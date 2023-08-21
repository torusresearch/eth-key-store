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
    const zero = f.newVector(0);
    return x.reduce((acc, xi, i) => {
        const num = f.newVectorFrom([f.neg(xi), 1n]);
        const denom = f.sub(x[i], xi);
        const denomInv = f.inv(denom);
        const pi = f.mulPolyByConstant(num, denomInv);
        return f.mulPolys(acc, pi);
    }, zero);
}