import { BytesLike, ContractRunner } from "ethers";
import { EthAddress, KeyStore, KeyStoreFactory, PubKey } from "../keystore";
import { StandardMerkleTree } from "@openzeppelin/merkle-tree";
import { MerkleKeyStore__factory, MerkleKeyStore as MerkleKeyStore__contract } from "../../typechain-types";
import { ethers } from "hardhat";

export class MerkleKeyStoreFactory implements KeyStoreFactory {
    async deploy(pub_keys: PubKey[], runner: ContractRunner): Promise<KeyStore> {
        const ksFactory = await ethers.getContractFactory("MerkleKeyStore");
        const t = MerkleKeyStore.computeTree(pub_keys);
        const ksContract = await ksFactory.deploy(t.root);

        const ksAddr = await ksContract.getAddress();
        const ks = new MerkleKeyStore(ksAddr, pub_keys, runner);
        return ks;
    }

    load(address: string, pub_keys: BytesLike[], runner: ContractRunner): Promise<KeyStore> {
        const ks = new MerkleKeyStore(address, pub_keys, runner);
        return Promise.resolve(ks);
    }
}

export class MerkleKeyStore implements KeyStore {
    private contract: MerkleKeyStore__contract;
    private tree: StandardMerkleTree<PubKey[]>;

    constructor(addr: EthAddress, pub_keys: PubKey[], runner: ContractRunner) {
        this.contract = MerkleKeyStore__factory.connect(addr, runner);
        this.tree = MerkleKeyStore.computeTree(pub_keys);
    }

    async address(): Promise<EthAddress> {
        return await this.contract.getAddress();
    }

    static computeTree(pub_keys: PubKey[]): StandardMerkleTree<PubKey[]> {
        const pk_tuples = pub_keys.map(x => [x]);
        const tree = StandardMerkleTree.of(pk_tuples, ['bytes']);
        return tree;
    }

    async setPublicKeys(pub_keys: PubKey[]): Promise<void> {
        const tree = MerkleKeyStore.computeTree(pub_keys);
        const tx = await this.contract.updateCommitment(tree.root);
        await tx.wait();
        this.tree = tree;
    }
    
    async containsKey(pk: PubKey): Promise<boolean> {
        const proof = await this.generateProof(pk);
        const b = await this.contract.containsKey(pk, proof);
        return b;
    }

    async generateProof(pk: PubKey): Promise<BytesLike> {
        const proof = this.tree.getProof([pk]);
        const proofEncoded = ethers.AbiCoder.defaultAbiCoder().encode(['bytes32[]'], [proof]);
        return Promise.resolve(proofEncoded);
    }
}

