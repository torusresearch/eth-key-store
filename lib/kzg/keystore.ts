import { BytesLike, ContractRunner, Signer } from "ethers";
import { EthAddress, KeyStore, KeyStoreFactory, PubKey } from "../keystore";
import { KZGKeyStore__factory, KZGKeyStore as KZGKeyStore__contract } from "../../typechain-types";
import { ethers } from "hardhat";
import { Pairing } from "../../typechain-types/contracts/KZGKeyStore";
import { Parameters as KZGParameters, generateVectorProof, vectorCommit } from "./commit";

export class KZGKeyStoreFactory implements KeyStoreFactory {
    private parameters: KZGParameters;

    constructor(pp: KZGParameters) {
        this.parameters = pp;
    }

    async deploy(pubKeys: PubKey[], signer: Signer): Promise<KeyStore> {
        const ksFactory = new KZGKeyStore__factory(signer);
        const c = vectorCommit(this.parameters, pubKeys);
        const ksContract = await ksFactory.deploy(c.commitment);

        const ksAddr = await ksContract.getAddress();
        const ks = new KZGKeyStore(ksAddr, this.parameters, pubKeys, signer);
        return ks;
    }

    load(address: string, pubKeys: BytesLike[], runner: ContractRunner): Promise<KeyStore> {
        const ks = new KZGKeyStore(address, this.parameters, pubKeys, runner);
        return Promise.resolve(ks);
    }
}

type G1Point = Pairing.G1PointStruct;

export class KZGKeyStore implements KeyStore {
    private contract: KZGKeyStore__contract;
    private parameters: KZGParameters;
    private commitment: G1Point;
    private polynomial: bigint[];

    constructor(addr: EthAddress, pp: KZGParameters, pubKeys: PubKey[], runner: ContractRunner) {
        this.contract = KZGKeyStore__factory.connect(addr, runner);
        const c = vectorCommit(pp, pubKeys)
        this.parameters = pp;
        this.commitment = c.commitment;
        this.polynomial = c.polynomial;
    }

    async address(): Promise<EthAddress> {
        return await this.contract.getAddress();
    }

    async setPublicKeys(pubKeys: PubKey[]): Promise<void> {
        const c = vectorCommit(this.parameters, pubKeys);
        const tx = await this.contract.updateCommitment(c.commitment);
        await tx.wait();
        this.commitment = c.commitment;
        this.polynomial = c.polynomial;
    }
    
    async containsKey(pk: PubKey): Promise<boolean> {
        const proof = await this.generateProof(pk);
        const b = await this.contract.containsKey(pk, proof);
        return b;
    }

    async generateProof(pk: PubKey): Promise<BytesLike> {
        const proof = generateVectorProof(this.parameters, this.polynomial, pk);
        const proofEncoded = ethers.AbiCoder.defaultAbiCoder().encode(['uint256', 'uint256', 'uint16'], [proof.p.X, proof.p.Y, proof.i]);
        return Promise.resolve(proofEncoded);
    }
}