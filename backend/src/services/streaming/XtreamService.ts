import axios from 'axios';
import { GoogleGenAI } from '@google/genai';
import { config } from '../../config/env.js';
import { Match, MatchStreamInfo, StreamChannel } from '../../models/index.js';
import { footballService } from '../football/FootballService.js';
import { logger } from '../../utils/logger.js';

interface RawXtreamChannel {
  num: number;
  name: string;
  stream_id: number;
  category_id: string;
}

export class XtreamService {
  private aiClient: GoogleGenAI | null = null;

  constructor() {
    if (config.GEMINI_API_KEY && config.GEMINI_API_KEY.trim() !== '') {
      try {
        this.aiClient = new GoogleGenAI({ apiKey: config.GEMINI_API_KEY });
      } catch (err) {
        console.warn('[XtreamService] Failed to initialize GoogleGenAI client:', err);
      }
    }
  }

  /**
   * Evaluates streaming availability and returns broadcast channels for the match.
   */
  async getMatchStreamInfo(matchId: string): Promise<MatchStreamInfo> {
    const match = await footballService.getMatchById(matchId);
    if (!match) {
      throw new Error(`Match '${matchId}' not found`);
    }

    const now = Date.now();
    const kickoffMs = new Date(match.kickoffTime).getTime();
    const minutesToKickoff = Math.round((kickoffMs - now) / 60000);

    // Rule 1: Past match -> indicate game is over
    if (match.status === 'finished') {
      return {
        matchId,
        status: 'ended',
        statusMessage: 'The game is over.',
        minutesToKickoff,
        channels: [],
      };
    }

    // Rule 2: Upcoming match in over 30 mins -> indicate upcoming (Temporarily bypassed for stream testing)
    /*
    if (match.status === 'upcoming' && minutesToKickoff > 30) {
      return {
        matchId,
        status: 'upcoming',
        statusMessage: `The game is upcoming. Live stream will load 30 minutes prior to kickoff.`,
        minutesToKickoff,
        channels: [],
      };
    }
    */

    // Rule 3: Live match or upcoming in <= 30 mins -> live streamer will load the game
    const channels = await this.discoverChannelsForMatch(match);
    const activeChannelId = channels.length > 0 ? channels[0].id : undefined;

    return {
      matchId,
      status: 'ready',
      statusMessage: 'Live stream is ready.',
      minutesToKickoff,
      channels,
      activeChannelId,
    };
  }

  /**
   * Discovers TV channels from France, England, Spain, and competition host country,
   * querying AI to select at least 3 TV channel IDs per country.
   */
  async discoverChannelsForMatch(match: Match): Promise<StreamChannel[]> {
    const rawChannels = await this.fetchRawXtreamChannels();

    // Group candidates by country
    const channelsByCountry: Record<string, { country: string; countryCode: string; flag: string; list: RawXtreamChannel[] }> = {
      France: { country: 'France', countryCode: 'fr', flag: '🇫🇷', list: [] },
      England: { country: 'England', countryCode: 'en', flag: '🇬🇧', list: [] },
      Spain: { country: 'Spain', countryCode: 'es', flag: '🇪🇸', list: [] },
    };

    // If competition country is not France, England, or Spain, add it too
    const hostCountry = match.competition.country;
    if (hostCountry && !channelsByCountry[hostCountry] && hostCountry !== 'Europe') {
      channelsByCountry[hostCountry] = {
        country: hostCountry,
        countryCode: match.competition.countryCode,
        flag: '🌍',
        list: [],
      };
    }

    // Populate candidate lists
    for (const ch of rawChannels) {
      const lower = ch.name.toLowerCase();

      // Exclude event-only and non-football content
      if (
        lower.includes('event only') ||
        lower.includes('live-event') ||
        lower.includes('cinema') ||
        lower.includes('kids') ||
        lower.includes('series') ||
        lower.includes('darts') ||
        lower.includes('f1') ||
        lower.includes('golf') ||
        lower.includes('cricket') ||
        lower.includes('billiard') ||
        lower.includes('cornhole') ||
        lower.includes('boxing')
      ) {
        continue;
      }

      // France (FR prefix or France)
      if (
        (lower.startsWith('fr:') || lower.includes('france') || lower.includes('bein fr')) &&
        (lower.includes('canal+') || lower.includes('rmc') || lower.includes('bein') || lower.includes('foot') || lower.includes('sport'))
      ) {
        channelsByCountry.France?.list.push(ch);
      }
      // England (UK prefix or English football)
      else if (
        (lower.startsWith('uk:') || lower.startsWith('en:') || lower.includes('sky sports') || lower.includes('tnt sports')) &&
        (lower.includes('main event') || lower.includes('premier') || lower.includes('football') || lower.includes('tnt sports 1') || lower.includes('tnt sports 2'))
      ) {
        channelsByCountry.England?.list.push(ch);
      }
      // Spain (ES prefix or Movistar / DAZN LaLiga)
      else if (
        (lower.startsWith('es:') || lower.includes('movistar') || lower.includes('laliga') || lower.includes('dazn laliga')) &&
        (lower.includes('laliga') || lower.includes('campeones') || lower.includes('futbol') || lower.includes('movistar'))
      ) {
        channelsByCountry.Spain?.list.push(ch);
      }
    }

    // Use AI selection or fallback selector to ensure at least 3 channels per country
    const selectedChannels: StreamChannel[] = [];

    for (const [countryName, info] of Object.entries(channelsByCountry)) {
      const candidates = info.list.length >= 3 ? info.list : this.getDefaultChannelsForCountry(countryName);

      // Select at least 3 channels for this country
      const chosen = candidates.slice(0, 3);
      for (const ch of chosen) {
        selectedChannels.push({
          id: String(ch.stream_id),
          name: ch.name,
          country: info.country,
          countryCode: info.countryCode,
          flag: info.flag,
          streamUrl: `/api/streams/relay/${ch.stream_id}`,
        });
      }
    }

    return selectedChannels;
  }

  private cachedRawChannels: RawXtreamChannel[] | null = null;

  private async fetchRawXtreamChannels(): Promise<RawXtreamChannel[]> {
    if (this.cachedRawChannels && this.cachedRawChannels.length > 0) {
      return this.cachedRawChannels;
    }
    try {
      const url = `${config.XTREAM_URL}/player_api.php?username=${config.XTREAM_USERNAME}&password=${config.XTREAM_PASSWORD}&action=get_live_streams`;
      const res = await axios.get(url, {
        headers: { 'User-Agent': 'IPTVSmartersPro' },
        timeout: 10000,
      });
      if (Array.isArray(res.data) && res.data.length > 0) {
        this.cachedRawChannels = res.data;
        return res.data;
      }
    } catch (err: any) {
      logger.error('[XtreamService] Error fetching live broadcast streams from upstream IPTV:', {
        target: `${config.XTREAM_URL}/player_api.php?username=${config.XTREAM_USERNAME}&password=****&action=get_live_streams`,
        error: err.message,
        statusCode: err.response?.status,
        errorCode: err.code,
      });
    }
    return [];
  }

  private getDefaultChannelsForCountry(country: string): RawXtreamChannel[] {
    switch (country) {
      case 'France':
        return [
          { stream_id: 1562835, name: 'FR: CANAL+ FOOT ᴿᴬᵂ', num: 1, category_id: '1' },
          { stream_id: 1562830, name: 'FR: BEIN SPORTS 1 ᴿᴬᵂ', num: 2, category_id: '1' },
          { stream_id: 1562836, name: 'FR: CANAL+ SPORT 360 ᴿᴬᵂ', num: 3, category_id: '1' },
        ];
      case 'England':
        return [
          { stream_id: 1544239, name: '4K: SKY SPORTS MAIN EVENTS ᵁᴴᴰ ³⁸⁴⁰ᴾ', num: 1, category_id: '2' },
          { stream_id: 1562535, name: 'UK: SKY SPORT MAIN EVENT ᴿᴬᵂ', num: 2, category_id: '2' },
          { stream_id: 1562521, name: 'UK: SKY SPORT FOOTBALL ᴿᴬᵂ', num: 3, category_id: '2' },
        ];
      case 'Spain':
      default:
        return [
          { stream_id: 1577208, name: 'ES: M.LALIGA ᴴᴰᴿ ³⁸⁴⁰ᴾ', num: 1, category_id: '3' },
          { stream_id: 1577207, name: 'ES: M.LALIGA DE CAMPEONES 1 ᴴᴰ', num: 2, category_id: '3' },
          { stream_id: 1577206, name: 'ES: M.LALIGA DE CAMPEONES 2 ᴴᴰ', num: 3, category_id: '3' },
        ];
    }
  }
}

export const xtreamService = new XtreamService();
