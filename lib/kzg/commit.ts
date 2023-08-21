import assert from "assert";
import { Pairing } from "../../typechain-types/contracts/KZGKeyStore";
import { BytesLike, keccak256 } from "ethers";
import { Point, lagrangePolynomial } from "./lagrange";
import { createPrimeField } from "@guildofweavers/galois";

interface CurvePoint {};

interface CurveScalar {};

interface Curve {
    zero: CurvePoint;
    toAffine(a: CurvePoint): CurvePoint;
    toObject(a: CurvePoint): bigint[];
    add(a: CurvePoint, b: CurvePoint): CurvePoint;
    timesScalar(a: CurvePoint, s: CurveScalar): CurvePoint;
}

interface Bn128 {
    G1: Curve,   
    r: bigint,
}

export interface Parameters {
    bn128: Bn128;
    srs: CurvePoint[];
}

export function polyCommit(
    pp: Parameters,
    coefficients: bigint[],
): Pairing.G1PointStruct {
    const G1 = pp.bn128.G1;
    const srs = pp.srs;

    let c = G1.zero;
    for (let i = 0; i < coefficients.length; i ++) {
        let coeff = BigInt(coefficients[i]);
        assert(coeff >= BigInt(0));

        c = G1.add(c, G1.timesScalar(srs[i], coeff));
    }

    const cAffine = G1.toObject(G1.toAffine(c));
    return {X: cAffine[0], Y: cAffine[1]};
}

export function vectorCommit(
    pp: Parameters,
    values: BytesLike[],
): {commitment: Pairing.G1PointStruct, polynomial: bigint[]} {
    const f = createPrimeField(pp.bn128.r);
    const x = values.map((_, i) => BigInt(i));
    const y = values.map(hashToField);
    const poly = lagrangePolynomial(f, x, y);
    const c = polyCommit(pp, poly);
    return {
        commitment: c,
        polynomial: poly,
    };
}

function bigIntsFromValues(values: BytesLike[]): bigint[] {
    return 
}

function hashToField(a: BytesLike): bigint {
    const h = keccak256(a);
    // Shift result to stay within scalar field of bn128.
    const b = BigInt(h) >> BigInt(3);
    return b;
}

export function generatePolyProof(
    pp: Parameters,
    coefficients: bigint[],
    index: number,
): Pairing.G1PointStruct {
    
}

export function generateVectorProof(
    pp: Parameters,
    coefficients: bigint[],
    value: BytesLike,
): {p: Pairing.G1PointStruct, i: number} {
    
}


