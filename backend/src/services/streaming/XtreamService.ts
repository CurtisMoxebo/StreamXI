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

interface CountryMeta {
  country: string;
  countryCode: string;
  flag: string;
}

interface ChannelCandidate {
  id: string;
  name: string;
  country: string;
  raw: RawXtreamChannel;
}

export class XtreamService {
  private aiClient: GoogleGenAI | null = null;
  private cachedRawChannels: RawXtreamChannel[] | null = null;
  private matchChannelsCache = new Map<string, StreamChannel[]>();

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
   * Discovers TV channels from France, England/UK, Spain, and the competition host country.
   * Sends candidate channels (id, name, country) to AI (Gemini) to determine the exact TV channels
   * that will broadcast the game (at most 3 for each country), and suggests them to the frontend.
   */
  async discoverChannelsForMatch(match: Match): Promise<StreamChannel[]> {
    // Check in-memory cache for this match
    if (this.matchChannelsCache.has(match.id)) {
      return this.matchChannelsCache.get(match.id)!;
    }

    const rawChannels = await this.fetchRawXtreamChannels();

    // Country definitions
    const countriesMeta: Record<string, CountryMeta> = {
      France: { country: 'France', countryCode: 'fr', flag: '🇫🇷' },
      England: { country: 'England', countryCode: 'en', flag: '🇬🇧' },
      Spain: { country: 'Spain', countryCode: 'es', flag: '🇪🇸' },
    };

    // If competition country is not France, England, or Spain, add host country
    const hostCountry = match.competition.country;
    if (
      hostCountry &&
      !countriesMeta[hostCountry] &&
      hostCountry !== 'Europe' &&
      hostCountry !== 'World' &&
      hostCountry !== 'International'
    ) {
      countriesMeta[hostCountry] = {
        country: hostCountry,
        countryCode: match.competition.countryCode || 'ww',
        flag: this.getCountryFlag(match.competition.countryCode || hostCountry),
      };
    }

    // Group candidates by country
    const candidatesByCountry: Record<string, ChannelCandidate[]> = {
      France: [],
      England: [],
      Spain: [],
    };
    if (hostCountry && countriesMeta[hostCountry] && !candidatesByCountry[hostCountry]) {
      candidatesByCountry[hostCountry] = [];
    }

    // Filter and collect candidate sports channels
    for (const ch of rawChannels) {
      const lower = ch.name.toLowerCase();

      // Exclude non-football and non-sports channels
      if (
        lower.includes('event only') ||
        lower.includes('cinema') ||
        lower.includes('kids') ||
        lower.includes('series') ||
        lower.includes('vod') ||
        lower.includes('darts') ||
        lower.includes('f1') ||
        lower.includes('golf') ||
        lower.includes('cricket') ||
        lower.includes('billiard') ||
        lower.includes('boxing') ||
        lower.includes('ufc') ||
        lower.includes('nba') ||
        lower.includes('nfl') ||
        lower.includes('tennis')
      ) {
        continue;
      }

      // France
      if (
        (lower.startsWith('fr:') || lower.startsWith('fr |') || lower.includes('france') || lower.includes('bein fr')) &&
        (lower.includes('canal+') || lower.includes('rmc') || lower.includes('bein') || lower.includes('foot') || lower.includes('dazn') || lower.includes('sport') || lower.includes('tf1') || lower.includes('m6'))
      ) {
        candidatesByCountry.France.push({ id: String(ch.stream_id), name: ch.name, country: 'France', raw: ch });
      }
      // England / UK
      else if (
        (lower.startsWith('uk:') || lower.startsWith('uk |') || lower.startsWith('en:') || lower.startsWith('4k:') || lower.includes('sky sports') || lower.includes('tnt sports')) &&
        (lower.includes('main event') || lower.includes('premier') || lower.includes('football') || lower.includes('tnt sports') || lower.includes('sky sport') || lower.includes('bbc') || lower.includes('itv'))
      ) {
        candidatesByCountry.England.push({ id: String(ch.stream_id), name: ch.name, country: 'England', raw: ch });
      }
      // Spain
      else if (
        (lower.startsWith('es:') || lower.startsWith('es |') || lower.includes('movistar') || lower.includes('laliga') || lower.includes('dazn laliga')) &&
        (lower.includes('laliga') || lower.includes('campeones') || lower.includes('futbol') || lower.includes('movistar') || lower.includes('dazn') || lower.includes('deportes'))
      ) {
        candidatesByCountry.Spain.push({ id: String(ch.stream_id), name: ch.name, country: 'Spain', raw: ch });
      }
      // Host Country
      else if (hostCountry && candidatesByCountry[hostCountry]) {
        const code = (match.competition.countryCode || '').toLowerCase();
        if (
          (code && (lower.startsWith(`${code}:`) || lower.startsWith(`${code} |`))) ||
          lower.includes(hostCountry.toLowerCase())
        ) {
          if (lower.includes('sport') || lower.includes('foot') || lower.includes('tv') || lower.includes('live')) {
            candidatesByCountry[hostCountry].push({ id: String(ch.stream_id), name: ch.name, country: hostCountry, raw: ch });
          }
        }
      }
    }

    // Prepare candidate channels list for AI (id, name, country), capping at 25 per country for optimal prompt tokens
    const channelsForAI: Array<{ id: string; name: string; country: string }> = [];
    for (const [countryName, list] of Object.entries(candidatesByCountry)) {
      const candidates = list.length >= 3 ? list : this.getDefaultCandidatesForCountry(countryName);
      const capped = candidates.slice(0, 25);
      for (const c of capped) {
        channelsForAI.push({ id: c.id, name: c.name, country: c.country });
      }
    }

    // Call AI to select the channels sure to play the game (at most 3 for each country)
    const aiSelectedMap = await this.queryAIToSelectChannels(match, channelsForAI);

    // Build final suggested channels list
    const suggestedChannels: StreamChannel[] = [];

    for (const [countryName, meta] of Object.entries(countriesMeta)) {
      const countryChannels: StreamChannel[] = [];
      const aiChannelsForCountry = aiSelectedMap.get(countryName) || [];

      // Add AI selected channels (at most 3 per country)
      for (const selected of aiChannelsForCountry.slice(0, 3)) {
        countryChannels.push({
          id: selected.id,
          name: selected.name,
          country: meta.country,
          countryCode: meta.countryCode,
          flag: meta.flag,
          streamUrl: `/api/streams/relay/${selected.id}`,
        });
      }

      // If AI selected fewer than 3 channels, supplement with top candidate/default channels
      if (countryChannels.length < 3) {
        const candidateList = candidatesByCountry[countryName] && candidatesByCountry[countryName].length > 0
          ? candidatesByCountry[countryName]
          : this.getDefaultCandidatesForCountry(countryName);

        for (const candidate of candidateList) {
          if (countryChannels.length >= 3) break;
          if (!countryChannels.some((c) => c.id === candidate.id)) {
            countryChannels.push({
              id: candidate.id,
              name: candidate.name,
              country: meta.country,
              countryCode: meta.countryCode,
              flag: meta.flag,
              streamUrl: `/api/streams/relay/${candidate.id}`,
            });
          }
        }
      }

      // Enforce at most 3 channels for this country
      suggestedChannels.push(...countryChannels.slice(0, 3));
    }

    logger.info(
      `[XtreamService] Suggested ${suggestedChannels.length} broadcast channels for match ${match.homeTeam.name} vs ${match.awayTeam.name} across countries: ${Object.keys(countriesMeta).join(', ')}`
    );

    this.matchChannelsCache.set(match.id, suggestedChannels);
    return suggestedChannels;
  }

  /**
   * Sends candidate TV channels (id, name, country) to Gemini AI to determine which channels
   * are sure to play the game, returning at most 3 channels per country.
   */
  private async queryAIToSelectChannels(
    match: Match,
    channelsList: Array<{ id: string; name: string; country: string }>
  ): Promise<Map<string, Array<{ id: string; name: string; country: string }>>> {
    const selectedByCountry = new Map<string, Array<{ id: string; name: string; country: string }>>();

    if (!this.aiClient || channelsList.length === 0) {
      return selectedByCountry;
    }

    const hostCountryStr = match.competition.country && match.competition.country !== 'Europe' && match.competition.country !== 'World'
      ? `, and ${match.competition.country}`
      : '';

    const prompt = `You are an expert football broadcasting intelligence system for StreamXI.
Given the following football match:
- Competition: ${match.competition.name} (${match.competition.country})
- Match: ${match.homeTeam.name} vs ${match.awayTeam.name}
- Kickoff Time: ${match.kickoffTime}
- Status: ${match.status}

Here is the list of available TV channels for France, England, Spain${hostCountryStr}:
${JSON.stringify(channelsList, null, 2)}

TASK:
Determine which TV channels will broadcast and play this game based on official TV rights and sports broadcasting schedules.
Return ONLY channels where you are sure will play the game.
Return AT MOST 3 channels for each country (France: at most 3, England: at most 3, Spain: at most 3${hostCountryStr ? `, ${match.competition.country}: at most 3` : ''}).

Respond in STRICT JSON only (no markdown, no backticks, no code blocks):
{
  "selectedChannels": [
    {
      "id": "<channel_id from the provided list>",
      "name": "<channel_name from the provided list>",
      "country": "<France | England | Spain | other>",
      "reason": "<concise reason, e.g. official Champions League rights holder in France>"
    }
  ]
}`;

    try {
      logger.info(
        `[XtreamService] Querying Gemini AI to determine broadcasting channels for ${match.homeTeam.name} vs ${match.awayTeam.name} (Candidate channels: ${channelsList.length})`
      );

      const response = await this.aiClient.models.generateContent({
        model: config.GEMINI_MODEL,
        contents: prompt,
      });

      const rawText = response.text?.trim() || '';
      const cleanedText = rawText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
      const parsed = JSON.parse(cleanedText);

      if (parsed && Array.isArray(parsed.selectedChannels)) {
        for (const item of parsed.selectedChannels) {
          if (!item.id || !item.country) continue;

          // Normalize country alias (e.g. UK -> England)
          let normalizedCountry = item.country;
          if (normalizedCountry.toLowerCase() === 'uk' || normalizedCountry.toLowerCase() === 'united kingdom') {
            normalizedCountry = 'England';
          }

          if (!selectedByCountry.has(normalizedCountry)) {
            selectedByCountry.set(normalizedCountry, []);
          }

          const countryList = selectedByCountry.get(normalizedCountry)!;
          if (countryList.length < 3 && !countryList.some((c) => c.id === String(item.id))) {
            countryList.push({
              id: String(item.id),
              name: item.name || `Channel ${item.id}`,
              country: normalizedCountry,
            });
          }
        }

        logger.info(
          `[XtreamService] AI selected channels for match ${match.id}: ${Array.from(selectedByCountry.entries())
            .map(([c, list]) => `${c}: ${list.length}`)
            .join(', ')}`
        );
      }
    } catch (err: any) {
      logger.warn(`[XtreamService] Gemini AI channel selection failed, using fallback candidate selector: ${err.message}`);
    }

    return selectedByCountry;
  }

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

  private getDefaultCandidatesForCountry(country: string): ChannelCandidate[] {
    switch (country) {
      case 'France':
        return [
          { id: '1562835', name: 'FR: CANAL+ FOOT ᴿᴬᵂ', country: 'France', raw: { stream_id: 1562835, name: 'FR: CANAL+ FOOT ᴿᴬᵂ', num: 1, category_id: '1' } },
          { id: '1562830', name: 'FR: BEIN SPORTS 1 ᴿᴬᵂ', country: 'France', raw: { stream_id: 1562830, name: 'FR: BEIN SPORTS 1 ᴿᴬᵂ', num: 2, category_id: '1' } },
          { id: '1562854', name: 'FR: CANAL+ LIVE 1 ᴿᴬᵂ', country: 'France', raw: { stream_id: 1562854, name: 'FR: CANAL+ LIVE 1 ᴿᴬᵂ', num: 3, category_id: '1' } },
        ];
      case 'England':
      case 'UK':
        return [
          { id: '1544239', name: '4K: SKY SPORTS MAIN EVENTS ᵁᴴᴰ ³⁸⁴⁰ᴾ', country: 'England', raw: { stream_id: 1544239, name: '4K: SKY SPORTS MAIN EVENTS ᵁᴴᴰ ³⁸⁴⁰ᴾ', num: 1, category_id: '2' } },
          { id: '1562535', name: 'UK: SKY SPORT MAIN EVENT ᴿᴬᵂ', country: 'England', raw: { stream_id: 1562535, name: 'UK: SKY SPORT MAIN EVENT ᴿᴬᵂ', num: 2, category_id: '2' } },
          { id: '1562521', name: 'UK: SKY SPORT FOOTBALL ᴿᴬᵂ', country: 'England', raw: { stream_id: 1562521, name: 'UK: SKY SPORT FOOTBALL ᴿᴬᵂ', num: 3, category_id: '2' } },
        ];
      case 'Spain':
      default:
        return [
          { id: '1577208', name: 'ES: M.LALIGA ᴴᴰᴿ ³⁸⁴⁰ᴾ', country: 'Spain', raw: { stream_id: 1577208, name: 'ES: M.LALIGA ᴴᴰᴿ ³⁸⁴⁰ᴾ', num: 1, category_id: '3' } },
          { id: '1577207', name: 'ES: M.LALIGA DE CAMPEONES 1 ᴴᴰ', country: 'Spain', raw: { stream_id: 1577207, name: 'ES: M.LALIGA DE CAMPEONES 1 ᴴᴰ', num: 2, category_id: '3' } },
          { id: '1577206', name: 'ES: M.LALIGA DE CAMPEONES 2 ᴴᴰ', country: 'Spain', raw: { stream_id: 1577206, name: 'ES: M.LALIGA DE CAMPEONES 2 ᴴᴰ', num: 3, category_id: '3' } },
        ];
    }
  }

  private getCountryFlag(countryCodeOrName: string): string {
    const code = countryCodeOrName.toLowerCase();
    switch (code) {
      case 'fr':
      case 'france':
        return '🇫🇷';
      case 'en':
      case 'uk':
      case 'gb':
      case 'england':
        return '🇬🇧';
      case 'es':
      case 'spain':
        return '🇪🇸';
      case 'de':
      case 'germany':
        return '🇩🇪';
      case 'it':
      case 'italy':
        return '🇮🇹';
      case 'pt':
      case 'portugal':
        return '🇵🇹';
      case 'nl':
      case 'netherlands':
        return '🇳🇱';
      case 'be':
      case 'belgium':
        return '🇧🇪';
      case 'sa':
      case 'saudi arabia':
        return '🇸🇦';
      case 'tr':
      case 'turkey':
        return '🇹🇷';
      default:
        return '🌍';
    }
  }
}

export const xtreamService = new XtreamService();
