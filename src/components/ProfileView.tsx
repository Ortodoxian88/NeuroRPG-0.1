import React from 'react';
import { X, Settings, LogOut } from 'lucide-react';
import { cn } from '../lib/utils';
import { authService } from '../services/auth';

interface ProfileViewProps {
  user: any;
  onClose: () => void;
  onOpenSettings: () => void;
}

export default function ProfileView({ user, onClose, onOpenSettings }: ProfileViewProps) {
  return (
    <div className="flex-1 flex flex-col p-6 space-y-8 overflow-y-auto bg-black">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold font-display">Профиль</h2>
        <button onClick={onClose} className="p-2 text-neutral-500 hover:text-white">
          <X size={24} />
        </button>
      </div>

      <div className="flex flex-col items-center text-center space-y-4 py-4">
        <div className="w-32 h-32 rounded-[2.5rem] bg-neutral-800 border-2 border-orange-500/30 flex items-center justify-center overflow-hidden shadow-2xl shadow-orange-500/10">
          {user.user_metadata?.avatar_url ? (
            <img src={user.user_metadata.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-5xl font-bold">{user.email?.[0].toUpperCase()}</span>
          )}
        </div>
        <div>
          <h3 className="text-2xl font-bold text-white">{user.user_metadata?.full_name || user.email?.split('@')[0]}</h3>
          <p className="text-neutral-500 text-sm">{user.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-neutral-900/50 border border-neutral-800 p-4 rounded-3xl space-y-1">
          <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Статус</p>
          <p className="text-white font-bold flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            В сети
          </p>
        </div>
        <div className="bg-neutral-900/50 border border-neutral-800 p-4 rounded-3xl space-y-1">
          <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">ID</p>
          <p className="text-white font-mono text-xs truncate">{user.id.slice(0, 8)}...</p>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-widest px-2">Управление</h4>
        <button 
          onClick={onOpenSettings}
          className="w-full flex items-center gap-4 p-4 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-2xl transition-all"
        >
          <Settings size={20} className="text-neutral-400" />
          <span className="font-bold">Настройки</span>
        </button>
        <button 
          onClick={() => { authService.logout(); onClose(); }}
          className="w-full flex items-center gap-4 p-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-2xl transition-all text-red-500"
        >
          <LogOut size={20} />
          <span className="font-bold">Выйти из аккаунта</span>
        </button>
      </div>
    </div>
  );
}
