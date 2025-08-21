// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

interface IERC1271Minimal {
    function isValidSignature(bytes32 _hash, bytes calldata _signature) external view returns (bytes4);
}

/**
 * @title Mock1271Wallet
 * @notice Minimal EIP-1271-compatible contract wallet for testing.
 *         Treats `owner` EOA as the authorized signer; validates signatures
 *         by recovering with ECDSA and comparing to `owner`.
 */
contract Mock1271Wallet is IERC1271Minimal {
    using ECDSA for bytes32;

    address public immutable owner;

    constructor(address _owner) {
        owner = _owner;
    }

    function isValidSignature(bytes32 _hash, bytes calldata _signature) external view override returns (bytes4) {
        (address recovered, ECDSA.RecoverError err, ) = ECDSA.tryRecover(_hash, _signature);
        if (err == ECDSA.RecoverError.NoError && recovered == owner) {
            // 0x1626ba7e
            return IERC1271Minimal.isValidSignature.selector;
        }
        return 0xffffffff;
    }
}
