import { ethers } from "hardhat";
import { ContractFactory } from "ethers";

export async function deployContract<T>(name: string, ...args: any[]): Promise<T> {
  const Contract = await ethers.getContractFactory(name);
  const contract = await Contract.deploy(...args);
  await contract.waitForDeployment();
  return contract as unknown as T;
}

export async function timeTravel(seconds: number): Promise<void> {
  await ethers.provider.send("evm_increaseTime", [seconds]);
  await ethers.provider.send("evm_mine", []);
}

export async function getLatestBlockTimestamp(): Promise<number> {
  const block = await ethers.provider.getBlock("latest");
  return block?.timestamp || 0;
}

export async function setNextBlockTimestamp(timestamp: number): Promise<void> {
  await ethers.provider.send("evm_setNextBlockTimestamp", [timestamp]);
  await ethers.provider.send("evm_mine", []);
} 