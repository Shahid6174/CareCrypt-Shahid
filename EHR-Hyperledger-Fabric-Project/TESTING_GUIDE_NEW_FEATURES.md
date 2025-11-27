# Testing Guide - New Features

## Quick Reference for Testing the Resolved Issues

---

## 🔍 Issue 1: Insurance Agent Claim Assignment

### Test Steps:

1. **As Patient**:
   ```
   - Login as patient
   - Navigate to Claims tab
   - Submit a new claim with required documents
   - Note the claim ID
   ```

2. **As Doctor**:
   ```
   - Login as doctor
   - Navigate to Claims tab
   - Find the patient's claim
   - Click "Approve" and add notes
   - Submit verification
   ```

3. **Check Backend Logs**:
   ```
   - Should see: "Assigned to agent [agentId]" in claim history
   ```

4. **As Insurance Agent**:
   ```
   - Login as insurance agent
   - Navigate to Claims tab
   - Verify you see the approved claim
   - Should show status: PENDING_INSURANCE_REVIEW
   ```

### Expected Results:
✅ Claim automatically assigned to a random insurance agent
✅ Insurance agent sees the claim in their dashboard
✅ Claim shows assigned agent ID in history

---

## 📄 Issue 2: Documents & OCR Scores

### Test Steps:

#### A. Document Requirement Test

1. **Without Documents**:
   ```
   - Login as patient
   - Try to submit claim without uploading documents
   - Expected: Error message "Please attach at least one medical document"
   ```

2. **With Documents**:
   ```
   - Upload documents first in Documents tab
   - Submit claim with documents attached
   - Expected: Claim submitted successfully with confidence score
   ```

#### B. Score Display Test

1. **Patient View**:
   ```
   - Login as patient
   - Go to Claims tab
   - Look for "Confidence: XX.X%" badge on each claim
   - Badge color:
     - Green: ≥75% (High confidence)
     - Yellow: 55-74% (Moderate)
     - Red: <55% (Low)
   ```

2. **Doctor View**:
   ```
   - Login as doctor
   - Go to Claims tab
   - Look for "AI Confidence: XX.X%" badge
   - Same color coding as above
   ```

3. **Insurance Agent View**:
   ```
   - Login as insurance agent
   - Go to Claims tab
   - Look for "AI Score: XX.X%" badge
   - Same color coding as above
   ```

#### C. Score Range Test

1. **Check Multiple Claims**:
   ```
   - Submit several claims with different document quality
   - Check that all scores are between 10% and 90%
   - Expected: NEVER 0% or 100%
   ```

#### D. Document Viewing (Doctor)

1. **View Documents**:
   ```
   - Login as doctor
   - Navigate to Claims tab
   - Find a claim with documents
   - Look for document cards with "View" buttons
   - Click "View" to download
   - Expected: Document downloads successfully
   ```

### Expected Results:
✅ Claims without documents are rejected
✅ All confidence scores are between 10-90%
✅ Scores displayed at all three levels (Patient, Doctor, Insurance)
✅ Doctors can view and download claim documents

---

## 📊 Issue 3: Patient History & Documents

### Test Steps:

#### A. Records Tab Enhancement

1. **Navigate to Records**:
   ```
   - Login as patient
   - Click on "Medical Records" tab
   - Expected to see TWO sections:
     1. Medical Records (with count)
     2. Claims History (with count)
   ```

2. **Check Medical Records Section**:
   ```
   - Should show all medical records
   - Each record displays:
     - Record ID
     - Diagnosis
     - Treatment
     - Doctor ID
     - Date/Timestamp
     - Notes (if any)
   ```

3. **Check Claims History Section**:
   ```
   - Should show all claims ever submitted
   - Each claim displays:
     - Claim ID
     - Status badge (color-coded)
     - Type
     - Amount
     - Submission date
     - Confidence score
   ```

#### B. Documents Tab Enhancement

1. **Navigate to Documents**:
   ```
   - Login as patient
   - Click on "Documents" tab
   - Expected to see TWO sections:
     1. Uploaded Documents (with count)
     2. Claim Documents
   ```

2. **Check Uploaded Documents Section**:
   ```
   - Shows all documents uploaded via upload form
   - Each document displays:
     - File name with icon
     - Category badge (color-coded)
     - File type, size, upload date
     - Download and Delete buttons
   ```

3. **Check Claim Documents Section**:
   ```
   - Shows documents organized by claim
   - Each claim group shows:
     - Claim ID
     - Claim status badge
     - List of documents attached to that claim
     - Download button for each document
   ```

4. **Test Document Download**:
   ```
   - Click download button on any document
   - Expected: Document downloads successfully
   ```

### Expected Results:
✅ Records tab shows complete history (records + claims)
✅ Documents tab shows both uploaded and claim documents
✅ All data properly organized and displayed
✅ Download functionality works for all documents

---

## 🎯 Complete End-to-End Test

### Scenario: Full Claim Lifecycle

1. **Patient Uploads Documents**:
   ```
   - Login as patient
   - Go to Documents tab
   - Upload a medical bill PDF
   - Note the document ID
   ```

2. **Patient Submits Claim**:
   ```
   - Go to Claims tab
   - Click "Submit New Claim"
   - Fill in all fields
   - Ensure document is selected from uploaded documents
   - Submit claim
   - Note: Should see confidence score (10-90%)
   ```

3. **Patient Checks History**:
   ```
   - Go to Records tab
   - Verify claim appears in Claims History section
   - Go to Documents tab
   - Verify document appears in Claim Documents section
   ```

4. **Doctor Reviews Claim**:
   ```
   - Login as doctor
   - Go to Claims tab
   - Find the patient's claim
   - Check AI Confidence score is displayed
   - Click on document to view/download it
   - Approve the claim with notes
   ```

5. **Insurance Agent Processes**:
   ```
   - Login as insurance agent
   - Go to Claims tab
   - Verify claim appears (randomly assigned)
   - Check AI Score is displayed
   - Process the claim (approve/reject)
   ```

6. **Patient Sees Final Result**:
   ```
   - Login as patient
   - Check claim status updated
   - Go to Records tab
   - Verify claim shows final status in history
   ```

### Expected Results:
✅ Complete flow works seamlessly
✅ All features working at each step
✅ Data consistency across all views

---

## 🐛 Potential Issues to Watch For

### Issue 1 Related:
- ❌ Insurance agent sees no claims → Check if agent is registered in blockchain
- ❌ Claim not assigned → Check backend logs for agent assignment errors

### Issue 2 Related:
- ❌ Can submit without documents → Check frontend validation and backend endpoint
- ❌ Score shows 0% or 100% → Check fraudDetectionService normalization
- ❌ Score not displayed → Check if `genuineScore` field exists in claim object

### Issue 3 Related:
- ❌ Records tab empty → Check if records API is returning data
- ❌ Claim documents not showing → Check if claim has `documents` array populated
- ❌ Download fails → Check document storage and `/documents/download/:id` endpoint

---

## 📝 API Endpoints to Test

### New Endpoint:
```
GET /insurance/claims/assigned
Headers: Authorization: Bearer <token>
Response: Array of claims assigned to logged-in agent
```

### Modified Endpoints:
```
POST /patient/claim/submit
Body: {
  ...claimData,
  documents: [...],
  documentIds: [...]  // NEW: Required, must not be empty
}
Response: 400 if documentIds empty, otherwise claim with genuineScore
```

### Existing Endpoints Used:
```
GET /documents/download/:documentId
GET /patient/:patientId/records
GET /patient/:patientId/claims
```

---

## 🔧 Troubleshooting Commands

### Check Chaincode Deployment:
```bash
# In fabric network
peer lifecycle chaincode querycommitted -C channel1 -n ehrcc
```

### Check Backend Logs:
```bash
# In server-node-sdk directory
pm2 logs server  # or
tail -f logs/app.log
```

### Check Frontend Console:
```
Open browser DevTools (F12)
Check Console tab for errors
Check Network tab for API calls
```

---

## ✅ Success Criteria Checklist

### Issue 1: Agent Assignment
- [ ] Claims automatically assigned after doctor approval
- [ ] Insurance agent can see assigned claims
- [ ] Multiple agents get distributed claims fairly

### Issue 2: Documents & Scores
- [ ] Cannot submit claim without documents
- [ ] All scores between 10-90%
- [ ] Scores visible to patient, doctor, and insurance agent
- [ ] Doctors can download claim documents

### Issue 3: History & Documents
- [ ] Records tab shows all medical records
- [ ] Records tab shows all claims history
- [ ] Documents tab shows uploaded documents
- [ ] Documents tab shows claim documents
- [ ] All downloads work correctly

---

## 📞 Need Help?

If you encounter issues:

1. Check the `ISSUE_RESOLUTION_SUMMARY.md` for detailed technical information
2. Review API logs for error messages
3. Verify chaincode is properly deployed
4. Check browser console for frontend errors
5. Ensure all services are running (blockchain network, backend server, frontend)

---

**Happy Testing! 🎉**

