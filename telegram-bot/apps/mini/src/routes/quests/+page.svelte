<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { showBackButton, hideBackButton, hapticFeedback } from '$lib/telegram';
	import { getQuests, claimQuest, type Quest } from '$lib/api';

	let quests: Quest[] = [];
	let loading = true;
	let claiming: number | null = null;

	const QUEST_ICONS: Record<string, string> = {
		DAILY_CHECKIN: '📅',
		FIRST_MINT: '🔒',
		SHARE_TELEGRAM: '📢',
		JOIN_COMMUNITY: '👥',
		CLAIM_YIELD: '💰',
		REFER_FRIEND: '🤝'
	};

	const QUEST_DESCRIPTIONS: Record<string, string> = {
		DAILY_CHECKIN: 'Check in daily to earn rewards',
		FIRST_MINT: 'Mint your first Relic NFT',
		SHARE_TELEGRAM: 'Share Infinite Relic in a Telegram group',
		JOIN_COMMUNITY: 'Join the official Telegram community',
		CLAIM_YIELD: 'Claim yield from your Relic',
		REFER_FRIEND: 'Refer a friend to Infinite Relic'
	};

	onMount(() => {
		showBackButton(() => {
			hideBackButton();
			goto('/');
		});

		loadQuests();

		return () => {
			hideBackButton();
		};
	});

	async function loadQuests() {
		loading = true;
		try {
			quests = await getQuests();
		} catch (error) {
			console.error('Failed to load quests:', error);
		} finally {
			loading = false;
		}
	}

	async function handleClaim(questId: number) {
		claiming = questId;
		hapticFeedback('medium');

		try {
			const result = await claimQuest(questId);
			hapticFeedback('success');

			// Show reward animation
			alert(`🎉 Earned $${result.reward.toFixed(2)}!`);

			// Reload quests
			await loadQuests();
		} catch (error) {
			hapticFeedback('error');
			console.error('Claim failed:', error);
			alert('Failed to claim quest. Please try again.');
		} finally {
			claiming = null;
		}
	}

	function getTimeUntilAvailable(cooldownEnd: string): string {
		const now = new Date();
		const end = new Date(cooldownEnd);
		const diff = end.getTime() - now.getTime();

		if (diff <= 0) return 'Available now';

		const hours = Math.floor(diff / (1000 * 60 * 60));
		const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

		if (hours > 0) return `${hours}h ${minutes}m`;
		return `${minutes}m`;
	}
</script>

<div class="min-h-screen p-4 pb-20">
	<h1 class="text-2xl font-bold mb-2">Daily Quests</h1>
	<p class="text-gray-400 mb-6">Complete quests to earn extra rewards</p>

	{#if loading}
		<!-- Loading Skeletons -->
		<div class="space-y-3">
			{#each [1, 2, 3] as _}
				<div class="card animate-pulse">
					<div class="flex justify-between items-start">
						<div class="flex-1">
							<div class="h-5 bg-white/10 rounded w-32 mb-2"></div>
							<div class="h-4 bg-white/10 rounded w-48"></div>
						</div>
						<div class="h-8 w-20 bg-white/10 rounded"></div>
					</div>
				</div>
			{/each}
		</div>
	{:else if quests.length === 0}
		<!-- Empty State -->
		<div class="flex flex-col items-center justify-center min-h-[60vh]">
			<div class="text-6xl mb-4">⚡</div>
			<h2 class="text-xl font-bold mb-2">No Quests Available</h2>
			<p class="text-gray-400 text-center">
				Check back tomorrow for new daily quests
			</p>
		</div>
	{:else}
		<!-- Quests List -->
		<div class="space-y-3">
			{#each quests as quest}
				<div class="card">
					<div class="flex justify-between items-start">
						<div class="flex-1">
							<div class="flex items-center gap-2 mb-1">
								<span class="text-2xl">{QUEST_ICONS[quest.type] || '🎯'}</span>
								<h3 class="font-bold">
									{quest.type.replace('_', ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
								</h3>
							</div>
							<p class="text-sm text-gray-400">
								{QUEST_DESCRIPTIONS[quest.type] || quest.description}
							</p>
							<p class="text-xs text-relic-purple mt-2">+${quest.reward.toFixed(2)} reward</p>
						</div>

						<div class="ml-4">
							{#if quest.status === 'COMPLETED'}
								<button
									on:click={() => handleClaim(quest.id)}
									disabled={claiming === quest.id}
									class="btn-primary text-sm py-2 px-4 whitespace-nowrap"
								>
									{#if claiming === quest.id}
										⏳
									{:else}
										Claim
									{/if}
								</button>
							{:else if quest.status === 'CLAIMED'}
								<div class="text-sm bg-green-500/20 text-green-400 py-2 px-4 rounded-lg">
									✓ Claimed
								</div>
							{:else}
								<div class="text-xs text-gray-500 text-center">
									{getTimeUntilAvailable(quest.cooldownEnd)}
								</div>
							{/if}
						</div>
					</div>
				</div>
			{/each}
		</div>

		<!-- Total Earned -->
		<div class="card mt-6 bg-gradient-to-r from-relic-purple/20 to-relic-pink/20 border-relic-purple/30">
			<div class="text-center">
				<p class="text-sm text-gray-400 mb-1">Total Quest Rewards Earned</p>
				<p class="text-2xl font-bold text-relic-purple">
					${quests.filter((q) => q.status === 'CLAIMED').reduce((sum, q) => sum + q.reward, 0).toFixed(2)}
				</p>
			</div>
		</div>

		<!-- Info -->
		<div class="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
			<p class="text-xs text-blue-300">
				💡 New quests are added daily at 9 AM UTC. Complete them before they reset!
			</p>
		</div>
	{/if}
</div>
