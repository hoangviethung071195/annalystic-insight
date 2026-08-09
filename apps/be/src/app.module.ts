import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './db/database.module';
import { GroupsModule } from './groups/groups.module';
import { PostsModule } from './posts/posts.module';
import { CommentsModule } from './comments/comments.module';
import { AnalysisModule } from './analysis/analysis.module';
import { CrawlerModule } from './crawler/crawler.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    GroupsModule,
    PostsModule,
    CommentsModule,
    AnalysisModule,
    CrawlerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
