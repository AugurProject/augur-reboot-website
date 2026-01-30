import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

export const prerender = true;

export async function GET(context: APIContext) {
  if (!context.site) {
    return new Response('RSS feed requires site URL to be configured', { status: 500 });
  }

  const blog = await getCollection('blog');

  // Sort by publish date, newest first
  const sortedBlog = blog.sort((a, b) =>
    b.data.publishDate.valueOf() - a.data.publishDate.valueOf()
  );

  return rss({
    title: 'Augur Blog',
    description: 'Latest insights and updates from the Augur Project',
    site: context.site,
    items: sortedBlog.map((post) => ({
      title: post.data.title,
      pubDate: post.data.publishDate,
      description: post.data.description,
      link: `/blog/${post.slug}/`,
      author: post.data.author,
      categories: post.data.tags,
    })),
    customData: `<language>en-us</language>`,
  });
}
