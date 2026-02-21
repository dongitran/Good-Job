import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Recognition } from '../../database/entities';

export interface FeedItem {
  id: string;
  orgId: string;
  points: number;
  message: string;
  isPrivate: boolean;
  createdAt: Date;
  giver: { id: string; fullName: string; avatarUrl: string | null };
  receiver: { id: string; fullName: string; avatarUrl: string | null };
  coreValue: {
    id: string;
    name: string;
    emoji: string | null;
    color: string | null;
  } | null;
  reactionCount: number;
  commentCount: number;
}

export interface FeedResult {
  items: FeedItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class FeedService {
  constructor(
    @InjectRepository(Recognition)
    private readonly recognitionRepo: Repository<Recognition>,
  ) {}

  async getFeed(
    orgId: string,
    page: number,
    limit: number,
    valueId?: string,
  ): Promise<FeedResult> {
    const qb = this.recognitionRepo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.giver', 'giver')
      .leftJoinAndSelect('r.receiver', 'receiver')
      .leftJoinAndSelect('r.coreValue', 'coreValue')
      .loadRelationCountAndMap('r.reactionCount', 'r.reactions')
      .loadRelationCountAndMap('r.commentCount', 'r.comments')
      .where('r.orgId = :orgId', { orgId })
      .andWhere('r.isPrivate = false')
      .andWhere('r.deletedAt IS NULL')
      .orderBy('r.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (valueId) {
      qb.andWhere('r.valueId = :valueId', { valueId });
    }

    const [raw, total] = await qb.getManyAndCount();

    // Map entities to the FeedItem shape (relations are loaded, reaction/comment counts
    // are injected by loadRelationCountAndMap at runtime so we access them via type assertion)
    const items: FeedItem[] = raw.map((r) => {
      const withCounts = r as Recognition & {
        reactionCount: number;
        commentCount: number;
      };
      return {
        id: r.id,
        orgId: r.orgId,
        points: r.points,
        message: r.message,
        isPrivate: r.isPrivate,
        createdAt: r.createdAt,
        giver: {
          id: r.giver.id,
          fullName: r.giver.fullName,
          avatarUrl: r.giver.avatarUrl ?? null,
        },
        receiver: {
          id: r.receiver.id,
          fullName: r.receiver.fullName,
          avatarUrl: r.receiver.avatarUrl ?? null,
        },
        coreValue: r.coreValue
          ? {
              id: r.coreValue.id,
              name: r.coreValue.name,
              emoji: r.coreValue.emoji ?? null,
              color: r.coreValue.color ?? null,
            }
          : null,
        reactionCount: withCounts.reactionCount ?? 0,
        commentCount: withCounts.commentCount ?? 0,
      };
    });

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
