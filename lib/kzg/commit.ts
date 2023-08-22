import assert from "assert";
import { Pairing } from "../../typechain-types/contracts/KZGKeyStore";
import { BytesLike, keccak256 } from "ethers";
import { lagrangePolynomial } from "./lagrange";
import { FiniteField, createPrimeField } from "@guildofweavers/galois";
import srsg1DataRaw from './taug1_65536.json';

interface CurvePoint {};

interface CurveScalar {};

interface Curve {
    zero: CurvePoint;
    toAffine(a: CurvePoint): CurvePoint;
    toObject(a: CurvePoint): bigint[];
    fromObject(a: bigint[]): CurvePoint;
    add(a: CurvePoint, b: CurvePoint): CurvePoint;
    timesScalar(a: CurvePoint, s: CurveScalar): CurvePoint;
}

interface Bn128 {
    G1: Curve,   
    r: bigint,
}

export class Parameters {
    bn128: Bn128;
    f: FiniteField;
    srs: CurvePoint[];
    constructor(bn128: Bn128, srs: CurvePoint[]) {
        this.bn128 = bn128;
        this.f = createPrimeField(bn128.r);
        this.srs = srs;
    }
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
    const x = values.map((_, i) => BigInt(i));
    const y = values.map(hashToField);
    const poly = lagrangePolynomial(pp.f, x, y);
    const c = polyCommit(pp, poly);
    return {
        commitment: c,
        polynomial: poly,
    };
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
): {w: Pairing.G1PointStruct, pi: bigint} {
    const f = pp.f;
    const poly = f.newVectorFrom(coefficients);

    const i = BigInt(index);
    const pi = f.evalPolyAt(poly, i);
    const piPoly = f.newVectorFrom([pi]);
    
    const num = f.subPolys(poly, piPoly);
    const denom = f.newVectorFrom([-i, 1n]);
    const q = f.divPolys(num, denom);

    const w = polyCommit(pp, q.toValues());
    return {
        w: w,
        pi: pi,
    }
}

export function generateVectorProof(
    pp: Parameters,
    coefficients: bigint[],
    value: BytesLike,
): {p: Pairing.G1PointStruct, i: number} {
    const i = findValue(pp.f, coefficients, value);
    const p = generatePolyProof(pp, coefficients, i);
    return {
        p: p.w,
        i: i,
    }
}

function findValue(f: FiniteField, coefficients: bigint[], value: BytesLike): number {
    const h = hashToField(value);
    const i = coefficients.indexOf(h);
    if (i == -1) {
        throw new Error("Value not found in coefficients");
    }
    return i;
}

export function loadSrsG1(bn128: Bn128, depth: number): CurvePoint[] {
    const G1 = bn128.G1;
    const srsg1 = srsg1DataRaw as string[][];

    assert(depth > 0);
    assert(depth <= srsg1.length);

    const g1 = []
    for (let i = 0; i < depth; i ++) {
        g1.push(G1.fromObject([
            BigInt(srsg1[i][0]),
            BigInt(srsg1[i][1]),
        ]));
    }

    return g1;
}
