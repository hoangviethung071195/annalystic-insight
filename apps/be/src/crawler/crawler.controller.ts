import { Controller, Get, Post, Put, Body, Query, UseGuards } from '@nestjs/common';
import { CrawlerService } from './crawler.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../auth/current-user.decorator';

@Controller('api/crawler')
@UseGuards(JwtAuthGuard)
export class CrawlerController {
  constructor(private readonly crawlerService: CrawlerService) {}

  @Post('launch')
  async launch() {
    return { success: true, message: 'External crawling mode active. Apify API integrates directly.' };
  }

  @Get('status')
  getStatus() {
    return this.crawlerService.getStatus();
  }

  // Get current config
  @Get('config')
  getConfig() {
    return this.crawlerService.getConfig();
  }

  // Update config
  @Put('config')
  updateConfig(@Body() config: any) {
    return {
      success: true,
      config: this.crawlerService.updateConfig(config),
    };
  }

  // Run crawl with optional config override
  @Post('run')
  async run(
    @CurrentUser() user: AuthenticatedUser,
    @Body('groupUrl') groupUrl: string,
    @Body('limitPosts') limitPosts?: number,
    @Body('config') config?: any,
  ) {
    if (!groupUrl) {
      return { success: false, message: 'groupUrl is required' };
    }

    const runConfig = { ...config };
    if (limitPosts !== undefined) {
      runConfig.targetPostCount = limitPosts;
    }

    return this.crawlerService.runCrawl(user.id, groupUrl, runConfig);
  }

  // Import trực tiếp dữ liệu cào sẵn (JSON)
  @Post('import')
  async importData(
    @CurrentUser() user: AuthenticatedUser,
    @Body('groupUrl') groupUrl: string,
    @Body('items') items: any[],
  ) {
    if (!groupUrl || !items || !Array.isArray(items)) {
      return { success: false, message: 'groupUrl and items (array) are required' };
    }
    return this.crawlerService.importApifyData(user.id, groupUrl, items);
  }
}

