import axios from 'axios';
import { config } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import {
  LiveTvCategory,
  LiveTvChannel,
  LiveTvCategoryGroup,
  EpgProgram,
  ChannelDetail,
} from '../../models/index.js';

interface RawCategory {
  category_id: string;
  category_name: string;
  parent_id?: number;
}

interface RawStream {
  num: number;
  name: string;
  stream_id: number;
  stream_icon?: string;
  epg_channel_id?: string;
  category_id: string;
}

interface RawEpgListing {
  id?: string;
  epg_id?: string;
  title?: string;
  description?: string;
  start?: string;
  end?: string;
  start_timestamp?: string | number;
  stop_timestamp?: string | number;
  now_playing?: number;
}

export function decodeBase64Safe(text?: string): string {
  if (!text || typeof text !== 'string') return '';
  const trimmed = text.trim();
  if (!trimmed) return '';

  // Attempt base64 decode
  try {
    const isBase64Pattern = /^[A-Za-z0-9+/=]+$/.test(trimmed) && trimmed.length % 4 === 0;
    if (isBase64Pattern) {
      const decoded = Buffer.from(trimmed, 'base64').toString('utf-8');
      // Verify decoded string is readable text
      if (decoded && !/[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(decoded)) {
        return decoded;
      }
    }
  } catch {
    // Return original on failure
  }
  return trimmed;
}

export class LiveTvService {
  private categoriesCache: LiveTvCategory[] | null = null;
  private categoriesCacheTime = 0;
  private rawStreamsCache: RawStream[] | null = null;
  private rawStreamsCacheTime = 0;
  private epgCache = new Map<string, { data: EpgProgram[]; timestamp: number }>();

  private readonly CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache
  private readonly EPG_CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes cache for EPG

  /**
   * Retrieves all live TV categories from Xtream IPTV.
   */
  async getCategories(): Promise<LiveTvCategory[]> {
    const now = Date.now();
    if (this.categoriesCache && now - this.categoriesCacheTime < this.CACHE_TTL_MS) {
      return this.categoriesCache;
    }

    try {
      const url = `${config.XTREAM_URL}/player_api.php?username=${config.XTREAM_USERNAME}&password=${config.XTREAM_PASSWORD}&action=get_live_categories`;
      const res = await axios.get<RawCategory[]>(url, {
        headers: { 'User-Agent': 'IPTVSmartersPro' },
        timeout: 10000,
      });

      if (Array.isArray(res.data)) {
        const categories = res.data.map((cat) => ({
          id: String(cat.category_id),
          name: cat.category_name,
        }));
        this.categoriesCache = categories;
        this.categoriesCacheTime = now;
        return categories;
      }
    } catch (err: any) {
      logger.error('[LiveTvService] Error fetching live categories from Xtream:', err.message);
    }

    return this.categoriesCache || [];
  }

  /**
   * Retrieves raw streams from Xtream IPTV.
   */
  async getRawStreams(): Promise<RawStream[]> {
    const now = Date.now();
    if (this.rawStreamsCache && now - this.rawStreamsCacheTime < this.CACHE_TTL_MS) {
      return this.rawStreamsCache;
    }

    try {
      const url = `${config.XTREAM_URL}/player_api.php?username=${config.XTREAM_USERNAME}&password=${config.XTREAM_PASSWORD}&action=get_live_streams`;
      const res = await axios.get<RawStream[]>(url, {
        headers: { 'User-Agent': 'IPTVSmartersPro' },
        timeout: 10000,
      });

      if (Array.isArray(res.data)) {
        this.rawStreamsCache = res.data;
        this.rawStreamsCacheTime = now;
        return res.data;
      }
    } catch (err: any) {
      logger.error('[LiveTvService] Error fetching live streams from Xtream:', err.message);
    }

    return this.rawStreamsCache || [];
  }

  /**
   * Returns list of TV channels grouped by their categories.
   * Supports filtering by search query (matching channel name or category name)
   * and filtering by categoryId.
   */
  async getCategoryGroups(options?: {
    search?: string;
    categoryId?: string;
    limitPerCategory?: number;
  }): Promise<LiveTvCategoryGroup[]> {
    const [categories, streams] = await Promise.all([
      this.getCategories(),
      this.getRawStreams(),
    ]);

    const categoryMap = new Map<string, string>();
    for (const cat of categories) {
      categoryMap.set(cat.id, cat.name);
    }

    const searchLower = (options?.search || '').trim().toLowerCase();
    const targetCategoryId = options?.categoryId?.trim();
    const limit = options?.limitPerCategory || 50;

    // Group streams by categoryId
    const channelsByCategory = new Map<string, LiveTvChannel[]>();

    for (const ch of streams) {
      const catId = String(ch.category_id);
      const catName = categoryMap.get(catId) || `Category ${catId}`;

      // Check categoryId filter
      if (targetCategoryId && catId !== targetCategoryId) {
        continue;
      }

      // Check search filter (channel name OR category name)
      if (searchLower) {
        const matchesChannel = ch.name.toLowerCase().includes(searchLower);
        const matchesCategory = catName.toLowerCase().includes(searchLower);
        if (!matchesChannel && !matchesCategory) {
          continue;
        }
      }

      if (!channelsByCategory.has(catId)) {
        channelsByCategory.set(catId, []);
      }

      const list = channelsByCategory.get(catId)!;
      list.push({
        id: String(ch.stream_id),
        name: ch.name,
        num: ch.num,
        streamIcon: ch.stream_icon,
        categoryId: catId,
        categoryName: catName,
        streamUrl: `/api/streams/relay/${ch.stream_id}`,
      });
    }

    // Build category groups
    const result: LiveTvCategoryGroup[] = [];

    for (const [catId, channelList] of channelsByCategory.entries()) {
      if (channelList.length === 0) continue;
      const catName = categoryMap.get(catId) || `Category ${catId}`;

      result.push({
        category: {
          id: catId,
          name: catName,
        },
        totalChannels: channelList.length,
        channels: channelList.slice(0, limit),
      });
    }

    // Sort groups alphabetically by category name
    result.sort((a, b) => a.category.name.localeCompare(b.category.name));

    return result;
  }

  /**
   * Retrieves single TV channel detail and its EPG.
   */
  async getChannelDetail(channelId: string): Promise<ChannelDetail | null> {
    const streams = await this.getRawStreams();
    const ch = streams.find((s) => String(s.stream_id) === String(channelId));

    if (!ch) {
      return null;
    }

    const categories = await this.getCategories();
    const catId = String(ch.category_id);
    const category = categories.find((c) => c.id === catId);
    const categoryName = category?.name || `Category ${catId}`;

    const epg = await this.getChannelEpg(channelId);

    return {
      id: String(ch.stream_id),
      name: ch.name,
      categoryId: catId,
      categoryName,
      streamIcon: ch.stream_icon,
      streamUrl: `/api/streams/relay/${ch.stream_id}`,
      epg,
    };
  }

  /**
   * Fetches EPG program listings for a given channel.
   * Decodes Base64 program titles/descriptions and calculates isNowPlaying.
   */
  async getChannelEpg(channelId: string): Promise<EpgProgram[]> {
    const now = Date.now();
    const cached = this.epgCache.get(channelId);
    if (cached && now - cached.timestamp < this.EPG_CACHE_TTL_MS) {
      return cached.data;
    }

    const nowSec = Math.floor(now / 1000);

    try {
      const url = `${config.XTREAM_URL}/player_api.php?username=${config.XTREAM_USERNAME}&password=${config.XTREAM_PASSWORD}&action=get_short_epg&stream_id=${channelId}&limit=20`;
      const res = await axios.get<{ epg_listings?: RawEpgListing[] }>(url, {
        headers: { 'User-Agent': 'IPTVSmartersPro' },
        timeout: 8000,
      });

      const listings = res.data?.epg_listings;
      if (Array.isArray(listings) && listings.length > 0) {
        const epgPrograms: EpgProgram[] = listings.map((prog, index) => {
          const startTs = prog.start_timestamp ? Number(prog.start_timestamp) : 0;
          const stopTs = prog.stop_timestamp ? Number(prog.stop_timestamp) : 0;
          const isNow = (prog.now_playing === 1) || (startTs > 0 && stopTs > 0 && nowSec >= startTs && nowSec <= stopTs);

          return {
            id: prog.id ? String(prog.id) : `epg-${channelId}-${index}`,
            title: decodeBase64Safe(prog.title) || 'Live Broadcast',
            description: decodeBase64Safe(prog.description) || '',
            start: prog.start || '',
            end: prog.end || '',
            startTimestamp: startTs,
            stopTimestamp: stopTs,
            isNowPlaying: isNow,
          };
        });

        this.epgCache.set(channelId, { data: epgPrograms, timestamp: now });
        return epgPrograms;
      }
    } catch (err: any) {
      logger.warn(`[LiveTvService] Error fetching EPG for channel ${channelId}:`, err.message);
    }

    // Fallback: If no EPG is available from upstream, generate a clean current live program
    const fallbackEpg: EpgProgram[] = [
      {
        id: `live-${channelId}`,
        title: 'Live TV Broadcast',
        description: 'Currently streaming live program on this channel.',
        start: new Date(now - 3600000).toISOString(),
        end: new Date(now + 3600000).toISOString(),
        startTimestamp: nowSec - 3600,
        stopTimestamp: nowSec + 3600,
        isNowPlaying: true,
      },
    ];

    this.epgCache.set(channelId, { data: fallbackEpg, timestamp: now });
    return fallbackEpg;
  }
}

export const liveTvService = new LiveTvService();
