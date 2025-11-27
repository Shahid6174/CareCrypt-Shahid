#!/bin/bash

echo "============================================"
echo "  Redeploying EHR Chaincode with Fixes"
echo "============================================"
echo ""
echo "This script will redeploy the chaincode with the following fixes:"
echo "1. Insurance agent claim approval auto-review"
echo "2. Doctor document download access"
echo "3. OCR/genuine score storage"
echo ""

# Navigate to test-network directory
cd "$(dirname "$0")/fabric-samples/test-network" || exit 1

echo "📍 Current directory: $(pwd)"
echo ""

# Check if network is running
echo "🔍 Checking if Fabric network is running..."
if ! docker ps | grep -q "peer0.org1.example.com"; then
    echo "❌ Fabric network is not running!"
    echo ""
    echo "Please start the network first:"
    echo "  cd fabric-samples/test-network"
    echo "  ./network.sh up createChannel -ca"
    echo ""
    exit 1
fi

echo "✅ Network is running"
echo ""

# Deploy the chaincode
echo "🚀 Deploying chaincode..."
echo ""

./network.sh deployCC \
    -ccn ehr \
    -ccp ../asset-transfer-basic/chaincode-javascript \
    -ccl javascript \
    -ccep "OR('Org1MSP.peer','Org2MSP.peer')" \
    -cccg ../asset-transfer-basic/chaincode-javascript/collections_config.json

if [ $? -eq 0 ]; then
    echo ""
    echo "============================================"
    echo "✅ Chaincode deployed successfully!"
    echo "============================================"
    echo ""
    echo "Next steps:"
    echo "1. Restart the backend server:"
    echo "   cd server-node-sdk"
    echo "   npm start"
    echo ""
    echo "2. Test the fixes:"
    echo "   - Insurance agent claim approval"
    echo "   - Doctor document download"
    echo "   - OCR score display in dashboards"
    echo ""
else
    echo ""
    echo "============================================"
    echo "❌ Chaincode deployment failed!"
    echo "============================================"
    echo ""
    echo "Troubleshooting:"
    echo "1. Check if the network is running properly"
    echo "2. Check the chaincode syntax for errors"
    echo "3. Review the logs above for specific errors"
    echo ""
    exit 1
fi

