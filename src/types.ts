import { Timestamp } from "firebase/firestore";

export interface UserProfile {
  currentRoomId: string | null;
}

export interface Room {
  id: string;
  hostId: string;
  scenario: string;
  turn: number;
  status: 'lobby' | 'playing';
  quests: string[];
  currentRoll?: { playerUid: string; playerName: string; value: number; timestamp: number } | null;
  isGenerating?: boolean;
  storySummary?: string;
  lastSummaryTurn?: number;
  worldState?: string; // Dynamic compendium/economy state
  factions?: Record<string, string>; // Faction relations and status
  hiddenTimers?: Record<string, number>; // Quest timers (e.g., "Save hostage": 3 turns left)
  createdAt: Timestamp;
}

export interface Player {
  uid: string;
  name: string;
  profile: string;
  inventory: string[];
  skills: string[];
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  stress?: number; // 0-100 psychological stress
  alignment?: string; // e.g., "Хаотично-Добрый"
  injuries?: string[]; // Permanent or semi-permanent injuries
  statuses?: string[]; // Temporary effects (Poisoned, Bleeding, Buffed)
  mutations?: string[]; // Hidden or visible curses/mutations
  reputation?: Record<string, number>; // Faction/NPC standing (-100 to 100)
  action: string;
  isHiddenAction?: boolean;
  isReady: boolean;
  joinedAt: Timestamp;
}

export interface Message {
  id: string;
  role: 'system' | 'ai' | 'players' | 'player';
  content: string;
  reasoning?: string;
  playerName?: string;
  playerUid?: string;
  isHidden?: boolean;
  turn: number;
  createdAt: Timestamp;
}

export interface BestiaryEntry {
  id?: string;
  title: string;
  content: string;
  discoveredAt: any;
}
