import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Desplegando contratos con la cuenta:", deployer.address);

  // Desplegar ForestToken
  const ForestToken = await ethers.getContractFactory("ForestToken");
  const forestToken = await ForestToken.deploy();
  await forestToken.waitForDeployment();
  console.log("ForestToken desplegado en:", await forestToken.getAddress());

  // Desplegar ForestNFT
  const ForestNFT = await ethers.getContractFactory("ForestNFT");
  const forestNFT = await ForestNFT.deploy();
  await forestNFT.waitForDeployment();
  console.log("ForestNFT desplegado en:", await forestNFT.getAddress());

  // Desplegar ForestStaking
  const ForestStaking = await ethers.getContractFactory("ForestStaking");
  const forestStaking = await ForestStaking.deploy(
    await forestToken.getAddress(),
    await forestNFT.getAddress()
  );
  await forestStaking.waitForDeployment();
  console.log("ForestStaking desplegado en:", await forestStaking.getAddress());

  // Transferir ownership del NFT al contrato de staking
  await forestNFT.transferOwnership(await forestStaking.getAddress());
  console.log("Ownership de ForestNFT transferido a ForestStaking");

  // Desplegar ForestMarketplace
  const ForestMarketplace = await ethers.getContractFactory("ForestMarketplace");
  const forestMarketplace = await ForestMarketplace.deploy(
    await forestNFT.getAddress(),
    await forestToken.getAddress()
  );
  await forestMarketplace.waitForDeployment();
  console.log("ForestMarketplace desplegado en:", await forestMarketplace.getAddress());

  // Mint tokens iniciales para el contrato de staking
  const rewardTokens = ethers.parseEther("1000000"); // 1M tokens para recompensas
  await forestToken.mint(await forestStaking.getAddress(), rewardTokens);
  console.log("Tokens de recompensa minted al contrato de staking");

  console.log("\nResumen de direcciones:");
  console.log("ForestToken:", await forestToken.getAddress());
  console.log("ForestNFT:", await forestNFT.getAddress());
  console.log("ForestStaking:", await forestStaking.getAddress());
  console.log("ForestMarketplace:", await forestMarketplace.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 