import { task } from "hardhat/config";

task("debug-deploy", "Debug deployment issue")
  .setAction(async (_, hre) => {
    console.log("🔍 Debug task running...");
    
    const { ethers } = hre;
    const [deployer] = await ethers.getSigners();
    
    console.log("Deployer:", await deployer.getAddress());
    console.log("Network:", await ethers.provider.getNetwork());
    
    console.log("Task completed!");
  });

export {};
