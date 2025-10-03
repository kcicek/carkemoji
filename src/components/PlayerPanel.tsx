import React from 'react';
import { PlayerState } from '../types';

interface Props { players: PlayerState[]; currentPlayer: number; }

const PlayerPanel: React.FC<Props> = ({ players, currentPlayer }) => {
  return (
    <div className="flex flex-wrap justify-center gap-3 w-full max-w-3xl mx-auto mt-4">
      {players.map((p, i) => (
        <div key={p.id} className={`px-3 py-2 rounded-md border text-sm flex flex-col items-center min-w-[90px] ${i===currentPlayer? 'bg-emerald-600/30 border-emerald-400 shadow-lg shadow-emerald-500/20':'bg-slate-800/60 border-slate-700'}`}> 
          <span className="font-semibold truncate max-w-[80px]">{p.name}</span>
          <span className="text-xs text-slate-400">Puan: <span className="text-amber-300 font-semibold">{p.score}</span></span>
          {i===currentPlayer && <span className="mt-1 text-[10px] tracking-wider text-emerald-300">Sıran</span>}
        </div>
      ))}
    </div>
  );
};
export default PlayerPanel;
