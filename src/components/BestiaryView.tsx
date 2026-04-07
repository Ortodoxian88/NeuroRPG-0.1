import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { BestiaryEntry, AppSettings } from '../types';
import { ArrowLeft, BookOpen, Search } from 'lucide-react';
import { cn } from '../lib/utils';

export default function BestiaryView({ onBack, appSettings }: { onBack: () => void, appSettings: AppSettings }) {
  const [entries, setEntries] = useState<BestiaryEntry[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'bestiary'), orderBy('title', 'asc'));
    return onSnapshot(q, (snap) => {
      setEntries(snap.docs.map(d => ({ id: d.id, ...d.data() } as BestiaryEntry)));
    });
  }, []);

  const filteredEntries = entries.filter(e => 
    e.title.toLowerCase().includes(search.toLowerCase()) || 
    e.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={cn(
      "flex-1 flex flex-col h-full absolute inset-0 z-50",
      appSettings.theme === 'light' ? "bg-neutral-50" : "bg-black"
    )}>
      <div className={cn(
        "p-4 border-b flex items-center gap-4 backdrop-blur-md",
        appSettings.theme === 'light' ? "bg-white/80 border-neutral-200" : "bg-black/80 border-neutral-800"
      )}>
        <button 
          onClick={onBack} 
          className={cn(
            "p-2 rounded-full transition-colors",
            appSettings.theme === 'light' ? "hover:bg-neutral-100" : "hover:bg-neutral-900"
          )}
        >
          <ArrowLeft size={24} className="text-orange-500" />
        </button>
        <h1 className={cn(
          "text-xl font-bold flex items-center gap-2 font-display",
          appSettings.theme === 'light' ? "text-neutral-900" : "text-white"
        )}>
          <BookOpen className="text-orange-500" /> Бестиарий
        </h1>
      </div>
      
      <div className={cn(
        "p-4 border-b",
        appSettings.theme === 'light' ? "bg-white border-neutral-200" : "bg-neutral-950 border-neutral-900"
      )}>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" size={20} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по бестиарию..."
            className={cn(
              "w-full border rounded-2xl py-4 pl-12 pr-4 text-base focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none transition-all",
              appSettings.theme === 'light' ? "bg-neutral-50 border-neutral-200 text-neutral-900" : "bg-neutral-900 border-neutral-800 text-neutral-100"
            )}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-20">
        {entries.length === 0 ? (
          <p className="text-neutral-500 text-center py-8">Бестиарий пока пуст. Исследуйте мир, чтобы пополнить его.</p>
        ) : filteredEntries.length === 0 ? (
          <p className="text-neutral-500 text-center py-8">Ничего не найдено.</p>
        ) : (
          filteredEntries.map(entry => (
            <div 
              key={entry.id} 
              className={cn(
                "border rounded-xl p-5",
                appSettings.theme === 'light' ? "bg-white border-neutral-200 shadow-sm" : "bg-neutral-900 border-neutral-800"
              )}
            >
              <h2 className="text-xl font-bold text-orange-500 mb-2 font-display">{entry.title}</h2>
              <div className={cn(
                "whitespace-pre-wrap text-base leading-relaxed",
                appSettings.theme === 'light' ? "text-neutral-700" : "text-neutral-300"
              )}>{entry.content}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
