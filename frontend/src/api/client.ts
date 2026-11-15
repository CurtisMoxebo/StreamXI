import axios from 'axios';
import { Match, MatchLineups, MatchStatsResponse, AIPrediction, MatchStreamInfo } from '../types/index.js';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  getMatches: async (date?: string): Promise<{ date: string; totalMatches: number; groups: { competition: any; matches: Match[] }[] }> => {
    const res = await apiClient.get('/matches', { params: { date } });
    return res.data;
  },

  getMatchById: async (id: string): Promise<Match> => {
    const res = await apiClient.get(`/matches/${id}`);
    return res.data;
  },

  getMatchLineups: async (id: string): Promise<MatchLineups> => {
    const res = await apiClient.get(`/matches/${id}/lineups`);
    return res.data;
  },

  getMatchStats: async (id: string): Promise<MatchStatsResponse> => {
    const res = await apiClient.get(`/matches/${id}/stats`);
    return res.data;
  },

  getMatchAiInsights: async (id: string): Promise<AIPrediction> => {
    const res = await apiClient.get(`/matches/${id}/ai-insights`);
    return res.data;
  },

  getMatchStreamInfo: async (id: string): Promise<MatchStreamInfo> => {
    const res = await apiClient.get(`/matches/${id}/stream-info`);
    return res.data;
  },
};
