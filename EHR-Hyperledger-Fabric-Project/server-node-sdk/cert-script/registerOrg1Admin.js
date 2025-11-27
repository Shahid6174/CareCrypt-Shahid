/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 * 
 * This script enrolls the CA bootstrap admin as "hospitalAdmin".
 * hospitalAdmin is used for REGISTERING new users with the CA.
 * 
 * NOTE: hospitalAdmin does NOT have role/uuid attributes.
 * For chaincode operations that require role=hospital, use Hospital01 (created by onboardHospital01.js)
 */

'use strict';

const FabricCAServices = require('fabric-ca-client');
const { Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');

async function main() {
    try {
        // load the network configuration
        const ccpPath = path.resolve(__dirname, '../..', 'fabric-samples', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        // Create a new CA client for interacting with the CA.
        const caInfo = ccp.certificateAuthorities['ca.org1.example.com'];
        const caTLSCACerts = caInfo.tlsCACerts.pem;
        const ca = new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts, verify: false }, caInfo.caName);

        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the admin user.
        const identity = await wallet.get('hospitalAdmin');
        if (identity) {
            console.log('An identity for the admin user "hospitalAdmin" already exists in the wallet');
            return;
        }

        // Enroll the CA bootstrap admin and store as hospitalAdmin
        // This admin is used for REGISTERING new users with the CA
        console.log('Enrolling CA bootstrap admin as "hospitalAdmin"...');
        const enrollment = await ca.enroll({ enrollmentID: 'admin', enrollmentSecret: 'adminpw' });
        const x509Identity = {
            credentials: {
                certificate: enrollment.certificate,
                privateKey: enrollment.key.toBytes(),
            },
            mspId: 'Org1MSP',
            type: 'X.509',
        };
        await wallet.put('hospitalAdmin', x509Identity);
        console.log('Successfully enrolled admin user "hospitalAdmin" and imported it into the wallet');
        console.log('NOTE: hospitalAdmin is for CA registration only. Use Hospital01 for chaincode operations.');

    } catch (error) {
        console.error(`Failed to enroll admin user "hospitalAdmin": ${error}`);
        process.exit(1);
    }
}

main();
