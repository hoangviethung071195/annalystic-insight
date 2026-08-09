import { Controller, Get, Post, Param, Body, ParseIntPipe, UseGuards, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PostsService } from './posts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../auth/current-user.decorator';
import { PrismaService } from '../db/prisma.service';

@Controller('api/groups/:groupId/posts')
@UseGuards(JwtAuthGuard)
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly prisma: PrismaService,
  ) {}

  private async checkGroupOwnership(groupId: number, userId: number) {
    const group = await this.prisma.group.findFirst({
      where: { id: groupId, userId },
    });
    if (!group) {
      throw new ForbiddenException('You do not have access to this group');
    }
  }

  @Get()
  async findByGroup(
    @Param('groupId', ParseIntPipe) groupId: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.checkGroupOwnership(groupId, user.id);
    const posts = await this.postsService.findByGroup(groupId);
    return { groupId, posts };
  }

  @Get(':postId')
  async findOne(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('postId', ParseIntPipe) postId: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.checkGroupOwnership(groupId, user.id);
    const post = await this.postsService.findOne(postId);
    if (!post || post.group_id !== groupId) {
      throw new NotFoundException('Post not found in this group');
    }
    return { post };
  }

  @Post()
  async create(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Body() body: any,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.checkGroupOwnership(groupId, user.id);
    const post = await this.postsService.create({
      group_id: groupId,
      fb_post_id: body.fb_post_id,
      author_name: body.author_name || null,
      content: body.content,
      comment_inner_text: body.comment_inner_text || null,
      post_text: body.post_text || null,
      post_url: body.post_url || null,
      comments: body.comments || null,
      crawled_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
    });
    return { success: true, post };
  }
}
