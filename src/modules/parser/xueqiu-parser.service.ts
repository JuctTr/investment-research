import { Injectable, Logger } from '@nestjs/common';
import * as cheerio from 'cheerio';
import { CreateXueqiuUserProfileDto } from '../xueqiu/dto/create-user-profile.dto';

@Injectable()
export class XueqiuParserService {
  private readonly logger = new Logger(XueqiuParserService.name);

  /**
   * 解析用户主页 HTML
   */
  parseUserProfile(html: string): CreateXueqiuUserProfileDto {
    const $ = cheerio.load(html);

    // 提取页面内嵌的 JSON 数据
    const scriptContent = $('script')
      .filter((_, el) => {
        return $(el).html()?.includes('window.SNOWMAN_TARGET');
      })
      .html();

    if (!scriptContent) {
      throw new Error('页面中未找到 SNOWMAN_TARGET');
    }

    // 提取 JSON 数据
    const match = scriptContent.match(/window\.SNOWMAN_TARGET\s*=\s*({.*?});/);
    if (!match || !match[1]) {
      throw new Error('提取 SNOWMAN_TARGET JSON 失败');
    }

    let userData: any;
    try {
      userData = JSON.parse(match[1]);
    } catch (error) {
      this.logger.error('解析用户 JSON 失败:', error);
      throw new Error('无效的 JSON 数据');
    }

    // 解析用户信息
    const userId = userData.userId || userData.id || '';
    const screenName = userData.screenName || userData.name || '';
    const followersCount = userData.followersCount || userData.followers || 0;
    const friendsCount = userData.friendsCount || userData.following || 0;
    const description = userData.description || userData.bio || '';

    if (!userId) {
      throw new Error('解析数据中未找到用户 ID');
    }

    return {
      uid: String(userId),
      screenName,
      followersCount,
      friendsCount,
      description,
      rawData: userData, // 保存完整原始数据
    };
  }

  /**
   * 解析 API JSON 响应
   */
  parseUserProfileFromAPI(apiData: any): CreateXueqiuUserProfileDto {
    if (!apiData || !apiData.id) {
      throw new Error('无效的 API 响应: 缺少用户 id');
    }

    return {
      uid: String(apiData.id),
      screenName: apiData.screen_name || apiData.name || '',
      followersCount: apiData.followers_count || apiData.followers || 0,
      friendsCount: apiData.friends_count || apiData.following || 0,
      description: apiData.description || '',
      rawData: apiData,
    };
  }

  /**
   * 验证用户数据完整性
   */
  validateUserData(data: CreateXueqiuUserProfileDto): boolean {
    return !!(
      data.uid &&
      data.screenName &&
      typeof data.followersCount === 'number' &&
      typeof data.friendsCount === 'number'
    );
  }
}
