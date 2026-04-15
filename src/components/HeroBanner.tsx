import { useRef, useEffect, useCallback } from 'react';
import { useStore } from '@nanostores/react';
import { $appStore, UIState } from '../stores/animationStore';
import AsciiText from '@/components/AsciiText';
import PageHeader from '@/components/PageHeader';
import { ForkMonitor } from '@/components/ForkMonitor';
import { ScrollIndicator } from '@/components/ScrollIndicator';
import BorderBeam from '@/components/ui/BorderBeam';
import { SirenIcon } from '@phosphor-icons/react';
import { AugurLogo } from '@/components/icons';
import { withBase } from '@/lib/utils';

// Animation timing table (delays in ms)
const TIMINGS = {
  logo: {
    keyframes: 'logo-fade-in 0.5s ease-in 0s forwards, logo-scale-down 1s ease-out 0.5s forwards',
    delay: 0,
  },
  predictionMarket: {
    keyframes: 'fade-in-up 0.8s ease-out 1.5s forwards',
    delay: 1500,
  },
  lineLeft: {
    keyframes: 'slide-in-from-right 0.25s ease-out 2.3s forwards',
    delay: 2300,
  },
  lineRight: {
    keyframes: 'slide-in-from-left 0.25s ease-out 2.3s forwards',
    delay: 2300,
  },
  asciiText: {
    keyframes: 'scale-in 0.4s ease-in 2.6s forwards, gradient-animation 2s linear 3s infinite',
    delay: 2600,
  },
  menuItem1: {
    keyframes: 'fade-in-up 0.5s ease-out 3.2s forwards',
    delay: 3200,
  },
  menuItem2: {
    keyframes: 'fade-in-up 0.5s ease-out 3.4s forwards',
    delay: 3400,
  },
  forkCta: {
    keyframes: 'fade-in-up 0.5s ease-out 3.6s forwards',
    delay: 3600,
  },
  forkMeter: {
    keyframes: 'fade-in-up 0.6s ease-out 3.8s forwards',
    delay: 3800,
  },
  topHeaderRow: {
    keyframes: 'fade-in-up 0.5s ease-out 4.4s forwards',
    delay: 4400,
  },
  focus: 4900,
} as const;

const ASCII_ART = `██╗ ███████╗     ██████╗  ███████╗ ██████╗   ██████╗   ██████╗  ████████╗ ██╗ ███╗   ██╗  ██████╗
██║ ██╔════╝     ██╔══██╗ ██╔════╝ ██╔══██╗ ██╔═══██╗ ██╔═══██╗ ╚══██╔══╝ ██║ ████╗  ██║ ██╔════╝
 ██║ ███████╗     ██████╔╝ █████╗   ██████╔╝ ██║   ██║ ██║   ██║    ██║    ██║ ██╔██╗ ██║ ██║  ███╗
 ██║ ╚════██║     ██╔══██╗ ██╔══╝   ██╔══██╗ ██║   ██║ ██║   ██║    ██║    ██║ ██║╚██╗██║ ██║   ██║
 ██║ ███████║     ██║  ██║ ███████╗ ██████╔╝ ╚██████╔╝ ╚██████╔╝    ██║    ██║ ██║ ╚████║ ╚██████╔╝
╚═╝ ╚══════╝     ╚═╝  ╚═╝ ╚══════╝ ╚═════╝   ╚═════╝   ╚═════╝     ╚═╝    ╚═╝ ╚═╝  ╚═══╝  ╚═════╝`;

const HeroBanner: React.FC = () => {
  const appState = useStore($appStore);
  const headerRowRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLSpanElement>(null);
  const predictionMarketRef = useRef<HTMLParagraphElement>(null);
  const lineLeftRef = useRef<HTMLSpanElement>(null);
  const lineRightRef = useRef<HTMLSpanElement>(null);
  const asciiTextRef = useRef<HTMLPreElement>(null);
  const menuItem1Ref = useRef<HTMLAnchorElement>(null);
  const menuItem2Ref = useRef<HTMLAnchorElement>(null);
  const forkCtaRef = useRef<HTMLDivElement>(null);
  const forkMeterRef = useRef<HTMLDivElement>(null);
  const timeoutsRef = useRef<number[]>([]);
  const lastStateRef = useRef<UIState | null>(null);

  const clearTimeouts = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  }, []);

  const showAll = useCallback(() => {
    const elements = [
      headerRowRef.current,
      logoRef.current,
      predictionMarketRef.current,
      lineLeftRef.current,
      lineRightRef.current,
      asciiTextRef.current,
      menuItem1Ref.current,
      menuItem2Ref.current,
      forkCtaRef.current,
      forkMeterRef.current,
    ];
    elements.forEach((el) => {
      if (el) {
        el.style.opacity = '1';
        el.style.transform = 'none';
      }
    });
  }, []);

  // Set initial hidden state on mount
  useEffect(() => {
    const elements = [
      headerRowRef.current,
      predictionMarketRef.current,
      lineLeftRef.current,
      lineRightRef.current,
      asciiTextRef.current,
      menuItem1Ref.current,
      menuItem2Ref.current,
      forkCtaRef.current,
      forkMeterRef.current,
    ];
    elements.forEach((el) => {
      if (el) el.style.opacity = '0';
    });
    // Logo has special initial state
    if (logoRef.current) {
      logoRef.current.style.opacity = '0';
      logoRef.current.style.transform = 'scale(2) translateY(50%)';
    }

    return clearTimeouts;
  }, [clearTimeouts]);

  // React to state changes
  useEffect(() => {
    if (appState.uiState === lastStateRef.current) return;
    lastStateRef.current = appState.uiState;

    if (appState.uiState !== UIState.MAIN_CONTENT) return;

    clearTimeouts();

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const urlParams = new URLSearchParams(window.location.search);
    const skipIntro = urlParams.get('intro') === 'false';

    if (prefersReducedMotion || skipIntro) {
      showAll();
      // Start gradient animation on ascii text
      if (asciiTextRef.current) {
        asciiTextRef.current.style.animation = 'gradient-animation 2s linear infinite';
      }
      menuItem1Ref.current?.focus();
      return;
    }

    // Play entrance sequence
    const schedule = (el: HTMLElement | null, keyframes: string, delay: number) => {
      if (!el) return;
      const timeout = window.setTimeout(() => {
        el.style.animation = keyframes;
      }, delay);
      timeoutsRef.current.push(timeout);
    };

    schedule(logoRef.current, TIMINGS.logo.keyframes, TIMINGS.logo.delay);
    schedule(predictionMarketRef.current, TIMINGS.predictionMarket.keyframes, TIMINGS.predictionMarket.delay);
    schedule(lineLeftRef.current, TIMINGS.lineLeft.keyframes, TIMINGS.lineLeft.delay);
    schedule(lineRightRef.current, TIMINGS.lineRight.keyframes, TIMINGS.lineRight.delay);
    schedule(asciiTextRef.current, TIMINGS.asciiText.keyframes, TIMINGS.asciiText.delay);
    schedule(menuItem1Ref.current, TIMINGS.menuItem1.keyframes, TIMINGS.menuItem1.delay);
    schedule(menuItem2Ref.current, TIMINGS.menuItem2.keyframes, TIMINGS.menuItem2.delay);
    schedule(forkCtaRef.current, TIMINGS.forkCta.keyframes, TIMINGS.forkCta.delay);
    schedule(forkMeterRef.current, TIMINGS.forkMeter.keyframes, TIMINGS.forkMeter.delay);
    schedule(headerRowRef.current, TIMINGS.topHeaderRow.keyframes, TIMINGS.topHeaderRow.delay);

    // Focus first menu item after sequence completes
    const focusTimeout = window.setTimeout(() => {
      menuItem1Ref.current?.focus();
    }, TIMINGS.focus);
    timeoutsRef.current.push(focusTimeout);
  }, [appState.uiState, clearTimeouts, showAll]);

  return (
    <div className="h-screen min-h-fit w-full relative">
      <div className="grid grid-rows-[auto_auto_auto] min-h-full z-10 text-center content-between">
        <div ref={headerRowRef}>
          <PageHeader />
        </div>

        {/* Middle Section */}
        <div className="flex flex-col items-center place-items-center py-8 gap-y-4">
          <span ref={logoRef}>
            <AugurLogo className="text-9xl" />
          </span>
          <p
            ref={predictionMarketRef}
            className="font-light font-display border border-foreground/20 px-3 py-1 mx-4 sm:text-xl tracking-widest leading-none uppercase"
          >
            THE FRONTIER OF PREDICTION MARKETS
          </p>

          <h2 className="grid grid-cols-[minmax(0.25rem,1rem)_1fr_minmax(0.25rem,1rem)] items-center gap-x-4">
            <span ref={lineLeftRef} className="h-px bg-foreground" />
            <AsciiText
              ref={asciiTextRef}
              content={ASCII_ART}
              className="text-[clamp(0.325rem,1vw,0.625rem)] leading-[1.1]"
            />
            <span ref={lineRightRef} className="h-px bg-foreground" />
          </h2>

          <div className="flex flex-col place-items-center text-left w-full max-w-3xl mx-auto mb-3">
            <a
              ref={menuItem1Ref}
              href={withBase('/mission')}
              className="menu-link font-display text-xl sm:text-3xl font-bold text-foreground hover:text-loud-foreground focus:text-loud-foreground block hover:fx-glow focus:fx-glow focus:outline-none uppercase"
            >
              THE NEXT GENERATION OF ORACLES
            </a>
            <a
              ref={menuItem2Ref}
              href={withBase('/team')}
              className="menu-link font-display text-xl sm:text-3xl font-bold text-foreground hover:text-loud-foreground focus:text-loud-foreground block hover:fx-glow focus:fx-glow focus:outline-none uppercase"
            >
              THE MINDS BEHIND THE REBOOT
            </a>
          </div>

          {/* Fork CTA */}
          <div ref={forkCtaRef}>
            <div className="animate-[bob_2s_ease-in-out_infinite]">
              <BorderBeam duration={2.5}>
                <a
                  href={withBase('/faq')}
                  className="font-display bg-foreground/5 tracking-wide flex items-center px-4 py-2 sm:text-xl font-semibold text-loud-foreground uppercase shadow-[0_0_10px_oklch(from_var(--color-foreground)_l_c_h/_0.4)] hover:fx-glow-sm focus:fx-glow-sm focus:outline-none whitespace-nowrap"
                >
                  <SirenIcon className="w-6 h-6 border-muted-foreground/80 rounded-full p-1 mr-3" />
                  THE FORK IS HERE! OWN REP? ACT NOW.
                </a>
              </BorderBeam>
            </div>
          </div>
        </div>

        {/* Bottom Section: Fork Monitor */}
        <div ref={forkMeterRef} className="py-6">
          <ForkMonitor animated={true} />
        </div>
      </div>

      <ScrollIndicator delay={5000} />
    </div>
  );
};

export default HeroBanner;
