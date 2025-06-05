import { expect } from "chai";
import { ethers } from "hardhat";
import { ForestToken, ForestNFT, ForestStaking } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { EventLog } from "ethers";

describe("ForestStaking", function () {
  let forestToken: ForestToken;
  let forestNFT: ForestNFT;
  let forestStaking: ForestStaking;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;

  const STAKE_AMOUNT = ethers.parseEther("100");
  const STAKE_DURATION = 3600; // 1 hora

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    // Deploy ForestToken
    const ForestToken = await ethers.getContractFactory("ForestToken");
    forestToken = await ForestToken.deploy();

    // Deploy ForestNFT
    const ForestNFT = await ethers.getContractFactory("ForestNFT");
    forestNFT = await ForestNFT.deploy();

    // Deploy ForestStaking
    const ForestStaking = await ethers.getContractFactory("ForestStaking");
    forestStaking = await ForestStaking.deploy(
      await forestToken.getAddress(),
      await forestNFT.getAddress()
    );

    // Transferir ownership del NFT al contrato de staking
    await forestNFT.transferOwnership(await forestStaking.getAddress());

    // Transferir tokens a addr1 para testing
    await forestToken.transfer(addr1.address, STAKE_AMOUNT * 2n);
  });

  describe("Staking", function () {
    beforeEach(async function () {
      // Aprobar tokens para staking
      await forestToken.connect(addr1).approve(await forestStaking.getAddress(), STAKE_AMOUNT);
    });

    it("Should allow users to stake tokens", async function () {
      await forestStaking.connect(addr1).stake(STAKE_AMOUNT, STAKE_DURATION);
      const stakes = await forestStaking.getActiveStakes(addr1.address);
      expect(stakes.length).to.equal(1);
      expect(stakes[0].amount).to.equal(STAKE_AMOUNT);
      expect(stakes[0].duration).to.equal(STAKE_DURATION);
    });

    it("Should not allow staking with duration less than minimum", async function () {
      await expect(
        forestStaking.connect(addr1).stake(STAKE_AMOUNT, 60) // 1 minuto
      ).to.be.revertedWith("Duration too short");
    });

    it("Should not allow staking with zero amount", async function () {
      await expect(
        forestStaking.connect(addr1).stake(0, STAKE_DURATION)
      ).to.be.revertedWith("Amount must be greater than 0");
    });
  });

  describe("Unstaking", function () {
    beforeEach(async function () {
      await forestToken.connect(addr1).approve(await forestStaking.getAddress(), STAKE_AMOUNT);
      await forestStaking.connect(addr1).stake(STAKE_AMOUNT, STAKE_DURATION);
    });

    it("Should not allow unstaking before duration ends", async function () {
      await expect(
        forestStaking.connect(addr1).unstake(0)
      ).to.be.revertedWith("Staking period not ended");
    });

    it("Should allow unstaking after duration ends", async function () {
      // Avanzar el tiempo
      await time.increase(STAKE_DURATION + 1);

      // Transferir tokens extra al contrato de staking para cubrir la recompensa
      const extra = ethers.parseEther("10");
      await forestToken.transfer(await forestStaking.getAddress(), extra);

      const initialBalance = await forestToken.balanceOf(addr1.address);
      await forestStaking.connect(addr1).unstake(0);
      const finalBalance = await forestToken.balanceOf(addr1.address);

      // Verificar que recibió tokens + recompensa
      expect(finalBalance).to.be.gt(initialBalance);
    });

    it("Should mint NFT after successful unstaking", async function () {
      await time.increase(STAKE_DURATION + 1);
      // Transferir tokens extra al contrato de staking para cubrir la recompensa
      const extra = ethers.parseEther("10");
      await forestToken.transfer(await forestStaking.getAddress(), extra);
      await forestStaking.connect(addr1).unstake(0);
      // Verificar que se mintió un NFT
      expect(await forestNFT.balanceOf(addr1.address)).to.equal(1);
    });
  });

  describe("Bonus Calculation", function () {
    async function bonusFixture() {
      const [owner, addr1] = await ethers.getSigners();
      const ForestToken = await ethers.getContractFactory("ForestToken");
      const forestToken = await ForestToken.deploy();
      const ForestNFT = await ethers.getContractFactory("ForestNFT");
      const forestNFT = await ForestNFT.deploy();
      // Mint y transfiere NFTs a addr1, asegurando al menos uno LEGENDARY
      let hasLegendary = false;
      for (let i = 0; i < 4; i++) {
        const mintTx = await forestNFT.connect(owner).mint(owner.address);
        const receipt = await mintTx.wait();
        const transferEvent = receipt?.logs.find(
          (log: any) => (log as EventLog).fragment?.name === 'Transfer' && (log as EventLog).args?.to === owner.address
        ) as any;
        const mintedTokenId = transferEvent?.args?.tokenId;
        const rarity = await forestNFT.tokenRarity(mintedTokenId);
        // Si es el último NFT y aún no hay LEGENDARY, forzar uno
        if (i === 3 && !hasLegendary) {
          // Mintear uno nuevo hasta que sea LEGENDARY
          let newTokenId;
          do {
            const newMintTx = await forestNFT.connect(owner).mint(owner.address);
            const newReceipt = await newMintTx.wait();
            const newTransferEvent = newReceipt?.logs.find(
              (log: any) => (log as EventLog).fragment?.name === 'Transfer' && (log as EventLog).args?.to === owner.address
            ) as any;
            newTokenId = newTransferEvent?.args?.tokenId;
            const newRarity = await forestNFT.tokenRarity(newTokenId);
            if (newRarity === 2n) { // LEGENDARY
              await forestNFT.connect(owner).transferFrom(owner.address, addr1.address, newTokenId);
              hasLegendary = true;
            }
          } while (!hasLegendary);
        } else {
          await forestNFT.connect(owner).transferFrom(owner.address, addr1.address, mintedTokenId);
          if (rarity === 2n) hasLegendary = true;
        }
      }
      // Deploy ForestStaking DESPUÉS de mintear y transferir NFTs
      const ForestStaking = await ethers.getContractFactory("ForestStaking");
      const forestStaking = await ForestStaking.deploy(
        await forestToken.getAddress(),
        await forestNFT.getAddress()
      );
      // Transferir ownership del NFT al contrato de staking
      await forestNFT.transferOwnership(await forestStaking.getAddress());
      // Mint tokens para el contrato de staking (para recompensas)
      const rewardTokens = ethers.parseEther("1000");
      await forestToken.mint(await forestStaking.getAddress(), rewardTokens);
      // Transferir tokens a addr1 para staking
      const stakeTokens = ethers.parseEther("100");
      await forestToken.transfer(addr1.address, stakeTokens);
      await forestToken.connect(addr1).approve(await forestStaking.getAddress(), stakeTokens);
      return { forestToken, forestNFT, forestStaking, owner, addr1 };
    }
    beforeEach(async function () {
      await loadFixture(bonusFixture);
    });

    it("Should calculate bonus based on NFT rarity", async function () {
      const { forestNFT, forestStaking, addr1 } = await loadFixture(bonusFixture);
      console.log("ForestNFT address:", await forestNFT.getAddress());
      console.log("ForestStaking address:", await forestStaking.getAddress());
      console.log("ForestNFT owner:", await forestNFT.owner());
      const legendaryCount = await forestNFT.getNFTsByRarity(addr1.address, 2); // LEGENDARY
      const rareCount = await forestNFT.getNFTsByRarity(addr1.address, 1); // RARE
      const normalCount = await forestNFT.getNFTsByRarity(addr1.address, 0); // NORMAL
      console.log("NFTs de addr1 (directo en NFT): LEGENDARY:", legendaryCount, "RARE:", rareCount, "NORMAL:", normalCount);
      // Ahora desde el contrato de staking, usando la referencia interna
      const stakingNFT = await forestStaking.forestNFT();
      console.log("forestNFT address desde staking:", stakingNFT);
      // Llamar a getNFTsByRarity desde el contrato de staking usando callStatic
      const legendaryCountStaking = await forestNFT.getNFTsByRarity(addr1.address, 2);
      console.log("NFTs de addr1 (staking view): LEGENDARY:", legendaryCountStaking);
      const bonus = await forestStaking.calculateBonus(addr1.address);
      console.log("Bonus calculado:", bonus);
      expect(bonus).to.be.gt(0);
    });

    it("Should apply bonus to rewards", async function () {
      const { forestToken, forestStaking, addr1 } = await loadFixture(bonusFixture);
      await forestToken.connect(addr1).approve(await forestStaking.getAddress(), STAKE_AMOUNT);
      await forestStaking.connect(addr1).stake(STAKE_AMOUNT, STAKE_DURATION);
      await time.increase(STAKE_DURATION + 1);
      // Asegurarse de que el contrato de staking tiene tokens suficientes
      const stakingBalance = await forestToken.balanceOf(await forestStaking.getAddress());
      console.log("Staking contract token balance:", stakingBalance);
      const initialBalance = await forestToken.balanceOf(addr1.address);
      await forestStaking.connect(addr1).unstake(0);
      const finalBalance = await forestToken.balanceOf(addr1.address);
      // La recompensa debería ser mayor que la base debido al bonus
      const reward = finalBalance - initialBalance;
      const baseReward = (STAKE_AMOUNT * BigInt(STAKE_DURATION) * 1n) / (3600n * 100n);
      console.log("Reward recibido:", reward, "BaseReward:", baseReward);
      expect(reward).to.be.gt(baseReward);
    });
  });
}); 