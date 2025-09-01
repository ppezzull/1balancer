// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "../interfaces/IERC1271.sol";

/**
 * @title Balancer
 * @notice Minimal portfolio balancer that relies on off-chain computation.
 * Off-chain service computes target allocation changes and crafts a Proposal
 * that is EIP-712 signed by the owner (or an authorized signer). The proposal
 * can adjust target percentages and move assets in/out (deposit/withdraw).
 * No on-chain price feeds, automation, or oracle integrations are present.
 */
contract Balancer is Ownable, IERC1271 {
    using SafeERC20 for IERC20;

    // ===== Data Structures =====
    struct OrderDelta { // describes a single asset adjustment
        address token;              // asset address
        int256 percentageDelta;     // relative change (bps, signed) applied to previous target
        uint256 newPercentage;      // absolute target percentage override (bps, 0 = ignore)
        uint256 amount;             // amount of tokens to transfer
        bool isDeposit;             // true -> pull from signer, false -> send to owner
    }

    // Primary type hashes (computed from canonical EIP-712 type strings)
    // OrderDelta: keccak256("OrderDelta(address token,int256 percentageDelta,uint256 newPercentage,uint256 amount,bool isDeposit)")
    bytes32 private constant ORDER_DELTA_TYPEHASH = keccak256("OrderDelta(address token,int256 percentageDelta,uint256 newPercentage,uint256 amount,bool isDeposit)");
    // Proposal depends on OrderDelta so full encoded type is:
    // Proposal(uint256 nonce,uint256 deadline,OrderDelta[] deltas)OrderDelta(address token,int256 percentageDelta,uint256 newPercentage,uint256 amount,bool isDeposit)
    bytes32 private constant PROPOSAL_TYPEHASH = keccak256("Proposal(uint256 nonce,uint256 deadline,OrderDelta[] deltas)OrderDelta(address token,int256 percentageDelta,uint256 newPercentage,uint256 amount,bool isDeposit)");

    // Domain separator components
    bytes32 private constant EIP712_DOMAIN_TYPEHASH = keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)");
    bytes32 private constant NAME_HASH = keccak256(bytes("Balancer"));
    bytes32 private constant VERSION_HASH = keccak256(bytes("1"));
    bytes32 private immutable _DOMAIN_SEPARATOR;
    uint256 private immutable _CACHED_CHAIN_ID;

    // ===== Storage =====
    address[] public assets;               // list of tracked tokens
    mapping(address => uint256) public targetPercentageBps; // target allocation per token (basis points, total SHOULD sum to 10_000)
    mapping(address => bool) public isAsset; // quick lookup
    uint256 public lastRebalanceTimestamp;  // last successful execution
    uint256 public nonce;                   // monotonically increasing signed proposal nonce
    address public authorizedSigner;        // optional delegate signer

    // ===== Events =====
    event AssetsInitialized(address[] assets, uint256[] targetPercBps, uint256[] deposits);
    event ProposalExecuted(uint256 indexed nonce, address executor, OrderDelta[] deltas);
    event SignerUpdated(address newSigner);

    // ===== Errors =====
    error ArrayLengthMismatch();
    error InvalidAsset();
    error Expired();
    error BadSignature();
    error ZeroAddress();

    constructor(
        address _owner,
        address[] memory _assets,
        uint256[] memory _targetPercentageBps,
        uint256[] memory _initialDepositAmounts
    ) Ownable(_owner) {
        if (_assets.length != _targetPercentageBps.length || _assets.length != _initialDepositAmounts.length) {
            revert ArrayLengthMismatch();
        }
        uint256 total;
        for (uint256 i; i < _assets.length; i++) {
            address token = _assets[i];
            if (token == address(0)) revert ZeroAddress();
            assets.push(token);
            isAsset[token] = true;
            targetPercentageBps[token] = _targetPercentageBps[i];
            total += _targetPercentageBps[i];
            if (_initialDepositAmounts[i] > 0) {
                IERC20(token).safeTransferFrom(_owner, address(this), _initialDepositAmounts[i]);
            }
        }
        // soft requirement: total == 10_000 (100%). Not enforced strictly to retain flexibility.
        lastRebalanceTimestamp = block.timestamp;
    authorizedSigner = _owner;

        _CACHED_CHAIN_ID = block.chainid;
        _DOMAIN_SEPARATOR = keccak256(abi.encode(
            EIP712_DOMAIN_TYPEHASH,
            NAME_HASH,
            VERSION_HASH,
            block.chainid,
            address(this)
        ));

    emit AssetsInitialized(_assets, _targetPercentageBps, _initialDepositAmounts);
    }

    // ===== View helpers =====
    function domainSeparator() public view returns (bytes32) {
        if (block.chainid == _CACHED_CHAIN_ID) {
            return _DOMAIN_SEPARATOR;
        }
        // In the (unlikely) event of a fork, recompute dynamically
        return keccak256(abi.encode(
            EIP712_DOMAIN_TYPEHASH,
            NAME_HASH,
            VERSION_HASH,
            block.chainid,
            address(this)
        ));
    }

    function assetCount() external view returns (uint256) { return assets.length; }

    // ===== Owner admin =====
    function updateAuthorizedSigner(address newSigner) external onlyOwner {
        if (newSigner == address(0)) revert ZeroAddress();
        authorizedSigner = newSigner;
        emit SignerUpdated(newSigner);
    }

    // ===== Proposal Execution =====
    function executeSignedRebalance(
        OrderDelta[] calldata deltas,
        uint256 deadline,
        bytes calldata signature
    ) external {
        if (block.timestamp > deadline) revert Expired();

        bytes32 structHash = _hashProposal(deltas, nonce, deadline);
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", domainSeparator(), structHash));

        // Validate signature: accept EOAs that recover to owner/authorizedSigner
        // or contract signers that implement EIP-1271.
        address recovered;
        bool valid;
        {
            (address r, ECDSA.RecoverError err, ) = ECDSA.tryRecover(digest, signature);
            recovered = r;
            if (err == ECDSA.RecoverError.NoError && (r == owner() || r == authorizedSigner)) {
                valid = true;
            }
        }
        if (!valid) {
            // fallback: if owner or authorizedSigner are contracts, query their isValidSignature per EIP-1271
            if (_isContract(owner())) {
                try IERC1271(owner()).isValidSignature(digest, signature) returns (bytes4 res) {
                    if (res == IERC1271.isValidSignature.selector) valid = true;
                } catch {}
            }
            if (!valid && authorizedSigner != address(0) && _isContract(authorizedSigner)) {
                try IERC1271(authorizedSigner).isValidSignature(digest, signature) returns (bytes4 res) {
                    if (res == IERC1271.isValidSignature.selector) valid = true;
                } catch {}
            }
        }
        if (!valid) revert BadSignature();

        // Effects
        nonce++;
        lastRebalanceTimestamp = block.timestamp;

        // Apply each delta
        for (uint256 i; i < deltas.length; i++) {
            OrderDelta calldata d = deltas[i];
            if (!isAsset[d.token]) revert InvalidAsset();

            if (d.newPercentage > 0) {
                targetPercentageBps[d.token] = d.newPercentage; // absolute override
            } else if (d.percentageDelta != 0) {
                int256 current = int256(targetPercentageBps[d.token]);
                int256 updated = current + d.percentageDelta; // can go negative transiently; clamp at 0
                if (updated < 0) updated = 0;
                targetPercentageBps[d.token] = uint256(updated);
            }

            if (d.amount > 0) {
                if (d.isDeposit) {
                    IERC20(d.token).safeTransferFrom(recovered, address(this), d.amount);
                } else {
                    IERC20(d.token).safeTransfer(owner(), d.amount);
                }
            }
        }

        emit ProposalExecuted(nonce - 1, msg.sender, deltas);
    }

    // ===== Hash helpers (public for test support) =====
    function hashOrderDelta(OrderDelta calldata d) public pure returns (bytes32) {
        return keccak256(abi.encode(
            ORDER_DELTA_TYPEHASH,
            d.token,
            d.percentageDelta,
            d.newPercentage,
            d.amount,
            d.isDeposit
        ));
    }

    function hashProposal(OrderDelta[] calldata deltas, uint256 _nonce, uint256 deadline) external pure returns (bytes32) {
        return _hashProposal(deltas, _nonce, deadline);
    }

    function _hashProposal(OrderDelta[] calldata deltas, uint256 _nonce, uint256 deadline) internal pure returns (bytes32) {
        bytes32[] memory deltaHashes = new bytes32[](deltas.length);
        for (uint256 i; i < deltas.length; i++) {
            OrderDelta calldata d = deltas[i];
            deltaHashes[i] = keccak256(abi.encode(
                ORDER_DELTA_TYPEHASH,
                d.token,
                d.percentageDelta,
                d.newPercentage,
                d.amount,
                d.isDeposit
            ));
        }
        bytes32 deltasHash = keccak256(abi.encodePacked(deltaHashes));
        return keccak256(abi.encode(
            PROPOSAL_TYPEHASH,
            _nonce,
            deadline,
            deltasHash
        ));
    }

    // ===== EIP-1271 compatibility =====
    /// @notice Expose EIP-1271 `isValidSignature` for contract signers
    /// @dev Returns 0x1626ba7e when signature is valid per EIP-1271
    function isValidSignature(bytes32 _hash, bytes calldata _signature) external view override returns (bytes4) {
        // Try EOA style recovery first
        (address recovered, ECDSA.RecoverError err, ) = ECDSA.tryRecover(_hash, _signature);
        if (err == ECDSA.RecoverError.NoError && (recovered == owner() || recovered == authorizedSigner)) {
            return IERC1271.isValidSignature.selector;
        }
        // Contract owner/authorizedSigner fallback
        if (_isContract(owner())) {
            try IERC1271(owner()).isValidSignature(_hash, _signature) returns (bytes4 res) {
                if (res == IERC1271.isValidSignature.selector) return res;
            } catch {}
        }
        if (authorizedSigner != address(0) && _isContract(authorizedSigner)) {
            try IERC1271(authorizedSigner).isValidSignature(_hash, _signature) returns (bytes4 res) {
                if (res == IERC1271.isValidSignature.selector) return res;
            } catch {}
        }
        return 0xffffffff; // invalid
    }

    function _isContract(address account) internal view returns (bool) {
        return account.code.length > 0;
    }
}
