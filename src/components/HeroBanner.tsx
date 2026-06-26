import { useEffect, useRef } from 'react';
import AsciiText from '@/components/AsciiText';
import PageHeader from '@/components/PageHeader';
import { ForkMonitor } from '@/components/ForkMonitor';
import { ScrollIndicator } from '@/components/ScrollIndicator';
import BorderBeam from '@/components/ui/BorderBeam';
import { SirenIcon } from '@phosphor-icons/react';
import { AugurLogo } from '@/components/icons';

const ASCII_ART = `██╗ ███████╗     ██████╗  ███████╗ ██████╗   ██████╗   ██████╗  ████████╗ ██╗ ███╗   ██╗  ██████╗
██║ ██╔════╝     ██╔══██╗ ██╔════╝ ██╔══██╗ ██╔═══██╗ ██╔═══██╗ ╚══██╔══╝ ██║ ████╗  ██║ ██╔════╝
 ██║ ███████╗     ██████╔╝ █████╗   ██████╔╝ ██║   ██║ ██║   ██║    ██║    ██║ ██╔██╗ ██║ ██║  ███╗
 ██║ ╚════██║     ██╔══██╗ ██╔══╝   ██╔══██╗ ██║   ██║ ██║   ██║    ██║    ██║ ██║╚██╗██║ ██║   ██║
 ██║ ███████║     ██║  ██║ ███████╗ ██████╔╝ ╚██████╔╝ ╚██████╔╝    ██║    ██║ ██║ ╚████║ ╚██████╔╝
╚═╝ ╚══════╝     ╚═╝  ╚═╝ ╚══════╝ ╚═════╝   ╚═════╝   ╚═════╝     ╚═╝    ╚═╝ ╚═╝  ╚═══╝  ╚═════╝`;

const HeroBanner: React.FC = () => {
  const menuItem1Ref = useRef<HTMLAnchorElement>(null);

  // Focus the first menu item once the entrance animation finishes.
  // Animation kicks off either on page load (no .boot class) or when Intro
  // removes .boot. Listen for animationend on the menu item itself.
  useEffect(() => {
    const el = menuItem1Ref.current;
    if (!el) return;
    const handle = () => el.focus({ preventScroll: true });
    el.addEventListener('animationend', handle, { once: true });
    return () => el.removeEventListener('animationend', handle);
  }, []);

  return (
    <div className="h-screen min-h-fit w-full relative">
      <div className="grid grid-rows-[auto_auto_auto] min-h-full z-10 text-center content-between">
        <div className="hero-header-row">
          <PageHeader />
        </div>

        {/* Middle Section */}
        <div className="flex flex-col items-center place-items-center py-8 gap-y-4">
          <span className="hero-logo">
            <AugurLogo className="text-9xl" />
          </span>
          <p className="hero-prediction-market font-light font-display border border-foreground/20 px-3 py-1 mx-4 sm:text-xl tracking-widest leading-none uppercase">
            THE FRONTIER OF PREDICTION MARKETS
          </p>

          <h2 className="grid grid-cols-[minmax(0.25rem,1rem)_1fr_minmax(0.25rem,1rem)] items-center gap-x-4">
            <span className="hero-line-left h-px bg-foreground" />
            <AsciiText
              className="hero-ascii text-[clamp(0.325rem,1vw,0.625rem)] leading-[1.1]"
              content={ASCII_ART}
            />
            <span className="hero-line-right h-px bg-foreground" />
          </h2>

          <div className="flex flex-col place-items-center text-left w-full max-w-3xl mx-auto mb-3">
            <a
              ref={menuItem1Ref}
              href="/mission"
              className="hero-menu-1 menu-link font-display text-xl sm:text-3xl font-bold text-foreground hover:text-loud-foreground focus:text-loud-foreground block hover:fx-glow focus:fx-glow focus:outline-none uppercase"
            >
              THE NEXT GENERATION OF ORACLES
            </a>
            <a
              href="/team"
              className="hero-menu-2 menu-link font-display text-xl sm:text-3xl font-bold text-foreground hover:text-loud-foreground focus:text-loud-foreground block hover:fx-glow focus:fx-glow focus:outline-none uppercase"
            >
              THE MINDS BEHIND THE REBOOT
            </a>
          </div>

          {/* Fork CTA */}
          <div className="hero-fork-cta">
            <div className="animate-[bob_2s_ease-in-out_infinite]">
              <BorderBeam duration={2.5}>
                <a
                  href="/faq"
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
        <div className="hero-fork-meter py-6">
          <ForkMonitor animated={true} />
        </div>
      </div>

      <ScrollIndicator delay={3200} />
    </div>
  );
};

export default HeroBanner;
