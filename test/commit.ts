import { buildBn128 } from 'ffjavascript';
import { expect } from "chai";

describe("Commit", function () {
    let bn128: any;
    before( async() => {
        bn128 = await buildBn128();
    });
    after( async() => {
        bn128.terminate();
    });

    it("shoud do scalar operations", async () => {
        const Fr = bn128.Fr;

        // Generate random Scalar.
        const a = Fr.random();
        const b = Fr.random();

        // Convert between BigInt and Scalar.
        {
            const i = 19520788255192006582995374522028048098496451720750299121731159140776301748643n;
            const a = Fr.fromObject(i);
            const b = Fr.toObject(a);
            expect(b).eq(i);
        }

        // Add Scalars.
        {
            const c = Fr.add(a, b);
            
            // Recompute using BigInt.
            const aBI = Fr.toObject(a);
            const bBI = Fr.toObject(b);
            const cBI = (aBI + bBI) % bn128.r;
            
            // Convert Fr to BigInt and compare.
            const _c = Fr.toObject(c);
            expect(_c).eq(cBI);
        }

        // Multiply Scalars.
        {
            const c = Fr.mul(a, b);
            
            // Recompute using BigInt.
            const aBI = Fr.toObject(a);
            const bBI = Fr.toObject(b);
            const cBI = (aBI * bBI) % bn128.r;
            
            // Convert Fr to BigInt and compare.
            const _c = Fr.toObject(c);
            expect(_c).eq(cBI);
        }
    });

    it("shoud do group operations", async () => {
        const Fr = bn128.Fr;
        const G1 = bn128.G1;
        const G2 = bn128.G2;
        const Gt = bn128.Gt;

        // Create group element from BigInt[].
        const a = G1.fromObject([1n, 2n]);

        // Get zero element.
        const zero = G1.zero;

        // Add zero and check equality.
        {
            const b = G1.add(a, zero);
            expect(G1.eq(a, b)).eq(true);
        }

        // Read affine coordinates.
        {
            const b = G1.toObject(G1.toAffine(a));
            const x = b[0];
            const y = b[1];
            const z = b[2];
        }
    });

    it("shoud do pairing", async () => {
        const Fr = bn128.Fr;
        const G1 = bn128.G1;
        const G2 = bn128.G2;
        const Gt = bn128.Gt;

        const x = Fr.random();
        const y = Fr.random();

        const g1x = G1.timesScalar(G1.g, x);
        const g2y = G2.timesScalar(G2.g, y);
        const px1y2 = bn128.pairing(g1x, g2y);

        const g1xy = G1.timesScalar(G1.timesScalar(G1.g, x), y);
        const pxy1 = bn128.pairing(g1xy, G2.g);
        
        expect(Gt.eq(px1y2, pxy1)).eq(true);
    });
});