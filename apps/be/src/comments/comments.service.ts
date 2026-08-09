import { Injectable } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';

export interface Comment {
  id: number;
  post_id: number;
  fb_comment_id: string;
  author_name: string | null;
  comment_text: string | null;
  created_at: string | null;
}

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findByPost(postId: number): Promise<Comment[]> {
    return this.prisma.comment.findMany({
      where: { post_id: postId },
      orderBy: { created_at: 'asc' },
    });
  }

  async findByFbId(fbCommentId: string): Promise<Comment | null> {
    return this.prisma.comment.findUnique({
      where: { fb_comment_id: fbCommentId },
    });
  }

  async bulkCreate(comments: Omit<Comment, 'id'>[]): Promise<number> {
    if (comments.length === 0) return 0;
    let count = 0;
    for (const comment of comments) {
      const existing = await this.findByFbId(comment.fb_comment_id);
      if (!existing) {
        await this.prisma.comment.create({
          data: {
            post_id: comment.post_id,
            fb_comment_id: comment.fb_comment_id,
            author_name: comment.author_name,
            comment_text: comment.comment_text,
            created_at: comment.created_at,
          },
        });
        count++;
      }
    }
    return count;
  }
}
