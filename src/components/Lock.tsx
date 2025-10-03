import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { splitEmojis } from '../utils/dataLoader';
import { playTick } from '../utils/sound';

interface LockRingProps {
  items: string[];
  activeIndex: number;
  radius: number;        // this ring's radius
  outerRadius: number;   // largest radius (for scaling)
  ringIndex: number;
  onChange: (ring: number, newIndex: number) => void;
  disabled?: boolean;
}

const LockRing: React.FC<LockRingProps> = ({ items, activeIndex, radius, outerRadius, ringIndex, onChange, disabled }) => {
  const size = radius*2;
  const ringRef = useRef<HTMLDivElement | null>(null);
  const startAngleRef = useRef<number | null>(null);
  const startIndexRef = useRef<number>(activeIndex);
  // Basit: rotation = -stepAngle*activeIndex -90 (üst hizalama)
  const [rotationDeg, setRotationDeg] = useState<number>(- (360 / items.length) * activeIndex - 90);
  const holdTimeoutRef = useRef<number | null>(null);
  const spinIntervalRef = useRef<number | null>(null);
  const lastEmitRef = useRef<number>(activeIndex);

  // Update rotationDeg whenever activeIndex changes keeping direction continuity.
  useEffect(() => {
    const stepAngle = 360 / items.length;
    setRotationDeg(- stepAngle * activeIndex - 90);
  }, [activeIndex, items.length]);

  function clientAngle(e: Touch | MouseEvent): number {
    const rect = ringRef.current!.getBoundingClientRect();
    const cx = rect.left + rect.width/2;
    const cy = rect.top + rect.height/2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    return Math.atan2(dy, dx) * 180/Math.PI; // degrees
  }

  const movedRef = useRef(false);
  const pointerActiveRef = useRef(false);

  function beginPointer(e: React.PointerEvent) {
    if (disabled) return;
    pointerActiveRef.current = true;
    movedRef.current = false;
    startAngleRef.current = clientAngle(e.nativeEvent as any);
    startIndexRef.current = activeIndex;
    // schedule hold auto-spin (only if not moved)
    if (holdTimeoutRef.current) window.clearTimeout(holdTimeoutRef.current);
    holdTimeoutRef.current = window.setTimeout(() => {
      if (movedRef.current || !pointerActiveRef.current) return;
      spinIntervalRef.current = window.setInterval(() => {
        const next = (lastEmitRef.current + 1) % items.length;
        lastEmitRef.current = next;
        playTick();
        onChange(ringIndex, next);
      }, 280);
    }, 320); // slight bump so accidental short taps don't trigger
    window.addEventListener('pointermove', movePointer, { passive: false });
    window.addEventListener('pointerup', endPointer);
    window.addEventListener('pointercancel', endPointer);
  }

  function movePointer(ev: PointerEvent) {
    if (!pointerActiveRef.current || startAngleRef.current == null) return;
    const angNow = clientAngle(ev as any);
    const delta = angNow - startAngleRef.current;
    const stepAngle = 360 / items.length;
    const deltaSteps = Math.round(delta / stepAngle);
    if (Math.abs(delta) > 4) movedRef.current = true; // small jitter tolerance
    const newIdx = (startIndexRef.current - deltaSteps + items.length) % items.length;
    if (newIdx !== activeIndex) {
      playTick();
      onChange(ringIndex, newIdx);
      lastEmitRef.current = newIdx;
    }
    ev.preventDefault();
  }

  function endPointer() {
    if (!pointerActiveRef.current) return;
    pointerActiveRef.current = false;
    // If no movement AND no auto spin started, treat as single step advance
    if (!movedRef.current && !spinIntervalRef.current) {
      const next = (activeIndex + 1) % items.length;
      playTick();
      onChange(ringIndex, next);
      lastEmitRef.current = next;
    }
    startAngleRef.current = null;
    if (holdTimeoutRef.current) { window.clearTimeout(holdTimeoutRef.current); holdTimeoutRef.current = null; }
    if (spinIntervalRef.current) { window.clearInterval(spinIntervalRef.current); spinIntervalRef.current = null; }
    window.removeEventListener('pointermove', movePointer as any);
    window.removeEventListener('pointerup', endPointer as any);
    window.removeEventListener('pointercancel', endPointer as any);
  }

  return (
    <div
      className="absolute"
      style={{
        width: size,
        height: size,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 50 - ringIndex,
        borderRadius: '50%',
        overflow: 'hidden',
        clipPath: `circle(${radius}px at 50% 50%)`
      }}
    >
      <motion.div
        ref={ringRef}
        onPointerDown={(e) => beginPointer(e)}
  className="relative w-full h-full rounded-full border border-slate-600/60 bg-slate-800/40 overflow-visible touch-none select-none cursor-pointer"
  style={{ WebkitMask: 'radial-gradient(circle at center, black 72%, transparent 74%)' }}
        /* Continuous rotation (avoid reverse jump on wrap) */
        animate={{ rotate: rotationDeg }}
        // onUpdate artık gerekli değil; highlight doğrudan activeIndex'e göre yapılacak
        transition={{ type: 'spring', stiffness: 140, damping: 20 }}
      >
        {items.map((emj, i) => {
          const angle = (360 / items.length) * i;
          const rad = angle * Math.PI / 180;
          const itemRadius = radius - 24; // padding for emoji size
          const center = radius; // since width/height == radius*2
          const x = center + Math.cos(rad) * itemRadius;
          const y = center + Math.sin(rad) * itemRadius;
          const relative = radius / outerRadius;
            const fontSize = 30 + relative * 10; // 30px -> 40px arası
          return (
            <div
              key={i}
              style={{ transform: 'translate(-50%, -50%)', left: x, top: y, fontSize }}
              className={`absolute transition-transform select-none ${i===activeIndex? 'scale-125 drop-shadow-[0_0_6px_rgba(250,204,21,0.6)]':''}`}
            >
              <span style={{ display:'inline-block', transform:`rotate(${angle + 90}deg)` }}>
                {emj}
              </span>
            </div>
          );
        })}
      </motion.div>
    </div>
  );
};

// Update rotation when activeIndex changes (continuous direction)
// Placed after component definition to keep logic close (alternative: inside component useEffect).
// We keep it inside component via useEffect above actual return block.
// Add effect inside component (patch continuation):

interface LockProps {
  rings: string[][];
  indices: number[];
  onRotate: (ring: number, newIndex: number) => void;
  solved: boolean;
  solution?: string;
  countdown?: number | null;
  onSkip?: () => void;
  awardedSeconds?: number; // kalan süreden gelen puan
}

const Lock: React.FC<LockProps> = ({ rings, indices, onRotate, solved, solution, countdown, onSkip, awardedSeconds }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const ringCount = rings.length;
  // Halka kalınlığı (emoji ~34px + margin). Sabit fark ile çakışma önlenir.
  const THICKNESS = 56;
  const innerRadius = 100; // en içte yeterli alan
  const outerRadius = innerRadius + (ringCount - 1) * THICKNESS;
  // Radii: index 0 = en iç halka
  const radii = Array.from({ length: ringCount }, (_, i) => innerRadius + i * THICKNESS);
  const containerSize = outerRadius * 2 + 72; // tampon

  return (
    <div ref={containerRef} className="relative mx-auto my-4" style={{ width: containerSize, height: containerSize }}>
      {/* Alignment window (rectangular) from center to top */}
      <div
        aria-label="Hedef Pencere"
        style={{
          position: 'absolute',
          left: '50%',
          top: 0,
          transform: 'translateX(-50%)',
          width: '48px', // tek emoji için daraltıldı
          minWidth: '48px',
          height: '50%', // merkezden yukarı
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          pointerEvents: 'none',
          zIndex: 35,
          background: 'linear-gradient(to bottom, rgba(251,191,36,0.15), rgba(251,191,36,0.03))',
          border: '2px solid #fbbf24',
          borderBottom: '1px solid rgba(251,191,36,0.35)',
          boxShadow: '0 0 8px 1px rgba(251,191,36,0.40), 0 0 2px 0 #fbbf24 inset',
          borderRadius: '10px 10px 18px 18px'
        }}
      >
        <span style={{
          position: 'absolute',
          top: 4,
          fontSize: '0.50rem',
          letterSpacing: '0.10em',
          fontWeight: 600,
          color: '#fde68a'
        }}>HİZALA</span>
        {/* Alt kısımda yukarı ok */}
        <span style={{
          position:'absolute',
          bottom:6,
          left:'50%',
          transform:'translateX(-50%)',
          fontSize:'1.15rem',
          lineHeight:1,
          color:'#ffe27a',
          filter:'drop-shadow(0 0 4px #ffd34daa) drop-shadow(0 0 10px #fbbf24aa)',
          textShadow:'0 0 6px #fde68a, 0 0 14px #fbbf24, 0 0 26px #f59e0b',
          animation:'arrowPulseUp 1.4s ease-in-out infinite',
          zIndex:60
        }}>
          <span style={{
            position:'absolute',
            top:'50%',
            left:'50%',
            transform:'translate(-50%,-50%) scale(1.9)',
            width:'28px',
            height:'28px',
            background:'radial-gradient(circle, rgba(255,214,96,0.65) 0%, rgba(255,170,0,0.15) 55%, rgba(255,170,0,0) 75%)',
            filter:'blur(3px)',
            borderRadius:'50%',
            pointerEvents:'none',
            zIndex:-1
          }} />
          ⬆️
        </span>
      </div>
  <style>{`@keyframes arrowPulseUp {0%,100%{transform:translateX(-50%) translateY(0);}50%{transform:translateX(-50%) translateY(-4px);} }`}</style>
      {/* Subtle dim outside window for focus (using overlay with hole) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 34,
          background: 'radial-gradient(circle at 50% 25%, rgba(0,0,0,0) 0%, rgba(0,0,0,0.35) 70%)'
        }}
      />
      {/* Render rings, all co-centered */}
            {rings.map((r, i) => (
              <LockRing
                key={i}
                items={r}
                activeIndex={indices[i]}
                radius={radii[i]}
                outerRadius={outerRadius}
                ringIndex={i}
                onChange={onRotate}
                disabled={solved}
              />
            ))}
      {solved && (
        <>
        {/* Opaque arka plan */}
  <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-sm" style={{ zIndex: 9000 }} />
  <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ zIndex: 9010 }}>
          <motion.div
            initial={{ scale: 0.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-[360px] max-w-full px-6 py-7 rounded-2xl shadow-2xl border-4 border-emerald-400 bg-emerald-800 flex flex-col items-center"
            style={{ boxShadow: '0 0 32px 4px #05966999, 0 0 0 8px #05966933' }}
          >
            <div className="text-3xl md:text-4xl font-bold text-emerald-300 mb-2 drop-shadow-lg">Kapı Açıldı!</div>
            {/* Emoji string above solution */}
            {Array.isArray(rings) && rings.length > 0 && (
              <div className="mb-2 text-2xl md:text-3xl text-center tracking-wide">
                {rings.map((r, i) => r[indices[i]]).join(' ')}
              </div>
            )}
            {solution && (
              <div className="mb-1">
                <p className="text-base md:text-lg font-semibold text-emerald-100 leading-snug text-center">{solution}</p>
                <p className="text-[11px] uppercase tracking-wider text-amber-300 mt-1 text-center">ÇÖZÜLDÜ</p>
              </div>
            )}
            {typeof awardedSeconds === 'number' && (
              <div className="mt-2 text-sm font-semibold text-amber-300">
                Puan: +{awardedSeconds}
              </div>
            )}
            {countdown != null && countdown >= 0 && (
              <div className="flex items-center gap-2 mt-3">
                <span className="px-2 py-0.5 rounded bg-slate-700 text-amber-300 font-mono text-[11px]">{countdown}s</span>
                {onSkip && (
                  <button onClick={onSkip} className="text-xs px-3 py-1 rounded bg-amber-400 text-slate-900 font-semibold hover:bg-amber-300 transition">
                    Hemen Geç
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </div>
        </>
      )}
    </div>
  );
};
export default Lock;
