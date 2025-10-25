<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { showBackButton, hideBackButton, hapticFeedback, openLink } from '$lib/telegram';
	import { getReferralLink, getUserStats } from '$lib/api';

	let referralLink = '';
	let referralCode = '';
	let referralCount = 0;
	let totalEarned = 0;
	let loading = true;
	let copied = false;

	onMount(() => {
		showBackButton(() => {
			hideBackButton();
			goto('/');
		});

		loadReferralData();

		return () => {
			hideBackButton();
		};
	});

	async function loadReferralData() {
		loading = true;
		try {
			const [link, stats] = await Promise.all([getReferralLink(), getUserStats()]);

			referralLink = link;
			referralCode = stats.referralCode;
			referralCount = stats.referralCount;
			totalEarned = stats.totalEarned;
		} catch (error) {
			console.error('Failed to load referral data:', error);
		} finally {
			loading = false;
		}
	}

	async function copyLink() {
		try {
			await navigator.clipboard.writeText(referralLink);
			hapticFeedback('success');
			copied = true;
			setTimeout(() => {
				copied = false;
			}, 2000);
		} catch (error) {
			console.error('Copy failed:', error);
			hapticFeedback('error');
		}
	}

	function shareToTelegram() {
		hapticFeedback('medium');
		const text = encodeURIComponent(
			`🔮 Join me on Infinite Relic!\n\nLock USDC, earn RWA yield from US T-Bills, and trade your position as an NFT.\n\n5-17% APR • Fully decentralized • Built on Arbitrum\n\n${referralLink}`
		);
		openLink(`https://t.me/share/url?url=${referralLink}&text=${text}`);
	}

	function shareToTwitter() {
		hapticFeedback('medium');
		const text = encodeURIComponent(
			`Just joined @InfiniteRelic - earning real RWA yield on my crypto! 🔮\n\n5-17% APR from US T-Bills\nTradeable lock positions as NFTs\nBuilt on @arbitrum\n\n${referralLink}`
		);
		openLink(`https://twitter.com/intent/tweet?text=${text}`);
	}
</script>

<div class="min-h-screen p-4 pb-20">
	<h1 class="text-2xl font-bold mb-2">Invite Friends</h1>
	<p class="text-gray-400 mb-6">Earn rewards for every friend you refer</p>

	{#if loading}
		<!-- Loading State -->
		<div class="space-y-4">
			<div class="card animate-pulse">
				<div class="h-6 bg-white/10 rounded w-32 mb-4"></div>
				<div class="h-12 bg-white/10 rounded"></div>
			</div>
			<div class="grid grid-cols-2 gap-4">
				<div class="card animate-pulse">
					<div class="h-20 bg-white/10 rounded"></div>
				</div>
				<div class="card animate-pulse">
					<div class="h-20 bg-white/10 rounded"></div>
				</div>
			</div>
		</div>
	{:else}
		<!-- Stats Cards -->
		<div class="grid grid-cols-2 gap-4 mb-6">
			<div class="card">
				<p class="text-gray-400 text-sm mb-1">Total Referrals</p>
				<p class="text-3xl font-bold text-relic-purple">{referralCount}</p>
			</div>
			<div class="card">
				<p class="text-gray-400 text-sm mb-1">Total Earned</p>
				<p class="text-3xl font-bold text-relic-pink">${totalEarned.toFixed(2)}</p>
			</div>
		</div>

		<!-- Referral Link -->
		<div class="card mb-6">
			<p class="text-sm text-gray-400 mb-2">Your Referral Link</p>
			<div class="flex gap-2">
				<input
					type="text"
					value={referralLink}
					readonly
					class="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
				/>
				<button on:click={copyLink} class="btn-secondary px-4 py-2">
					{copied ? '✓' : '📋'}
				</button>
			</div>
			<p class="text-xs text-gray-500 mt-2">Code: {referralCode}</p>
		</div>

		<!-- Share Buttons -->
		<div class="space-y-3 mb-6">
			<button on:click={shareToTelegram} class="w-full btn-primary flex items-center justify-center gap-2">
				<span class="text-xl">📱</span>
				<span>Share on Telegram</span>
			</button>
			<button on:click={shareToTwitter} class="w-full btn-secondary flex items-center justify-center gap-2">
				<span class="text-xl">🐦</span>
				<span>Share on Twitter</span>
			</button>
		</div>

		<!-- Rewards Tiers -->
		<div class="card bg-gradient-to-r from-relic-purple/20 to-relic-pink/20 border-relic-purple/30 mb-6">
			<h3 class="font-bold mb-3">Referral Rewards</h3>
			<div class="space-y-2 text-sm">
				<div class="flex justify-between">
					<span>🥉 1-5 referrals</span>
					<span class="font-bold">$0.50 each</span>
				</div>
				<div class="flex justify-between">
					<span>🥈 6-20 referrals</span>
					<span class="font-bold">$1.00 each</span>
				</div>
				<div class="flex justify-between">
					<span>🥇 21+ referrals</span>
					<span class="font-bold">$2.00 each</span>
				</div>
			</div>
		</div>

		<!-- How it Works -->
		<div class="card">
			<h3 class="font-bold mb-3">How It Works</h3>
			<div class="space-y-3 text-sm">
				<div class="flex gap-3">
					<div class="w-8 h-8 rounded-full bg-relic-purple/20 flex items-center justify-center flex-shrink-0">
						1
					</div>
					<div class="flex-1">
						<p class="font-medium mb-1">Share Your Link</p>
						<p class="text-gray-400 text-xs">Send your unique referral link to friends</p>
					</div>
				</div>
				<div class="flex gap-3">
					<div class="w-8 h-8 rounded-full bg-relic-purple/20 flex items-center justify-center flex-shrink-0">
						2
					</div>
					<div class="flex-1">
						<p class="font-medium mb-1">Friend Joins</p>
						<p class="text-gray-400 text-xs">They sign up using your link</p>
					</div>
				</div>
				<div class="flex gap-3">
					<div class="w-8 h-8 rounded-full bg-relic-purple/20 flex items-center justify-center flex-shrink-0">
						3
					</div>
					<div class="flex-1">
						<p class="font-medium mb-1">Earn Rewards</p>
						<p class="text-gray-400 text-xs">Get paid instantly when they mint their first Relic</p>
					</div>
				</div>
			</div>
		</div>

		<!-- Leaderboard Teaser -->
		<div class="mt-6 p-4 bg-gradient-cosmic rounded-xl text-center">
			<p class="text-sm font-bold mb-1">🏆 Top Referrer This Week</p>
			<p class="text-2xl font-bold">125 Referrals</p>
			<p class="text-xs text-white/80 mt-1">Can you beat them?</p>
		</div>
	{/if}
</div>
