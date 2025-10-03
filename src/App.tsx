import React, { useEffect, useState } from 'react';
import HintBox from './components/HintBox';
import PlayerPanel from './components/PlayerPanel';
import Lock from './components/Lock';
import Results from './components/Results';
import { randomEntry, buildRings, isSolved } from './utils/dataLoader';
import { playTada, playConfettiBurst, playApplause } from './utils/sound';
import type { PlayerState, RoundData } from './types';

type Screen = 'start' | 'game' | 'results';

const TOPLAM_TUR = 8;

interface ActiveRoundState {
  roundData: RoundData;
  rings: string[][];
  indices: number[]; // active item index per ring
  solved: boolean;
  roundNumber: number;
  // Zamanlama
  startTime?: number; // ilk hareket zamanı (ms)
  totalTime?: number; // bu turun toplam süresi (s)
  remaining?: number; // kalan süre (s, tam sayı gösterim)
  targetParts: string[]; // bağlayıcılar filtrelenmiş gerçek hedef parçalar
}

const App: React.FC = () => {
  const [screen, setScreen] = useState<Screen>('start');
  const [players, setPlayers] = useState<PlayerState[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [usedIndices, setUsedIndices] = useState<Set<number>>(new Set());
  const [active, setActive] = useState<ActiveRoundState | null>(null);
  const [pendingAdvance, setPendingAdvance] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [championId, setChampionId] = useState<number | null>(null);

  // Start screen form state
  const [playerCount, setPlayerCount] = useState(1);
  const [nameInputs, setNameInputs] = useState<string[]>(['Oyuncu 1', 'Oyuncu 2', 'Oyuncu 3', 'Oyuncu 4']);

  function initPlayers(count: number) {
    return Array.from({ length: count }, (_, i) => ({ id: i, name: nameInputs[i] || `Oyuncu ${i+1}`, score: 0 }));
  }

  const CONNECTORS = new Set(['➡️','→','↪️','↔️','➡','➜']);

  function yeniTur(roundNumber: number, prevUsed: Set<number> = usedIndices) {
    const { entry, index } = randomEntry(prevUsed);
  const filtered = entry.emojiParts.filter(p => !CONNECTORS.has(p));
  const ringCount = Math.min(6, Math.max(2, filtered.length));
  // Hedef parçaların sadece ilk ringCount kadarını oyun state'ine dahil et
  const targetParts = filtered.slice(0, ringCount);
  const rings = buildRings(targetParts, ringCount);
    const indices = rings.map(() => 0); // start at index 0
    const nextUsed = new Set(prevUsed); nextUsed.add(index); setUsedIndices(nextUsed);
    // Süre hesapla: ilk 2 halka 100 sn, her ek halka +20 sn
    const baseTime = 100 + Math.max(0, ringCount - 2) * 20; // saniye
    const startMs = Date.now();
  setActive({ roundData: entry, rings, indices, solved: false, roundNumber, totalTime: baseTime, remaining: baseTime, startTime: startMs, targetParts });
  }

  function handleStart() {
    const ps = initPlayers(playerCount);
    setPlayers(ps);
    setCurrentPlayer(0);
    setUsedIndices(new Set());
    yeniTur(1, new Set());
    setScreen('game');
  }

  function rotateRing(ring: number, newIndex: number) {
    if (!active || active.solved) return;
    const now = Date.now();
    const next = { ...active, indices: [...active.indices] } as ActiveRoundState;
    next.indices[ring] = newIndex;
    // Uyumluluk: rings.length ve targetParts uzunluğu her tur için ringCount ile sınırlandı (buildRings fix).
    // Yine de beklenmeyen durumları gözlemlemek için geçici doğrulama (gerekirse kaldırılabilir).
    if (process.env.NODE_ENV !== 'production') {
      if (next.rings.length !== active.targetParts.length) {
        // eslint-disable-next-line no-console
        console.warn('Halka/Target uzunluk uyumsuzluğu', next.rings.length, active.targetParts.length);
      }
    }
  const solvedNow = isSolved(next.indices, next.rings, active.targetParts);
    next.solved = solvedNow;
    // İlk hareket ise sayaç başlat
    if (!active.startTime) {
      next.startTime = now;
    } else {
      next.startTime = active.startTime; // koru
    }
    setActive(next);
    if (solvedNow) {
      // Doğru çözüm sesi
      try { playTada(); } catch {}
      // Kalan süreyi puan olarak ver
      const awarded = Math.max(0, next.remaining ?? 0);
      if (awarded > 0) {
        setPlayers(prev => {
          const updated = prev.map((pl,i)=> i===currentPlayer ? { ...pl, score: pl.score + awarded }: pl);
          // Şampiyon kontrolü (1000+ puan)
          const newLeader = updated.find(p=> p.score >= 1000);
          if (newLeader && championId == null) {
            setChampionId(newLeader.id);
            // Anında sonuç ekranına git
            setTimeout(()=> setScreen('results'), 400);
          }
          return updated;
        });
      }
      setPendingAdvance(true);
      setCountdown(10); // 10 saniyelik geri sayım
    }
  }

  function advanceTurn(solved: boolean) {
    if (!active) return;
    setPendingAdvance(false);
    setCountdown(null);
    const isLastRound = active.roundNumber >= TOPLAM_TUR;
    if (isLastRound) {
      setScreen('results');
      return;
    }
    // Next round always increments round number regardless of who solved
    const nextRoundNumber = active.roundNumber + 1;
    // Next player turn order cycles each round
  setCurrentPlayer(prev => (prev + 1) % players.length);
    yeniTur(nextRoundNumber);
  }

  const handleManualNext = () => {
    if (!active) return;
    if (pendingAdvance) return; // already going
    // treat as failure attempt; just advance round without point
    setPendingAdvance(true);
    setTimeout(()=> advanceTurn(false), 400);
  };
  // Countdown effect when solved
  useEffect(() => {
    if (!pendingAdvance || countdown == null) return;
    if (countdown <= 0) {
      advanceTurn(true);
      return;
    }
    const t = setTimeout(() => setCountdown(c => (c==null?null:c-1)), 1000);
    return () => clearTimeout(t);
  }, [pendingAdvance, countdown]);

  // Oyun içi kalan süre sayaç efekti (anında başlar)
  useEffect(() => {
    if (!active || active.solved) return;
    if (!active.totalTime || !active.startTime) return;
    const interval = setInterval(() => {
      setActive(prev => {
        if (!prev) return prev;
        if (prev.solved) return prev;
        if (!prev.totalTime || !prev.startTime) return prev;
        const elapsedMs = Date.now() - prev.startTime;
        const elapsedSec = Math.floor(elapsedMs / 1000);
        const newRemaining = Math.max(0, (prev.totalTime ?? 0) - elapsedSec);
        if (newRemaining === prev.remaining) return prev;
        return { ...prev, remaining: newRemaining };
      });
    }, 250);
    return () => clearInterval(interval);
  }, [active?.startTime, active?.totalTime, active?.solved]);


  function restart() {
    setScreen('start');
    setPlayers([]);
    setActive(null);
    setUsedIndices(new Set());
  }

  // Responsive container classes
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 text-slate-100">
      <div className="flex-1 w-full px-3 md:px-6 py-4 flex flex-col items-center">
        {screen === 'start' && (
          <div className="w-full max-w-lg mt-10 p-6 bg-slate-800/70 border border-slate-700 rounded-xl space-y-5">
            <h1 className="text-3xl font-bold text-center text-amber-300">ÇarkEmoji</h1>
            <div>
              <label className="block text-sm mb-1">Oyuncu Sayısı</label>
              <div className="flex gap-2 justify-center mt-2">
                {[1,2,3,4].map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setPlayerCount(n)}
                    className={`px-4 py-2 rounded-lg font-semibold border transition-all text-sm
                      ${playerCount===n ? 'bg-amber-400 text-slate-900 border-amber-400 shadow-lg' : 'bg-slate-900 text-slate-100 border-slate-700 hover:bg-slate-800'}`}
                  >{n}</button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm">İsimler</p>
              {Array.from({ length: playerCount }).map((_,i)=>(
                <input key={i} value={nameInputs[i]} onChange={e=> {
                  const arr = [...nameInputs]; arr[i] = e.target.value; setNameInputs(arr);
                }} className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2" />
              ))}
            </div>
            <button onClick={handleStart} className="w-full py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-semibold shadow-lg shadow-emerald-600/30 transition">
              Oyuna Başla
            </button>
          </div>
        )}

        {screen === 'game' && active && (
          <div className="flex flex-col items-center w-full">
            <HintBox
              hint={active.roundData.hint}
              type={active.roundData.type}
              round={active.roundNumber}
              totalRounds={TOPLAM_TUR}
              solved={active.solved}
            />
            <div className="relative mt-6">
              <Lock
                rings={active.rings}
                indices={active.indices}
                onRotate={rotateRing}
                solved={!!active.solved}
                solution={active.solved ? active.roundData.text : undefined}
                countdown={active.solved ? countdown : null}
                onSkip={() => { if (active.solved) advanceTurn(true); }}
                awardedSeconds={active.solved ? Math.max(0, active.remaining ?? 0) : undefined}
              />
            </div>
            <div className="mt-4 text-center space-y-2">
              <p className="text-sm text-slate-400">Sıradaki Oyuncu: <span className="text-emerald-400 font-semibold">{players[currentPlayer]?.name}</span></p>
              {!active.solved && (
                <div className="w-full flex flex-col items-center gap-1">
                  <p className="text-[11px] text-amber-300 tracking-wide font-medium">Kalan Süre = Kazanabileceğin Puan</p>
                  <div className="w-72 max-w-[80vw] h-3 rounded bg-slate-700 overflow-hidden border border-slate-600 shadow-inner">
                    {(() => {
                      const total = active.totalTime ?? 1;
                      const rem = active.remaining ?? total;
                      const pct = Math.max(0, Math.min(100, (rem/total)*100));
                      return (
                        <div
                          className="h-full bg-gradient-to-r from-emerald-400 via-amber-300 to-red-500 transition-[width] duration-300 ease-linear"
                          style={{ width: pct + '%' }}
                        />
                      );
                    })()}
                  </div>
                  <p className="text-xs font-mono text-amber-200">{active.remaining ?? active.totalTime ?? 0}s</p>
                </div>
              )}
              {!active.solved && (
                <button onClick={handleManualNext} className="px-5 py-2 rounded-md bg-slate-700 hover:bg-slate-600 text-sm font-medium">Geç (Yeni Tur)</button>
              )}
              {active.solved && countdown != null && (
                <p className="text-emerald-400 text-sm font-semibold">Yeni tur {countdown}s</p>
              )}
              <div className="text-xs text-slate-500 max-w-xs">Her turda kilidi çözmek için halkaları döndür. Doğru emojiler hizalanırsa puan kazanırsın.</div>
            </div>
            <PlayerPanel players={players} currentPlayer={currentPlayer} />
          </div>
        )}

        {screen === 'results' && (
          <Results players={players} onRestart={restart} championId={championId} />
        )}
      </div>
  <footer className="text-center py-3 text-[11px] text-slate-500">© 2025 ÇarkEmoji</footer>
    </div>
  );
};

export default App;
