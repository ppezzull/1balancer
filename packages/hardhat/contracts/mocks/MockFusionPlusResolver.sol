// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "../ethereum-hub/interfaces/IFusionPlusHub.sol";
import "../ethereum-hub/libraries/TimelocksLib.sol";
import "../ethereum-hub/libraries/ImmutablesLib.sol";

/**
 * @title MockFusionPlusResolver
 * @notice Mock resolver for testing Fusion+ flows without live resolvers
 * @dev Simulates resolver behavior for local testing and integration tests
 */
contract MockFusionPlusResolver {
    using TimelocksLib for TimelocksLib.Timelocks;
    using ImmutablesLib for ImmutablesLib.Immutables;

    // Simulated order database
    mapping(bytes32 => SimulatedOrder) public orders;
    mapping(bytes32 => bool) public ordersFilled;
    mapping(address => mapping(address => bool)) public escrowPairs;

    struct SimulatedOrder {
        address maker;
        address srcToken;
        address dstToken;
        uint256 srcAmount;
        uint256 dstAmount;
        bytes32 secretHash;
        TimelocksLib.Timelocks timelocks;
        bool exists;
    }

    // Events for testing
    event OrderSimulated(bytes32 indexed orderHash, address maker);
    event EscrowsDeployed(address srcEscrow, address dstEscrow);
    event SwapCompleted(bytes32 indexed orderHash);
    event SwapCancelled(bytes32 indexed orderHash);

    IFusionPlusHub public immutable hub;
    address public immutable baseEscrowFactory;
    address public immutable dstChainSimulator;

    constructor(
        address _hub,
        address _baseEscrowFactory,
        address _dstChainSimulator
    ) {
        hub = IFusionPlusHub(_hub);
        baseEscrowFactory = _baseEscrowFactory;
        dstChainSimulator = _dstChainSimulator;
    }

    /**
     * @notice Simulate placing an order for testing
     */
    function simulateOrder(
        address maker,
        address srcToken,
        address dstToken,
        uint256 srcAmount,
        uint256 dstAmount,
        bytes32 secretHash,
        TimelocksLib.Timelocks calldata timelocks
    ) external returns (bytes32 orderHash) {
        orderHash = keccak256(abi.encode(
            maker,
            srcToken,
            dstToken,
            srcAmount,
            dstAmount,
            secretHash,
            timelocks
        ));

        orders[orderHash] = SimulatedOrder({
            maker: maker,
            srcToken: srcToken,
            dstToken: dstToken,
            srcAmount: srcAmount,
            dstAmount: dstAmount,
            secretHash: secretHash,
            timelocks: timelocks,
            exists: true
        });

        emit OrderSimulated(orderHash, maker);
    }

    /**
     * @notice Simulate the full atomic swap flow
     */
    function simulateAtomicSwap(bytes32 orderHash) external {
        SimulatedOrder memory order = orders[orderHash];
        require(order.exists, "Order does not exist");
        require(!ordersFilled[orderHash], "Order already filled");

        // 1. Deploy source escrow
        bytes32 salt = keccak256(abi.encode(orderHash, "src"));
        ImmutablesLib.Immutables memory srcImmutables = ImmutablesLib.Immutables({
            maker: order.maker,
            taker: address(this),
            token: order.srcToken,
            amount: order.srcAmount,
            safetyDeposit: order.srcAmount / 100, // 1% safety deposit
            hashlockHash: order.secretHash,
            timelocks: order.timelocks,
            orderHash: orderHash,
            chainId: block.chainid
        });

        address srcEscrow = _deployEscrow(salt, ImmutablesLib.encode(srcImmutables));

        // 2. Simulate destination chain escrow deployment
        // In real scenario, this would be on another chain
        bytes32 dstSalt = keccak256(abi.encode(orderHash, "dst"));
        address dstEscrow = _computeEscrowAddress(dstSalt);

        // 3. Record escrow pair
        escrowPairs[srcEscrow][dstEscrow] = true;

        // 4. Mark order as filled
        ordersFilled[orderHash] = true;

        emit EscrowsDeployed(srcEscrow, dstEscrow);
    }

    /**
     * @notice Simulate revealing the secret and completing the swap
     */
    function simulateRevealSecret(
        bytes32 orderHash,
        bytes32 secret
    ) external {
        SimulatedOrder memory order = orders[orderHash];
        require(order.exists, "Order does not exist");
        require(ordersFilled[orderHash], "Order not filled");
        require(keccak256(abi.encode(secret)) == order.secretHash, "Invalid secret");

        emit SwapCompleted(orderHash);
    }

    /**
     * @notice Simulate cancelling an order
     */
    function simulateCancelOrder(bytes32 orderHash) external {
        SimulatedOrder memory order = orders[orderHash];
        require(order.exists, "Order does not exist");
        require(block.timestamp > order.timelocks.srcCancellation, "Cannot cancel yet");

        ordersFilled[orderHash] = false;
        emit SwapCancelled(orderHash);
    }

    /**
     * @notice Get simulated order details
     */
    function getOrder(bytes32 orderHash) external view returns (
        address maker,
        address srcToken,
        address dstToken,
        uint256 srcAmount,
        uint256 dstAmount,
        bytes32 secretHash,
        TimelocksLib.Timelocks memory timelocks,
        bool filled
    ) {
        SimulatedOrder memory order = orders[orderHash];
        require(order.exists, "Order does not exist");

        return (
            order.maker,
            order.srcToken,
            order.dstToken,
            order.srcAmount,
            order.dstAmount,
            order.secretHash,
            order.timelocks,
            ordersFilled[orderHash]
        );
    }

    /**
     * @notice Check if escrows are paired
     */
    function areEscrowsPaired(
        address srcEscrow,
        address dstEscrow
    ) external view returns (bool) {
        return escrowPairs[srcEscrow][dstEscrow];
    }

    /**
     * @notice Deploy escrow using factory
     */
    function _deployEscrow(
        bytes32 salt,
        bytes memory immutables
    ) private returns (address) {
        (bool success, bytes memory data) = baseEscrowFactory.call(
            abi.encodeWithSignature("deploySrc(bytes32,bytes)", salt, immutables)
        );
        require(success, "Escrow deployment failed");
        return abi.decode(data, (address));
    }

    /**
     * @notice Compute escrow address for CREATE2
     */
    function _computeEscrowAddress(bytes32 salt) private view returns (address) {
        // Simplified computation for testing
        return address(uint160(uint256(keccak256(abi.encode(salt, block.timestamp)))));
    }

    /**
     * @notice Batch operation simulation for testing
     */
    function simulateBatch(
        bytes32[] calldata orderHashes,
        bool[] calldata shouldFill
    ) external {
        require(orderHashes.length == shouldFill.length, "Length mismatch");

        for (uint256 i = 0; i < orderHashes.length; i++) {
            if (shouldFill[i]) {
                this.simulateAtomicSwap(orderHashes[i]);
            }
        }
    }

    /**
     * @notice Simulate time-based scenarios
     */
    function simulateTimeTravel(uint256 timestamp) external {
        // This would be used with Hardhat's time manipulation
        // to test timeout scenarios
    }

    /**
     * @notice Get all active orders for testing
     */
    function getActiveOrderCount() external view returns (uint256 count) {
        // Simplified for testing - in production would maintain proper list
        return 0;
    }
}