import { FiniteField, Polynom, Vector } from "@guildofweavers/galois";

export function lagrangePolynomial(f: FiniteField, x: bigint[], y: bigint[]): bigint[] {
    const zero = f.newVector(0);
    const p = y.reduce((acc, yi, i) => {
        const li = basisPolynomial(f, x, i);
        const ly = f.mulPolyByConstant(li, yi);
        return f.addPolys(acc, ly);
    }, zero);
    return p.toValues();
}

function basisPolynomial(f: FiniteField, x: bigint[], i: number): Polynom {
    const one = f.newVectorFrom([1n]);
    const p = x.reduce((acc, xj, j) => {
        if (j == i) {
            return acc;
        }
        const num = f.newVectorFrom([f.neg(xj), 1n]);
        const denom = f.sub(x[i], xj);
        const denomInv = f.inv(denom);
        const pi = f.mulPolyByConstant(num, denomInv);
        return f.mulPolys(acc, pi);
    }, one);
    return p;
}