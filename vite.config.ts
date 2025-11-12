import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		host: '0.0.0.0', // Listen on all network interfaces (allows LAN access)
		port: 5174,
		strictPort: false, // Use alternative port if 5174 is busy
		// Allow CORS for development
		cors: true
	},
	preview: {
		host: '0.0.0.0', // Also expose preview server
		port: 4173,
		strictPort: false
	}
});
