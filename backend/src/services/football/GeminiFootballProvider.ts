import { GoogleGenAI } from '@google/genai';
import { IFootballDataProvider } from './IFootballDataProvider.js';
import { Match, MatchLineups, MatchStatsResponse } from '../../models/index.js';
import { getSeedMatches, getSeedLineups, getSeedStats } from './seedData.js';
import { config } from '../../config/env.js';

export class GeminiFootballProvider implements IFootballDataProvider {
  private aiClient: GoogleGenAI | null = null;

  constructor() {
    if (config.GEMINI_API_KEY && config.GEMINI_API_KEY.trim() !== '') {
      try {
        this.aiClient = new GoogleGenAI({ apiKey: config.GEMINI_API_KEY });
      } catch (err) {
        console.warn('[GeminiFootballProvider] Failed to initialize GoogleGenAI client:', err);
      }
    }
  }

  async getMatchesByDate(dateString: string): Promise<Match[]> {
    // If Gemini client is active, we could ask Gemini for structured fixtures.
    // For reliable resilience and testing, return normalized structured match fixtures:
    const matches = getSeedMatches(dateString);
    return matches;
  }

  async getMatchById(id: string): Promise<Match | null> {
    const today = new Date().toISOString().substring(0, 10);
    const matches = getSeedMatches(today);
    const match = matches.find((m) => m.id === id);
    return match || null;
  }

  async getMatchLineups(matchId: string): Promise<MatchLineups | null> {
    return getSeedLineups(matchId);
  }

  async getMatchStats(matchId: string): Promise<MatchStatsResponse | null> {
    const match = await this.getMatchById(matchId);
    if (!match) return null;
    return getSeedStats(match);
  }
}
