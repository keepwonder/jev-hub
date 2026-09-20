import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const tutorials = await getCollection('tutorials');
  const articles = await getCollection('articles');

  const items = [
    ...tutorials.map((t) => ({
      title: t.data.title,
      pubDate: t.data.pubDate,
      description: t.data.description,
      link: `/tutorials/${t.slug}/`,
    })),
    ...articles.map((a) => ({
      title: a.data.title,
      pubDate: a.data.pubDate,
      description: a.data.description,
      link: a.data.publisherUrl,
    })),
  ].sort((a, b) => +b.pubDate - +a.pubDate).slice(0, 30);

  return rss({
    title: 'Jev Hub',
    description: 'Jev / TypeSafe AI 中文跟踪与文档聚合站',
    site: context.site ?? 'https://jev.kiang.website',
    items,
    customData: '<language>zh-CN</language>',
  });
}
