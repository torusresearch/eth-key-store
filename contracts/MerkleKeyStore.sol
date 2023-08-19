// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./KeyStore.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract MerkleKeyStore is KeyStore, Ownable {
    bytes32 public commitment;

    constructor(bytes32 _commitment) {
        commitment = _commitment;
    }

    function updateCommitment(bytes32 _commitment) external onlyOwner {
        commitment = _commitment;
    }

    function containsKey(
        bytes memory key,
        bytes memory proof
    ) external view returns(bool) {
        bytes32[] memory _proof = abi.decode(proof, (bytes32[]));
        bytes32 leaf = keccak256(bytes.concat(keccak256(abi.encode(key))));
        bool valid = MerkleProof.verify(_proof, commitment, leaf);
        return valid;
    }
}