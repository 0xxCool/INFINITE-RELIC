import { createConfig, http } from '@wagmi/core';
import { arbitrumSepolia, arbitrum } from '@wagmi/core/chains';
import { injected, walletConnect } from '@wagmi/connectors';

const projectId = import.meta.env.PUBLIC_WC_PROJECT_ID || 'YOUR_WALLETCONNECT_PROJECT_ID';

export const wagmiConfig = createConfig({
	chains: [arbitrumSepolia, arbitrum],
	connectors: [
		injected(),
		walletConnect({
			projectId,
			metadata: {
				name: 'Infinite Relic',
				description: 'On-chain RWA yield, locked in NFTs',
				url: 'https://infiniterelic.xyz',
				icons: ['https://infiniterelic.xyz/logo.png']
			}
		})
	],
	transports: {
		[arbitrumSepolia.id]: http(),
		[arbitrum.id]: http()
	}
});

export const CONTRACTS = {
	VAULT: '0x0000000000000000000000000000000000000000', // UPDATE AFTER DEPLOYMENT
	NFT: '0x0000000000000000000000000000000000000000',
	USDC: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831' // Arbitrum USDC
} as const;
