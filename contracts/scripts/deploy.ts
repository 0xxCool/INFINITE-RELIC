import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("=".repeat(60));
  console.log("🚀 INFINITE RELIC - CONTRACT DEPLOYMENT");
  console.log("=".repeat(60));
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");
  console.log("Chain ID:", (await ethers.provider.getNetwork()).chainId);
  console.log();

  // 1. Deploy MockUSDC
  console.log("📝 [1/5] Deploying MockUSDC...");
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const usdc = await MockUSDC.deploy();
  await usdc.waitForDeployment();
  const usdcAddress = await usdc.getAddress();
  console.log("✅ MockUSDC deployed to:", usdcAddress);
  console.log();

  // 2. Deploy MockRWAAdapter
  console.log("📝 [2/5] Deploying MockRWAAdapter...");
  const MockRWA = await ethers.getContractFactory("MockRWAAdapter");
  const rwa = await MockRWA.deploy(usdcAddress);
  await rwa.waitForDeployment();
  const rwaAddress = await rwa.getAddress();
  console.log("✅ MockRWAAdapter deployed to:", rwaAddress);
  console.log();

  // 3. Deploy YieldToken
  console.log("📝 [3/5] Deploying YieldToken...");
  const YieldToken = await ethers.getContractFactory("YieldToken");
  const yieldToken = await YieldToken.deploy();
  await yieldToken.waitForDeployment();
  const yieldAddress = await yieldToken.getAddress();
  console.log("✅ YieldToken deployed to:", yieldAddress);
  console.log();

  // 4. Deploy RelicNFT
  console.log("📝 [4/5] Deploying RelicNFT...");
  const RelicNFT = await ethers.getContractFactory("RelicNFT");
  const nft = await RelicNFT.deploy("https://api.infinite-relic.io/relic/");
  await nft.waitForDeployment();
  const nftAddress = await nft.getAddress();
  console.log("✅ RelicNFT deployed to:", nftAddress);
  console.log();

  // 5. Deploy RelicVault
  console.log("📝 [5/5] Deploying RelicVault...");
  const RelicVault = await ethers.getContractFactory("RelicVault");
  const vault = await RelicVault.deploy(usdcAddress, nftAddress, yieldAddress, rwaAddress);
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  console.log("✅ RelicVault deployed to:", vaultAddress);
  console.log();

  // 6. Transfer ownership to vault (CRITICAL for YieldToken minting)
  console.log("🔑 Transferring ownership...");

  // Transfer NFT ownership
  let tx = await nft.transferOwnership(vaultAddress);
  await tx.wait();
  const nftOwner = await nft.owner();
  if (nftOwner !== vaultAddress) {
    throw new Error("RelicNFT ownership transfer failed!");
  }
  console.log("✅ RelicNFT ownership transferred to Vault (verified)");

  // Transfer YieldToken ownership (CRITICAL - Vault must mint yield tokens)
  tx = await yieldToken.transferOwnership(vaultAddress);
  await tx.wait();
  const yieldOwner = await yieldToken.owner();
  if (yieldOwner !== vaultAddress) {
    throw new Error("YieldToken ownership transfer failed!");
  }
  console.log("✅ YieldToken ownership transferred to Vault (verified)");
  console.log();

  // 7. Summary
  console.log("=".repeat(60));
  console.log("📋 DEPLOYMENT SUMMARY");
  console.log("=".repeat(60));
  console.log("MockUSDC:         ", usdcAddress);
  console.log("MockRWAAdapter:   ", rwaAddress);
  console.log("YieldToken:       ", yieldAddress);
  console.log("RelicNFT:         ", nftAddress);
  console.log("RelicVault:       ", vaultAddress);
  console.log("=".repeat(60));
  console.log();

  console.log("💾 Add to .env:");
  console.log(`VAULT_ADDRESS=${vaultAddress}`);
  console.log(`USDC_ADDRESS=${usdcAddress}`);
  console.log(`RELIC_NFT_ADDRESS=${nftAddress}`);
  console.log(`YIELD_TOKEN_ADDRESS=${yieldAddress}`);
  console.log(`RWA_ADAPTER_ADDRESS=${rwaAddress}`);
  console.log();

  console.log("🔍 Verify contracts:");
  console.log(`npx hardhat verify --network arbSepolia ${usdcAddress}`);
  console.log(`npx hardhat verify --network arbSepolia ${rwaAddress} ${usdcAddress}`);
  console.log(`npx hardhat verify --network arbSepolia ${yieldAddress}`);
  console.log(`npx hardhat verify --network arbSepolia ${nftAddress} "https://api.infinite-relic.io/relic/"`);
  console.log(`npx hardhat verify --network arbSepolia ${vaultAddress} ${usdcAddress} ${nftAddress} ${yieldAddress} ${rwaAddress}`);
  console.log();

  console.log("✅ DEPLOYMENT COMPLETE!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
