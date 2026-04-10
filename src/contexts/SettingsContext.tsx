import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppSettings, ChatSettings } from '../types';

interface SettingsContextType {
  appSettings: AppSettings;
  setAppSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  chatSettings: ChatSettings;
  setChatSettings: React.Dispatch<React.SetStateAction<ChatSettings>>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [appSettings, setAppSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('appSettings');
    return saved ? JSON.parse(saved) : {
      goreLevel: 'medium',
      gmTone: 'classic',
      difficulty: 'normal',
      theme: 'dark',
      language: 'ru',
      soundEffects: true,
      vibration: true,
      animations: true,
      performanceMode: false
    };
  });

  const [chatSettings, setChatSettings] = useState<ChatSettings>(() => {
    const saved = localStorage.getItem('chatSettings');
    return saved ? JSON.parse(saved) : {
      fontFamily: 'sans',
      fontSize: 'md',
      lineHeight: 'normal',
      tracking: 'normal',
      boldNames: true,
      italicActions: true,
      highlightKeywords: false,
      textAlign: 'left',
      autoCapitalize: true,
      typewriterSpeed: 30,
      messageStyle: 'bubbles',
      compactMode: false,
      showTimestamps: true,
      avatarSize: 'md',
      hideSystemMessages: false,
      playerColors: true,
      aiTextColor: 'default',
      borderStyle: 'rounded',
      shadowIntensity: 'sm',
      linkColor: 'blue',
      whisperColor: 'gray',
      errorColor: 'red',
      autoScroll: true,
      smoothScroll: true,
      enableMarkdown: true,
      focusMode: false
    };
  });

  useEffect(() => {
    localStorage.setItem('appSettings', JSON.stringify(appSettings));
    if (appSettings.theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  }, [appSettings]);

  useEffect(() => {
    localStorage.setItem('chatSettings', JSON.stringify(chatSettings));
  }, [chatSettings]);

  return (
    <SettingsContext.Provider value={{ appSettings, setAppSettings, chatSettings, setChatSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
