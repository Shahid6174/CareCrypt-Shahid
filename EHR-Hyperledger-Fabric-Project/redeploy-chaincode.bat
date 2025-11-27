@echo off
echo ============================================
echo   Redeploying EHR Chaincode with Fixes
echo ============================================
echo.
echo This script will redeploy the chaincode with the following fixes:
echo 1. Insurance agent claim approval auto-review
echo 2. Doctor document download access
echo 3. OCR/genuine score storage
echo.

cd fabric-samples\test-network

echo Current directory: %CD%
echo.

echo Checking if Fabric network is running...
docker ps | findstr "peer0.org1.example.com" >nul
if errorlevel 1 (
    echo Network is not running!
    echo.
    echo Please start the network first:
    echo   cd fabric-samples\test-network
    echo   network.sh up createChannel -ca
    echo.
    pause
    exit /b 1
)

echo Network is running
echo.

echo Deploying chaincode...
echo.

call network.sh deployCC -ccn ehr -ccp ../asset-transfer-basic/chaincode-javascript -ccl javascript -ccep "OR('Org1MSP.peer','Org2MSP.peer')" -cccg ../asset-transfer-basic/chaincode-javascript/collections_config.json

if %errorlevel% equ 0 (
    echo.
    echo ============================================
    echo Chaincode deployed successfully!
    echo ============================================
    echo.
    echo Next steps:
    echo 1. Restart the backend server:
    echo    cd server-node-sdk
    echo    npm start
    echo.
    echo 2. Test the fixes:
    echo    - Insurance agent claim approval
    echo    - Doctor document download
    echo    - OCR score display in dashboards
    echo.
) else (
    echo.
    echo ============================================
    echo Chaincode deployment failed!
    echo ============================================
    echo.
    echo Troubleshooting:
    echo 1. Check if the network is running properly
    echo 2. Check the chaincode syntax for errors
    echo 3. Review the logs above for specific errors
    echo.
)

pause

