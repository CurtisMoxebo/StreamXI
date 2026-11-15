import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../api/client.js';
import { AIPrediction, BetPrediction } from '../../types/index.js';

interface AiInsightsTabProps {
  matchId: string;
}

export const AiInsightsTab: React.FC<AiInsightsTabProps> = ({ matchId }) => {
  const { t } = useTranslation();
  const [insights, setInsights] = useState<AIPrediction | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    api.getMatchAiInsights(matchId)
      .then((data) => {
        if (isMounted) {
          setInsights(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load AI insights:', err);
        if (isMounted) {
          setError(err.response?.data?.error || 'Failed to load AI match prediction.');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [matchId]);

  if (loading) {
    return (
      <div className="py-16 text-center text-slate-400" data-testid="ai-tab-loading">
        <div className="w-9 h-9 border-2 border-brand-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-medium text-slate-300">
          Calculating Gemini 3.5 Flash-Lite tactical probabilities & predictions...
        </p>
      </div>
    );
  }

  if (error || !insights) {
    return (
      <div className="py-12 text-center text-slate-400 text-xs" data-testid="ai-tab-error">
        {error || 'AI prediction unavailable for this match.'}
      </div>
    );
  }

  const { probabilities, lowRiskBets, highRiskBets, analyticalSummary, model, generatedAt } = insights;

  // Helper for rendering bet prediction card
  const renderBetCard = (bet: BetPrediction, index: number, isHighRisk: boolean) => (
    <div
      key={`${bet.title}-${index}`}
      className={`p-4 rounded-xl border transition-all ${
        isHighRisk
          ? 'bg-amber-950/20 border-amber-500/30 hover:border-amber-500/50'
          : 'bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-500/50'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
          <span>{isHighRisk ? '⚡' : '🛡️'}</span>
          <span>{bet.title}</span>
        </h4>
        <span
          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
            isHighRisk
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
          }`}
        >
          {isHighRisk ? 'High Risk' : 'Low Risk'}
        </span>
      </div>

      <p className="text-xs text-slate-300 mb-3 leading-relaxed">
        {bet.reasoning}
      </p>

      {/* Confidence Meter */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span>{t('confidence')}</span>
          <span className="font-semibold text-slate-200">{bet.confidence}%</span>
        </div>
        <div className="h-1.5 w-full bg-surface-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              isHighRisk ? 'bg-amber-400' : 'bg-emerald-400'
            }`}
            style={{ width: `${bet.confidence}%` }}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6" data-testid="ai-insights-tab">
      
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-surface-800/80 p-3 rounded-xl border border-surface-700">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
          <span className="text-xs font-semibold text-white">
            Gemini AI Prediction Engine
          </span>
          <span className="text-[10px] bg-brand-500/20 text-brand-300 px-2 py-0.5 rounded border border-brand-500/30 font-mono">
            {model}
          </span>
        </div>
        <span className="text-[10px] text-slate-400">
          Updated: {new Date(generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {/* 1. Win & Draw Probabilities */}
      <div className="bg-surface-800/60 p-4 rounded-xl border border-surface-700/80 space-y-3">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
          {t('winDrawProbabilities')}
        </h3>

        {/* Triple Split Bar */}
        <div className="h-3 w-full rounded-full overflow-hidden flex bg-surface-900 border border-surface-700">
          <div
            className="bg-brand-500 transition-all duration-500"
            style={{ width: `${probabilities.homeWin}%` }}
            title={`Home Win: ${probabilities.homeWin}%`}
          />
          <div
            className="bg-slate-400 transition-all duration-500"
            style={{ width: `${probabilities.draw}%` }}
            title={`Draw: ${probabilities.draw}%`}
          />
          <div
            className="bg-accent-cyan transition-all duration-500"
            style={{ width: `${probabilities.awayWin}%` }}
            title={`Away Win: ${probabilities.awayWin}%`}
          />
        </div>

        {/* Legend / Values */}
        <div className="grid grid-cols-3 gap-2 text-center pt-1">
          <div className="bg-surface-850 p-2.5 rounded-lg border border-surface-750">
            <span className="block text-[11px] text-brand-400 font-semibold mb-0.5">Home Win</span>
            <span className="text-base sm:text-lg font-bold text-white">{probabilities.homeWin}%</span>
          </div>
          <div className="bg-surface-850 p-2.5 rounded-lg border border-surface-750">
            <span className="block text-[11px] text-slate-300 font-semibold mb-0.5">Draw</span>
            <span className="text-base sm:text-lg font-bold text-white">{probabilities.draw}%</span>
          </div>
          <div className="bg-surface-850 p-2.5 rounded-lg border border-surface-750">
            <span className="block text-[11px] text-accent-cyan font-semibold mb-0.5">Away Win</span>
            <span className="text-base sm:text-lg font-bold text-white">{probabilities.awayWin}%</span>
          </div>
        </div>
      </div>

      {/* 2. Low Risk & High Risk Bet Predictions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Low Risk Bets (2) */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wider">
            <span>🛡️</span>
            <span>{t('lowRiskPredictions')}</span>
          </div>
          <div className="space-y-3">
            {lowRiskBets.map((bet, idx) => renderBetCard(bet, idx, false))}
          </div>
        </div>

        {/* High Risk Bets (2) */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider">
            <span>⚡</span>
            <span>{t('highRiskPredictions')}</span>
          </div>
          <div className="space-y-3">
            {highRiskBets.map((bet, idx) => renderBetCard(bet, idx, true))}
          </div>
        </div>

      </div>

      {/* 3. One-paragraph Gemini AI Tactical Summary */}
      <div className="relative overflow-hidden rounded-xl border border-brand-500/40 bg-gradient-to-r from-surface-850 via-surface-800 to-surface-850 p-4 sm:p-5 shadow-lg">
        <div className="flex items-center gap-2 mb-2 text-brand-400">
          <svg className="w-5 h-5 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 2zm0 13a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 15zm8-5a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5A.75.75 0 0118 10zM5 10a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5A.75.75 0 015 10zm11.657-4.243a.75.75 0 010 1.06l-1.06 1.061a.75.75 0 11-1.062-1.06l1.061-1.061a.75.75 0 011.061 0zM6.464 13.536a.75.75 0 010 1.06l-1.06 1.061a.75.75 0 11-1.062-1.06l1.061-1.061a.75.75 0 011.061 0zm10.193 4.243a.75.75 0 01-1.06 0l-1.061-1.06a.75.75 0 111.06-1.062l1.061 1.061a.75.75 0 010 1.061zM6.464 6.464a.75.75 0 01-1.06 0l-1.061-1.06a.75.75 0 011.06-1.062l1.061 1.061a.75.75 0 010 1.061z" />
          </svg>
          <h4 className="text-xs sm:text-sm font-bold text-white">
            {t('aiTacticalSummary')}
          </h4>
        </div>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed italic">
          "{analyticalSummary}"
        </p>
      </div>

    </div>
  );
};
