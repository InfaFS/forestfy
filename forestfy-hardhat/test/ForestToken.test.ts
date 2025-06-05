import { expect } from "chai";
import { ethers } from "hardhat";
import { ForestToken } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { deployContract } from "./helpers";

describe("ForestToken", function () {
  let forestToken: ForestToken;
  let owner: HardhatEthersSigner;
  let addr1: HardhatEthersSigner;
  let addr2: HardhatEthersSigner;

  async function deployTokenFixture() {
    const [owner, addr1, addr2] = await ethers.getSigners();
    const forestToken = await deployContract<ForestToken>("ForestToken");
    return { forestToken, owner, addr1, addr2 };
  }

  beforeEach(async function () {
    const { forestToken: token, owner: o, addr1: a1, addr2: a2 } = await loadFixture(deployTokenFixture);
    forestToken = token;
    owner = o;
    addr1 = a1;
    addr2 = a2;
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await forestToken.owner()).to.equal(owner.address);
    });

    it("Should assign the total supply of tokens to the owner", async function () {
      const ownerBalance = await forestToken.balanceOf(owner.address);
      expect(await forestToken.totalSupply()).to.equal(ownerBalance);
    });
  });

  describe("Transactions", function () {
    it("Should transfer tokens between accounts", async function () {
      await forestToken.transfer(addr1.address, 50);
      const addr1Balance = await forestToken.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(50);

      await forestToken.connect(addr1).transfer(addr2.address, 50);
      const addr2Balance = await forestToken.balanceOf(addr2.address);
      expect(addr2Balance).to.equal(50);
    });

    it("Should fail if sender doesn't have enough tokens", async function () {
      const initialOwnerBalance = await forestToken.balanceOf(owner.address);
      await expect(
        forestToken.connect(addr1).transfer(owner.address, 1)
      ).to.be.revertedWithCustomError(forestToken, "ERC20InsufficientBalance");

      expect(await forestToken.balanceOf(owner.address)).to.equal(initialOwnerBalance);
    });

    it("Should update balances after transfers", async function () {
      const initialOwnerBalance = await forestToken.balanceOf(owner.address);

      await forestToken.transfer(addr1.address, 100);
      await forestToken.transfer(addr2.address, 50);

      const finalOwnerBalance = await forestToken.balanceOf(owner.address);
      expect(finalOwnerBalance).to.equal(initialOwnerBalance - 150n);

      const addr1Balance = await forestToken.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(100);

      const addr2Balance = await forestToken.balanceOf(addr2.address);
      expect(addr2Balance).to.equal(50);
    });
  });

  describe("Minting", function () {
    it("Should allow owner to mint tokens", async function () {
      await forestToken.mint(addr1.address, 100);
      expect(await forestToken.balanceOf(addr1.address)).to.equal(100);
    });

    it("Should not allow non-owner to mint tokens", async function () {
      await expect(
        forestToken.connect(addr1).mint(addr2.address, 100)
      ).to.be.revertedWithCustomError(forestToken, "OwnableUnauthorizedAccount");
    });
  });

  describe("Burning", function () {
    it("Should allow users to burn their own tokens", async function () {
      await forestToken.transfer(addr1.address, 100);
      await forestToken.connect(addr1).burn(50);
      expect(await forestToken.balanceOf(addr1.address)).to.equal(50);
    });

    it("Should fail if user tries to burn more tokens than they have", async function () {
      await forestToken.transfer(addr1.address, 100);
      await expect(
        forestToken.connect(addr1).burn(150)
      ).to.be.revertedWithCustomError(forestToken, "ERC20InsufficientBalance");
    });
  });
}); 