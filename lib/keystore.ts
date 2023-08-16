import { BytesLike, ContractRunner } from "ethers";

export type EthAddress = string;
export type PubKey = BytesLike;

export interface KeyStoreFactory {
    deploy(pub_keys: PubKey[], runner: ContractRunner): Promise<KeyStore>;
    load(address: EthAddress, pub_keys: PubKey[], runner: ContractRunner): Promise<KeyStore>;
}

export interface KeyStore {
    address(): Promise<EthAddress>;
    set_public_keys(public_key: PubKey[]): Promise<void>;
    contains_key(public_key: PubKey): Promise<boolean>;
    generateProof(pk: PubKey): Promise<BytesLike[]>;
}
