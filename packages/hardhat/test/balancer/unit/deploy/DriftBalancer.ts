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
    const { driftBalancer, dia, priceAggregator, factory } = await setupDriftBalancerMixed();

    // Debug: print wiring before deviation
    const stables: string[] = await driftBalancer.getStablecoins();
    console.log("dbg/drift: balancer.stables=", stables);
    console.log(
      "dbg/drift: factory.priceFeed=",
      await factory.priceFeed(),
      "adapter=",
      await priceAggregator.getAddress(),
    );
    for (const s of stables) {
      console.log("dbg/drift: adapter.key[", s, "]=", await priceAggregator.tokenToUsdKey(s));
    }

    // Push deviation into DIA
    await forceStableDeviation(dia, "0.990");
    console.log("dbg/drift: DIA USDT/USD=", await dia.updates("USDT/USD"));
    console.log("dbg/drift: DIA USDC/USD=", await dia.updates("USDC/USD"));
    console.log("dbg/drift: DIA DAI/USD=", await dia.updates("DAI/USD"));

    // Probe adapter cross-rate calls directly for first two stables if present
    if (stables.length >= 2) {
      try {
        const rate = await priceAggregator.getRate(stables[1], stables[0], false);
        console.log("dbg/drift: adapter.getRate(stable[1]->stable[0])=", rate.toString());
      } catch (e) {
        console.log("dbg/drift: adapter.getRate threw:", e);
      }
    }

    // Target call under test
    const [needed] = await driftBalancer.checkUpkeep("0x");
    expect(needed).to.equal(true);
  });

  it("allows owner to update base metadata (name/description)", async function () {
    const { driftBalancer } = await setupDriftBalancerMixed();
    await expect(driftBalancer.updateMetadata("Drift Name", "Desc")).to.not.be.reverted;
    expect(await driftBalancer.name()).to.equal("Drift Name");
  });
});
