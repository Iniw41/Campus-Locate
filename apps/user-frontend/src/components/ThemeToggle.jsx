// Round sun/moon button. Sits next to the notification bell in Topbar.jsx.
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext.jsx';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
      className="rounded-full bg-black p-2 text-white"
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} fill="currentColor" />}
    </button>
  );
}