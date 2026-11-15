import { describe, it, expect, beforeEach } from 'vitest';
import i18n, { detectBrowserLanguage, SUPPORTED_LANGUAGES, LANGUAGE_FLAGS } from '../src/i18n/index.js';

describe('Frontend Step 1: i18n Multilingual & Setup Tests', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en');
  });

  it('contains supported languages: English, French, and Spanish', () => {
    expect(SUPPORTED_LANGUAGES).toEqual(['en', 'fr', 'es']);
    expect(LANGUAGE_FLAGS.en.flag).toBe('🇬🇧');
    expect(LANGUAGE_FLAGS.fr.flag).toBe('🇫🇷');
    expect(LANGUAGE_FLAGS.es.flag).toBe('🇪🇸');
    expect(LANGUAGE_FLAGS.en.flagUrl).toContain('flagcdn.com/w40/gb.png');
    expect(LANGUAGE_FLAGS.fr.flagUrl).toContain('flagcdn.com/w40/fr.png');
    expect(LANGUAGE_FLAGS.es.flagUrl).toContain('flagcdn.com/w40/es.png');
  });

  it('detects language based on browser language, defaulting to "en" if neither en, fr, nor es', () => {
    const originalLanguage = navigator.language;

    try {
      Object.defineProperty(navigator, 'language', { value: 'fr-FR', configurable: true });
      expect(detectBrowserLanguage()).toBe('fr');

      Object.defineProperty(navigator, 'language', { value: 'es-MX', configurable: true });
      expect(detectBrowserLanguage()).toBe('es');

      Object.defineProperty(navigator, 'language', { value: 'en-GB', configurable: true });
      expect(detectBrowserLanguage()).toBe('en');

      // Neither en, fr, nor es (e.g. German, Portuguese, Japanese) -> defaults to 'en'
      Object.defineProperty(navigator, 'language', { value: 'de-DE', configurable: true });
      expect(detectBrowserLanguage()).toBe('en');

      Object.defineProperty(navigator, 'language', { value: 'ja-JP', configurable: true });
      expect(detectBrowserLanguage()).toBe('en');
    } finally {
      Object.defineProperty(navigator, 'language', { value: originalLanguage, configurable: true });
    }
  });

  it('switches translations seamlessly between EN, FR, and ES', async () => {
    await i18n.changeLanguage('en');
    expect(i18n.t('navFootball')).toBe('Football');
    expect(i18n.t('badgeSoon')).toBe('Soon');

    await i18n.changeLanguage('fr');
    expect(i18n.t('navFootball')).toBe('Football');
    expect(i18n.t('badgeSoon')).toBe('Bientôt');
    expect(i18n.t('filterLive')).toBe('En direct');

    await i18n.changeLanguage('es');
    expect(i18n.t('navFootball')).toBe('Fútbol');
    expect(i18n.t('badgeSoon')).toBe('Próximamente');
    expect(i18n.t('filterLive')).toBe('En vivo');
  });
});
