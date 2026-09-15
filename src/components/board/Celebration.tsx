import { useEffect, useRef } from 'react';
import { usePrefersReducedMotion } from '@/hooks/useMediaQuery';
import { toast, useUiStore } from '@/stores/uiStore';
import { getBoard } from '@/stores/boardStore';

const COLORS = ['#FF7B72', '#FFA657', '#F6D55C', '#7EE0A1', '#6CB8FF', '#C49BFF'];

/** A short, one-shot confetti burst. No library; ~40 WAAPI-animated squares. */
function burst(container: HTMLElement) {
  const pieces = 44;
  for (let i = 0; i < pieces; i++) {
    const piece = document.createElement('span');
    const size = 6 + Math.random() * 6;
    Object.assign(piece.style, {
      position: 'absolute',
      left: `${50 + (Math.random() - 0.5) * 24}%`,
      top: '38%',
      width: `${size}px`,
      height: `${size * (0.5 + Math.random())}px`,
      background: COLORS[i % COLORS.length],
      borderRadius: '2px',
    });
    container.appendChild(piece);
    const angle = Math.random() * Math.PI * 2;
    const distance = 180 + Math.random() * 260;
    const animation = piece.animate(
      [
        { transform: 'translate(0,0) rotate(0deg)', opacity: 1 },
        {
          transform: `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance * 0.6 + 260}px) rotate(${Math.random() * 720}deg)`,
          opacity: 0,
        },
      ],
      { duration: 1100 + Math.random() * 700, easing: 'cubic-bezier(0.15, 0.6, 0.35, 1)' },
    );
    animation.onfinish = () => piece.remove();
  }
}

/** Listens for celebration moments and plays them once. */
export function Celebration() {
  const celebration = useUiStore((state) => state.celebration);
  const celebrate = useUiStore((state) => state.celebrate);
  const openDialog = useUiStore((state) => state.openDialog);
  const ref = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (!celebration) return;
    if (celebration.kind === 'complete') {
      if (!reducedMotion && ref.current) burst(ref.current);
      toast({
        message: '🎉 Ranking complete',
        tone: 'success',
        action: { label: 'Export image', run: () => openDialog('export') },
        duration: 7000,
      });
    } else if (celebration.kind === 'glow-up') {
      const name = getBoard()?.items[celebration.itemId]?.name ?? 'That one';
      toast({ message: `${name} went from the bottom to the top. Redemption arc.` });
    }
    const timer = setTimeout(() => celebrate(null), 2800);
    return () => clearTimeout(timer);
  }, [celebration, celebrate, openDialog, reducedMotion]);

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[65] overflow-hidden"
    />
  );
}
