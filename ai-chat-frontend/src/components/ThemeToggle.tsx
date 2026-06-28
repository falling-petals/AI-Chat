import { Moon, Sun, Monitor } from 'lucide-react';
import { useChatStore } from '../store';

const THEME_ICONS = {
  light: Sun,
  dark: Moon,
  system: Monitor,
} as const;
const THEME_LABELS = {
  light: '浅色',
  dark: '深色',
  system: '跟随系统',
} as const;
const THEME_ORDER: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system'];

export default function ThemeToggle() {
  const theme = useChatStore((s) => s.theme);
  const setTheme = useChatStore((s) => s.setTheme);
  const cycleTheme = () => {
    const idx = THEME_ORDER.indexOf(theme);
    const next = THEME_ORDER[(idx + 1) % THEME_ORDER.length];
    setTheme(next);
  };
  const Icon = THEME_ICONS[theme];
  return (
    <button onClick={cycleTheme} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer" title={THEME_LABELS[theme]}>
      <Icon className="w-4 h-4 text-[#64748B] dark:text-slate-400" />
    </button>
  );
}
