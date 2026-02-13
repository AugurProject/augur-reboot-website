import { cn } from '@/lib/utils';

export interface PostCardProps {
  title: string;
  description: string;
  date: string;
  imageUrl: string;
  featured?: boolean;
  href?: string;
}

export const PostCard = ({ title, description, date, imageUrl, featured = false, href = '#' }: PostCardProps) => (
  <article className={cn(
    "group flex flex-col border border-foreground/30 bg-background/70 relative overflow-visible",
    "transition-all hover:shadow-xl shadow-foreground/10",

  )}>
    <a href={href} className="flex flex-col flex-1 no-underline text-inherit outline-none">
    {/* Top-left & Bottom-right sights */}
    <div className={cn(
      "absolute inset-0 pointer-events-none",

      // top left sights - hidden by default, animate in on hover/focus
      "before:content-[''] before:block before:absolute before:size-8 before:border-l-2 before:border-t-2 before:border-foreground",
      "before:-translate-x-4 before:-translate-y-4 before:opacity-0 before:transition-all group-hover:before:translate-x-0 group-hover:before:translate-y-0 group-hover:before:opacity-100 group-focus:before:translate-x-0 group-focus:before:translate-y-0 group-focus:before:opacity-100",

      // bottom right sights - hidden by default, animate in on hover/focus
      "after:content-[''] after:block after:absolute after:bottom-0 after:right-0 after:size-8 after:border-r-2 after:border-b-2 after:border-foreground",
      "after:translate-x-4 after:translate-y-4 after:opacity-0 after:transition-all group-hover:after:translate-x-0 group-hover:after:translate-y-0 group-hover:after:opacity-100 group-focus:after:translate-x-0 group-focus:after:translate-y-0 group-focus:after:opacity-100"
    )} />

    {/* Bottom-left & Top-right sights */}
    <div className={cn(
      "absolute inset-0 pointer-events-none",

      // bottom left sights - hidden by default, animate in on hover/focus
      "before:content-[''] before:block before:absolute before:bottom-0 before:left-0 before:size-8 before:border-l-2 before:border-b-2 before:border-foreground",
      "before:-translate-x-4 before:translate-y-4 before:opacity-0 before:transition-all group-hover:before:translate-x-0 group-hover:before:translate-y-0 group-hover:before:opacity-100 group-focus:before:translate-x-0 group-focus:before:translate-y-0 group-focus:before:opacity-100",

      // top right sights - hidden by default, animate in on hover/focus
      "after:content-[''] after:block after:absolute after:top-0 after:right-0 after:size-8 after:border-r-2 after:border-t-2 after:border-foreground",
      "after:translate-x-4 after:-translate-y-4 after:opacity-0 after:transition-all group-hover:after:translate-x-0 group-hover:after:translate-y-0 group-hover:after:opacity-100 group-focus:after:translate-x-0 group-focus:after:translate-y-0 group-focus:after:opacity-100"
    )} />
    <div className={cn('overflow-hidden w-full aspect-video')}>
      <img
        src={imageUrl}
        alt={title}
        loading="lazy"
        decoding="async"
        fetchPriority="auto"
        width={featured ? 1200 : 600}
        height={featured ? 630 : 338}
        className="w-full h-full object-cover"
      />
    </div>
    <div className={cn(
      "flex flex-col justify-between flex-1 border-t border-foreground/30 p-4",
      featured && "md:p-6"
    )}>
        <h3 className={cn(
        "text-xl font-bold mb-2 uppercase",
        featured && "md:text-2xl"
      )}>{title}</h3>
        <p className={cn(
        "font-custom tracking-prose text-sm leading-tight text-muted-foreground line-clamp-2 mb-4",
        featured && "md:text-[1rem]"

      )}>
        {description}
      </p>
      <div className={cn('flex items-start justify-between')}>
        <div className="text-sm text-muted-foreground before:content-['\25F4'] before:mr-1 before:text-foreground">
          {date}
        </div>
        <div className="text-right">
          <span className={cn(
            "text-sm font-bold group-hover:text-loud-foreground group-focus:text-loud-foreground",
            "before:inline-block before:content-['[['] after:inline-block after:content-[']]'] before:mr-1 after:ml-1",
            "group-hover:fx-glow group-focus:fx-glow",
            "before:transition-transform group-hover:before:-translate-x-1 group-focus:before:-translate-x-1",
            "after:transition-transform group-hover:after:translate-x-1 group-focus:after:translate-x-1"
          )}>
            <span className="whitespace-nowrap group-hover:underline group-focus:underline underline-offset-4">+ READ MORE</span>
          </span>
        </div>
      </div>
    </div>
    </a>
  </article>
);
