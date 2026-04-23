## Hyperledger Fabric module (private bid details)

This repo’s main app stores tenders/bids in MongoDB and anchors hashes on Ethereum.
For **private bid details** (technical specs, evaluation score, sensitive documents), use Fabric **Private Data Collections (PDC)**.

What’s included here:
- **Chaincode (Go)**: `fabric/chaincode/smartbidpro/` (stores/retrieves private bid details)
- **Collections config**: `fabric/collections/collections_config.json`
- **Gateway REST service (Node.js)**: `fabric/gateway/` (simple HTTP API to call chaincode)

### Status
- Chaincode + gateway code are present.
- A full Fabric network (CA/peers/orderer) is not vendored in this repo. For local dev, use `fabric-samples/test-network` and deploy this chaincode to it.

### Local dev (high level)
1) Install prerequisites: Docker, Node.js, Go, and Fabric binaries (or use `fabric-samples`).
2) Bring up a local network using `fabric-samples/test-network`.
3) Deploy the chaincode from `fabric/chaincode/smartbidpro`.
4) Configure the gateway service with the connection profile + identities, then start it.
5) Point the Rust backend to the gateway via `FABRIC_GATEWAY_URL`.

### Data model
Private bid details are stored in PDC under:
- **collection**: `privateBidDetails`
- **key**: `bid:<bidId>`

Recommended: store only public metadata in MongoDB and keep private fields in Fabric.
