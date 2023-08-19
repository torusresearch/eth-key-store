import { BytesLike, ContractRunner } from "ethers";

export type EthAddress = string;
export type PubKey = BytesLike;

export interface KeyStoreFactory {
    deploy(pub_keys: PubKey[], runner: ContractRunner): Promise<KeyStore>;
    load(address: EthAddress, pub_keys: PubKey[], runner: ContractRunner): Promise<KeyStore>;
}

export interface KeyStore {
    address(): Promise<EthAddress>;
    setPublicKeys(public_key: PubKey[]): Promise<void>;
    containsKey(public_key: PubKey): Promise<boolean>;
    generateProof(pk: PubKey): Promise<BytesLike>;
}
