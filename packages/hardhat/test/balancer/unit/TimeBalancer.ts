import { expect } from "chai";
import { ethers } from "hardhat";
import { setupTimeBalancer } from "../../../utils/test/setup";

describe("TimeBalancer", function () {
  it("performs upkeep when interval elapses (monthly)", async function () {
    const { timeBalancer, tokens, priceAggregator } = await setupTimeBalancer(undefined, {
      percentages: [70n, 30n],
      intervalSeconds: 30 * 24 * 60 * 60,
    });

    // Initially too early
    const [neededBefore] = await timeBalancer.checkUpkeep("0x");
    expect(neededBefore).to.equal(false);

    // Simulate time elapse; set interval small for test
    await timeBalancer.setRebalanceInterval(1);
    await ethers.provider.send("evm_increaseTime", [2]);
    await ethers.provider.send("evm_mine", []);

    // Introduce slight stablecoin deviation to ensure event emission
    const usdc = await tokens.mockUSDC.getAddress();
    const usdt = await tokens.mockUSDT.getAddress();
    const ONE = ethers.parseUnits("1", 18);
    const usdtUsdc = ethers.parseUnits("0.995", 18);
    const usdcUsdt = (ONE * ONE) / usdtUsdc;
    await priceAggregator.setMockPrice(usdt, usdc, usdtUsdc);
    await priceAggregator.setMockPrice(usdc, usdt, usdcUsdt);

    const tx = await timeBalancer.triggerTimeRebalance();
    const receipt = await tx.wait();
    const event = receipt?.logs.find((l: any) => (l as any).eventName === "RebalanceNeeded");
    expect(event).to.not.equal(undefined);
  });
});
