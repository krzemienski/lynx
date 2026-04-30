// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://lynx.dev',
  integrations: [
    starlight({
      title: 'Lynx',
      description:
        "Sharp-eyed visual-audit suite for Claude Code. 14/14 detection accuracy. No mocks, no test files.",
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/krzemienski/lynx',
        },
      ],
      sidebar: [
        { label: 'Getting Started', items: [{label: 'Install', slug: 'install'}, {label: 'Usage', slug: 'usage'}] },
        { label: 'Architecture', autogenerate: { directory: 'architecture' } },
        { label: 'Reference', autogenerate: { directory: 'reference' } },
        { label: 'Project', autogenerate: { directory: 'project' } },
      ],
      head: [
        { tag: 'meta', attrs: { name: 'twitter:card', content: 'summary_large_image' } },
      ],
      lastUpdated: true,
    }),
    sitemap(),
    mdx(),
  ],
});
