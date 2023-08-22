import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { PubKey } from "../lib/keystore";
import { MerkleKeyStoreFactory } from "../lib/merkle/keystore";
import { KZGKeyStoreFactory } from "../lib/kzg/keystore";
import { buildBn128 } from 'ffjavascript';
import { Parameters as KZGParameters, loadSrsG1 } from "../lib/kzg/commit";

describe("MerkleKeyStore", function () {
    // We define a fixture to reuse the same setup in every test.
    // We use loadFixture to run this setup once, snapshot that state,
    // and reset Hardhat Network to that snapshot in every test.
    async function deployKeyStoreFixture() {
        const [acc] = await ethers.getSigners();
        
        const pub_keys: PubKey[] = ["0x01", "0x02"];
        const invalid_key: PubKey = "0x00";

        const ksFactory = new MerkleKeyStoreFactory();
        const ks = await ksFactory.deploy(pub_keys, acc);

        const transactorFactory = await ethers.getContractFactory("TestTransactor");
        const transactor = await transactorFactory.deploy();

        return { ks, transactor, acc, pub_keys, invalid_key };
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
        const max_length = 128;
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
        
        const pub_keys: PubKey[] = ["0x01", "0x02"];
        const invalid_key: PubKey = "0x00";

        const ksFactory = new KZGKeyStoreFactory(pp);
        const ks = await ksFactory.deploy(pub_keys, acc);

        const transactorFactory = await ethers.getContractFactory("TestTransactor");
        const transactor = await transactorFactory.deploy();

        return { ks, transactor, acc, pub_keys, invalid_key };
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
