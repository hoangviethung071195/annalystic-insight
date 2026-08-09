import { Injectable } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { Prisma } from '@prisma/client';

export interface Group {
  id: number;
  name: string | null;
  url: string;
  last_crawled_at: string | null;
}

export interface GroupWithStats extends Group {
  postCount: number;
  commentCount: number;
}

@Injectable()
export class GroupsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: number): Promise<GroupWithStats[]> {
    const groups = await this.prisma.group.findMany({
      where: { userId },
      include: {
        _count: {
          select: {
            posts: true,
          },
        },
        posts: {
          include: {
            _count: {
              select: {
                comments: true,
              },
            },
          },
        },
      },
      orderBy: {
        last_crawled_at: 'desc',
      },
    }) satisfies Array<{ id: number; name: string | null; url: string; last_crawled_at: string | null; _count: { posts: number }; posts: Array<{ _count: { comments: number } }> }>;

    return groups.map((g) => {
      const commentCount = g.posts.reduce((sum, p) => sum + p._count.comments, 0);
      return {
        id: g.id,
        name: g.name,
        url: g.url,
        last_crawled_at: g.last_crawled_at,
        postCount: g._count.posts,
        commentCount,
      };
    });
  }

  async findOne(id: number, userId: number): Promise<GroupWithStats | null> {
    const group = await this.prisma.group.findFirst({
      where: { id, userId },
      include: {
        _count: {
          select: {
            posts: true,
          },
        },
        posts: {
          include: {
            _count: {
              select: {
                comments: true,
              },
            },
          },
        },
      },
    });

    if (!group) return null;

    const commentCount = group.posts.reduce((sum, p) => sum + p._count.comments, 0);
    return {
      id: group.id,
      name: group.name,
      url: group.url,
      last_crawled_at: group.last_crawled_at,
      postCount: group._count.posts,
      commentCount,
    };
  }

  async findByUrl(userId: number, url: string): Promise<Group | null> {
    return this.prisma.group.findFirst({
      where: { userId, url },
    });
  }

  async create(userId: number, name: string, url: string): Promise<Group> {
    return this.prisma.group.create({
      data: {
        userId,
        name,
        url,
      },
    });
  }

  async updateLastCrawled(id: number): Promise<void> {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    await this.prisma.group.update({
      where: { id },
      data: {
        last_crawled_at: now,
      },
    });
  }

  async updateName(id: number, name: string): Promise<Group> {
    return this.prisma.group.update({
      where: { id },
      data: { name },
    });
  }

  async remove(id: number, userId: number): Promise<boolean> {
    try {
      await this.prisma.group.delete({
        where: { id, userId },
      });
      return true;
    } catch {
      return false;
    }
  }
}
