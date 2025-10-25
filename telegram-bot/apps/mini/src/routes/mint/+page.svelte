<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { showBackButton, hideBackButton, hapticFeedback } from '$lib/telegram';
	import { getAccount, readContract, writeContract, waitForTransactionReceipt } from '@wagmi/core';
	import { wagmiConfig, CONTRACTS } from '$lib/wagmi';
	import { parseUnits, formatUnits } from 'viem';

	const LOCK_PERIODS = [
		{ days: 30, name: 'Copper', baseAPR: 5, maxBoost: 7, color: 'from-orange-600 to-orange-400' },
		{ days: 90, name: 'Silver', baseAPR: 5, maxBoost: 10, color: 'from-gray-400 to-gray-200' },
		{ days: 180, name: 'Gold', baseAPR: 5, maxBoost: 13, color: 'from-yellow-400 to-yellow-200' },
		{ days: 365, name: 'Infinite', baseAPR: 5, maxBoost: 17, color: 'from-purple-500 to-pink-500' }
	];

	let selectedPeriod = LOCK_PERIODS[1]; // Default to 90 days
	let amount = '';
	let loading = false;
	let step: 'input' | 'approve' | 'mint' | 'success' = 'input';
	let txHash = '';
	let allowance = 0n;

	onMount(() => {
		showBackButton(() => {
			hideBackButton();
			goto('/');
		});

		checkAllowance();

		return () => {
			hideBackButton();
		};
	});

	async function checkAllowance() {
		try {
			const account = getAccount(wagmiConfig);
			if (!account.address) return;

			const result = await readContract(wagmiConfig, {
				address: CONTRACTS.USDC,
				abi: [
					{
						inputs: [
							{ name: 'owner', type: 'address' },
							{ name: 'spender', type: 'address' }
						],
						name: 'allowance',
						outputs: [{ name: '', type: 'uint256' }],
						stateMutability: 'view',
						type: 'function'
					}
				],
				functionName: 'allowance',
				args: [account.address, CONTRACTS.VAULT]
			});

			allowance = result as bigint;
		} catch (error) {
			console.error('Failed to check allowance:', error);
		}
	}

	async function handleApprove() {
		if (!amount || parseFloat(amount) < 10) {
			hapticFeedback('error');
			alert('Minimum amount is 10 USDC');
			return;
		}

		loading = true;
		hapticFeedback('light');

		try {
			const amountBN = parseUnits(amount, 6);

			const hash = await writeContract(wagmiConfig, {
				address: CONTRACTS.USDC,
				abi: [
					{
						inputs: [
							{ name: 'spender', type: 'address' },
							{ name: 'amount', type: 'uint256' }
						],
						name: 'approve',
						outputs: [{ name: '', type: 'bool' }],
						stateMutability: 'nonpayable',
						type: 'function'
					}
				],
				functionName: 'approve',
				args: [CONTRACTS.VAULT, amountBN]
			});

			step = 'approve';
			await waitForTransactionReceipt(wagmiConfig, { hash });

			hapticFeedback('success');
			await checkAllowance();
			step = 'input';
		} catch (error) {
			hapticFeedback('error');
			console.error('Approval failed:', error);
			alert('Approval failed. Please try again.');
		} finally {
			loading = false;
		}
	}

	async function handleMint() {
		if (!amount || parseFloat(amount) < 10) {
			hapticFeedback('error');
			alert('Minimum amount is 10 USDC');
			return;
		}

		const amountBN = parseUnits(amount, 6);
		if (allowance < amountBN) {
			await handleApprove();
			return;
		}

		loading = true;
		hapticFeedback('medium');

		try {
			const hash = await writeContract(wagmiConfig, {
				address: CONTRACTS.VAULT,
				abi: [
					{
						inputs: [
							{ name: 'lockDays', type: 'uint32' },
							{ name: 'usdcAmount', type: 'uint256' }
						],
						name: 'mintRelic',
						outputs: [{ name: 'tokenId', type: 'uint256' }],
						stateMutability: 'nonpayable',
						type: 'function'
					}
				],
				functionName: 'mintRelic',
				args: [selectedPeriod.days, amountBN]
			});

			step = 'mint';
			txHash = hash;

			await waitForTransactionReceipt(wagmiConfig, { hash });

			hapticFeedback('success');
			step = 'success';
		} catch (error) {
			hapticFeedback('error');
			console.error('Minting failed:', error);
			alert('Minting failed. Please try again.');
			step = 'input';
		} finally {
			loading = false;
		}
	}

	function selectPeriod(period: typeof LOCK_PERIODS[0]) {
		hapticFeedback('light');
		selectedPeriod = period;
	}
</script>

<div class="min-h-screen p-4 pb-20">
	{#if step === 'success'}
		<!-- Success Screen -->
		<div class="flex flex-col items-center justify-center min-h-[80vh]">
			<div class="text-6xl mb-4">🎉</div>
			<h2 class="text-2xl font-bold mb-2">Relic Minted!</h2>
			<p class="text-gray-400 text-center mb-8">
				Your {selectedPeriod.name} Relic has been successfully minted
			</p>

			<div class="w-full space-y-3">
				<button on:click={() => goto('/portfolio')} class="w-full btn-primary">
					View Portfolio
				</button>
				<button on:click={() => { step = 'input'; amount = ''; }} class="w-full btn-secondary">
					Mint Another
				</button>
			</div>
		</div>
	{:else}
		<!-- Mint Form -->
		<h1 class="text-2xl font-bold mb-6">Mint Relic</h1>

		<!-- Lock Period Selection -->
		<div class="mb-6">
			<p class="text-sm text-gray-400 mb-3">Select Lock Period</p>
			<div class="grid grid-cols-2 gap-3">
				{#each LOCK_PERIODS as period}
					<button
						on:click={() => selectPeriod(period)}
						class="card {selectedPeriod.days === period.days ? 'border-2 border-relic-purple' : ''}"
					>
						<div class="bg-gradient-to-r {period.color} h-2 rounded-full mb-2"></div>
						<p class="font-bold">{period.name}</p>
						<p class="text-xs text-gray-400">{period.days} days</p>
						<p class="text-sm text-relic-purple mt-1">{period.baseAPR}-{period.maxBoost}% APR</p>
					</button>
				{/each}
			</div>
		</div>

		<!-- Amount Input -->
		<div class="mb-6">
			<p class="text-sm text-gray-400 mb-2">Amount (USDC)</p>
			<input
				type="number"
				bind:value={amount}
				placeholder="Min 10 USDC"
				min="10"
				step="0.01"
				class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-relic-purple"
			/>
			<p class="text-xs text-gray-500 mt-1">1% dev fee applied (you deposit {amount ? (parseFloat(amount) * 0.99).toFixed(2) : '0'} USDC)</p>
		</div>

		<!-- Stats Preview -->
		{#if amount && parseFloat(amount) >= 10}
			<div class="card mb-6 bg-gradient-to-r from-relic-purple/20 to-relic-pink/20 border-relic-purple/30">
				<div class="space-y-2 text-sm">
					<div class="flex justify-between">
						<span class="text-gray-400">Lock Period</span>
						<span class="font-bold">{selectedPeriod.days} days</span>
					</div>
					<div class="flex justify-between">
						<span class="text-gray-400">Deposited</span>
						<span class="font-bold">{(parseFloat(amount) * 0.99).toFixed(2)} USDC</span>
					</div>
					<div class="flex justify-between">
						<span class="text-gray-400">Est. APR</span>
						<span class="font-bold text-relic-purple">{selectedPeriod.baseAPR}-{selectedPeriod.maxBoost}%</span>
					</div>
					<div class="flex justify-between">
						<span class="text-gray-400">Min. Yield ({selectedPeriod.baseAPR}% APR)</span>
						<span class="font-bold text-green-400">
							${((parseFloat(amount) * 0.99 * selectedPeriod.baseAPR / 100 * selectedPeriod.days) / 365).toFixed(2)}
						</span>
					</div>
				</div>
			</div>
		{/if}

		<!-- Action Buttons -->
		<div class="space-y-3">
			{#if loading}
				<button disabled class="w-full btn-primary">
					{#if step === 'approve'}
						⏳ Approving...
					{:else if step === 'mint'}
						⏳ Minting...
					{:else}
						⏳ Processing...
					{/if}
				</button>
			{:else if allowance < parseUnits(amount || '0', 6)}
				<button on:click={handleApprove} class="w-full btn-primary" disabled={!amount || parseFloat(amount) < 10}>
					1. Approve USDC
				</button>
			{:else}
				<button on:click={handleMint} class="w-full btn-primary" disabled={!amount || parseFloat(amount) < 10}>
					2. Mint Relic
				</button>
			{/if}
		</div>

		<!-- Info -->
		<div class="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
			<p class="text-xs text-blue-300">
				💡 Your Relic NFT represents your locked position. You can sell it on OpenSea or claim yield anytime!
			</p>
		</div>
	{/if}
</div>
