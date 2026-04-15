import { useRef, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { $appStore, UIState } from '../stores/animationStore';
import { XIcon, DiscordIcon, GithubIcon } from './icons';
import Pointer from './Pointer';

interface PageHeaderProps {
  backHref?: string;
  className?: string;
}

const SOCIAL_DELAYS = [0.5, 0.7, 0.9]; // twitter, discord, github

const PageHeader: React.FC<PageHeaderProps> = ({ backHref, className = '' }) => {
  const appState = useStore($appStore);
  const socialRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const socialAnimated = useRef(false);

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

      <div className="flex justify-center" />

      {/* Right slot: social links */}
      <div className="flex md:justify-end">
        <div className="flex gap-x-8">
          <a
            ref={(el) => { socialRefs.current[0] = el; }}
            href="https://x.com/AugurProject"
            className="text-foreground hover:text-loud-foreground focus:text-loud-foreground hover:fx-glow focus:fx-glow focus:outline-none no-underline text-3xl"
            style={isHomepage ? { opacity: 0 } : undefined}
          >
            <XIcon className="text-3xl" />
          </a>
          <a
            ref={(el) => { socialRefs.current[1] = el; }}
            href="https://discord.gg/Y3tCZsSmz3"
            className="text-foreground hover:text-loud-foreground focus:text-loud-foreground hover:fx-glow focus:fx-glow focus:outline-none no-underline text-3xl"
            style={isHomepage ? { opacity: 0 } : undefined}
          >
            <DiscordIcon className="text-3xl" />
          </a>
          <a
            ref={(el) => { socialRefs.current[2] = el; }}
            href="https://github.com/AugurProject/"
            className="text-foreground hover:text-loud-foreground focus:text-loud-foreground hover:fx-glow focus:fx-glow focus:outline-none no-underline text-3xl"
            style={isHomepage ? { opacity: 0 } : undefined}
          >
            <GithubIcon className="text-3xl" />
          </a>
        </div>
      </div>
    </header>
  );
};

export default PageHeader;
