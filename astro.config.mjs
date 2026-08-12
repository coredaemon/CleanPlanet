import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://clean-planet.online',
  output: 'static',
  trailingSlash: 'always',
  integrations: [
    tailwind({ applyBaseStyles: false }),
    // Страница благодарности закрыта noindex — в карте сайта ей не место
    sitemap({ filter: (page) => !page.includes('/thank-you/') }),
  ],
  redirects: {
    '/services/ekouborka/': '/services/uborka-kvartir/',
  },
});
