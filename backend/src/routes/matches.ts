import { Router, Request, Response } from 'express';
import { footballService } from '../services/football/FootballService.js';
import { aiService } from '../services/ai/AIService.js';

export const matchesRouter = Router();

/**
 * GET /api/matches
 * Returns list of games grouped by competition, sorted by kickoff time.
 * Supports ?date=YYYY-MM-DD
 */
matchesRouter.get('/', async (req: Request, res: Response) => {
  try {
    const dateQuery = typeof req.query.date === 'string' ? req.query.date : undefined;
    const result = await footballService.getMatchesGroupedByCompetition(dateQuery);
    res.json(result);
  } catch (err) {
    console.error('Error fetching matches:', err);
    res.status(500).json({ error: 'Failed to retrieve match schedule' });
  }
});

/**
 * GET /api/matches/:id
 * Returns single match header details (teams, status, scores, scorers, red cards)
 */
matchesRouter.get('/:id', async (req: Request<{ id: string }>, res: Response) => {
  try {
    const matchId = String(req.params.id);
    const match = await footballService.getMatchById(matchId);
    if (!match) {
      res.status(404).json({ error: 'Match not found' });
      return;
    }
    res.json(match);
  } catch (err) {
    console.error(`Error fetching match ${req.params.id}:`, err);
    res.status(500).json({ error: 'Failed to retrieve match details' });
  }
});

/**
 * GET /api/matches/:id/lineups
 * Tab 1: Lineup of both teams on football pitch with positions, coach, and substitutes.
 */
matchesRouter.get('/:id/lineups', async (req: Request<{ id: string }>, res: Response) => {
  try {
    const matchId = String(req.params.id);
    const lineups = await footballService.getMatchLineups(matchId);
    if (!lineups) {
      res.status(404).json({ error: 'Lineups not found for this match' });
      return;
    }
    res.json(lineups);
  } catch (err) {
    console.error(`Error fetching lineups for ${req.params.id}:`, err);
    res.status(500).json({ error: 'Failed to retrieve lineups' });
  }
});

/**
 * GET /api/matches/:id/stats
 * Tab 2:
 * - If game is upcoming: last 5 games form, W/D/L, goals scored/conceded, xG, possession, big chances.
 * - If game is live or past: in-game stats (possession, shots, saves, corners, fouls, cards).
 */
matchesRouter.get('/:id/stats', async (req: Request<{ id: string }>, res: Response) => {
  try {
    const matchId = String(req.params.id);
    const stats = await footballService.getMatchStats(matchId);
    if (!stats) {
      res.status(404).json({ error: 'Stats not found for this match' });
      return;
    }
    res.json(stats);
  } catch (err) {
    console.error(`Error fetching stats for ${req.params.id}:`, err);
    res.status(500).json({ error: 'Failed to retrieve match stats' });
  }
});

/**
 * GET /api/matches/:id/ai-insights
 * Tab 3: AI prediction and insights
 * Only exists for live or upcoming matches.
 * Returns: win/draw probability, 2 low risk bets, 2 high risk bets, and 1 paragraph AI insight.
 */
matchesRouter.get('/:id/ai-insights', async (req: Request<{ id: string }>, res: Response) => {
  try {
    const matchId = String(req.params.id);
    const match = await footballService.getMatchById(matchId);
    if (!match) {
      res.status(404).json({ error: 'Match not found' });
      return;
    }

    if (match.status === 'finished') {
      res.status(400).json({
        error: 'AI insights are only available for upcoming or live matches.',
      });
      return;
    }

    const insights = await aiService.getMatchInsights(matchId);
    res.json(insights);
  } catch (err: any) {
    console.error(`Error generating AI insights for ${req.params.id}:`, err);
    res.status(500).json({ error: err.message || 'Failed to generate AI insights' });
  }
});
