import React from 'react';

interface Props { hint: string; type: string; round: number; totalRounds: number; solution?: string; countdown?: number | null; solved?: boolean; }

const HintBox: React.FC<Props> = ({ hint, type, round, totalRounds, solution, countdown, solved }) => {
  return (
    <div className="w-full max-w-2xl mx-auto p-4 bg-slate-800/70 rounded-lg border border-slate-700 backdrop-blur">
      <div className="flex justify-between text-xs text-slate-400 mb-1">
        <span>İpucu</span>
        <span>Tur {round}/{totalRounds}</span>
      </div>
      {!solved && (
        <p className="text-lg md:text-xl font-semibold text-amber-300 mb-1">{hint}</p>
      )}
      <p className="text-xs uppercase tracking-wider text-slate-400 flex items-center gap-2">
        <span>{type}</span>
      </p>
    </div>
  );
};
export default HintBox;
