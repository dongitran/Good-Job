import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import {
  Organization,
  CoreValue,
  Invitation,
  OrganizationMembership,
  UserRole,
} from '../../database/entities';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { CreateCoreValuesDto } from './dto/create-core-values.dto';
import { CreateInvitationsDto } from './dto/create-invitations.dto';
import { CompleteOnboardingDto } from './dto/complete-onboarding.dto';

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
    return saved;
  }

  async sendInvitations(
    orgId: string,
    userId: string,
    dto: CreateInvitationsDto,
  ): Promise<{ sent: number; skipped: number }> {
    await this.verifyMembership(orgId, userId);

    let sent = 0;
    let skipped = 0;

    for (const rawEmail of dto.emails) {
      const email = rawEmail.trim().toLowerCase();

      // Skip if invitation already exists for this org+email
      const existing = await this.invitationRepo.findOne({
        where: { orgId, email },
      });
      if (existing) {
        skipped++;
        continue;
      }

      await this.invitationRepo.save(
        this.invitationRepo.create({
          orgId,
          email,
          role: UserRole.MEMBER,
          invitedBy: userId,
          token: randomUUID(),
          expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000), // 7 days
        }),
      );
      sent++;
    }

    this.logger.log(
      `Invitations for org ${orgId}: ${sent} sent, ${skipped} skipped`,
    );
    return { sent, skipped };
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
      this.logger.log(`Demo data seeding requested for org ${orgId}`);
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

  private generateSlug(name: string): string {
    const base = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const suffix = Math.random().toString(36).slice(2, 6);
    return `${base}-${suffix}`;
  }
}
