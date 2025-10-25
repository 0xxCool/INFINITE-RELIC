import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		port: 3002,
		host: true,
		fs: {
			allow: ['..']
		}
	},
	optimizeDeps: {
		include: ['@telegram-apps/sdk', 'viem', 'wagmi']
	}
});
