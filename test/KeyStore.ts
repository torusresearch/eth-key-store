import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { assert, expect } from "chai";
import { ethers } from "hardhat";
import { PubKey } from "../lib/keystore";
import { MerkleKeyStoreFactory } from "../lib/merkle/keystore";
import { KZGKeyStoreFactory } from "../lib/kzg/keystore";
import { buildBn128 } from "ffjavascript";
import { Parameters as KZGParameters, loadSrsG1 } from "../lib/kzg/commit";
import { BytesLike } from "ethers";

const nPubKeys = 128;
const keyLength = 32;
function intToBytes(i: number, l: number): BytesLike {
    return "0x" + (i+1).toString(16).padStart(2*l, "0")
}
const invalidKey: PubKey = intToBytes(0, keyLength);
const pubKeys: PubKey[] = [...Array(nPubKeys)].map(
    (_, i) => intToBytes(i+1, keyLength)
);
assert(pubKeys.indexOf(invalidKey) == -1);

describe("MerkleKeyStore", function () {
    // We define a fixture to reuse the same setup in every test.
    // We use loadFixture to run this setup once, snapshot that state,
    // and reset Hardhat Network to that snapshot in every test.
    async function deployKeyStoreFixture() {
        const [acc] = await ethers.getSigners();

        const ksFactory = new MerkleKeyStoreFactory();
        const ks = await ksFactory.deploy(pubKeys, acc);

        const transactorFactory = await ethers.getContractFactory("TestTransactor");
        const transactor = await transactorFactory.deploy();

        return { ks, transactor, acc, pub_keys: pubKeys, invalid_key: invalidKey };
    }

    it("Transaction with valid key should succeed", async function () {
        const { ks, transactor, pub_keys } = await loadFixture(deployKeyStoreFixture);

        const ks_addr = await ks.address();
        const pk = pub_keys[0];
        const proof = await ks.generateProof(pk);

        const tx = transactor.transact(ks_addr, pk, proof);
        await expect(tx).not.reverted;
    });

    it("Transaction with invalid key should fail", async function () {
        const { ks, pub_keys, transactor, invalid_key } = await loadFixture(deployKeyStoreFixture);

        const ks_addr = await ks.address();
        const pk = pub_keys[0];
        const proof = await ks.generateProof(pk);
        
        const tx = transactor.transact(ks_addr, invalid_key, proof)
        await expect(tx).revertedWith("invalid key");
    });
});

describe("KZGKeyStore", function () {
    let bn128: any;
    let pp: KZGParameters;
    before( async() => {
        bn128 = await buildBn128();
        const max_length = pubKeys.length;
        const srsg1 = loadSrsG1(bn128, max_length);
        pp = new KZGParameters(bn128, srsg1);
    });
    after( async() => {
        bn128.terminate();
    });

    // We define a fixture to reuse the same setup in every test.
    // We use loadFixture to run this setup once, snapshot that state,
    // and reset Hardhat Network to that snapshot in every test.
    async function deployKeyStoreFixture() {
        const [acc] = await ethers.getSigners();

        const ksFactory = new KZGKeyStoreFactory(pp);
        const ks = await ksFactory.deploy(pubKeys, acc);

        const transactorFactory = await ethers.getContractFactory("TestTransactor");
        const transactor = await transactorFactory.deploy();

        return { ks, transactor, acc, pub_keys: pubKeys, invalid_key: invalidKey };
    }

    it("Transaction with valid key should succeed", async function () {
        const { ks, transactor, pub_keys } = await loadFixture(deployKeyStoreFixture);

        const ks_addr = await ks.address();
        const pk = pub_keys[0];
        const proof = await ks.generateProof(pk);

        const tx = transactor.transact(ks_addr, pk, proof);
        await expect(tx).not.reverted;
    });

    it("Transaction with invalid key should fail", async function () {
        const { ks, pub_keys, transactor, invalid_key } = await loadFixture(deployKeyStoreFixture);

        const ks_addr = await ks.address();
        const pk = pub_keys[0];
        const proof = await ks.generateProof(pk);
        
        const tx = transactor.transact(ks_addr, invalid_key, proof)
        await expect(tx).revertedWith("invalid key");
    });
});
