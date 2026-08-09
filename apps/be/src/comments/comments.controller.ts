import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { CommentsService } from './comments.service';

@Controller('api/posts/:postId/comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get()
  async findByPost(@Param('postId', ParseIntPipe) postId: number) {
    const comments = await this.commentsService.findByPost(postId);
    return { postId, comments };
  }
}
