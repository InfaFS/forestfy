import { expect } from "chai";
import { ethers } from "hardhat";
import { ForestNFT } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { EventLog } from "ethers";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("ForestNFT", function () {
  async function deployNFTFixture() {
    const [owner, addr1, addr2] = await ethers.getSigners();
    const ForestNFT = await ethers.getContractFactory("ForestNFT");
    const forestNFT = await ForestNFT.deploy();
    await forestNFT.waitForDeployment();
    return { forestNFT, owner, addr1, addr2 };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { forestNFT, owner } = await loadFixture(deployNFTFixture);
      expect(await forestNFT.owner()).to.equal(owner.address);
    });

    it("Should have correct name and symbol", async function () {
      const { forestNFT } = await loadFixture(deployNFTFixture);
      expect(await forestNFT.name()).to.equal("Forest Tree");
      expect(await forestNFT.symbol()).to.equal("FTREE");
    });
  });

  describe("Minting", function () {
    let localTokenId: bigint;
    let forestNFT: ForestNFT;
    let owner: SignerWithAddress;
    let addr1: SignerWithAddress;
    let addr2: SignerWithAddress;
    beforeEach(async function () {
      ({ forestNFT, owner, addr1, addr2 } = await loadFixture(deployNFTFixture));
      if (this.currentTest?.title !== "Should update user NFT count by rarity") {
        const mintTx = await forestNFT.connect(owner).mint(addr1.address);
        const receipt = await mintTx.wait();
        const transferEvent = receipt?.logs.find(
          (log: any) => (log as EventLog).fragment?.name === 'Transfer' && (log as EventLog).args?.to === addr1.address
        ) as EventLog | undefined;
        localTokenId = transferEvent?.args?.tokenId ?? 1n;
      }
    });

    it("Should allow owner to mint NFT", async function () {
      const mintTx = await forestNFT.mint(addr2.address);
      const receipt = await mintTx.wait();
      const transferEvent = receipt?.logs.find(
        log => (log as EventLog).fragment?.name === 'Transfer' && (log as EventLog).args?.to === addr2.address
      ) as EventLog | undefined;
      const newTokenId = transferEvent?.args?.tokenId ?? 2n;
      expect(await forestNFT.ownerOf(newTokenId)).to.equal(addr2.address);
    });

    it("Should not allow non-owner to mint NFT", async function () {
      await expect(
        forestNFT.connect(addr1).mint(addr2.address)
      ).to.be.revertedWithCustomError(forestNFT, "OwnableUnauthorizedAccount");
    });

    it("Should assign correct rarity to minted NFT", async function () {
      const rarity = await forestNFT.tokenRarity(localTokenId);
      expect(rarity).to.be.oneOf([0n, 1n, 2n]); // NORMAL, RARE, LEGENDARY
    });

    it("Should update user NFT count by rarity", async function () {
      // No usar ningún fixture ni beforeEach global
      const [owner, addr1] = await ethers.getSigners();
      const ForestNFT = await ethers.getContractFactory("ForestNFT");
      const forestNFT = await ForestNFT.deploy();
      await forestNFT.waitForDeployment();

      // Mintear SOLO UN NFT para addr1
      const mintTx = await forestNFT.mint(addr1.address);
      const receipt = await mintTx.wait();
      const transferEvent = receipt?.logs.find(
        (log: any) => (log as EventLog).fragment?.name === 'Transfer' && (log as EventLog).args?.to === addr1.address
      ) as EventLog | undefined;
      const localTokenId = transferEvent?.args?.tokenId ?? 1n;

      const rarity = await forestNFT.tokenRarity(localTokenId);
      const count = await forestNFT.getNFTsByRarity(addr1.address, rarity);
      expect(count).to.equal(1n);
    });
  });

  describe("Transfers", function () {
    let localTokenId: bigint;
    let forestNFT: ForestNFT;
    let owner: SignerWithAddress;
    let addr1: SignerWithAddress;
    let addr2: SignerWithAddress;
    beforeEach(async function () {
      ({ forestNFT, owner, addr1, addr2 } = await loadFixture(deployNFTFixture));
      // Mintear solo un NFT para este test
      const mintTx = await forestNFT.mint(addr1.address);
      const receipt = await mintTx.wait();
      const transferEvent = receipt?.logs.find(
        (log: any) => (log as EventLog).fragment?.name === 'Transfer' && (log as EventLog).args?.to === addr1.address
      ) as EventLog | undefined;
      localTokenId = transferEvent?.args?.tokenId ?? 1n;
      // Aprobar a addr2 para transferir el NFT
      await forestNFT.connect(addr1).approve(addr2.address, localTokenId);
    });
    it("Should allow owner to transfer NFT", async function () {
      await forestNFT.connect(addr1).transferFrom(addr1.address, addr2.address, localTokenId);
      expect(await forestNFT.ownerOf(localTokenId)).to.equal(addr2.address);
    });
    it("Should update NFT counts after transfer", async function () {
      const rarity = await forestNFT.tokenRarity(localTokenId);
      const initialCount1 = await forestNFT.getNFTsByRarity(addr1.address, rarity);
      const initialCount2 = await forestNFT.getNFTsByRarity(addr2.address, rarity);
      await forestNFT.connect(addr1).transferFrom(addr1.address, addr2.address, localTokenId);
      const finalCount1 = await forestNFT.getNFTsByRarity(addr1.address, rarity);
      const finalCount2 = await forestNFT.getNFTsByRarity(addr2.address, rarity);
      expect(finalCount1).to.equal(initialCount1 - 1n);
      expect(finalCount2).to.equal(initialCount2 + 1n);
    });
    it("Should not allow non-owner to transfer NFT", async function () {
      // Nos aseguramos de que addr2 no tenga aprobación y el NFT no esté aprobado para nadie
      await forestNFT.connect(addr1).approve(ethers.ZeroAddress, localTokenId);
      await forestNFT.connect(addr1).setApprovalForAll(addr2.address, false);
      await expect(
        forestNFT.connect(addr2).transferFrom(addr1.address, addr2.address, localTokenId)
      ).to.be.revertedWithCustomError(forestNFT, "ERC721InsufficientApproval");
    });
  });

  describe("Rarity Distribution", function () {
    it("Should maintain rarity distribution over multiple mints", async function () {
      const { forestNFT, addr1 } = await loadFixture(deployNFTFixture);
      const numMints = 100;
      let normalCount = 0n;
      let rareCount = 0n;
      let legendaryCount = 0n;

      for (let i = 0; i < numMints; i++) {
        const mintTx = await forestNFT.mint(addr1.address);
        const receipt = await mintTx.wait();
        const transferEvent = receipt?.logs.find(
          (log: any) => (log as EventLog).fragment?.name === 'Transfer' && (log as EventLog).args?.to === addr1.address
        ) as EventLog | undefined;
        const newTokenId = transferEvent?.args?.tokenId ?? BigInt(i + 2);
        
        const rarity = await forestNFT.tokenRarity(newTokenId);
        if (rarity === 0n) normalCount++;
        else if (rarity === 1n) rareCount++;
        else legendaryCount++;
      }

      // Verificar que la distribución está dentro de un rango razonable
      expect(normalCount).to.be.greaterThan(60n); // >60% normal
      expect(rareCount).to.be.greaterThanOrEqual(15n); // >=15% rare
      expect(legendaryCount).to.be.greaterThanOrEqual(2n); // >=2% legendary
    });
  });
}); 