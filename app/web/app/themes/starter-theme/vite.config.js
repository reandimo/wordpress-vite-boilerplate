import { defineConfig } from 'vite';
import { resolve } from 'path';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import hotFile from './vite-plugin-hot-file.js';

export default defineConfig({
	root: '.',
	base: './',
	publicDir: false,
	plugins: [
		hotFile(),
		viteStaticCopy({
			// silent: true prevents build failure when resources/fonts/ is empty
			silent: true,
			targets: [
				{
					src: 'resources/fonts/*',
					dest: 'fonts',
				},
			],
		}),
	],
	server: {
		host: 'localhost',
		port: 5173,
		strictPort: true,
		cors: true,
		hmr: {
			host: 'localhost',
			protocol: 'ws',
		},
		watch: {
			usePolling: true,
		},
		origin: 'http://localhost:5173',
	},
	build: {
		outDir: 'public',
		emptyOutDir: false,
		manifest: 'manifest.json',
		rollupOptions: {
			input: {
				main: resolve(__dirname, 'resources/scripts/frontend/main.ts'),
			},
			output: {
				entryFileNames: 'js/[name].js',
				chunkFileNames: 'js/[name]-[hash].js',
				assetFileNames: (assetInfo) => {
					if (assetInfo.name.endsWith('.css')) {
						return 'css/[name].css';
					}
					return 'assets/[name]-[hash][extname]';
				},
			},
		},
		cssCodeSplit: false,
	},
	css: {
		preprocessorOptions: {
			scss: {
				api: 'modern-compiler',
				additionalData: '',
			},
		},
	},
	resolve: {
		alias: {
			'@': resolve(__dirname, 'resources'),
			'@fonts': resolve(__dirname, 'public/fonts'),
		},
	},
});
