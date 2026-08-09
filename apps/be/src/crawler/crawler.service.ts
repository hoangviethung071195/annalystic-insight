import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { GroupsService } from '../groups/groups.service';
import { PostsService } from '../posts/posts.service';

export interface CrawlerStatus {
  browserOpen: boolean;
  isLoggedIn: boolean;
  currentTask: 'idle' | 'crawling' | 'error';
  crawlingGroup: string | null;
  lastError: string | null;
}

@Injectable()
export class CrawlerService {
  private readonly logger = new Logger(CrawlerService.name);
  private status: CrawlerStatus = {
    browserOpen: false,
    isLoggedIn: true,
    currentTask: 'idle',
    crawlingGroup: null,
    lastError: null,
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly groupsService: GroupsService,
    private readonly postsService: PostsService,
  ) {}

  getStatus(): CrawlerStatus {
    return { ...this.status };
  }

  getConfig() {
    return { apifyConfigured: !!process.env.APIFY_API_TOKEN };
  }

  updateConfig(config: any) {
    return this.getConfig();
  }

  // Chạy crawl thông qua Apify API
  async runCrawl(userId: number, groupUrl: string, config: { targetPostCount?: number } = {}) {
    const token = process.env.APIFY_API_TOKEN;
    if (!token) {
      this.status.currentTask = 'error';
      this.status.lastError = 'APIFY_API_TOKEN is not configured in .env';
      return { success: false, message: this.status.lastError };
    }

    this.status.currentTask = 'crawling';
    this.status.crawlingGroup = groupUrl;
    this.status.lastError = null;

    // Chạy bất đồng bộ
    this.executeApifyCrawl(userId, groupUrl, token, config.targetPostCount || 20).catch((err) => {
      this.logger.error(`Failed to crawl from Apify: ${err.message}`, err.stack);
      this.status.currentTask = 'error';
      this.status.lastError = err.message;
    });

    return {
      success: true,
      message: 'Apify crawl job has been successfully triggered. It is running in the background.',
    };
  }

  private async executeApifyCrawl(userId: number, groupUrl: string, token: string, maxPosts: number) {
    this.logger.log(`Starting Apify run for group: ${groupUrl}, maxPosts: ${maxPosts}`);
    
    // 1. Gọi Actor apify/facebook-groups-scraper (hoặc actor tương tự)
    // Để linh hoạt hơn, ta dùng Actor ID: apify/facebook-groups-scraper
    const actorId = 'apify~facebook-groups-scraper';
    const runUrl = `https://api.apify.com/v2/acts/${actorId}/runs?token=${token}`;
    
    const response = await fetch(runUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startUrls: [{ url: groupUrl }],
        resultsLimit: maxPosts,
        maxPosts: maxPosts,
        commentsMode: 'ALL',
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Apify Actor invocation failed: ${response.status} - ${errText}`);
    }

    const runData = await response.json();
    const runId = runData.data.id;
    const datasetId = runData.data.defaultDatasetId;
    this.logger.log(`Apify Job started. Run ID: ${runId}, Dataset ID: ${datasetId}`);

    // 2. Poll trạng thái cho đến khi hoàn thành
    let attempts = 0;
    const maxAttempts = 60; // Chờ tối đa 10 phút (mỗi lần cách nhau 10 giây)
    let finished = false;
    let runStatus = 'PENDING';

    while (attempts < maxAttempts && !finished) {
      await new Promise((resolve) => setTimeout(resolve, 10000));
      attempts++;

      const checkUrl = `https://api.apify.com/v2/actor-runs/${runId}?token=${token}`;
      const checkRes = await fetch(checkUrl);
      if (!checkRes.ok) {
        this.logger.warn(`Failed to poll status for run ${runId}`);
        continue;
      }

      const checkData = await checkRes.json();
      runStatus = checkData.data.status;
      this.logger.log(`Polling Apify Job status: ${runStatus} (Attempt ${attempts}/${maxAttempts})`);

      if (runStatus === 'SUCCEEDED') {
        finished = true;
      } else if (['FAILED', 'ABORTED', 'TIMED-OUT'].includes(runStatus)) {
        this.logger.warn(`Apify Job stopped with status: ${runStatus}. Trying to download and import existing items...`);
        finished = true;
      }
    }

    if (!finished && runStatus === 'PENDING') {
      throw new Error('Apify Job timed out without response.');
    }

    // 3. Fetch kết quả từ Dataset
    const datasetUrl = `https://api.apify.com/v2/datasets/${datasetId}/items?token=${token}`;
    const datasetRes = await fetch(datasetUrl);
    if (!datasetRes.ok) {
      throw new Error(`Failed to fetch dataset items: ${datasetRes.statusText}`);
    }

    const items = await datasetRes.json();
    this.logger.log(`Fetched ${items.length} items from Apify dataset.`);

    if (items.length === 0) {
      throw new Error(`Apify Job completed with status: ${runStatus} but returned no posts.`);
    }

    // 4. Import dữ liệu vào DB
    await this.importApifyData(userId, groupUrl, items);

    this.status.currentTask = 'idle';
    this.status.crawlingGroup = null;
  }

  // Import dữ liệu từ cấu hình JSON của Apify
  async importApifyData(userId: number, groupUrl: string, items: any[]): Promise<{ success: boolean; count: number; groupId: number }> {
    // Trích xuất tên Group từ URL hoặc item đầu tiên
    let groupName = 'Facebook Group';
    if (items.length > 0 && items[0].groupName) {
      groupName = items[0].groupName;
    } else {
      const match = groupUrl.match(/groups\/([^/]+)/);
      if (match) groupName = match[1];
    }

    // Tìm hoặc tạo Group
    let group = await this.groupsService.findByUrl(userId, groupUrl);
    if (!group) {
      group = await this.groupsService.create(userId, groupName, groupUrl);
    } else if (groupName !== 'Facebook Group' && group.name !== groupName) {
      await this.groupsService.updateName(group.id, groupName);
    }

    this.logger.log(`Importing data into Group ID: ${group.id} (${groupName})`);

    // Lưu từng bài viết
    let importedCount = 0;
    for (const item of items) {
      const fbPostId = item.id || item.postId || item.facebookId || `post_${Date.now()}_${Math.random()}`;
      const authorName = item.user?.name || item.authorName || item.author || 'Ẩn danh';
      const content = item.text || item.message || '';
      const postUrl = item.url || item.postUrl || `${groupUrl}/posts/${fbPostId}`;
      const comments = Array.isArray(item.comments) ? item.comments : [];

      // Phân tích/Map comments
      const commentList = comments.map((c: any) => ({
        author_name: c.user?.name || c.authorName || c.author || 'Ẩn danh',
        comment_text: c.text || c.message || c.body || '',
      }));

      await this.postsService.create({
        group_id: group.id,
        fb_post_id: String(fbPostId),
        author_name: authorName,
        content: content,
        comment_inner_text: commentList.map((c: any) => c.comment_text).join('\n'),
        post_text: content,
        post_url: postUrl,
        comments: commentList,
      });

      importedCount++;
    }

    await this.groupsService.updateLastCrawled(group.id);
    this.logger.log(`Successfully imported ${importedCount} posts for Group ${groupName}`);

    return { success: true, count: importedCount, groupId: group.id };
  }
}
