const fs = require("fs");
const path = require("path");
const express = require("express");
require("dotenv").config();

const { Gateway, Wallets } = require("fabric-network");

const PORT = process.env.PORT || 9000;

const FABRIC_CCP_PATH = process.env.FABRIC_CCP_PATH; // connection profile json
const FABRIC_WALLET_DIR = process.env.FABRIC_WALLET_DIR; // wallet directory
const FABRIC_IDENTITY = process.env.FABRIC_IDENTITY; // identity label in wallet
const FABRIC_CHANNEL = process.env.FABRIC_CHANNEL || "mychannel";
const FABRIC_CHAINCODE = process.env.FABRIC_CHAINCODE || "smartbidpro";
const FABRIC_CONTRACT = process.env.FABRIC_CONTRACT || "SmartBidContract";

function requireEnv(name, val) {
  if (!val) throw new Error(`Missing env var: ${name}`);
  return val;
}

async function getContract() {
  const ccpPath = requireEnv("FABRIC_CCP_PATH", FABRIC_CCP_PATH);
  const walletDir = requireEnv("FABRIC_WALLET_DIR", FABRIC_WALLET_DIR);
  const identity = requireEnv("FABRIC_IDENTITY", FABRIC_IDENTITY);

  const ccp = JSON.parse(fs.readFileSync(path.resolve(ccpPath), "utf8"));
  const wallet = await Wallets.newFileSystemWallet(path.resolve(walletDir));

  const gateway = new Gateway();
  await gateway.connect(ccp, {
    wallet,
    identity,
    discovery: { enabled: true, asLocalhost: true }
  });

  const network = await gateway.getNetwork(FABRIC_CHANNEL);
  const contract = network.getContract(FABRIC_CHAINCODE, FABRIC_CONTRACT);

  return { contract, gateway };
}

const app = express();
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

// Upsert private bid details in PDC
app.post("/private-bids/upsert", async (req, res) => {
  let gw;
  try {
    const { contract, gateway } = await getContract();
    gw = gateway;
    const payload = JSON.stringify(req.body || {});
    await contract.submitTransaction("UpsertPrivateBidDetails", payload);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: String(e.message || e) });
  } finally {
    try { gw && gw.disconnect(); } catch {}
  }
});

// Read private bid details
app.get("/private-bids/:bidId", async (req, res) => {
  let gw;
  try {
    const { contract, gateway } = await getContract();
    gw = gateway;
    const out = await contract.evaluateTransaction("ReadPrivateBidDetails", req.params.bidId);
    res.json({ ok: true, details: JSON.parse(out.toString("utf8")) });
  } catch (e) {
    const msg = String(e.message || e);
    const status = msg.toLowerCase().includes("not found") ? 404 : 500;
    res.status(status).json({ error: msg });
  } finally {
    try { gw && gw.disconnect(); } catch {}
  }
});

app.listen(PORT, () => {
  console.log(`[fabric-gateway] listening on :${PORT}`);
});

