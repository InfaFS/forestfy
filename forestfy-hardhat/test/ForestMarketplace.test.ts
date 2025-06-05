import { expect } from "chai";
import { ethers } from "hardhat";
import { ForestMarketplace, ForestNFT, ForestToken } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("ForestMarketplace", function () {
  let marketplace: ForestMarketplace;
  let forestNFT: ForestNFT;
  let forestToken: ForestToken;
  let owner: SignerWithAddress;
  let seller: SignerWithAddress;
  let buyer: SignerWithAddress;
  let tokenId: bigint;
  const listingPrice = ethers.parseEther("1.0");

  beforeEach(async function () {
    [owner, seller, buyer] = await ethers.getSigners();

    // Desplegar ForestToken
    const ForestToken = await ethers.getContractFactory("ForestToken");
    forestToken = await ForestToken.deploy();
    await forestToken.waitForDeployment();

    // Desplegar ForestNFT
    const ForestNFT = await ethers.getContractFactory("ForestNFT");
    forestNFT = await ForestNFT.deploy();
    await forestNFT.waitForDeployment();

    // Desplegar Marketplace
    const Marketplace = await ethers.getContractFactory("ForestMarketplace");
    marketplace = await Marketplace.deploy(await forestNFT.getAddress(), await forestToken.getAddress());
    await marketplace.waitForDeployment();

    // Mint NFT para el seller
    const mintTx = await forestNFT.mint(seller.address);
    const receipt = await mintTx.wait();
    // Obtener el tokenId del evento Transfer
    const transferEvent = receipt?.logs.find(
      log => (log as any).fragment?.name === 'Transfer' && (log as any).args?.to === seller.address
    ) as any;
    tokenId = transferEvent?.args?.tokenId ?? 1n;

    // Aprobar al marketplace para transferir el NFT
    const approveTx = await forestNFT.connect(seller).approve(await marketplace.getAddress(), tokenId);
    await approveTx.wait();

    // Transferir tokens al buyer para que pueda comprar
    const transferAmount = ethers.parseEther("10.0");
    const transferTx = await forestToken.transfer(buyer.address, transferAmount);
    await transferTx.wait();

    // Aprobar al marketplace para gastar tokens
    const approveTokenTx = await forestToken.connect(buyer).approve(await marketplace.getAddress(), transferAmount);
    await approveTokenTx.wait();
  });

  describe("Listing", function () {
    it("Should allow owner to list NFT", async function () {
      const listTx = await marketplace.connect(seller).listNFT(tokenId, listingPrice);
      await listTx.wait();

      const listing = await marketplace.listings(tokenId);
      expect(listing.seller).to.equal(seller.address);
      expect(listing.price).to.equal(listingPrice);
      expect(listing.isActive).to.be.true;
    });

    it("Should not allow listing NFT that is not owned", async function () {
      await expect(
        marketplace.connect(buyer).listNFT(tokenId, listingPrice)
      ).to.be.revertedWith("Not the owner");
    });
  });

  describe("Buying", function () {
    beforeEach(async function () {
      const listTx = await marketplace.connect(seller).listNFT(tokenId, listingPrice);
      await listTx.wait();
    });

    it("Should allow buying listed NFT", async function () {
      const initialSellerBalance = await forestToken.balanceOf(seller.address);
      const initialBuyerBalance = await forestToken.balanceOf(buyer.address);
      const initialMarketplaceBalance = await forestToken.balanceOf(await marketplace.getAddress());

      const buyTx = await marketplace.connect(buyer).buyNFT(tokenId);
      await buyTx.wait();

      expect(await forestNFT.ownerOf(tokenId)).to.equal(buyer.address);
      const listing = await marketplace.listings(tokenId);
      expect(listing.isActive).to.be.false;

      // Verificar transferencia de tokens
      const finalSellerBalance = await forestToken.balanceOf(seller.address);
      const finalBuyerBalance = await forestToken.balanceOf(buyer.address);
      const finalMarketplaceBalance = await forestToken.balanceOf(await marketplace.getAddress());

      const fee = (listingPrice * 2n) / 100n; // 2% fee
      const sellerAmount = listingPrice - fee;

      expect(finalSellerBalance - initialSellerBalance).to.equal(sellerAmount);
      expect(initialBuyerBalance - finalBuyerBalance).to.equal(listingPrice);
      expect(finalMarketplaceBalance - initialMarketplaceBalance).to.equal(fee);
    });

    it("Should not allow buying with insufficient tokens", async function () {
      // Quemar tokens del buyer para que no tenga suficientes
      const burnAmount = await forestToken.balanceOf(buyer.address);
      await forestToken.connect(buyer).burn(burnAmount);

      await expect(
        marketplace.connect(buyer).buyNFT(tokenId)
      ).to.be.revertedWithCustomError(forestToken, "ERC20InsufficientBalance");
    });
  });

  describe("Unlisting", function () {
    beforeEach(async function () {
      const listTx = await marketplace.connect(seller).listNFT(tokenId, listingPrice);
      await listTx.wait();
    });

    it("Should allow seller to unlist NFT", async function () {
      const unlistTx = await marketplace.connect(seller).unlistNFT(tokenId);
      await unlistTx.wait();

      const listing = await marketplace.listings(tokenId);
      expect(listing.isActive).to.be.false;
    });

    it("Should not allow non-seller to unlist NFT", async function () {
      await expect(
        marketplace.connect(buyer).unlistNFT(tokenId)
      ).to.be.revertedWith("Not the seller");
    });
  });

  describe("Fee Management", function () {
    beforeEach(async function () {
      const listTx = await marketplace.connect(seller).listNFT(tokenId, listingPrice);
      await listTx.wait();
      const buyTx = await marketplace.connect(buyer).buyNFT(tokenId);
      await buyTx.wait();
    });

    it("Should allow owner to withdraw fees", async function () {
      const initialOwnerBalance = await forestToken.balanceOf(owner.address);
      const initialMarketplaceBalance = await forestToken.balanceOf(await marketplace.getAddress());

      const withdrawTx = await marketplace.withdrawFees();
      await withdrawTx.wait();

      const finalOwnerBalance = await forestToken.balanceOf(owner.address);
      const finalMarketplaceBalance = await forestToken.balanceOf(await marketplace.getAddress());

      expect(finalOwnerBalance - initialOwnerBalance).to.equal(initialMarketplaceBalance);
      expect(finalMarketplaceBalance).to.equal(0n);
    });

    it("Should not allow non-owner to withdraw fees", async function () {
      await expect(
        marketplace.connect(seller).withdrawFees()
      ).to.be.revertedWithCustomError(marketplace, "OwnableUnauthorizedAccount");
    });
  });
}); 