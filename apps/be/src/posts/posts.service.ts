import { Injectable } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';

export interface Post {
  id: number;
  group_id: number;
  fb_post_id: string | null;
  author_name: string | null;
  content: string | null;
  comment_inner_text: string | null;
  post_text: string | null;
  post_url: string | null;
  crawled_at: string;
}

export interface PostWithComments extends Post {
  comments: Comment[];
}

export interface Comment {
  id: number;
  post_id: number;
  fb_comment_id: string;
  author_name: string | null;
  comment_text: string | null;
  created_at: string | null;
}

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

  async findByGroup(groupId: number): Promise<PostWithComments[]> {
    const posts = await this.prisma.post.findMany({
      where: { group_id: groupId },
      include: {
        comments: {
          orderBy: { created_at: 'asc' },
        },
      },
      orderBy: { crawled_at: 'desc' },
    });

    return posts as PostWithComments[];
  }

  async findByFbId(fbPostId: string): Promise<Post | null> {
    return this.prisma.post.findFirst({
      where: { fb_post_id: fbPostId },
    });
  }

  async findOne(postId: number): Promise<PostWithComments | null> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: {
        comments: {
          orderBy: { created_at: 'asc' },
        },
      },
    });
    return post as PostWithComments | null;
  }

  async create(data: Omit<Post, 'id' | 'crawled_at'> & { crawled_at?: string; comments?: { author_name: string; comment_text: string }[] }): Promise<Post> {
    const now = data.crawled_at || new Date().toISOString().replace('T', ' ').substring(0, 19);
    
    const commentData = data.comments ? {
      create: data.comments.map((c, index) => ({
        fb_comment_id: `${data.fb_post_id}_comment_${index}_${Date.now()}`,
        author_name: c.author_name,
        comment_text: c.comment_text,
        created_at: now,
      }))
    } : undefined;

    return this.prisma.post.create({
      data: {
        group_id: data.group_id,
        fb_post_id: data.fb_post_id,
        author_name: data.author_name,
        content: data.content,
        comment_inner_text: data.comment_inner_text,
        post_text: data.post_text,
        post_url: data.post_url,
        crawled_at: now,
        comments: commentData,
      },
    });
  }
}
