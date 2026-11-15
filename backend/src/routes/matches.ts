import { Router, Request, Response } from 'express';
import { footballService } from '../services/football/FootballService.js';

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
