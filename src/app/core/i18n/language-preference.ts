const LANG_KEY = 'lightway_lang_pref';

export function getInitialLanguage(): 'fr' | 'en' {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved === 'fr' || saved === 'en') {
      return saved;
    }
    const navLang = navigator.language?.toLowerCase();
    if (navLang?.startsWith('en')) {
      return 'en';
    }
  } catch {
    // localStorage might be unavailable
  }
  return 'fr';
}

export function saveLanguagePreference(lang: 'fr' | 'en'): void {
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {
    // localStorage might be unavailable
  }
}
