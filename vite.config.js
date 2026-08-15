import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), '');
	const apiOrigin = (env.VITE_API_URL || 'http://localhost:5000/api').replace(
		/\/api\/?$/,
		'',
	);

	return {
		plugins: [
			react(),
			tailwindcss(),
			VitePWA({
				registerType: 'autoUpdate',
				pwaAssets: {
					config: true,
					image: 'public/favicon.svg',
					overrideManifestIcons: true,
				},
				manifest: {
					name: 'Eggys',
					short_name: 'Eggys',
					description:
						"Farm-fresh eggs, delivered from Ghana's best local producers.",
					theme_color: '#2b2118',
					background_color: '#fff8ec',
					display: 'standalone',
					start_url: '/',
					scope: '/',
				},
				workbox: {
					navigateFallback: '/index.html',
					// Real static files (sitemap.xml, robots.txt, etc.) have an
					// extension in the path — don't let the SPA fallback swallow
					// those and serve the cached app shell instead.
					navigateFallbackDenylist: [/\.[a-zA-Z0-9]+$/],
					cleanupOutdatedCaches: true,
					runtimeCaching: [
						{
							urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
							handler: 'CacheFirst',
							options: {
								cacheName: 'google-fonts-stylesheets',
								expiration: {
									maxEntries: 10,
									maxAgeSeconds: 60 * 60 * 24 * 365,
								},
								cacheableResponse: { statuses: [0, 200] },
							},
						},
						{
							urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
							handler: 'CacheFirst',
							options: {
								cacheName: 'google-fonts-webfonts',
								expiration: {
									maxEntries: 10,
									maxAgeSeconds: 60 * 60 * 24 * 365,
								},
								cacheableResponse: { statuses: [0, 200] },
							},
						},
					],
				},
			}),
		],
		server: {
			port: 5198,
			strictPort: true,
			proxy: {
				'/api': apiOrigin,
				'/uploads': apiOrigin,
			},
		},
	};
});
