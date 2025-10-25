/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			colors: {
				relic: {
					purple: '#8B5CF6',
					pink: '#EC4899',
					blue: '#3B82F6',
					dark: '#0F172A',
					gray: '#1E293B'
				}
			},
			backgroundImage: {
				'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
				'gradient-cosmic': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
			}
		}
	},
	plugins: []
};
