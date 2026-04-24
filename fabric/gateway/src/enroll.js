const { Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const fs = require('fs');

const { buildCAClient, enrollAdmin, registerAndEnrollUser } = require('./CAUtil.js');
const { buildCCPOrg1, buildWallet } = require('./AppUtil.js');

const mspOrg1 = 'Org1MSP';
const walletPath = path.join(__dirname, '..', 'wallet');

async function main() {
	try {
		const ccp = buildCCPOrg1();
		const caClient = buildCAClient(FabricCAServices, ccp, 'ca.org1.example.com');
		const wallet = await buildWallet(Wallets, walletPath);

		await enrollAdmin(caClient, wallet, mspOrg1);
		await registerAndEnrollUser(caClient, wallet, mspOrg1, 'appUser', 'org1.department1');

		console.log('Successfully enrolled admin and appUser');
	} catch (error) {
		console.error(`Error: ${error}`);
		process.exit(1);
	}
}

main();
