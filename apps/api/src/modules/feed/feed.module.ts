import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeedController } from './feed.controller';
import { FeedService } from './feed.service';
import {
  Recognition,
  RecognitionReaction,
  RecognitionComment,
} from '../../database/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Recognition,
      RecognitionReaction,
      RecognitionComment,
    ]),
  ],
  controllers: [FeedController],
  providers: [FeedService],
})
export class FeedModule {}
