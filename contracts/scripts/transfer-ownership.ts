import { ethers } from 'hardhat';

/**
 * Transfer ownership of all contracts to a Gnosis Safe
 * IMPORTANT: Only run this on mainnet after deploying to Gnosis Safe
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('Transferring ownership from:', deployer.address);

  // UPDATE THESE ADDRESSES
  const GNOSIS_SAFE = process.env.GNOSIS_SAFE_ADDRESS || '';
  const VAULT_ADDRESS = process.env.VAULT_ADDRESS || '';
  const NFT_ADDRESS = process.env.NFT_ADDRESS || '';

  if (!GNOSIS_SAFE) {
    throw new Error('GNOSIS_SAFE_ADDRESS not set in .env');
  }

  if (!VAULT_ADDRESS || !NFT_ADDRESS) {
    throw new Error('Contract addresses not set');
  }

  console.log('New owner (Gnosis Safe):', GNOSIS_SAFE);
  console.log('\nTransferring ownership...\n');

  // Transfer RelicVault ownership
  const vault = await ethers.getContractAt('RelicVault', VAULT_ADDRESS);
  let tx = await vault.transferOwnership(GNOSIS_SAFE);
  await tx.wait();
  console.log('✅ RelicVault ownership transferred');

  // Transfer RelicNFT ownership
  const nft = await ethers.getContractAt('RelicNFT', NFT_ADDRESS);
  tx = await nft.transferOwnership(GNOSIS_SAFE);
  await tx.wait();
  console.log('✅ RelicNFT ownership transferred');

  console.log('\n🎉 All ownerships transferred successfully!');
  console.log('\nNext steps:');
  console.log('1. Verify new owner in Gnosis Safe UI');
  console.log('2. Test ownership functions via Safe');
  console.log('3. Update monitoring alerts');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
