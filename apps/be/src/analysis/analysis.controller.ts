import { Controller, Get, Post, Delete, Param, ParseIntPipe, UseGuards, ForbiddenException } from '@nestjs/common';
import { AnalysisService } from './analysis.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../auth/current-user.decorator';
import { PrismaService } from '../db/prisma.service';

@Controller('api/groups/:groupId/analysis')
@UseGuards(JwtAuthGuard)
export class AnalysisController {
  constructor(
    private readonly analysisService: AnalysisService,
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

  @Post()
  async analyze(
    @Param('groupId', ParseIntPipe) groupId: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.checkGroupOwnership(groupId, user.id);
    return this.analysisService.analyze(groupId);
  }

  @Get()
  async getHistory(
    @Param('groupId', ParseIntPipe) groupId: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.checkGroupOwnership(groupId, user.id);
    return this.analysisService.getHistory(groupId);
  }

  @Delete(':analysisId')
  async delete(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('analysisId', ParseIntPipe) analysisId: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.checkGroupOwnership(groupId, user.id);
    return this.analysisService.delete(analysisId);
  }
}
