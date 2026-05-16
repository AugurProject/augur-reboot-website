import { XIcon, DiscordIcon, GithubIcon } from './icons';
import Pointer from './Pointer';

interface PageHeaderProps {
  backHref?: string;
  className?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({ backHref, className = '' }) => {
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
            href="https://x.com/AugurProject"
            className="header-social text-foreground hover:text-loud-foreground focus:text-loud-foreground hover:fx-glow focus:fx-glow focus:outline-none no-underline text-3xl"
          >
            <XIcon className="text-3xl" />
          </a>
          <a
            href="https://discord.gg/Y3tCZsSmz3"
            className="header-social text-foreground hover:text-loud-foreground focus:text-loud-foreground hover:fx-glow focus:fx-glow focus:outline-none no-underline text-3xl"
          >
            <DiscordIcon className="text-3xl" />
          </a>
          <a
            href="https://github.com/AugurProject/"
            className="header-social text-foreground hover:text-loud-foreground focus:text-loud-foreground hover:fx-glow focus:fx-glow focus:outline-none no-underline text-3xl"
          >
            <GithubIcon className="text-3xl" />
          </a>
        </div>
      </div>
    </header>
  );
};

export default PageHeader;
