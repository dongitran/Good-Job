import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import {
  Organization,
  CoreValue,
  Invitation,
  OrganizationMembership,
  Reward,
  RewardCategory,
  UserRole,
} from '../../database/entities';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import {
  CacheEvents,
  OrgUpdatedPayload,
} from '../../common/events/cache-events';
import { CreateCoreValuesDto } from './dto/create-core-values.dto';
import { CreateInvitationsDto } from './dto/create-invitations.dto';
import { CompleteOnboardingDto } from './dto/complete-onboarding.dto';
import { AuthEmailService } from '../auth/auth-email.service';

@Injectable()
export class OrganizationsService {
  private readonly logger = new Logger(OrganizationsService.name);

  constructor(
    @InjectRepository(Organization)
    private readonly orgRepo: Repository<Organization>,
    @InjectRepository(CoreValue)
    private readonly coreValueRepo: Repository<CoreValue>,
    @InjectRepository(Invitation)
    private readonly invitationRepo: Repository<Invitation>,
    @InjectRepository(OrganizationMembership)
    private readonly membershipRepo: Repository<OrganizationMembership>,
    @InjectRepository(Reward)
    private readonly rewardRepo: Repository<Reward>,
    private readonly authEmailService: AuthEmailService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async getOrganization(orgId: string, userId: string): Promise<Organization> {
    await this.verifyMembership(orgId, userId);
    const org = await this.orgRepo.findOne({
      where: { id: orgId },
      relations: ['coreValues'],
    });
    if (!org) throw new NotFoundException('Organization not found.');
    return org;
  }

  async updateOrganization(
    orgId: string,
    userId: string,
    dto: UpdateOrganizationDto,
  ): Promise<Organization> {
    await this.verifyMembership(orgId, userId);
    const org = await this.orgRepo.findOne({ where: { id: orgId } });
    if (!org) throw new NotFoundException('Organization not found.');

    if (dto.name) {
      org.name = dto.name;
      org.slug = this.generateSlug(dto.name);
    }
    if (dto.industry !== undefined) org.industry = dto.industry;
    if (dto.companySize !== undefined) org.companySize = dto.companySize;
    if (dto.logoUrl !== undefined) org.logoUrl = dto.logoUrl;

    const saved = await this.orgRepo.save(org);
    this.logger.log(`Organization ${orgId} updated by ${userId}`);

    this.eventEmitter.emit(CacheEvents.ORG_UPDATED, {
      orgId,
    } satisfies OrgUpdatedPayload);

    return saved;
  }

  async setCoreValues(
    orgId: string,
    userId: string,
    dto: CreateCoreValuesDto,
  ): Promise<CoreValue[]> {
    await this.verifyMembership(orgId, userId);

    // Deactivate existing core values for this org
    await this.coreValueRepo.update(
      { orgId, isActive: true },
      { isActive: false },
    );

    // Create new core values
    const entities = dto.values.map((v) =>
      this.coreValueRepo.create({
        orgId,
        name: v.name,
        emoji: v.emoji ?? undefined,
        color: v.color ?? undefined,
        isActive: true,
      }),
    );

    const saved = await this.coreValueRepo.save(entities);
    this.logger.log(
      `Set ${saved.length} core values for org ${orgId} by ${userId}`,
    );

    this.eventEmitter.emit(CacheEvents.ORG_UPDATED, {
      orgId,
    } satisfies OrgUpdatedPayload);

    return saved;
  }

  async sendInvitations(
    orgId: string,
    userId: string,
    dto: CreateInvitationsDto,
  ): Promise<{ sent: number; skipped: number; alreadyInvited: string[] }> {
    const membership = await this.verifyMembership(orgId, userId);

    // Only admins and owners can invite members
    if (
      membership.role !== UserRole.ADMIN &&
      membership.role !== UserRole.OWNER
    ) {
      throw new ForbiddenException('Only admins can invite members.');
    }

    const org = await this.orgRepo.findOne({ where: { id: orgId } });
    if (!org) throw new NotFoundException('Organization not found.');

    // Load all existing invitations for this org in one query (avoid N+1)
    const normalizedEmails = dto.emails.map((e) => e.trim().toLowerCase());
    const existingInvitations = await this.invitationRepo.find({
      where: { orgId },
      select: ['email'],
    });
    const existingEmailSet = new Set(existingInvitations.map((i) => i.email));

    const alreadyInvited: string[] = [];
    const toCreate: { email: string; token: string }[] = [];

    for (const email of normalizedEmails) {
      if (existingEmailSet.has(email)) {
        alreadyInvited.push(email);
      } else {
        toCreate.push({ email, token: randomUUID() });
      }
    }

    const skipped = alreadyInvited.length;

    if (toCreate.length > 0) {
      // Bulk insert new invitations
      await this.invitationRepo.save(
        toCreate.map(({ email, token }) =>
          this.invitationRepo.create({
            orgId,
            email,
            role: UserRole.MEMBER,
            invitedBy: userId,
            token,
            expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000), // 7 days
          }),
        ),
      );

      // Send invitation emails concurrently
      await Promise.all(
        toCreate.map(({ email, token }) =>
          this.authEmailService.sendInvitationEmail(email, org.name, token),
        ),
      );
    }

    const sent = toCreate.length;

    this.logger.log(
      `Invitations for org ${orgId}: ${sent} sent, ${skipped} skipped`,
    );
    return { sent, skipped, alreadyInvited };
  }

  async getPendingInvitations(
    orgId: string,
    userId: string,
  ): Promise<
    {
      id: string;
      email: string;
      role: string;
      createdAt: Date;
      expiresAt: Date;
    }[]
  > {
    await this.verifyMembership(orgId, userId);

    const invitations = await this.invitationRepo.find({
      where: {
        orgId,
        acceptedAt: IsNull(),
        revokedAt: IsNull(),
      },
      order: { createdAt: 'DESC' },
    });

    const now = new Date();
    return invitations
      .filter((inv) => inv.expiresAt > now)
      .map((inv) => ({
        id: inv.id,
        email: inv.email,
        role: inv.role,
        createdAt: inv.createdAt,
        expiresAt: inv.expiresAt,
      }));
  }

  async revokeInvitation(
    orgId: string,
    userId: string,
    invitationId: string,
  ): Promise<{ message: string }> {
    const membership = await this.verifyMembership(orgId, userId);

    if (
      membership.role !== UserRole.ADMIN &&
      membership.role !== UserRole.OWNER
    ) {
      throw new ForbiddenException('Only admins can revoke invitations.');
    }

    const invitation = await this.invitationRepo.findOne({
      where: { id: invitationId, orgId },
    });
    if (!invitation) throw new NotFoundException('Invitation not found.');

    if (invitation.acceptedAt) {
      throw new ConflictException('Cannot revoke an accepted invitation.');
    }
    if (invitation.revokedAt) {
      throw new ConflictException('Invitation has already been revoked.');
    }

    invitation.revokedAt = new Date();
    await this.invitationRepo.save(invitation);

    const org = await this.orgRepo.findOne({ where: { id: orgId } });
    if (org) {
      // Fire-and-forget — do not block the response on email delivery
      void this.authEmailService
        .sendInvitationCancelledEmail(invitation.email, org.name)
        .catch((err: unknown) =>
          this.logger.warn(
            `Failed to send cancellation email to ${invitation.email}: ${String(err)}`,
          ),
        );
    }

    this.logger.log(
      `Invitation ${invitationId} to ${invitation.email} revoked by ${userId}`,
    );
    return { message: 'Invitation revoked.' };
  }

  async getMembers(
    orgId: string,
    userId: string,
    q?: string,
  ): Promise<
    {
      id: string;
      fullName: string;
      email: string;
      avatarUrl: string | null;
      role: UserRole;
    }[]
  > {
    await this.verifyMembership(orgId, userId);

    const qb = this.membershipRepo
      .createQueryBuilder('m')
      .innerJoinAndSelect('m.user', 'u')
      .where('m.org_id = :orgId', { orgId })
      .andWhere('m.is_active = true')
      .andWhere('u.is_active = true');

    if (q?.trim()) {
      qb.andWhere('(LOWER(u.full_name) LIKE :q OR LOWER(u.email) LIKE :q)', {
        q: `%${q.toLowerCase().trim()}%`,
      });
    }

    const memberships = await qb.getMany();
    return memberships.map((m) => ({
      id: m.user.id,
      fullName: m.user.fullName,
      email: m.user.email,
      avatarUrl: m.user.avatarUrl ?? null,
      role: m.role,
    }));
  }

  async completeOnboarding(
    orgId: string,
    userId: string,
    dto: CompleteOnboardingDto,
  ): Promise<Organization> {
    await this.verifyMembership(orgId, userId);
    const org = await this.orgRepo.findOne({ where: { id: orgId } });
    if (!org) throw new NotFoundException('Organization not found.');

    org.onboardingCompletedAt = new Date();
    const saved = await this.orgRepo.save(org);
    if (dto.seedDemoData) {
      await this.seedDemoRewards(orgId);
    }
    this.logger.log(`Onboarding completed for org ${orgId} by ${userId}`);
    return saved;
  }

  private async verifyMembership(
    orgId: string,
    userId: string,
  ): Promise<OrganizationMembership> {
    const membership = await this.membershipRepo.findOne({
      where: { orgId, userId, isActive: true },
    });
    if (!membership) {
      throw new ForbiddenException(
        'You do not have access to this organization.',
      );
    }
    return membership;
  }

  private async seedDemoRewards(orgId: string): Promise<void> {
    const existing = await this.rewardRepo.count({ where: { orgId } });
    if (existing > 0) return;

    const demos = [
      {
        name: 'Coffee Shop Gift Card',
        description: '$10 gift card for your favorite cafe',
        pointsCost: 100,
        category: RewardCategory.GIFT_CARD,
        stock: -1,
      },
      {
        name: 'Company Swag Hoodie',
        description: 'Cozy branded hoodie in your size',
        pointsCost: 500,
        category: RewardCategory.SWAG,
        stock: 20,
      },
      {
        name: 'Extra Day Off',
        description: 'One additional PTO day, approved by your manager',
        pointsCost: 1000,
        category: RewardCategory.TIME_OFF,
        stock: -1,
      },
      {
        name: 'Team Lunch',
        description: 'Lunch out with your team of up to 6 people',
        pointsCost: 750,
        category: RewardCategory.EXPERIENCE,
        stock: 5,
      },
      {
        name: 'Charity Donation $25',
        description: 'We donate $25 to a charity of your choice',
        pointsCost: 250,
        category: RewardCategory.CHARITY,
        stock: -1,
      },
    ];

    await this.rewardRepo.save(
      demos.map((d) => this.rewardRepo.create({ ...d, orgId, isActive: true })),
    );
    this.logger.log(`Seeded ${demos.length} demo rewards for org ${orgId}`);
  }

  private generateSlug(name: string): string {
    const base = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const suffix = Math.random().toString(36).slice(2, 6);
    return `${base}-${suffix}`;
  }
}
