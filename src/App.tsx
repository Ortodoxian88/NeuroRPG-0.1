/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import Lobby from './components/Lobby';
import RoomView from './components/RoomView';
import BestiaryView from './components/BestiaryView';
import SettingsView from './components/SettingsView';
import ErrorBoundary from './components/ErrorBoundary';
import ReportModal from './components/ReportModal';
import ProfileView from './components/ProfileView';
import { LogOut, BookOpen, Home, DoorOpen, MoreVertical, Settings, Bug, X, Send, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { cn } from './lib/utils';
import { useAuth } from './hooks/useAuth';
import { useSettings } from './contexts/SettingsContext';
import { authService } from './services/auth';
import { signInWithGoogle } from './supabase';

type ViewState = 'main' | 'bestiary' | 'settings';

export default function App() {
  const { appSettings, setAppSettings, chatSettings, setChatSettings } = useSettings();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [activeView, setActiveView] = useState<ViewState>('main');
  const [showProfile, setShowProfile] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    if (appSettings.theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  }, [appSettings.theme]);

  useEffect(() => {
    const handleClickOutside = () => setShowMoreMenu(false);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.warn("Unhandled rejection caught:", event.reason);
      // Suppress Vite WebSocket errors as they are benign in this environment
      if (event.reason?.message?.includes('WebSocket') || event.reason?.message?.includes('vite')) {
        event.preventDefault();
      }
    };
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => window.removeEventListener('unhandledrejection', handleUnhandledRejection);
  }, []);

  useEffect(() => {
    setLoading(authLoading);
    setProfileLoading(false);
    if (user) {
      const savedRoomId = localStorage.getItem(`currentRoomId_${user.id}`);
      if (savedRoomId) {
        setCurrentRoomId(savedRoomId);
      }
    }
  }, [user, authLoading]);

  const handleRoomSelected = (roomId: string) => {
    if (!user) return;
    localStorage.setItem(`currentRoomId_${user.id}`, roomId);
    setCurrentRoomId(roomId);
    setActiveView('main');
  };

  const handleMinimizeRoom = async () => {
    if (!user) return;
    localStorage.removeItem(`currentRoomId_${user.id}`);
    setCurrentRoomId(null);
    setActiveView('main');
  };

  const handleLeaveRoom = async () => {
    if (!user) return;
    
    localStorage.removeItem(`currentRoomId_${user.id}`);
    setCurrentRoomId(null);
    setActiveView('main');
  };

  if (loading || profileLoading) {
    return (
      <div className="min-h-[100dvh] bg-black flex items-center justify-center text-neutral-400">
        Загрузка...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[100dvh] bg-black flex items-center justify-center">
        <div className="w-full max-w-md h-[100dvh] bg-black flex flex-col items-center justify-center p-8 text-neutral-100 overflow-hidden relative border-x border-neutral-900 shadow-2xl">
          <div className="flex flex-col items-center justify-center w-full space-y-12 text-center max-w-xs">
            <div className="space-y-4">
              <div className="w-24 h-24 bg-orange-600 rounded-[2.5rem] mx-auto flex items-center justify-center shadow-2xl shadow-orange-600/20 rotate-3 animate-in zoom-in duration-500">
                <span className="text-5xl font-black text-white">N</span>
              </div>
              <div className="space-y-2">
                <h1 className="text-5xl font-bold tracking-tighter text-white font-display pt-4">NeuroRPG</h1>
                <p className="text-neutral-500 text-sm font-medium uppercase tracking-[0.2em]">Цифровой Гейм-мастер</p>
              </div>
            </div>
            
            <div className="w-full space-y-4">
              {authError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-xl text-left animate-in fade-in slide-in-from-bottom-2">
                  {authError}
                </div>
              )}
              <button
                onClick={async () => {
                  console.log("Sign in button clicked");
                  setAuthError(null);
                  setIsSigningIn(true);
                  const result = await signInWithGoogle();
                  if (result && !result.success) {
                    setAuthError(result.error || "Произошла неизвестная ошибка");
                    setIsSigningIn(false);
                  }
                }}
                disabled={isSigningIn}
                className="w-full flex items-center justify-center gap-4 px-4 py-5 border border-transparent text-lg font-bold rounded-3xl text-black bg-white hover:bg-neutral-200 transition-all active:scale-95 shadow-2xl shadow-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSigningIn ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-6 h-6" alt="" />
                )}
                {isSigningIn ? 'Вход...' : 'Войти через Google'}
              </button>
              <p className="text-[10px] text-neutral-600 font-medium uppercase tracking-widest leading-relaxed">
                Авторизация необходима для сохранения <br /> твоего прогресса и персонажей
              </p>
            </div>
          </div>

          {/* Report Modal */}
          <ReportModal 
            isOpen={showReportModal} 
            onClose={() => setShowReportModal(false)} 
            userEmail={user?.email} 
            roomId={currentRoomId} 
          />
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className={cn(
        "h-[100dvh] text-neutral-100 font-sans flex flex-col max-w-md mx-auto relative shadow-2xl overflow-hidden border-x",
        appSettings.theme === 'black' ? "bg-black border-neutral-900" : appSettings.theme === 'light' ? "bg-white text-black border-neutral-200" : "bg-neutral-950 border-neutral-900",
        !appSettings.animations && "no-animations",
        appSettings.performanceMode && "performance-mode"
      )}>
        {isOffline && (
          <div className="bg-red-500 text-white text-[10px] font-bold text-center py-1 z-50 shrink-0 uppercase tracking-widest">
            Автономный режим
          </div>
        )}
        {activeView === 'main' && (
          <header className={cn(
            "shrink-0 border-b backdrop-blur-md p-5 flex justify-between items-center z-30",
            appSettings.theme === 'light' ? "bg-white/80 border-neutral-200" : "bg-black/80 border-neutral-900"
          )}>
            <div className="flex items-center gap-3">
              <h1 
                className={cn(
                  "text-2xl font-bold tracking-tight cursor-pointer flex items-center gap-2 font-display",
                  appSettings.theme === 'light' ? "text-black" : "text-white"
                )}
                onClick={() => { setActiveView('main'); setCurrentRoomId(currentRoomId); }}
              >
                NeuroRPG
              </h1>
              {currentRoomId && activeView === 'main' && (
                <button 
                  onClick={() => setActiveView('bestiary')} 
                  className="text-orange-500 hover:text-orange-400 flex items-center gap-1 text-sm font-bold uppercase tracking-wider bg-orange-500/10 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <BookOpen size={16} /> Бестиарий
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              {currentRoomId && activeView === 'main' ? (
                <>
                  <button
                    onClick={handleMinimizeRoom}
                    className="p-2 text-neutral-400 hover:text-white transition-colors rounded-xl hover:bg-neutral-900"
                    title="Свернуть игру"
                  >
                    <Home size={24} />
                  </button>
                  <div className="relative">
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowMoreMenu(!showMoreMenu); }}
                      className="p-2 text-neutral-400 hover:text-white transition-colors rounded-xl hover:bg-neutral-900"
                    >
                      <MoreVertical size={24} />
                    </button>
                    
                    {showMoreMenu && (
                      <div className="absolute right-0 mt-2 w-56 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden z-50">
                        <button 
                          onClick={() => { setActiveView('settings'); setShowMoreMenu(false); }}
                          className="w-full flex items-center gap-3 px-5 py-4 text-base text-neutral-300 hover:bg-neutral-800 transition-colors"
                        >
                          <Settings size={20} /> Настройки
                        </button>
                        <button 
                          onClick={() => { handleLeaveRoom(); setShowMoreMenu(false); }}
                          className="w-full flex items-center gap-3 px-5 py-4 text-base text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <DoorOpen size={20} /> Покинуть сессию
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <button 
                  onClick={() => setShowProfile(true)}
                  className="flex items-center gap-3 hover:bg-neutral-900 p-1.5 rounded-2xl transition-all active:scale-95"
                >
                    <span className="text-sm font-bold text-neutral-500 uppercase tracking-widest truncate max-w-[80px]">{user.user_metadata?.full_name?.split(' ')[0] || user.email?.split('@')[0]}</span>
                    <div className="w-10 h-10 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center overflow-hidden">
                      {user.user_metadata?.avatar_url ? <img src={user.user_metadata.avatar_url} alt="" /> : <span className="text-base">{user.email?.[0].toUpperCase()}</span>}
                    </div>
                </button>
              )}
            </div>
          </header>
        )}

        <main className="flex-1 flex flex-col relative overflow-hidden">
          {showProfile ? (
            <ProfileView 
              user={user} 
              onClose={() => setShowProfile(false)} 
              onOpenSettings={() => { setShowProfile(false); setActiveView('settings'); }}
            />
          ) : activeView === 'bestiary' ? (
            <BestiaryView onBack={() => setActiveView('main')} appSettings={appSettings} />
          ) : activeView === 'settings' ? (
            <SettingsView 
              appSettings={appSettings} 
              setAppSettings={setAppSettings} 
              chatSettings={chatSettings} 
              setChatSettings={setChatSettings} 
              onClose={() => setActiveView('main')} 
            />
          ) : currentRoomId ? (
            <RoomView 
              roomId={currentRoomId} 
              onLeave={handleLeaveRoom} 
              onMinimize={handleMinimizeRoom}
              onOpenBestiary={() => setActiveView('bestiary')} 
              appSettings={appSettings}
              chatSettings={chatSettings}
            />
          ) : (
            <Lobby 
              onOpenBestiary={() => setActiveView('bestiary')} 
              onOpenSettings={() => { setActiveView('settings'); }}
              onOpenReport={() => setShowReportModal(true)}
              appSettings={appSettings}
              onRoomSelected={handleRoomSelected}
            />
          )}
        </main>
        
        {/* Global Report Modal (for logged in users) */}
        <ReportModal 
          isOpen={showReportModal} 
          onClose={() => setShowReportModal(false)} 
          userEmail={user?.email} 
          roomId={currentRoomId} 
        />
      </div>
    </ErrorBoundary>
  );
}
