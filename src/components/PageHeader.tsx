import { useRef, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { $appStore, UIState } from '../stores/animationStore';
import DiscordLogoUrl from '../assets/discord.svg';
import XLogoUrl from '../assets/x.svg';
import GithubLogoUrl from '../assets/github.svg';
import WarningMarkUrl from '@phosphor-icons/core/assets/regular/siren.svg';
import BorderBeam from './ui/BorderBeam';
import Pointer from './Pointer';
import { withBase } from '../lib/utils';

interface PageHeaderProps {
  backHref?: string;
  showCta?: boolean;
  className?: string;
}

const SOCIAL_DELAYS = [0.5, 0.7, 0.9]; // twitter, discord, github

const PageHeader: React.FC<PageHeaderProps> = ({
  backHref,
  showCta = false,
  className = '',
}) => {
  const appState = useStore($appStore);
  const socialRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const socialAnimated = useRef(false);
  const faqHref = withBase('/faq');

  // Animate social links when hero sequence starts
  useEffect(() => {
    if (appState.uiState === UIState.MAIN_CONTENT && !socialAnimated.current) {
      socialAnimated.current = true;
      socialRefs.current.forEach((el, i) => {
        if (el) {
          el.style.animation = `fade-in-down 0.5s ease-out ${SOCIAL_DELAYS[i]}s forwards`;
        }
      });
    }
  }, [appState.uiState]);

  const isHomepage = appState.uiState === UIState.BOOT_SEQUENCE || appState.uiState === UIState.MAIN_CONTENT;

  return (
    <header
      className={`flex flex-col items-center gap-3 px-10 py-6 md:grid md:grid-cols-[1fr_auto_1fr] md:items-center md:gap-4 ${className}`}
    >
      {/* Left slot: back button */}
      <div className="w-full flex md:justify-start justify-center order-last md:order-none">
        {backHref ? (
          <a
            href={backHref}
            className="font-display text-lg tracking-wide inline-flex items-center gap-1 text-foreground hover:text-loud-foreground focus:text-loud-foreground hover:fx-glow focus:fx-glow focus:outline-none transition-colors uppercase"
          >
            <Pointer animated="auto" direction="left" />
            BACK TO HOME
          </a>
        ) : (
          <span className="hidden md:block" />
        )}
      </div>

      {/* Center: Fork CTA */}
      <div className="flex justify-center">
        {showCta && (
          <div className="animate-[bob_2s_ease-in-out_infinite]">
            <BorderBeam duration={2.5}>
              <a
                href={faqHref}
                className="font-display bg-foreground/5 tracking-wide flex items-center px-4 py-2 text-lg font-semibold text-loud-foreground uppercase shadow-[0_0_10px_oklch(from_var(--color-foreground)_l_c_h/_0.4)] hover:fx-glow-sm focus:fx-glow-sm focus:outline-none whitespace-nowrap"
              >
                <img src={WarningMarkUrl} alt="" className="w-6 h-6 border-muted-foreground/80 rounded-full p-1 mr-3" />
                THE FORK IS HERE! OWN REP? ACT NOW.
              </a>
            </BorderBeam>
          </div>
        )}
      </div>

      {/* Right slot: social links */}
      <div className="flex md:justify-end">
        <div className="flex gap-x-8">
          <a
            ref={(el) => { socialRefs.current[0] = el; }}
            href="https://x.com/AugurProject"
            className="text-foreground hover:text-loud-foreground focus:text-loud-foreground hover:fx-glow focus:fx-glow focus:outline-none no-underline text-3xl"
            style={isHomepage ? { opacity: 0 } : undefined}
          >
            <img src={XLogoUrl} alt="X (Twitter)" className="text-3xl" />
          </a>
          <a
            ref={(el) => { socialRefs.current[1] = el; }}
            href="https://discord.gg/Y3tCZsSmz3"
            className="text-foreground hover:text-loud-foreground focus:text-loud-foreground hover:fx-glow focus:fx-glow focus:outline-none no-underline text-3xl"
            style={isHomepage ? { opacity: 0 } : undefined}
          >
            <img src={DiscordLogoUrl} alt="Discord" className="text-3xl" />
          </a>
          <a
            ref={(el) => { socialRefs.current[2] = el; }}
            href="https://github.com/AugurProject/"
            className="text-foreground hover:text-loud-foreground focus:text-loud-foreground hover:fx-glow focus:fx-glow focus:outline-none no-underline text-3xl"
            style={isHomepage ? { opacity: 0 } : undefined}
          >
            <img src={GithubLogoUrl} alt="GitHub" className="text-3xl" />
          </a>
        </div>
      </div>
    </header>
  );
};

export default PageHeader;
