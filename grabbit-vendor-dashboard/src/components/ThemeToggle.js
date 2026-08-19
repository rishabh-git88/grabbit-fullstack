import React from 'react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  return (
    <button className="theme-toggle" onClick={toggleTheme} aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`} title={`Switch to ${isDark ? 'light' : 'dark'} mode`}>
      <span>{isDark ? '☀️' : '🌙'}</span>
      <span className="theme-toggle-label">{isDark ? 'Light' : 'Dark'}</span>
    </button>
  );
}
