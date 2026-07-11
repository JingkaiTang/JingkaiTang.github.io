export type ThemeNavItem = {
  href: string;
  label: string;
  external?: boolean;
};

export type ThemeKey = 'tech' | 'day' | 'night' | 'cny' | 'spring' | 'summer';

export type ThemeOption = {
  value: ThemeKey;
  label: string;
};

export const THEME_BRAND = 'JINGKAI//TANG';

// Default theme entrypoint: update this value when changing site default theme.
export const DEFAULT_THEME: ThemeKey = 'spring';
export const THEME_STORAGE_KEY = 'site-theme';
export const THEME_KEYS: ThemeKey[] = ['tech', 'day', 'night', 'cny', 'spring', 'summer'];

export const THEME_OPTIONS: ThemeOption[] = [
  { value: 'tech', label: '🤖 科技' },
  { value: 'day', label: '☀️ 白天' },
  { value: 'night', label: '🌙 黑夜' },
  { value: 'cny', label: '🧧 新春' },
  { value: 'spring', label: '🌸 春季' },
  { value: 'summer', label: '✨ 夏夜' },
];

export const THEME_NAV_ITEMS: ThemeNavItem[] = [
  { href: '/writing', label: '文章' },
  { href: '/now', label: 'Now' },
  { href: '/tags/ai/', label: 'AI' },
  { href: '/tags/game/', label: '游戏' },
  { href: '/tags/life/', label: '生活' },
  { href: '/search', label: 'Search' },
  { href: '/rss.xml', label: 'RSS' },
  { href: 'https://github.com/JingkaiTang', label: 'GitHub', external: true },
];
