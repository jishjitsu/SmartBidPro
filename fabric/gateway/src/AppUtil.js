'use strict';

const fs = require('fs');
const path = require('path');

exports.buildCCPOrg1 = () => {
    // We expect FABRIC_SAMPLES_PATH to be set in environment
    const fabricSamplesPath = process.env.FABRIC_SAMPLES_PATH || path.resolve(__dirname, '../../../../fabric-samples');
	const ccpPath = path.resolve(fabricSamplesPath, 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
	const fileExists = fs.existsSync(ccpPath);
	if (!fileExists) {
		throw new Error(`no such file or directory: ${ccpPath}. Please set FABRIC_SAMPLES_PATH env var.`);
	}
	const contents = fs.readFileSync(ccpPath, 'utf8');
	const ccp = JSON.parse(contents);
	console.log(`Loaded the network configuration located at ${ccpPath}`);
	return ccp;
};

exports.buildWallet = async (Wallets, walletPath) => {
	let wallet;
	if (walletPath) {
		wallet = await Wallets.newFileSystemWallet(walletPath);
		console.log(`Built a file system wallet at ${walletPath}`);
	} else {
		wallet = await Wallets.newInMemoryWallet();
		console.log('Built an in memory wallet');
	}
	return wallet;
};

exports.prettyJSONString = (inputString) => {
	if (inputString) {
		 return JSON.stringify(JSON.parse(inputString), null, 2);
	}
	else {
		 return inputString;
	}
}
