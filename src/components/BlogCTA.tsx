import { cn } from "@/lib/utils";

export const BlogCTA = ({ href, children }: { href: string; children: React.ReactNode }) => {
  return (
    <div className={cn(
      "w-full max-w-md grid gap-x-4 grid-cols-[1fr_max-content_1fr] items-center",
      "before:content-[''] before:inline-block before:border-t before:border-foreground/30",
      "after:content-[''] after:inline-block after:border-t after:border-foreground/30"
    )}>
    <a
      href={href}
      className={cn(
        "text-[1rem] uppercase font-semibold text-foreground border border-foreground/30 py-2 px-4 outline-none",
        "hover:fx-glow-sm hover:text-loud-foreground hover:border-loud-foreground transition-colors",
        "focus:fx-glow-sm focus:text-loud-foreground focus:border-loud-foreground transition-colors"
      )}
    >
      {children}
    </a>
    </div>
  );
};
