<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { showBackButton, hideBackButton, hapticFeedback } from '$lib/telegram';
	import { getAccount, readContract, writeContract, waitForTransactionReceipt } from '@wagmi/core';
	import { wagmiConfig, CONTRACTS } from '$lib/wagmi';
	import { formatUnits } from 'viem';

	interface Relic {
		tokenId: bigint;
		principal: bigint;
		lockDays: number;
		lockEnd: bigint;
		pendingYield: bigint;
		name: string;
		color: string;
	}

	let relics: Relic[] = [];
	let loading = true;
	let claiming: bigint | null = null;

	const PERIOD_STYLES = {
		30: { name: 'Copper', color: 'from-orange-600 to-orange-400' },
		90: { name: 'Silver', color: 'from-gray-400 to-gray-200' },
		180: { name: 'Gold', color: 'from-yellow-400 to-yellow-200' },
		365: { name: 'Infinite', color: 'from-purple-500 to-pink-500' }
	};

	onMount(() => {
		showBackButton(() => {
			hideBackButton();
			goto('/');
		});

		loadPortfolio();

		return () => {
			hideBackButton();
		};
	});

	async function loadPortfolio() {
		loading = true;
		try {
			const account = getAccount(wagmiConfig);
			if (!account.address) return;

			// Get balance (number of NFTs owned)
			const balance = await readContract(wagmiConfig, {
				address: CONTRACTS.NFT,
				abi: [
					{
						inputs: [{ name: 'owner', type: 'address' }],
						name: 'balanceOf',
						outputs: [{ name: '', type: 'uint256' }],
						stateMutability: 'view',
						type: 'function'
					}
				],
				functionName: 'balanceOf',
				args: [account.address]
			}) as bigint;

			// Load each NFT
			const relicPromises = [];
			for (let i = 0; i < Number(balance); i++) {
				relicPromises.push(loadRelic(account.address, i));
			}

			relics = (await Promise.all(relicPromises)).filter((r) => r !== null) as Relic[];
		} catch (error) {
			console.error('Failed to load portfolio:', error);
		} finally {
			loading = false;
		}
	}

	async function loadRelic(owner: string, index: number): Promise<Relic | null> {
		try {
			// Get token ID by index
			const tokenId = (await readContract(wagmiConfig, {
				address: CONTRACTS.NFT,
				abi: [
					{
						inputs: [
							{ name: 'owner', type: 'address' },
							{ name: 'index', type: 'uint256' }
						],
						name: 'tokenOfOwnerByIndex',
						outputs: [{ name: '', type: 'uint256' }],
						stateMutability: 'view',
						type: 'function'
					}
				],
				functionName: 'tokenOfOwnerByIndex',
				args: [owner, BigInt(index)]
			})) as bigint;

			// Get metadata
			const metadata = (await readContract(wagmiConfig, {
				address: CONTRACTS.NFT,
				abi: [
					{
						inputs: [{ name: 'tokenId', type: 'uint256' }],
						name: 'getMetadata',
						outputs: [
							{
								components: [
									{ name: 'lockDays', type: 'uint32' },
									{ name: 'principal', type: 'uint256' },
									{ name: 'lockEnd', type: 'uint256' }
								],
								type: 'tuple'
							}
						],
						stateMutability: 'view',
						type: 'function'
					}
				],
				functionName: 'getMetadata',
				args: [tokenId]
			})) as { lockDays: number; principal: bigint; lockEnd: bigint };

			// Get pending yield
			const pendingYield = (await readContract(wagmiConfig, {
				address: CONTRACTS.VAULT,
				abi: [
					{
						inputs: [{ name: 'tokenId', type: 'uint256' }],
						name: 'getPendingYield',
						outputs: [{ name: '', type: 'uint256' }],
						stateMutability: 'view',
						type: 'function'
					}
				],
				functionName: 'getPendingYield',
				args: [tokenId]
			})) as bigint;

			const style = PERIOD_STYLES[metadata.lockDays as keyof typeof PERIOD_STYLES];

			return {
				tokenId,
				principal: metadata.principal,
				lockDays: metadata.lockDays,
				lockEnd: metadata.lockEnd,
				pendingYield,
				name: style.name,
				color: style.color
			};
		} catch (error) {
			console.error('Failed to load relic:', error);
			return null;
		}
	}

	async function claimYield(tokenId: bigint) {
		claiming = tokenId;
		hapticFeedback('medium');

		try {
			const hash = await writeContract(wagmiConfig, {
				address: CONTRACTS.VAULT,
				abi: [
					{
						inputs: [{ name: 'tokenId', type: 'uint256' }],
						name: 'claimYield',
						outputs: [],
						stateMutability: 'nonpayable',
						type: 'function'
					}
				],
				functionName: 'claimYield',
				args: [tokenId]
			});

			await waitForTransactionReceipt(wagmiConfig, { hash });

			hapticFeedback('success');
			await loadPortfolio();
		} catch (error) {
			hapticFeedback('error');
			console.error('Claim failed:', error);
			alert('Claim failed. Please try again.');
		} finally {
			claiming = null;
		}
	}

	function isUnlocked(lockEnd: bigint): boolean {
		return Number(lockEnd) < Math.floor(Date.now() / 1000);
	}

	function formatTimeRemaining(lockEnd: bigint): string {
		const now = Math.floor(Date.now() / 1000);
		const end = Number(lockEnd);
		if (end < now) return 'Unlocked';

		const diff = end - now;
		const days = Math.floor(diff / 86400);
		const hours = Math.floor((diff % 86400) / 3600);

		if (days > 0) return `${days}d ${hours}h`;
		return `${hours}h`;
	}
</script>

<div class="min-h-screen p-4 pb-20">
	<h1 class="text-2xl font-bold mb-6">My Portfolio</h1>

	{#if loading}
		<!-- Loading Skeletons -->
		<div class="space-y-4">
			{#each [1, 2] as _}
				<div class="card animate-pulse">
					<div class="h-6 bg-white/10 rounded w-32 mb-4"></div>
					<div class="space-y-2">
						<div class="h-4 bg-white/10 rounded w-full"></div>
						<div class="h-4 bg-white/10 rounded w-3/4"></div>
					</div>
				</div>
			{/each}
		</div>
	{:else if relics.length === 0}
		<!-- Empty State -->
		<div class="flex flex-col items-center justify-center min-h-[60vh]">
			<div class="text-6xl mb-4">💎</div>
			<h2 class="text-xl font-bold mb-2">No Relics Yet</h2>
			<p class="text-gray-400 text-center mb-8">
				Mint your first Relic to start earning RWA yield
			</p>
			<button on:click={() => goto('/mint')} class="btn-primary px-8">
				Mint Relic
			</button>
		</div>
	{:else}
		<!-- Relics List -->
		<div class="space-y-4">
			{#each relics as relic}
				<div class="card">
					<!-- Header -->
					<div class="flex items-center justify-between mb-4">
						<div>
							<div class="bg-gradient-to-r {relic.color} h-1 w-20 rounded-full mb-2"></div>
							<h3 class="font-bold text-lg">{relic.name} Relic #{relic.tokenId.toString()}</h3>
						</div>
						{#if isUnlocked(relic.lockEnd)}
							<span class="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
								Unlocked
							</span>
						{:else}
							<span class="text-xs bg-relic-purple/20 text-relic-purple px-2 py-1 rounded-full">
								{formatTimeRemaining(relic.lockEnd)}
							</span>
						{/if}
					</div>

					<!-- Stats -->
					<div class="space-y-2 text-sm mb-4">
						<div class="flex justify-between">
							<span class="text-gray-400">Principal</span>
							<span class="font-bold">{formatUnits(relic.principal, 6)} USDC</span>
						</div>
						<div class="flex justify-between">
							<span class="text-gray-400">Lock Period</span>
							<span class="font-bold">{relic.lockDays} days</span>
						</div>
						<div class="flex justify-between">
							<span class="text-gray-400">Pending Yield</span>
							<span class="font-bold text-green-400">+{formatUnits(relic.pendingYield, 6)} USDC</span>
						</div>
					</div>

					<!-- Actions -->
					<div class="space-y-2">
						<button
							on:click={() => claimYield(relic.tokenId)}
							disabled={claiming === relic.tokenId || relic.pendingYield === 0n}
							class="w-full btn-primary text-sm py-2"
						>
							{#if claiming === relic.tokenId}
								⏳ Claiming...
							{:else if relic.pendingYield === 0n}
								No Yield Yet
							{:else}
								Claim {formatUnits(relic.pendingYield, 6)} USDC
							{/if}
						</button>
						{#if isUnlocked(relic.lockEnd)}
							<button class="w-full btn-secondary text-sm py-2">
								View on OpenSea
							</button>
						{/if}
					</div>
				</div>
			{/each}
		</div>

		<!-- Total Stats -->
		<div class="card mt-6 bg-gradient-to-r from-relic-purple/20 to-relic-pink/20 border-relic-purple/30">
			<div class="space-y-2 text-sm">
				<div class="flex justify-between">
					<span class="text-gray-400">Total Locked</span>
					<span class="font-bold">
						{formatUnits(
							relics.reduce((sum, r) => sum + r.principal, 0n),
							6
						)} USDC
					</span>
				</div>
				<div class="flex justify-between">
					<span class="text-gray-400">Total Pending Yield</span>
					<span class="font-bold text-green-400">
						+{formatUnits(
							relics.reduce((sum, r) => sum + r.pendingYield, 0n),
							6
						)} USDC
					</span>
				</div>
			</div>
		</div>
	{/if}
</div>
