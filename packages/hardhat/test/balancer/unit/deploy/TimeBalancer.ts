import { expect } from "chai";
import { ethers } from "hardhat";
import { setupTimeBalancer } from "../../../../utils/test/setup";
import { fastForward, forceStableDeviation, setForwarder } from "../../../../utils/test/baseBalancer";

describe("TimeBalancer", function () {
  it("deploys and is owned by deployer", async function () {
    const { timeBalancer, deployer } = await setupTimeBalancer();
    expect(await timeBalancer.owner()).to.equal(await deployer.getAddress());
  });

  it("owner-only: setRebalanceInterval and updateTimeMetadata; forwarder gating performUpkeep", async function () {
    const { timeBalancer, dia } = await setupTimeBalancer();
    const [owner, other] = await ethers.getSigners();

    await expect(timeBalancer.connect(other).setRebalanceInterval(10)).to.be.revertedWithCustomError(
      timeBalancer as any,
      "OwnableUnauthorizedAccount",
    );
    await expect(timeBalancer.setRebalanceInterval(10)).to.emit(timeBalancer, "IntervalUpdated");

    await expect(timeBalancer.connect(other).updateTimeMetadata("N", "D")).to.be.revertedWithCustomError(
      timeBalancer as any,
      "OwnableUnauthorizedAccount",
    );
    await expect(timeBalancer.updateTimeMetadata("N", "D")).to.not.be.reverted;

    // performUpkeep only by forwarder
    await timeBalancer.setRebalanceInterval(1);
    await fastForward(2);
    await forceStableDeviation(dia, "0.995");
    const [needed, data] = await timeBalancer.checkUpkeep("0x");
    if (needed) {
      await expect(timeBalancer.connect(other).performUpkeep(data)).to.be.revertedWith("Not authorized forwarder");
      await setForwarder(timeBalancer, await owner.getAddress());
      await expect(timeBalancer.connect(owner).performUpkeep(data)).to.emit(timeBalancer, "RebalanceNeeded");
    }
  });

  it("allows owner to update base metadata (name/description)", async function () {
    const { timeBalancer } = await setupTimeBalancer();
    await expect(timeBalancer.updateMetadata("Time Name", "Desc")).to.not.be.reverted;
    expect(await timeBalancer.name()).to.equal("Time Name");
  });
});

it("performs upkeep when interval elapses (monthly)", async function () {
  const { timeBalancer, dia } = await setupTimeBalancer(undefined, {
    percentages: [70n, 30n],
    intervalSeconds: 30 * 24 * 60 * 60,
  });

  // Initially too early
  const [neededBefore] = await timeBalancer.checkUpkeep("0x");
  expect(neededBefore).to.equal(false);

  // Simulate time elapse; set interval small for test
  await timeBalancer.setRebalanceInterval(1);
  await fastForward(2);

  // Force deviation and use upkeep path
  await forceStableDeviation(dia, "0.995");
  const [needed, data] = await timeBalancer.checkUpkeep("0x");
  expect(needed).to.equal(true);
  // Authorize forwarder as owner to allow performUpkeep
  const owner = await ethers.getSigner(await timeBalancer.owner());
  await setForwarder(timeBalancer, await owner.getAddress());
  await expect(timeBalancer.performUpkeep(data)).to.emit(timeBalancer, "RebalanceNeeded");
});
