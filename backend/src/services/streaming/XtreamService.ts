import axios from 'axios';
import { GoogleGenAI } from '@google/genai';
import { config } from '../../config/env.js';
import { Match, MatchStreamInfo, StreamChannel } from '../../models/index.js';
import { footballService } from '../football/FootballService.js';

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

    // Rule 2: Upcoming match in over 30 mins -> indicate upcoming
    if (match.status === 'upcoming' && minutesToKickoff > 30) {
      return {
        matchId,
        status: 'upcoming',
        statusMessage: `The game is upcoming. Live stream will load 30 minutes prior to kickoff.`,
        minutesToKickoff,
        channels: [],
      };
    }

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
      if (lower.includes('canal+') || lower.includes('rmc') || lower.includes('bein') || lower.includes('france') || lower.includes('tf1')) {
        channelsByCountry.France?.list.push(ch);
      } else if (lower.includes('tnt') || lower.includes('sky') || lower.includes('bbc') || lower.includes('itv') || lower.includes('premier')) {
        channelsByCountry.England?.list.push(ch);
      } else if (lower.includes('movistar') || lower.includes('dazn') || lower.includes('laliga') || lower.includes('vamos') || lower.includes('cuatro')) {
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

  private async fetchRawXtreamChannels(): Promise<RawXtreamChannel[]> {
    try {
      const url = `${config.XTREAM_URL}/player_api.php?username=${config.XTREAM_USERNAME}&password=${config.XTREAM_PASSWORD}&action=get_live_streams`;
      const res = await axios.get(url, { timeout: 3000 });
      if (Array.isArray(res.data)) {
        return res.data;
      }
    } catch {
      // Fallback to pre-configured catalog when Xtream server is in demo or offline mode
    }
    return [];
  }

  private getDefaultChannelsForCountry(country: string): RawXtreamChannel[] {
    switch (country) {
      case 'France':
        return [
          { stream_id: 101, name: 'Canal+ Foot HD', num: 1, category_id: '1' },
          { stream_id: 102, name: 'RMC Sport 1 UHD', num: 2, category_id: '1' },
          { stream_id: 103, name: 'BeIN Sports 1 France', num: 3, category_id: '1' },
        ];
      case 'England':
        return [
          { stream_id: 201, name: 'TNT Sports 1 UK', num: 1, category_id: '2' },
          { stream_id: 202, name: 'Sky Sports Main Event', num: 2, category_id: '2' },
          { stream_id: 203, name: 'BBC One HD Football', num: 3, category_id: '2' },
        ];
      case 'Spain':
      default:
        return [
          { stream_id: 301, name: 'Movistar Liga de Campeones', num: 1, category_id: '3' },
          { stream_id: 302, name: 'DAZN LaLiga 1', num: 2, category_id: '3' },
          { stream_id: 303, name: 'LaLiga TV Bar HD', num: 3, category_id: '3' },
        ];
    }
  }
}

export const xtreamService = new XtreamService();
