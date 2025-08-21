/* NOTE: Replaced by unit tests. Keeping file to avoid breaking tags, but it's a no-op. */
import { DeployFunction } from "hardhat-deploy/types";

const noop: DeployFunction = async () => {
  // Intentionally empty
};

export default noop;
noop.tags = ["Balancer-disabled"];
