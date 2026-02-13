import { cn } from '@/lib/utils';

const testImageUrl = '/src/content/blog/the-augur-lituus-whitepaper/featured-image.webp';

interface PostProps {
  title: string;
  description: string;
  date: string;
  imageUrl: string;
  featured?: boolean;
}

const Post = ({ title, description, date, imageUrl, featured = false }: PostProps) => (
  <article className={cn(
    "group flex flex-col border border-foreground/30 bg-background/70 relative overflow-visible",
    "transition-all hover:shadow-xl shadow-foreground/10",

    // "before:content-[''] before:block before:absolute before:size-8 before:border-l-2 before:border-t-2 before:border-foreground",
    // "before:transition-transform hover:before:-translate-x-3 hover:before:-translate-y-3",

    // "after:content-[''] after:block after:absolute after:bottom-0 after:right-0 after:size-8 after:border-r-2 after:border-b-2 after:border-foreground",
    // "after:transition-transform hover:after:translate-x-3 hover:after:translate-y-3"

  )}>
    {/*  */}
    <div className={cn(
      "absolute inset-0 pointer-events-none",

      // top left sights
      "before:content-[''] before:block before:absolute before:size-8 before:border-l-2 before:border-t-2 before:border-foreground",
      "before:transition-transform group-hover:before:-translate-x-3 group-hover:before:-translate-y-3",

      // bottom right sights
      "after:content-[''] after:block after:absolute after:bottom-0 after:right-0 after:size-8 after:border-r-2 after:border-b-2 after:border-foreground",
      "after:transition-transform group-hover:after:translate-x-3 group-hover:after:translate-y-3"
    )} />
    <div className={cn('overflow-hidden w-full mb-4 aspect-video')}>
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
      <h3 className={cn('text-xl font-bold mb-2 uppercase')}>{title}</h3>
      <p className={cn('font-custom text-sm leading-tight text-muted-foreground line-clamp-2 mb-4')}>
        {description}
      </p>
      <div className={cn('flex items-start justify-between')}>
        <div className="text-sm text-muted-foreground before:content-['\25F4'] before:mr-1 before:text-foreground">
          {date}
        </div>
        <div className="text-right">
          <a href="#" className={cn(
            "outline-none cursor-pointer font-custom text-sm font-bold focus:text-loud-foreground hover:text-loud-foreground group",
            "before:inline-block before:content-['[['] after:inline-block after:content-[']]'] before:mr-1 after:ml-1",
            "focus:fx-glow hover:fx-glow",
            "before:transition-transform focus:before:-translate-x-1 hover:after:translate-x-1",
            "after:transition-transform focus:after:translate-x-1 hover:before:-translate-x-1"
          )}>
            <span className="whitespace-nowrap group-focus:underline group-hover:underline underline-offset-4">+ READ MORE</span>
          </a>
        </div>
      </div>
    </div>
  </article>
);

export const Test = () => {
  return (
    <section className="max-w-3xl mx-auto px-6">
      {/* Featured Post */}
      <Post
        title="The Augur Lituus Whitepaper"
        description="A proposed modular oracle for outsourced resolution, and a comparative analysis of oracle security"
        date="2026 &middot; 01 &middot; 29"
        imageUrl={testImageUrl}
        featured
      />

      {/* Secondary Posts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mt-8">
        <Post
          title="Generalizing Augur"
          description="A framework for understanding prediction markets beyond cryptocurrency"
          date="2026 &middot; 01 &middot; 15"
          imageUrl={testImageUrl}
        />
        <Post
          title="Augur Evolution"
          description="Exploring the next phase of oracle technology and market infrastructure"
          date="2026 &middot; 01 &middot; 10"
          imageUrl={testImageUrl}
        />
      </div>
    </section>
  );
};
