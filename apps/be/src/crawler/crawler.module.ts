import { Module } from '@nestjs/common';
import { CrawlerController } from './crawler.controller';
import { CrawlerService } from './crawler.service';
import { GroupsModule } from '../groups/groups.module';
import { PostsModule } from '../posts/posts.module';
import { CommentsModule } from '../comments/comments.module';

@Module({
  imports: [GroupsModule, PostsModule, CommentsModule],
  controllers: [CrawlerController],
  providers: [CrawlerService],
  exports: [CrawlerService],
})
export class CrawlerModule {}
