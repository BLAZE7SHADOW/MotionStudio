import { useEffect, useRef, useState } from 'react';
import { ImageIcon } from 'lucide-react';

interface TourStep {
  title: string;
  desc: string;
  tag: string;
  mediaPath: string;
}

const STEPS: TourStep[] = [
  {
    title: 'Bring your ideas to life',
    desc: 'Drag, resize, and layer text, images, and video on a frame-perfect canvas.',
    tag: 'canvas editor',
    mediaPath: '/assets/landing/canvas-editor-screenshot.webp',
  },
  {
    title: '22 text effects, 18 shader backgrounds',
    desc: 'Pick from a live-preview gallery — see the motion before you commit to it.',
    tag: 'effects gallery',
    mediaPath: '/assets/landing/effects-gallery-screenshot.webp',
  },
  {
    title: 'Keyframe your motion',
    desc: 'Spring physics, easing curves, and a draggable keyframe strip on the timeline.',
    tag: 'animation engine',
    mediaPath: '/assets/landing/timeline-keyframes-screenshot.webp',
  },
  {
    title: 'Export in 1080p on AWS Lambda',
    desc: 'Render full resolution from any device. No CPU usage, no waiting.',
    tag: 'cloud render',
    mediaPath: '/assets/landing/export-dialog-screenshot.webp',
  },
];

function TourMedia({ mediaPath, alt }: { mediaPath: string; alt: string }) {
  const [failed, setFailed] = useState(false);

  return (
    // Solid border, not dashed: a dashed frame reads as an empty placeholder
    // even once the screenshot has loaded.
    <div className="aspect-video w-full rounded-studio-lg bg-studio-panel border border-studio-border overflow-hidden flex items-center justify-center">
      {failed ? (
        // Was "Media not found — check file path or add the asset", which is an
        // instruction to a developer shipped to a visitor.
        <div className="flex flex-col items-center justify-center gap-2 text-center px-4">
          <ImageIcon className="w-5 h-5 text-studio-text-faint" strokeWidth={1.5} />
          <span className="text-[11px] text-studio-text-faint">Preview unavailable</span>
        </div>
      ) : (
        <img
          src={mediaPath}
          alt={alt}
          className="w-full h-full object-contain"
          loading="lazy"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}

function TourStepRow({ step, index }: { step: TourStep; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setRevealed(true);
      },
      { threshold: 0.3 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const reversed = index % 2 === 1;

  return (
    <div
      ref={ref}
      className={`relative grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 items-center py-10 md:py-14 transition-all duration-700 ease-out ${
        revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      }`}
    >
      {/* keyframe marker on the spine, centered on this row — same visual
          language as the hero's TimelineSignature */}
      <div className="hidden md:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
        <div
          className="w-2.5 h-2.5 rotate-45 border-2 border-studio-bg transition-colors duration-300"
          style={{ backgroundColor: revealed ? '#ff5c5c' : 'oklch(1 0 0 / 20%)' }}
        />
      </div>

      <div className={reversed ? 'md:order-2' : ''}>
        <TourMedia mediaPath={step.mediaPath} alt={step.title} />
      </div>
      <div className={reversed ? 'md:order-1 md:text-right' : ''}>
        <span className="font-mono text-[10px] text-studio-accent tracking-widest uppercase">{step.tag}</span>
        <h3 className="text-[20px] font-semibold text-studio-text mt-1.5 mb-2">{step.title}</h3>
        <p className="text-[13px] text-studio-text-muted leading-relaxed">{step.desc}</p>
      </div>
    </div>
  );
}

/**
 * Scroll-driven product tour — a vertical rail fills as you scroll through
 * the section, with keyframe-diamond markers lighting up at each step,
 * continuing the timeline vernacular from the hero's TimelineSignature
 * rather than borrowing a generic "connecting line" effect wholesale.
 */
export default function ProductTour() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [lineProgress, setLineProgress] = useState(0);

  useEffect(() => {
    let raf = 0;
    function onScroll() {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const node = sectionRef.current;
        if (!node) return;
        const rect = node.getBoundingClientRect();
        const vh = window.innerHeight;
        // 0 when the section's top reaches the bottom of the viewport,
        // 1 when the section's bottom has fully scrolled past the top
        const total = rect.height + vh;
        const scrolled = vh - rect.top;
        setLineProgress(Math.min(1, Math.max(0, scrolled / total)));
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative px-6 py-16 sm:py-20 border-b border-studio-border overflow-hidden"
    >
      <div className="max-w-4xl mx-auto">
        <h2 className="text-[13px] font-semibold text-studio-text-faint uppercase tracking-widest mb-1.5">
          See it in action
        </h2>
        <p className="text-[13px] text-studio-text-faint mb-4">Real screens from the real editor.</p>

        <div className="relative">
          {/* spine track */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 bg-white/8">
            <div
              className="w-full bg-gradient-to-b from-studio-accent to-studio-accent/30"
              style={{ height: `${lineProgress * 100}%` }}
            />
          </div>

          {STEPS.map((step, i) => (
            <TourStepRow key={step.title} step={step} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
