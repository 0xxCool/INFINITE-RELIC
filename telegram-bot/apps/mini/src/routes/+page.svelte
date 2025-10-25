<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { telegramUser } from '$lib/telegram';
	import { getUserStats } from '$lib/api';
	import { hapticFeedback } from '$lib/telegram';

	let stats = {
		totalEarned: 0,
		referralCount: 0,
		questsCompleted: 0,
		referralCode: ''
	};

	let loading = true;
	let error = '';

	onMount(async () => {
		try {
			stats = await getUserStats();
			error = '';
		} catch (err) {
			console.error('Failed to load stats:', err);
			error = 'Failed to load your stats. Please try refreshing the app.';
		} finally {
			loading = false;
		}
	});

	function navigate(path: string) {
		hapticFeedback('light');
		goto(path);
	}
</script>

<div class="min-h-screen p-4 pb-20">
	<!-- Header -->
	<div class="mb-8 text-center">
		<h1 class="text-3xl font-bold bg-gradient-to-r from-relic-purple to-relic-pink bg-clip-text text-transparent">
			Infinite Relic
		</h1>
		<p class="text-gray-400 mt-2">
			{#if $telegramUser}
				Welcome, {$telegramUser.first_name}! 👋
			{:else}
				Loading...
			{/if}
		</p>
	</div>

	<!-- Error Message -->
	{#if error}
		<div class="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
			<p class="text-sm text-red-300 text-center">⚠️ {error}</p>
		</div>
	{/if}

	<!-- Stats Cards -->
	{#if !loading && !error}
		<div class="grid grid-cols-2 gap-4 mb-8">
			<div class="card">
				<p class="text-gray-400 text-sm">Total Earned</p>
				<p class="text-2xl font-bold text-relic-purple">${stats.totalEarned.toFixed(2)}</p>
			</div>
			<div class="card">
				<p class="text-gray-400 text-sm">Referrals</p>
				<p class="text-2xl font-bold text-relic-pink">{stats.referralCount}</p>
			</div>
			<div class="card col-span-2">
				<p class="text-gray-400 text-sm">Quests Completed</p>
				<p class="text-2xl font-bold text-relic-blue">{stats.questsCompleted}</p>
			</div>
		</div>
	{:else if loading}
		<div class="grid grid-cols-2 gap-4 mb-8">
			<div class="card animate-pulse">
				<div class="h-4 bg-white/10 rounded w-20 mb-2"></div>
				<div class="h-8 bg-white/10 rounded w-24"></div>
			</div>
			<div class="card animate-pulse">
				<div class="h-4 bg-white/10 rounded w-20 mb-2"></div>
				<div class="h-8 bg-white/10 rounded w-24"></div>
			</div>
		</div>
	{/if}

	<!-- Quick Actions -->
	<div class="space-y-4">
		<button on:click={() => navigate('/mint')} class="w-full btn-primary flex items-center justify-between">
			<span>🔒 Mint Relic</span>
			<span class="text-2xl">→</span>
		</button>

		<button on:click={() => navigate('/portfolio')} class="w-full btn-secondary flex items-center justify-between">
			<span>💎 My Portfolio</span>
			<span class="text-2xl">→</span>
		</button>

		<button on:click={() => navigate('/quests')} class="w-full btn-secondary flex items-center justify-between">
			<span>⚡ Daily Quests</span>
			<span class="text-2xl">→</span>
		</button>

		<button on:click={() => navigate('/referrals')} class="w-full btn-secondary flex items-center justify-between">
			<span>👥 Invite Friends</span>
			<span class="text-2xl">→</span>
		</button>
	</div>

	<!-- Info Banner -->
	<div class="mt-8 card bg-gradient-to-r from-relic-purple/20 to-relic-pink/20 border-relic-purple/30">
		<p class="text-sm text-center">
			🎯 Lock USDC, earn RWA yield, trade your lock as an NFT
		</p>
	</div>
</div>
