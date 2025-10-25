import { run } from 'hardhat';

/**
 * Verify all contracts on Arbiscan
 * Run after deployment: npx hardhat run scripts/verify-all.ts --network arbitrum
 */
async function main() {
  // UPDATE THESE WITH YOUR DEPLOYED ADDRESSES
  const addresses = {
    mockUSDC: process.env.MOCK_USDC_ADDRESS || '',
    mockRWA: process.env.MOCK_RWA_ADDRESS || '',
    yieldToken: process.env.YIELD_TOKEN_ADDRESS || '',
    nft: process.env.NFT_ADDRESS || '',
    vault: process.env.VAULT_ADDRESS || '',
  };

  const constructorArgs = {
    mockUSDC: [],
    mockRWA: [addresses.mockUSDC],
    yieldToken: [],
    nft: [],
    vault: [
      addresses.mockUSDC,
      addresses.mockRWA,
      addresses.yieldToken,
      addresses.nft,
    ],
  };

  console.log('Verifying contracts on Arbiscan...\n');

  // Verify MockUSDC
  if (addresses.mockUSDC) {
    try {
      console.log('Verifying MockUSDC...');
      await run('verify:verify', {
        address: addresses.mockUSDC,
        constructorArguments: constructorArgs.mockUSDC,
      });
      console.log('✅ MockUSDC verified\n');
    } catch (error: any) {
      if (error.message.includes('already verified')) {
        console.log('✅ MockUSDC already verified\n');
      } else {
        console.error('❌ MockUSDC verification failed:', error.message, '\n');
      }
    }
  }

  // Verify MockRWAAdapter
  if (addresses.mockRWA) {
    try {
      console.log('Verifying MockRWAAdapter...');
      await run('verify:verify', {
        address: addresses.mockRWA,
        constructorArguments: constructorArgs.mockRWA,
      });
      console.log('✅ MockRWAAdapter verified\n');
    } catch (error: any) {
      if (error.message.includes('already verified')) {
        console.log('✅ MockRWAAdapter already verified\n');
      } else {
        console.error('❌ MockRWAAdapter verification failed:', error.message, '\n');
      }
    }
  }

  // Verify YieldToken
  if (addresses.yieldToken) {
    try {
      console.log('Verifying YieldToken...');
      await run('verify:verify', {
        address: addresses.yieldToken,
        constructorArguments: constructorArgs.yieldToken,
      });
      console.log('✅ YieldToken verified\n');
    } catch (error: any) {
      if (error.message.includes('already verified')) {
        console.log('✅ YieldToken already verified\n');
      } else {
        console.error('❌ YieldToken verification failed:', error.message, '\n');
      }
    }
  }

  // Verify RelicNFT
  if (addresses.nft) {
    try {
      console.log('Verifying RelicNFT...');
      await run('verify:verify', {
        address: addresses.nft,
        constructorArguments: constructorArgs.nft,
      });
      console.log('✅ RelicNFT verified\n');
    } catch (error: any) {
      if (error.message.includes('already verified')) {
        console.log('✅ RelicNFT already verified\n');
      } else {
        console.error('❌ RelicNFT verification failed:', error.message, '\n');
      }
    }
  }

  // Verify RelicVault
  if (addresses.vault) {
    try {
      console.log('Verifying RelicVault...');
      await run('verify:verify', {
        address: addresses.vault,
        constructorArguments: constructorArgs.vault,
      });
      console.log('✅ RelicVault verified\n');
    } catch (error: any) {
      if (error.message.includes('already verified')) {
        console.log('✅ RelicVault already verified\n');
      } else {
        console.error('❌ RelicVault verification failed:', error.message, '\n');
      }
    }
  }

  console.log('🎉 Verification complete!');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
