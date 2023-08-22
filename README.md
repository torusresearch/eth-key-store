# eth-key-store

This project explores how key stores can be represented succinctly on-chain.

## Overview

The on-chain key store holds a succinct representation of all valid keys.
When submitting a transaction, it is checked whether the signer public key is contained in the keystore.
This is done using a vector commitment scheme (e.g., Merkle, KZG).

### Comparison: Merkle vs KZG

#### Merkle
\+ easy to implement, relatively computation efficient

\- verification efficiency (computation, proof size) degrades with the number of items in the key store

#### KZG
\+ constant verification efficiency (independent of key store items)

\- relatively complicated to implement, relatively high computational demand (less of a problem on l2)

## Development

```bash
# Compile contracts (force recompilation)
npm run compile -- --force

# Run tests (measure gas)
REPORT_GAS=true npm run test
```
