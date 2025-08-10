import { expect } from "chai";
// import { ethers } from "hardhat";
import { setupDriftBalancerMixed } from "../../../../utils/test/setup";
import { forceStableDeviation } from "../../../../utils/test/baseBalancer";

describe("DriftBalancer", function () {
  it("deploys and is owned by deployer", async function () {
    const { driftBalancer, deployer } = await setupDriftBalancerMixed();
    expect(await driftBalancer.owner()).to.equal(await deployer.getAddress());
  });

  it("signals upkeep needed after deviation (automation path)", async function () {
    const { driftBalancer, dia } = await setupDriftBalancerMixed();
    await forceStableDeviation(dia, "0.990");
    const [needed] = await driftBalancer.checkUpkeep("0x");
    expect(needed).to.equal(true);
  });

  it("allows owner to update base metadata (name/description)", async function () {
    const { driftBalancer } = await setupDriftBalancerMixed();
    await expect(driftBalancer.updateMetadata("Drift Name", "Desc")).to.not.be.reverted;
    expect(await driftBalancer.name()).to.equal("Drift Name");
  });
});
