// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./KeyStore.sol";

contract TestTransactor {
    bytes32 dummy;

    function transact(
        address keystore,
        bytes memory key,
        bytes memory proof
    ) external {
        bool b = KeyStore(keystore).containsKey(key, proof);
        require(b, "invalid key");

        // Dummy write to make this a gas consuming transaction so we can
        // measure the gas cost of querying the key store.
        dummy = 0;
    }
}