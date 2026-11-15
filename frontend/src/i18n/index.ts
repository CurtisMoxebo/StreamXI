import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

export const SUPPORTED_LANGUAGES = ['en', 'fr', 'es'] as const;
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

export const LANGUAGE_FLAGS: Record<SupportedLanguage, { flag: string; flagUrl: string; label: string; name: string }> = {
  en: { flag: '🇬🇧', flagUrl: 'https://flagcdn.com/w40/gb.png', label: 'EN', name: 'English' },
  fr: { flag: '🇫🇷', flagUrl: 'https://flagcdn.com/w40/fr.png', label: 'FR', name: 'Français' },
  es: { flag: '🇪🇸', flagUrl: 'https://flagcdn.com/w40/es.png', label: 'ES', name: 'Español' },
};

export function detectBrowserLanguage(): SupportedLanguage {
  if (typeof window === 'undefined' || !navigator.language) {
    return 'en';
  }
  const code = navigator.language.toLowerCase().substring(0, 2);
  if (SUPPORTED_LANGUAGES.includes(code as SupportedLanguage)) {
    return code as SupportedLanguage;
  }
  return 'en';
}

export const resources = {
  en: {
    translation: {
      tagline: 'Football Schedules & Live Streams',
      searchPlaceholder: 'Search teams, leagues (e.g. Real Madrid, Arsenal, Champions League)...',
      menuTitle: 'Menu Navigation',
      navFootball: 'Football',
      navLiveTv: 'Live TV',
      badgeSoon: 'Soon',
      topLeagues: 'Top Competitions',
      prevDay: 'Previous',
      nextDay: 'Next',
      badgeToday: 'Today',
      filterAll: 'All Matches',
      filterLive: 'Live',
      filterUpcoming: 'Upcoming',
      filterFinished: 'Finished',
      legendLive: 'Green Score: Live Game',
      legendPast: 'White Score: Finished Game',
      legendRedCard: 'Red Card',
      statusUpcoming: 'Upcoming',
      statusFinished: 'FT (Full Time)',
      startsSoon: 'Starts in 25 min',
      noResultsTitle: 'No matches found',
      noResultsDesc: 'Try searching for different team names or competitions, or clear your search query to see all games for today.',
      btnResetSearch: 'Reset Filter',
      
      // Match Details & Video Player
      backToMatches: 'Back to Matches',
      streamEnded: 'The game is over.',
      streamUpcoming: 'The game is upcoming. Live stream will load 30 minutes prior to kickoff.',
      streamLoading: 'Connecting to IPTV stream...',
      chooseBroadcast: 'Broadcast Channel:',
      
      // Tabs
      tabLineups: 'Lineups',
      tabStats: 'Stats & H2H',
      tabAiInsights: 'AI Insights',
      confirmedLineup: 'Confirmed Lineup',
      projectedLineup: 'Projected Lineup',
      headCoach: 'Head Coach',
      substitutes: 'Substitutes',
      
      // Stats
      last5Games: 'Last 5 Games Form',
      goalsScored: 'Goals Scored',
      goalsConceded: 'Goals Conceded',
      expectedGoals: 'Expected Goals (xG)',
      possession: 'Possession',
      bigChances: 'Big Chances Created',
      cleanSheets: 'Clean Sheets',
      shotsTotal: 'Total Shots',
      shotsOnTarget: 'Shots on Target',
      goalkeeperSaves: 'Goalkeeper Saves',
      cornerKicks: 'Corner Kicks',
      fouls: 'Fouls Committed',
      passes: 'Completed Passes',
      tackles: 'Tackles Won',
      yellowCards: 'Yellow Cards',
      redCards: 'Red Cards',
      
      // AI Tab
      winDrawProbabilities: 'Win & Draw Probabilities',
      lowRiskPredictions: 'Low-Risk Predictions',
      highRiskPredictions: 'High-Risk Predictions',
      aiTacticalSummary: 'AI Tactical Analysis',
      confidence: 'Confidence',
      
      // Footer
      copyright: '© 2026 StreamXI. All rights reserved.',
    },
  },
  fr: {
    translation: {
      tagline: 'Calendriers et diffusions de football en direct',
      searchPlaceholder: 'Rechercher équipes, ligues (ex. Real Madrid, Arsenal, Ligue des Champions)...',
      menuTitle: 'Navigation',
      navFootball: 'Football',
      navLiveTv: 'Télé en direct',
      badgeSoon: 'Bientôt',
      topLeagues: 'Compétitions majeures',
      prevDay: 'Précédent',
      nextDay: 'Suivant',
      badgeToday: "Aujourd'hui",
      filterAll: 'Tous les matchs',
      filterLive: 'En direct',
      filterUpcoming: 'À venir',
      filterFinished: 'Terminés',
      legendLive: 'Score vert : En direct',
      legendPast: 'Score blanc : Match terminé',
      legendRedCard: 'Carton rouge',
      statusUpcoming: 'À venir',
      statusFinished: 'Terminé (Fin du match)',
      startsSoon: 'Commence dans 25 min',
      noResultsTitle: 'Aucun match trouvé',
      noResultsDesc: 'Essayez de rechercher d\'autres équipes ou compétitions, ou réinitialisez la recherche.',
      btnResetSearch: 'Réinitialiser',
      
      backToMatches: 'Retour aux matchs',
      streamEnded: 'Le match est terminé.',
      streamUpcoming: 'Le match est à venir. Le flux en direct chargera 30 minutes avant le coup d\'envoi.',
      streamLoading: 'Connexion au flux IPTV...',
      chooseBroadcast: 'Chaîne de diffusion :',
      
      tabLineups: 'Compositions',
      tabStats: 'Stats & Face-à-face',
      tabAiInsights: 'Analyses IA',
      confirmedLineup: 'Composition officielle',
      projectedLineup: 'Composition probable',
      headCoach: 'Entraîneur',
      substitutes: 'Remplaçants',
      
      last5Games: 'Forme sur les 5 derniers matchs',
      goalsScored: 'Buts marqués',
      goalsConceded: 'Buts encaissés',
      expectedGoals: 'Buts attendus (xG)',
      possession: 'Possession',
      bigChances: 'Grosses occasions créées',
      cleanSheets: 'Matchs sans encaisser',
      shotsTotal: 'Tirs totaux',
      shotsOnTarget: 'Tirs cadrés',
      goalkeeperSaves: 'Arrêts du gardien',
      cornerKicks: 'Corners',
      fouls: 'Fautes commises',
      passes: 'Passes réussies',
      tackles: 'Tacles réussis',
      yellowCards: 'Cartons jaunes',
      redCards: 'Cartons rouges',
      
      winDrawProbabilities: 'Probabilités de victoire et nul',
      lowRiskPredictions: 'Prédictions à faible risque',
      highRiskPredictions: 'Prédictions à haut risque',
      aiTacticalSummary: 'Analyse tactique IA',
      confidence: 'Confiance',
      
      copyright: '© 2026 StreamXI. Tous droits réservés.',
    },
  },
  es: {
    translation: {
      tagline: 'Horarios y retransmisiones de fútbol en vivo',
      searchPlaceholder: 'Buscar equipos, ligas (ej. Real Madrid, Arsenal, Champions League)...',
      menuTitle: 'Navegación',
      navFootball: 'Fútbol',
      navLiveTv: 'TV en vivo',
      badgeSoon: 'Próximamente',
      topLeagues: 'Competiciones destacadas',
      prevDay: 'Anterior',
      nextDay: 'Siguiente',
      badgeToday: 'Hoy',
      filterAll: 'Todos los partidos',
      filterLive: 'En vivo',
      filterUpcoming: 'Próximos',
      filterFinished: 'Finalizados',
      legendLive: 'Marcador verde: En vivo',
      legendPast: 'Marcador blanco: Finalizado',
      legendRedCard: 'Tarjeta roja',
      statusUpcoming: 'Próximo',
      statusFinished: 'Final (Tiempo completo)',
      startsSoon: 'Empieza en 25 min',
      noResultsTitle: 'No se encontraron partidos',
      noResultsDesc: 'Intenta buscar otros nombres de equipos o competiciones, o restablece la búsqueda.',
      btnResetSearch: 'Restablecer filtro',
      
      backToMatches: 'Volver a partidos',
      streamEnded: 'El partido ha concluido.',
      streamUpcoming: 'El partido está próximo. La retransmisión cargará 30 minutos antes del inicio.',
      streamLoading: 'Conectando con la señal IPTV...',
      chooseBroadcast: 'Canal de transmisión:',
      
      tabLineups: 'Alineaciones',
      tabStats: 'Estadísticas y H2H',
      tabAiInsights: 'Predicciones IA',
      confirmedLineup: 'Alineación confirmada',
      projectedLineup: 'Alineación probable',
      headCoach: 'Director técnico',
      substitutes: 'Suplentes',
      
      last5Games: 'Forma en los últimos 5 partidos',
      goalsScored: 'Goles marcados',
      goalsConceded: 'Goles encajados',
      expectedGoals: 'Goles esperados (xG)',
      possession: 'Posesión',
      bigChances: 'Grandes ocasiones creadas',
      cleanSheets: 'Porterías a cero',
      shotsTotal: 'Tiros totales',
      shotsOnTarget: 'Tiros a puerta',
      goalkeeperSaves: 'Paradas del portero',
      cornerKicks: 'Córners',
      fouls: 'Faltas cometidas',
      passes: 'Pases completados',
      tackles: 'Entradas ganadas',
      yellowCards: 'Tarjetas amarillas',
      redCards: 'Tarjetas rojas',
      
      winDrawProbabilities: 'Probabilidades de victoria y empate',
      lowRiskPredictions: 'Apuestas de bajo riesgo',
      highRiskPredictions: 'Apuestas de alto riesgo',
      aiTacticalSummary: 'Análisis táctico IA',
      confidence: 'Confianza',
      
      copyright: '© 2026 StreamXI. Todos los derechos reservados.',
    },
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    lng: detectBrowserLanguage(),
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
