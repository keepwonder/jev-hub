// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import pagefind from 'astro-pagefind';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import remarkGfm from 'remark-gfm';

export default defineConfig({
  site: 'https://jev.kiang.website',
  trailingSlash: 'never',
  prefetch: { prefetchAll: true },
  integrations: [
    tailwind({ applyBaseStyles: true }),
    mdx({ remarkPlugins: [remarkGfm], rehypePlugins: [rehypeSlug, [rehypeAutolinkHeadings, { behavior: 'wrap' }]] }),
    sitemap(),
    pagefind(),
  ],
  markdown: {
    shikiConfig: { theme: 'github-light', wrap: true },
  },
  vite: {
    server: { fs: { strict: false } },
  },
});
