// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./KeyStore.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./Pairing.sol";
import "./KZGVerifier.sol";

contract KZGKeyStore is KeyStore, Ownable, Verifier {
    Pairing.G1Point public commitment;

    constructor(Pairing.G1Point memory _commitment) {
        commitment = _commitment;
    }

    function updateCommitment(Pairing.G1Point memory _commitment) external onlyOwner {
        commitment = _commitment;
    }

    function containsKey(
        bytes memory key,
        bytes memory proof
    ) external view returns(bool) {
        (uint256 x, uint256 y, uint16 i) = abi.decode(proof, (uint256, uint256, uint16));
        Pairing.G1Point memory _proof = Pairing.G1Point(x, y);
        uint256 h = hashKey(key);
        bool b = Verifier.verify(commitment, _proof, i, h);
        return b;
    }

    function hashKey(bytes memory key) internal pure returns(uint256) {
        // Shift right to ensure that result is smaller than curve order.
        bytes32 h = keccak256(key) >> 3;
        return uint256(h);
    }
}