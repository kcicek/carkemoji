import React, { useEffect } from 'react';
import { PlayerState } from '../types';
import { playConfettiBurst, playApplause } from '../utils/sound';

interface Props { players: PlayerState[]; onRestart: () => void; championId?: number | null; }

const Results: React.FC<Props> = ({ players, onRestart, championId }) => {
  const max = Math.max(...players.map(p=>p.score));
  const winners = players.filter(p=>p.score===max);
  const champion = championId != null ? players.find(p=>p.id===championId) : null;
  // Winner açıklandığında efektler
  useEffect(() => {
    // Bir kez tetikle
    try { playConfettiBurst(); } catch {}
    // İkinci bir küçük patlama
    setTimeout(()=> { try { playConfettiBurst(); } catch {} }, 300);
    // Ardından alkış (biraz gecikmeli)
    setTimeout(()=> { try { playApplause(); } catch {} }, 450);
  }, []);
  return (
    <div className="flex flex-col items-center gap-6 py-10 w-full relative">
      {/* Konfeti: artık sadece şampiyon olduğunda değil her sonuç ekranında göster */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden z-20" aria-hidden>
        {Array.from({ length: 80 }).map((_,i)=> {
          const size = 4 + Math.random()*6; // 4-10px
          return (
            <span
              key={i}
              className="absolute block rounded-sm animate-fall"
              style={{
                width: size + 'px',
                height: (size*1.4) + 'px',
                left: Math.random()*100+'%',
                top: '-10%',
                background: ['#fbbf24','#f59e0b','#10b981','#3b82f6','#ec4899','#a855f7'][i%6],
                opacity: 0.9,
                animationDelay: (Math.random()*2)+'s',
                animationDuration: (2.5+Math.random()*2)+'s',
                transform: `rotate(${Math.random()*360}deg)`
              }}
            />
          );
        })}
      </div>
  <style>{`@keyframes confFall {0%{transform:translate3d(0,-10vh,0) rotate(0deg);}100%{transform:translate3d(calc(var(--drift)*1px),110vh,0) rotate(720deg);} } .animate-fall{animation:confFall linear infinite; will-change: transform;} .animate-fall:nth-child(odd){--drift: 60;} .animate-fall:nth-child(even){--drift:-40;}`}</style>
      <h2 className="text-3xl font-bold text-amber-300 flex items-center gap-2">
        Sonuçlar {champion && <span className="text-sm px-2 py-1 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-300">Şampiyon: {champion.name}</span>}
      </h2>
      <div className="grid gap-3 w-full max-w-md">
        {players.sort((a,b)=>b.score-a.score).map(p=> (
          <div key={p.id} className={`p-3 rounded-md border relative ${p.id===championId? 'border-emerald-400 bg-emerald-600/15 shadow-[0_0_0_2px_rgba(16,185,129,0.3),0_0_18px_2px_rgba(16,185,129,0.35)]': p.score===max?'border-amber-400 bg-amber-500/10':'border-slate-700 bg-slate-800/60'}`}> 
            {p.id===championId && <div className="absolute -top-2 -right-2 text-xl" title="Şampiyon">🏆</div>}
            <div className="flex justify-between"><span className="font-semibold">{p.name}</span><span className="text-amber-300 font-bold">{p.score}</span></div>
          </div>
        ))}
      </div>
      <div className="text-center">
        {winners.length===1 ? (
          <p className="text-xl">Kazanan: <span className="text-emerald-400 font-semibold">{winners[0].name}</span></p>
        ) : (
          <p className="text-xl">Kazananlar: {winners.map(w=>w.name).join(', ')}</p>
        )}
      </div>
      <button onClick={onRestart} className="px-6 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 transition font-semibold shadow">
        Tekrar Oyna
      </button>
    </div>
  );
};
export default Results;
