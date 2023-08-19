// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface KeyStore {
    /**
     * `containsKey` checks whether a key is contained in the key store.
     */
    function containsKey(
        bytes memory key,
        bytes memory proof
    ) external view returns(bool);
}