interface Post {
  title: string;
  path: string;
}

interface BlogNavigationProps {
  prevPost?: Post;
  nextPost?: Post;
}

export default function BlogNavigation({ prevPost, nextPost }: BlogNavigationProps) {
  return (
    <aside className="sticky bottom-0 border-t border-foreground/30 bg-background uppercase">
      <div className="max-w-2xl mx-auto px-4 md:px-8 py-3 md:py-6 w-full">
        <div className="flex items-center justify-between gap-4 text-xs md:text-sm font-light tracking-widest">
          {/* Previous Post */}
          {prevPost ? (
            <a
              href={prevPost.path}
              className="text-muted-foreground hover:text-primary transition-colors flex-1"
            >
              ← PREVIOUS: {prevPost.title}
            </a>
          ) : (
            <span className="text-muted-foreground/40 flex-1">
              ← FIRST POST
            </span>
          )}

          {/* Next Post */}
          {nextPost ? (
            <a
              href={nextPost.path}
              className="text-muted-foreground hover:text-primary transition-colors flex-1 text-right"
            >
              NEXT: {nextPost.title} →
            </a>
          ) : (
            <span className="text-muted-foreground/40 flex-1 text-right">
              LATEST POST →
            </span>
          )}
        </div>
      </div>
    </aside>
  );
}
