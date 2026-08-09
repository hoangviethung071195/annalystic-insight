import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

@Injectable()
export class AnalysisService {
  private readonly logger = new Logger(AnalysisService.name);
  private model: GenerativeModel | null = null;
  private isAIConfigured = false;

  constructor(private readonly prisma: PrismaService) {
    const provider = process.env.AI_PROVIDER || 'gemini';
    
    if (provider === 'gemini') {
      const apiKey = process.env.GEMINI_API_KEY;
      if (apiKey && apiKey !== 'your_gemini_api_key_here') {
        const genAI = new GoogleGenerativeAI(apiKey);
        this.model = genAI.getGenerativeModel({ model: process.env.AI_MODEL_NAME || 'gemini-2.0-flash' });
        this.isAIConfigured = true;
      }
    } else {
      const apiKey = provider === 'openai' ? process.env.OPENAI_API_KEY : process.env.DEEPSEEK_API_KEY;
      if (apiKey) {
        this.isAIConfigured = true;
        this.logger.log(`AI Analysis configured using provider: ${provider}`);
      }
    }

    if (!this.isAIConfigured) {
      this.logger.warn('AI API key not configured. AI analysis will fall back to mock mode.');
    }
  }

  private async callChatCompletion(prompt: string): Promise<string> {
    const provider = process.env.AI_PROVIDER || 'deepseek';
    const apiKey = provider === 'openai' 
      ? process.env.OPENAI_API_KEY 
      : process.env.DEEPSEEK_API_KEY;
    const baseUrl = provider === 'openai'
      ? 'https://api.openai.com/v1'
      : (process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com');
    const model = process.env.AI_MODEL_NAME || (provider === 'openai' ? 'gpt-4o-mini' : 'deepseek-chat');

    if (!apiKey) {
      throw new Error(`API key for provider "${provider}" is not configured.`);
    }

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AI API request failed: ${response.status} - ${errorText}`);
    }

    const data: any = await response.json();
    return data.choices[0].message.content || '';
  }

  async analyze(groupId: number): Promise<{ success: boolean; analysis?: Record<string, any>; message: string }> {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
    });
    if (!group) {
      return { success: false, message: 'Group not found' };
    }

    const posts = await this.prisma.post.findMany({
      where: { group_id: groupId },
      include: { comments: true },
      take: 100, // Lấy tối đa 100 bài viết mới nhất để phân tích sâu sắc
    });

    if (posts.length === 0) {
      return { success: false, message: 'No posts found. Please run or import data first.' };
    }

    // Gộp dữ liệu posts và comments thành chuỗi văn bản cho AI
    const dataForAI = posts.map((post, idx) => {
      const commentsText = post.comments.map(c => `  - ${c.author_name}: ${c.comment_text}`).join('\n');
      return `[Bài viết #${idx + 1} - Author: ${post.author_name}]
Nội dung: ${post.content}
Đường dẫn: ${post.post_url}
Bình luận:
${commentsText}`;
    }).join('\n\n');

    let finalAnalysis: Record<string, any>;

    if (this.isAIConfigured) {
      try {
        const prompt = `Bạn là chuyên gia phân tích thị trường cao cấp. Bạn được cung cấp dữ liệu cào từ một Group Facebook. Hãy phân tích toàn bộ dữ liệu này và phân loại theo khung phân tích W-N-D-I (Want - Need - Demand - Insight).
Want: Mong muốn cảm xúc hoặc mục tiêu cá nhân (ví dụ: sở hữu xe sang, muốn bé ngủ ngon, muốn thể hiện phong cách, giảm cân...).
Need: Nhu cầu giải quyết vấn đề hoặc tìm kiếm giải pháp thực tế (ví dụ: tối ưu nhiên liệu, sửa lỗi phần mềm, tăng sữa mẹ, cách lái xe an toàn...).
Demand: Nhu cầu thị trường / thương hiệu / sản phẩm / dịch vụ cụ thể được nhắc đến trong hội thoại (ví dụ: dòng xe X, phần mềm Y, ngũ cốc Z, dịch vụ tư vấn...).
Insight: Đúc kết hành vi và cơ hội.

Dữ liệu đầu vào:
${dataForAI}

Hãy trả về một đối tượng JSON chuẩn bằng tiếng Việt với cấu trúc chính xác như sau:
{
  "topicDistribution": {
    "Chủ đề A": 10,
    "Chủ đề B": 5
  },
  "contentTypeDistribution": {
    "Câu hỏi / xin lời khuyên": 12,
    "Nhả vía / success story": 4
  },
  "journeyDistribution": {
    "Mang thai": 15,
    "Nuôi con": 8
  },
  "topWants": [
    { "label": "Mô tả mong muốn 1", "val": 15 },
    { "label": "Mô tả mong muốn 2", "val": 10 }
  ],
  "topNeeds": [
    { "label": "Mô tả nhu cầu giải pháp 1", "val": 20 },
    { "label": "Mô tả nhu cầu giải pháp 2", "val": 8 }
  ],
  "topDemands": [
    { "label": "Sản phẩm A", "val": 12 }
  ],
  "insights": [
    { "num": "01", "title": "Tiêu đề insight", "content": "Nội dung chi tiết insight" }
  ],
  "recommendations": [
    { "tag": "Content/Product/Community", "content": "Khuyến nghị hành động" }
  ],
  "representativePosts": [
    {
      "content": "Trích đoạn ngắn nội dung bài viết tiêu biểu",
      "want": "Mô tả Want",
      "need": "Mô tả Need",
      "demand": "Mô tả Demand hoặc ghi '-'",
      "engScore": "Số lượt tương tác hoặc bình luận"
    }
  ],
  "oneMinuteSummary": [
    "Tóm tắt 1",
    "Tóm tắt 2"
  ]
}

Lưu ý: Không thêm bất kỳ văn bản giải thích nào ngoài đối tượng JSON. Hãy bọc đối tượng trong block mã \`\`\`json.`;

        let responseText = '';
        if (this.model) {
          const result = await this.model.generateContent(prompt);
          responseText = result.response.text();
        } else {
          responseText = await this.callChatCompletion(prompt);
        }

        try {
          const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
          const jsonStr = jsonMatch ? jsonMatch[1].trim() : responseText.trim();
          finalAnalysis = JSON.parse(jsonStr);
        } catch (e) {
          this.logger.error('Failed to parse JSON from AI response: ' + responseText);
          throw new Error('AI returned malformed JSON.');
        }
      } catch (err) {
        this.logger.error('[analyze] AI analysis failed', err);
        return { success: false, message: `AI analysis failed: ${(err as Error).message}` };
      }
    } else {
      // Mock data generic
      finalAnalysis = {
        topicDistribution: {
          "Chủ đề nổi bật 1": 25,
          "Chủ đề nổi bật 2": 20,
          "Chủ đề nổi bật 3": 15,
          "Khác": 10
        },
        contentTypeDistribution: {
          "Câu hỏi / Thảo luận": 35,
          "Chia sẻ trải nghiệm / Review": 15,
          "Quảng cáo / Giới thiệu sản phẩm": 10
        },
        journeyDistribution: {
          "Giai đoạn tìm hiểu": 25,
          "Giai đoạn sử dụng": 20,
          "Giai đoạn đánh giá": 15
        },
        topWants: [
          { label: "Mong muốn giải quyết vấn đề hiệu quả", val: 20 },
          { label: "Mong muốn tối ưu chi phí & thời gian", val: 15 }
        ],
        topNeeds: [
          { label: "Cần tìm giải pháp hoặc công cụ hỗ trợ tốt hơn", val: 18 },
          { label: "Cần tài liệu hướng dẫn và cộng đồng chia sẻ kinh nghiệm", val: 12 }
        ],
        topDemands: [
          { label: "Sản phẩm / Dịch vụ phổ biến 1", val: 15 },
          { label: "Sản phẩm / Dịch vụ phổ biến 2", val: 10 }
        ],
        insights: [
          { num: "01", title: "Xu hướng hành vi người dùng", content: "Người dùng có xu hướng tin tưởng các đánh giá và chia sẻ thực tế từ cộng đồng hơn là thông tin quảng cáo trực tiếp." }
        ],
        recommendations: [
          { tag: "Content", content: "Tập trung xây dựng nội dung chia sẻ thực tế, case-study chi tiết giải quyết trực tiếp khó khăn của người dùng." }
        ],
        representativePosts: [
          { content: "Bài viết chia sẻ thắc mắc về giải pháp tối ưu cho vấn đề...", want: "Mong muốn tối ưu hóa", need: "Cần giải pháp nhanh", demand: "Sản phẩm 1", engScore: "15" }
        ],
        oneMinuteSummary: [
          "Phần lớn các cuộc thảo luận xoay quanh việc tìm kiếm giải pháp và tối ưu hóa quy trình hiện tại."
        ]
      };
    }

    await this.saveAnalysis(groupId, finalAnalysis);
    return { success: true, analysis: finalAnalysis, message: 'Analysis complete' };
  }

  async delete(analysisId: number): Promise<{ success: boolean; message: string }> {
    try {
      await this.prisma.analysisResult.delete({
        where: { id: analysisId },
      });
      return { success: true, message: 'Analysis deleted successfully' };
    } catch (error) {
      return { success: false, message: `Failed to delete: ${(error as Error).message}` };
    }
  }

  async getHistory(groupId: number): Promise<any[]> {
    const rows = await this.prisma.analysisResult.findMany({
      where: { group_id: groupId },
      orderBy: { created_at: 'desc' },
    });
    return rows.map((row) => ({
      id: row.id,
      group_id: row.group_id,
      analysis_text: row.analysis_text,
      created_at: row.created_at,
    }));
  }

  private async saveAnalysis(groupId: number, analysis: Record<string, any>): Promise<void> {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    await this.prisma.analysisResult.create({
      data: {
        group_id: groupId,
        analysis_text: JSON.stringify(analysis),
        created_at: now,
      },
    });
  }
}
