import React, { useEffect, useState } from 'react';
import { cn } from '../../lib/utils';
import { Dices } from 'lucide-react';

interface DiceOverlayProps {
  showDiceRoll: { player: string, value: number } | null;
}

export default function DiceOverlay({ showDiceRoll }: DiceOverlayProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (showDiceRoll) {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showDiceRoll]);

  if (!visible || !showDiceRoll) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div className="bg-black/80 text-white px-8 py-6 rounded-2xl shadow-2xl border border-neutral-800 flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
        <Dices size={48} className="text-orange-500 animate-bounce" />
        <div className="text-center">
          <p className="text-neutral-400 text-sm mb-1">{showDiceRoll.player} бросает кубики</p>
          <p className="text-5xl font-black text-white">{showDiceRoll.value}</p>
        </div>
      </div>
    </div>
  );
}
