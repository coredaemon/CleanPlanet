import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://cleanplanet.example',
  output: 'static',
  trailingSlash: 'always',
  integrations: [tailwind({ applyBaseStyles: false }), sitemap()],
  redirects: {
    '/services/ekouborka/': '/services/uborka-kvartir/',
  },
});
