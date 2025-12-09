import { useEffect, useState, createContext, useContext } from 'react';
import { themeApi } from '../services/api';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const response = await themeApi.getActive();
      if (response.success && response.data) {
        applyTheme(response.data);
        setTheme(response.data);
      }
    } catch (err) {
      console.error('Failed to load theme:', err);
      // Apply default theme on error
      applyTheme(getDefaultTheme());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultTheme = () => ({
    organizationName: 'Pickleball College',
    primaryColor: '#047857',
    primaryDarkColor: '#065f46',
    primaryLightColor: '#d1fae5',
    accentColor: '#f59e0b',
    accentDarkColor: '#d97706',
    accentLightColor: '#fef3c7',
    successColor: '#10b981',
    errorColor: '#ef4444',
    warningColor: '#f59e0b',
    infoColor: '#3b82f6',
    textPrimaryColor: '#111827',
    textSecondaryColor: '#6b7280',
    textLightColor: '#f9fafb',
    backgroundColor: '#ffffff',
    backgroundSecondaryColor: '#f3f4f6',
    borderColor: '#e5e7eb',
    shadowColor: '#00000026',
    fontFamily: 'Inter, system-ui, sans-serif',
    headingFontFamily: 'Playfair Display, serif'
  });

  const applyTheme = (themeData) => {
    const root = document.documentElement;

    root.style.setProperty('--color-primary', themeData.primaryColor);
    root.style.setProperty('--color-primary-dark', themeData.primaryDarkColor);
    root.style.setProperty('--color-primary-light', themeData.primaryLightColor);
    root.style.setProperty('--color-accent', themeData.accentColor);
    root.style.setProperty('--color-accent-dark', themeData.accentDarkColor);
    root.style.setProperty('--color-accent-light', themeData.accentLightColor);
    root.style.setProperty('--color-success', themeData.successColor);
    root.style.setProperty('--color-error', themeData.errorColor);
    root.style.setProperty('--color-warning', themeData.warningColor);
    root.style.setProperty('--color-info', themeData.infoColor);
    root.style.setProperty('--color-text-primary', themeData.textPrimaryColor);
    root.style.setProperty('--color-text-secondary', themeData.textSecondaryColor);
    root.style.setProperty('--color-text-light', themeData.textLightColor);
    root.style.setProperty('--color-background', themeData.backgroundColor);
    root.style.setProperty('--color-background-secondary', themeData.backgroundSecondaryColor);
    root.style.setProperty('--color-border', themeData.borderColor);
    root.style.setProperty('--color-shadow', themeData.shadowColor);
    root.style.setProperty('--font-family', themeData.fontFamily);
    root.style.setProperty('--font-family-heading', themeData.headingFontFamily);

    if (themeData.organizationName) {
      document.title = themeData.organizationName;
    }

    if (themeData.faviconUrl) {
      let favicon = document.querySelector("link[rel='icon']");
      if (!favicon) {
        favicon = document.createElement('link');
        favicon.rel = 'icon';
        document.head.appendChild(favicon);
      }
      favicon.href = themeData.faviconUrl;
    }

    if (themeData.customCss) {
      let styleEl = document.getElementById('custom-theme-css');
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'custom-theme-css';
        document.head.appendChild(styleEl);
      }
      styleEl.textContent = themeData.customCss;
    }
  };

  const refreshTheme = async () => {
    await loadTheme();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, applyTheme, refreshTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export { ThemeProvider };
