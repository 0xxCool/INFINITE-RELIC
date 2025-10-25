<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { initTelegram } from '$lib/telegram';
	import { wagmiConfig } from '$lib/wagmi';

	onMount(() => {
		// Initialize Telegram Mini App
		initTelegram();

		// Expand to full height
		if (window.Telegram?.WebApp) {
			window.Telegram.WebApp.expand();
			window.Telegram.WebApp.ready();
		}
	});
</script>

<div class="min-h-screen bg-gradient-to-br from-relic-dark via-relic-gray to-relic-dark safe-top safe-bottom">
	<slot />
</div>

<style>
	:global(body) {
		overflow-x: hidden;
		-webkit-user-select: none;
		user-select: none;
	}
</style>
