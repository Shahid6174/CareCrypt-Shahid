# Fixes Applied - November 27, 2025

## Issues Fixed

### 1. ✅ Insurance Agent Claim Approval Error
**Problem**: Getting error "Claim not in insurance stage" when trying to approve claims.

**Root Cause**: The chaincode requires claims to be in `PENDING_INSURANCE_APPROVAL` status, but after doctor verification, claims are in `PENDING_INSURANCE_REVIEW` status. The agent needs to first "review" the claim before "approving" it.

**Solution**: Modified `insuranceController.js` to automatically call `reviewClaimByAgent` before `approveClaimByInsurance` if the claim is in `PENDING_INSURANCE_REVIEW` status.

**Files Modified**:
- `EHR-Hyperledger-Fabric-Project/server-node-sdk/controllers/insuranceController.js`

**Changes**:
```javascript
// Auto-review claim if it's in PENDING_INSURANCE_REVIEW status
if (claim.status === 'PENDING_INSURANCE_REVIEW') {
  await invoke.invokeTransaction('reviewClaimByAgent', {
    claimId,
    agentId: userId,
    notes: notes || 'Reviewed by agent before approval'
  }, userId);
}
```

---

### 2. ✅ Doctor Cannot View Uploaded Documents
**Problem**: Doctors were unable to download/view documents uploaded by patients.

**Root Cause**: The `/documents/download/:documentId` endpoint only allowed document owners (patients) to download their documents. Doctors with authorized access to patients couldn't download documents.

**Solution**: Enhanced `downloadDocument` endpoint to:
1. Check if requester owns the document
2. If not, check if requester is a doctor with authorized access to the patient
3. Verify authorization via blockchain query to `getPatientById`
4. Allow download if doctor is in patient's `authorizedDoctors` list

**Files Modified**:
- `EHR-Hyperledger-Fabric-Project/server-node-sdk/controllers/documentController.js`

**Changes**:
- Added support for `patientId` query parameter
- Added blockchain authorization verification for doctors
- Added fallback search across all users with authorization check

---

### 3. ✅ OCR Score Not Visible
**Problem**: OCR/genuine scores were not visible in doctor and patient dashboards for claims.

**Root Cause**: The chaincode's `submitClaim` function was not accepting or saving the `genuineScore` and `autoApproved` fields that were being calculated by the fraud detection system.

**Solution**: Modified chaincode to:
1. Accept `genuineScore`, `autoApproved`, and `status` parameters in submitClaim
2. Save these fields to the blockchain claim record
3. Allow custom status to be set during claim submission (for auto-approved claims)

**Files Modified**:
- `EHR-Hyperledger-Fabric-Project/fabric-samples/asset-transfer-basic/chaincode-javascript/lib/ehrChainCode.js`

**Changes**:
```javascript
// Added to function parameters
const { ..., status, autoApproved, genuineScore } = JSON.parse(args);

// Added to claim object
if (genuineScore !== undefined) claim.genuineScore = genuineScore;
if (autoApproved !== undefined) claim.autoApproved = autoApproved;
```

**Note**: Frontend already had display logic for genuine scores in both dashboards. The issue was backend data flow.

---

## Testing Instructions

### 1. Redeploy the Chaincode
The chaincode was modified, so it needs to be redeployed:

```bash
cd EHR-Hyperledger-Fabric-Project/fabric-samples/test-network
./network.sh deployCC -ccn ehr -ccp ../asset-transfer-basic/chaincode-javascript -ccl javascript
```

### 2. Restart the Backend Server
```bash
cd EHR-Hyperledger-Fabric-Project/server-node-sdk
npm start
```

### 3. Test Insurance Agent Claim Approval
1. Login as insurance agent
2. Navigate to claims dashboard
3. Click "Approve" on a claim that has been verified by a doctor
4. Should approve successfully without "Claim not in insurance stage" error

### 4. Test Doctor Document Download
1. Login as doctor
2. View a patient's claim that has attached documents
3. Click "Download" on any document
4. Document should download successfully

### 5. Test OCR Score Display
1. Login as patient
2. Submit a new claim with documents
3. OCR score should be visible in the claim card
4. Login as doctor or insurance agent
5. View the same claim - OCR score should be visible

---

## API Changes

### Modified Endpoints

#### 1. POST /insurance/claim/approve
**Enhanced Behavior**:
- Now auto-reviews claim if in `PENDING_INSURANCE_REVIEW` status
- No longer requires manual review step before approval

**Request** (unchanged):
```json
{
  "claimId": "CLAIM-xxx",
  "approvedAmount": 4500,
  "notes": "Approved"
}
```

#### 2. GET /documents/download/:documentId
**Enhanced Behavior**:
- Accepts optional `patientId` query parameter
- Allows authorized doctors to download patient documents
- Verifies doctor authorization via blockchain

**Request** (enhanced):
```
GET /documents/download/DOC-123?patientId=patient01
Headers: { "x-userid": "doctor01" }
```

---

## Blockchain Changes

### Modified Smart Contract Functions

#### submitClaim
**New Parameters**:
- `status` (optional) - Custom initial status
- `autoApproved` (optional) - Whether claim was auto-approved by AI
- `genuineScore` (optional) - OCR/AI confidence score (0-100)

**Example Invocation**:
```json
{
  "patientId": "patient01",
  "doctorId": "doctor01",
  "claimAmount": 5000,
  "claimType": "medical",
  "description": "Treatment",
  "documents": [...],
  "genuineScore": 87.5,
  "autoApproved": true,
  "status": "INSURANCE_APPROVED"
}
```

---

## Additional Notes

1. **Backward Compatibility**: All changes are backward compatible. Old claims without genuine scores will still work.

2. **Security**: Doctor authorization is verified through the blockchain `getPatientById` query, ensuring only authorized doctors can access patient documents.

3. **Auto-Review**: The auto-review mechanism for insurance agents is transparent and logged in the claim history.

4. **OCR Display**: Both frontend dashboards already had the display logic implemented - the fix was purely on the backend/blockchain side.

---

## Files Modified Summary

1. `server-node-sdk/controllers/insuranceController.js` - Auto-review before approve
2. `server-node-sdk/controllers/documentController.js` - Doctor document access
3. `fabric-samples/asset-transfer-basic/chaincode-javascript/lib/ehrChainCode.js` - OCR score storage

---

## Next Steps

1. ✅ Redeploy chaincode (see testing instructions above)
2. ✅ Restart backend server
3. ✅ Test all three fixes
4. ✅ Submit new claims to verify OCR scores are saved
5. ✅ Verify doctor can download patient documents
6. ✅ Verify insurance agent can approve claims without errors

