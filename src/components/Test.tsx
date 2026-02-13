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
  <article className={cn('overflow-hidden flex flex-col', featured ? '' : 'border border-foreground/30 rounded')}>
    <div className={cn('overflow-hidden w-full', featured ? 'border border-foreground/30 mb-4' : 'aspect-video rounded-t')}>
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
    <div className={cn('flex flex-col justify-between flex-1', featured ? '' : 'p-4')}>
      <div>
        <h3 className={cn('text-xl font-bold mb-2 uppercase', featured && 'px-6')}>{title}</h3>
        <p className={cn('font-custom text-sm leading-tight text-muted-foreground', featured ? 'px-6 mb-4' : 'line-clamp-2')}>
          {description}
        </p>
      </div>
      <div className={cn('flex items-start justify-between', featured && 'px-6')}>
        <div className="text-muted-foreground before:content-['\25F4'] before:mr-1 before:text-foreground mb-2">
          {date}
        </div>
        <div className="text-right">
          <a href="#" className="outline-none cursor-pointer font-custom text-xs font-bold focus:text-loud-foreground hover:text-loud-foreground before:content-['[['] after:content-[']]'] group">
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
