// Sliding sun/moon switch. Lives in the floating header (Topbar.jsx).
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext.jsx';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
      className="relative flex h-9 w-[68px] items-center rounded-full bg-gray-100 p-1 transition-colors"
    >
      <span
        className={`absolute left-1 h-7 w-7 rounded-full bg-maroon shadow-md transition-transform duration-300 ease-out ${
          isDark ? 'translate-x-8' : 'translate-x-0'
        }`}
      />
      <span className={`relative z-10 flex h-7 w-8 items-center justify-center ${isDark ? 'text-gray-500' : 'text-white'}`}>
        <Sun size={15} />
      </span>
      <span className={`relative z-10 flex h-7 w-7 items-center justify-center ${isDark ? 'text-white' : 'text-gray-500'}`}>
        <Moon size={15} />
      </span>
    </button>
  );
}