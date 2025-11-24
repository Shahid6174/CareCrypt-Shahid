# EHR CareCrypt - Complete API Documentation

## Base URL
```
http://localhost:5000
```

## Common Headers

### For Authenticated Requests
```json
{
  "Content-Type": "application/json",
  "x-userid": "user123"  // Required for protected endpoints
}
```

### For File Upload Requests
```json
{
  "Content-Type": "multipart/form-data",
  "x-userid": "user123"
}
```

## Standard Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... } // or [ ... ]
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description"
}
```

---

# Authentication Endpoints

## 1. Register Patient

Register a new patient account.

**Endpoint:** `POST /auth/registerPatient`

**Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "email": "patient@example.com",
  "password": "securePassword123",
  "name": "John Doe",
  "dob": "1990-01-01",
  "city": "New York",
  "doctorId": "doctor01" // Optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "userId": "P-abc123def456",
    "message": "Registration successful. Your userId has been generated. An admin will complete your blockchain registration shortly.",
    "needsAdminRegistration": true,
    "registrationData": {
      "adminId": "hospitalAdmin",
      "userId": "P-abc123def456",
      "name": "John Doe",
      "dob": "1990-01-01",
      "city": "New York",
      "doctorId": null
    }
  }
}
```

---

## 2. Register Doctor

Register a new doctor account.

**Endpoint:** `POST /auth/registerDoctor`

**Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "email": "doctor@example.com",
  "password": "securePassword123",
  "name": "Dr. Jane Smith",
  "hospitalId": "Hospital01",
  "city": "New York"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "userId": "D-abc123def456",
    "message": "Registration successful. Your userId has been generated. An admin will complete your blockchain registration shortly.",
    "needsAdminRegistration": true,
    "registrationData": {
      "adminId": "hospitalAdmin",
      "userId": "D-abc123def456",
      "name": "Dr. Jane Smith",
      "hospitalId": "Hospital01",
      "city": "New York"
    }
  }
}
```

---

## 3. Register Insurance Agent

Register a new insurance agent account.

**Endpoint:** `POST /auth/registerInsuranceAgent`

**Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "email": "agent@example.com",
  "password": "securePassword123",
  "name": "Agent John",
  "insuranceId": "Insurance01",
  "city": "New York"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "userId": "IA-abc123def456",
    "message": "Registration successful. Your userId has been generated. An admin will complete your blockchain registration shortly.",
    "needsAdminRegistration": true,
    "registrationData": {
      "adminId": "insuranceAdmin",
      "userId": "IA-abc123def456",
      "name": "Agent John",
      "insuranceId": "Insurance01",
      "city": "New York"
    }
  }
}
```

---

## 4. Login Patient

Login with patient credentials.

**Endpoint:** `POST /auth/loginPatient`

**Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "email": "patient@example.com",
  "password": "securePassword123"
}
```

**Response (Successful):**
```json
{
  "success": true,
  "data": {
    "success": true,
    "userId": "P-abc123def456",
    "role": "patient",
    "name": "John Doe",
    "registeredOnChain": true
  }
}
```

**Response (Needs Registration):**
```json
{
  "success": true,
  "data": {
    "needsRegistration": true,
    "message": "User not found. Please register first."
  }
}
```

**Response (Pending Blockchain Registration):**
```json
{
  "success": true,
  "data": {
    "needsChaincodeRegistration": true,
    "userId": "P-abc123def456",
    "message": "Please complete your registration on the blockchain. An admin will register you shortly."
  }
}
```

---

## 5. Login Doctor

Login with doctor credentials.

**Endpoint:** `POST /auth/loginDoctor`

**Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "email": "doctor@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "userId": "D-abc123def456",
    "role": "doctor",
    "name": "Dr. Jane Smith",
    "registeredOnChain": true
  }
}
```

---

## 6. Login Insurance Agent

Login with insurance agent credentials.

**Endpoint:** `POST /auth/loginInsuranceAgent`

**Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "email": "agent@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "userId": "IA-abc123def456",
    "role": "insuranceAgent",
    "name": "Agent John",
    "registeredOnChain": true
  }
}
```

---

## 7. Complete Patient Registration (Admin)

Complete patient blockchain registration.

**Endpoint:** `POST /auth/completePatientRegistration`

**Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "userId": "P-abc123def456",
  "adminId": "hospitalAdmin"  // Optional, defaults to hospitalAdmin
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "userId": "P-abc123def456",
    "chaincodeResult": "{ ... blockchain response ... }",
    "message": "Patient successfully registered on blockchain"
  }
}
```

---

## 8. Complete Doctor Registration (Admin)

Complete doctor blockchain registration.

**Endpoint:** `POST /auth/completeDoctorRegistration`

**Headers:**
```json
{
  "Content-Type": "application/json",
  "x-userid": "hospitalAdmin"
}
```

**Request Body:**
```json
{
  "userId": "D-abc123def456",
  "adminId": "hospitalAdmin"  // Optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "userId": "D-abc123def456",
    "chaincodeResult": "{ ... blockchain response ... }",
    "message": "Doctor successfully registered on blockchain"
  }
}
```

---

## 9. Complete Insurance Agent Registration (Admin)

Complete insurance agent blockchain registration.

**Endpoint:** `POST /auth/completeInsuranceAgentRegistration`

**Headers:**
```json
{
  "Content-Type": "application/json",
  "x-userid": "insuranceAdmin"
}
```

**Request Body:**
```json
{
  "userId": "IA-abc123def456",
  "adminId": "insuranceAdmin"  // Optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "userId": "IA-abc123def456",
    "chaincodeResult": "{ ... blockchain response ... }",
    "message": "Insurance agent successfully registered on blockchain"
  }
}
```

---

# Patient Endpoints

## 10. Submit Claim

Submit an insurance claim.

**Endpoint:** `POST /patient/claim/submit`

**Headers:**
```json
{
  "Content-Type": "application/json",
  "x-userid": "P-abc123def456"
}
```

**Request Body:**
```json
{
  "doctorId": "D-abc123",
  "policyId": "POL-12345",
  "hospitalId": "Hospital01",
  "claimAmount": 5000.00,
  "medicalRecordIds": ["R-abc123", "R-def456"],
  "claimType": "Surgery",
  "description": "Emergency appendectomy procedure",
  "documents": ["doc1.pdf", "doc2.pdf"],
  "documentIds": ["DOC-uuid-1", "DOC-uuid-2"]  // Optional: IDs of uploaded documents for fraud detection
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "claimId": "C-xyz789",
    "status": "pending",
    "message": "Claim submitted successfully",
    "verification": {
      "verified": true,
      "score": 25,
      "documentsAnalyzed": 2,
      "confidence": 25
    },
    "fraudStatus": {
      "previousAttempts": 0,
      "remainingAttempts": 3
    }
  }
}
```

**Response (Fraud Detected - Warning):**
```json
{
  "success": false,
  "fraudDetected": true,
  "message": "WARNING: Fraudulent claim detected! Attempt 1 of 3. Your claim has been rejected.",
  "details": {
    "fraudScore": 65,
    "confidence": 65,
    "attemptCount": 1,
    "remainingAttempts": 2,
    "isBlocked": false,
    "recommendations": [
      "Document contains multiple suspicious phrases",
      "Claim amount $5000 not found in supporting documents"
    ],
    "verificationSummary": {
      "documentsAnalyzed": 2,
      "issues": [
        {
          "fileName": "document1.pdf",
          "fraudScore": 70,
          "indicators": [
            {
              "type": "fraud_pattern",
              "severity": "high",
              "description": "Detected suspicious pattern #1"
            }
          ]
        }
      ]
    }
  }
}
```

**Response (Account Blocked - 3rd Attempt):**
```json
{
  "success": false,
  "fraudDetected": true,
  "message": "ACCOUNT BLOCKED: This is your third fraudulent claim attempt. Your account has been blocked. Contact support immediately.",
  "details": {
    "fraudScore": 75,
    "confidence": 75,
    "attemptCount": 3,
    "remainingAttempts": 0,
    "isBlocked": true
  }
}
```

---

## 11. Grant Doctor Access

Grant a doctor access to patient's medical records.

**Endpoint:** `POST /patient/grantAccess`

**Headers:**
```json
{
  "Content-Type": "application/json",
  "x-userid": "P-abc123def456"
}
```

**Request Body:**
```json
{
  "doctorIdToGrant": "D-abc123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Access granted successfully"
  }
}
```

---

## 12. Revoke Doctor Access

Revoke a doctor's access to patient's medical records.

**Endpoint:** `POST /patient/revokeAccess`

**Headers:**
```json
{
  "Content-Type": "application/json",
  "x-userid": "P-abc123def456"
}
```

**Request Body:**
```json
{
  "doctorIdToRevoke": "D-abc123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Access revoked successfully"
  }
}
```

---

## 13. Get Patient Claims

Retrieve all claims for a patient.

**Endpoint:** `GET /patient/:patientId/claims`

**Headers:**
```json
{
  "x-userid": "P-abc123def456"
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "claimId": "C-xyz789",
      "patientId": "P-abc123def456",
      "doctorId": "D-abc123",
      "policyId": "POL-12345",
      "hospitalId": "Hospital01",
      "claimAmount": 5000.00,
      "claimType": "Surgery",
      "description": "Emergency appendectomy procedure",
      "status": "pending",
      "submittedAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

## 14. Get Patient Medical Records

Retrieve all medical records for a patient.

**Endpoint:** `GET /patient/:patientId/records`

**Headers:**
```json
{
  "x-userid": "P-abc123def456"
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "recordId": "R-abc123",
      "patientId": "P-abc123def456",
      "doctorId": "D-abc123",
      "diagnosis": "Acute appendicitis",
      "treatment": "Appendectomy",
      "notes": "Patient recovered well post-surgery",
      "date": "2024-01-10T14:30:00Z"
    }
  ]
}
```

---

## 15. Get Patient Profile

Retrieve patient profile information.

**Endpoint:** `GET /patient/:patientId/profile`

**Headers:**
```json
{
  "x-userid": "P-abc123def456"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "patientId": "P-abc123def456",
    "name": "John Doe",
    "dob": "1990-01-01",
    "city": "New York",
    "doctorId": "D-abc123"
  }
}
```

---

## 16. Update Claim Documents

Update documents associated with a claim.

**Endpoint:** `POST /patient/claim/updateDocuments`

**Headers:**
```json
{
  "Content-Type": "application/json",
  "x-userid": "P-abc123def456"
}
```

**Request Body:**
```json
{
  "claimId": "C-xyz789",
  "documents": ["doc1.pdf", "doc2.pdf", "doc3.pdf"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Documents updated successfully"
  }
}
```

---

# Doctor Endpoints

## 17. Add Medical Record

Add a new medical record for a patient.

**Endpoint:** `POST /doctor/addRecord`

**Headers:**
```json
{
  "Content-Type": "application/json",
  "x-userid": "D-abc123"
}
```

**Request Body:**
```json
{
  "patientId": "P-abc123def456",
  "diagnosis": "Acute appendicitis",
  "prescription": "Pain medication, antibiotics",
  "notes": "Patient presented with severe abdominal pain. Surgery recommended."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "recordId": "R-abc123",
    "message": "Medical record added successfully"
  }
}
```

---

## 18. Verify Claim

Verify or reject an insurance claim.

**Endpoint:** `POST /doctor/claim/verify`

**Headers:**
```json
{
  "Content-Type": "application/json",
  "x-userid": "D-abc123"
}
```

**Request Body:**
```json
{
  "claimId": "C-xyz789",
  "verified": true,
  "notes": "Medical records reviewed. Claim is valid."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "claimId": "C-xyz789",
    "status": "verified",
    "message": "Claim verified successfully"
  }
}
```

---

## 19. Get Records by Patient

Get all medical records for a specific patient.

**Endpoint:** `GET /doctor/records/:patientId`

**Headers:**
```json
{
  "x-userid": "D-abc123"
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "recordId": "R-abc123",
      "patientId": "P-abc123def456",
      "doctorId": "D-abc123",
      "diagnosis": "Acute appendicitis",
      "treatment": "Appendectomy",
      "prescription": "Pain medication, antibiotics",
      "notes": "Patient recovered well post-surgery",
      "date": "2024-01-10T14:30:00Z"
    }
  ]
}
```

---

## 20. List Doctor's Patients

Get all patients assigned to a doctor.

**Endpoint:** `GET /doctor/:doctorId/patients`

**Headers:**
```json
{
  "x-userid": "D-abc123"
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "patientId": "P-abc123def456",
      "name": "John Doe",
      "dob": "1990-01-01",
      "city": "New York"
    }
  ]
}
```

---

## 21. Get Doctor Profile

Get doctor profile information.

**Endpoint:** `GET /doctor/:doctorId/profile`

**Headers:**
```json
{
  "x-userid": "D-abc123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "doctorId": "D-abc123",
    "name": "Dr. Jane Smith",
    "hospitalId": "Hospital01",
    "city": "New York"
  }
}
```

---

# Insurance Endpoints

## 22. Review Claim

Add review notes to a claim.

**Endpoint:** `POST /insurance/claim/review`

**Headers:**
```json
{
  "Content-Type": "application/json",
  "x-userid": "IA-abc123"
}
```

**Request Body:**
```json
{
  "claimId": "C-xyz789",
  "notes": "Reviewing claim documents and medical records."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "claimId": "C-xyz789",
    "message": "Review notes added successfully"
  }
}
```

---

## 23. Approve Claim

Approve an insurance claim.

**Endpoint:** `POST /insurance/claim/approve`

**Headers:**
```json
{
  "Content-Type": "application/json",
  "x-userid": "IA-abc123"
}
```

**Request Body:**
```json
{
  "claimId": "C-xyz789",
  "approvedAmount": 4500.00,
  "notes": "Claim approved after review. Partial amount approved."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "claimId": "C-xyz789",
    "status": "approved",
    "approvedAmount": 4500.00,
    "message": "Claim approved successfully"
  }
}
```

---

## 24. Reject Claim

Reject an insurance claim.

**Endpoint:** `POST /insurance/claim/reject`

**Headers:**
```json
{
  "Content-Type": "application/json",
  "x-userid": "IA-abc123"
}
```

**Request Body:**
```json
{
  "claimId": "C-xyz789",
  "reason": "Missing required documentation. Policy does not cover this procedure."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "claimId": "C-xyz789",
    "status": "rejected",
    "message": "Claim rejected"
  }
}
```

---

## 25. Get Claim Details

Get detailed information about a specific claim.

**Endpoint:** `GET /insurance/claim/:claimId`

**Headers:**
```json
{
  "x-userid": "IA-abc123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "claimId": "C-xyz789",
    "patientId": "P-abc123def456",
    "doctorId": "D-abc123",
    "policyId": "POL-12345",
    "hospitalId": "Hospital01",
    "claimAmount": 5000.00,
    "approvedAmount": 4500.00,
    "claimType": "Surgery",
    "description": "Emergency appendectomy procedure",
    "status": "approved",
    "submittedAt": "2024-01-15T10:30:00Z",
    "approvedAt": "2024-01-17T15:20:00Z"
  }
}
```

---

## 26. Get Claim Medical Records

Get medical records associated with a claim.

**Endpoint:** `GET /insurance/claim/:claimId/records`

**Headers:**
```json
{
  "x-userid": "IA-abc123"
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "recordId": "R-abc123",
      "patientId": "P-abc123def456",
      "diagnosis": "Acute appendicitis",
      "treatment": "Appendectomy",
      "date": "2024-01-10T14:30:00Z"
    }
  ]
}
```

---

## 27. Get Agent Profile

Get insurance agent profile information.

**Endpoint:** `GET /insurance/agent/:agentId/profile`

**Headers:**
```json
{
  "x-userid": "IA-abc123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "agentId": "IA-abc123",
    "name": "Agent John",
    "insuranceId": "Insurance01",
    "city": "New York"
  }
}
```

---

# Claim Endpoints

## 28. Get Claims by Status

Get all claims with a specific status.

**Endpoint:** `GET /claims/byStatus?status=pending`

**Headers:**
```json
{
  "x-userid": "IA-abc123"
}
```

**Query Parameters:**
- `status`: pending | approved | rejected | verified

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "claimId": "C-xyz789",
      "patientId": "P-abc123def456",
      "status": "pending",
      "claimAmount": 5000.00,
      "claimType": "Surgery"
    }
  ]
}
```

---

## 29. Get Claims by Patient

Get all claims for a specific patient.

**Endpoint:** `GET /claims/byPatient/:patientId`

**Headers:**
```json
{
  "x-userid": "P-abc123def456"
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "claimId": "C-xyz789",
      "patientId": "P-abc123def456",
      "doctorId": "D-abc123",
      "claimAmount": 5000.00,
      "status": "pending"
    }
  ]
}
```

---

## 30. Get Claims by Doctor

Get all claims associated with a specific doctor.

**Endpoint:** `GET /claims/byDoctor/:doctorId`

**Headers:**
```json
{
  "x-userid": "D-abc123"
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "claimId": "C-xyz789",
      "patientId": "P-abc123def456",
      "doctorId": "D-abc123",
      "claimAmount": 5000.00,
      "status": "pending"
    }
  ]
}
```

---

## 31. Get Claims by Hospital

Get all claims for a specific hospital.

**Endpoint:** `GET /claims/byHospital/:hospitalId`

**Headers:**
```json
{
  "x-userid": "hospitalAdmin"
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "claimId": "C-xyz789",
      "hospitalId": "Hospital01",
      "patientId": "P-abc123def456",
      "claimAmount": 5000.00,
      "status": "pending"
    }
  ]
}
```

---

# Admin Endpoints

## 32. Add Doctor

Onboard a doctor to the blockchain (assumes already registered).

**Endpoint:** `POST /admin/hospital/doctor/add`

**Headers:**
```json
{
  "Content-Type": "application/json",
  "x-userid": "hospitalAdmin"
}
```

**Request Body:**
```json
{
  "doctorId": "D-abc123",
  "hospitalId": "Hospital01",
  "name": "Dr. Jane Smith",
  "city": "New York"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "doctorId": "D-abc123",
    "message": "Doctor onboarded successfully"
  }
}
```

---

## 33. Assign Doctor to Hospital

Assign a doctor to a different hospital.

**Endpoint:** `POST /admin/hospital/doctor/assign`

**Headers:**
```json
{
  "Content-Type": "application/json",
  "x-userid": "hospitalAdmin"
}
```

**Request Body:**
```json
{
  "doctorId": "D-abc123",
  "hospitalId": "Hospital02"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Doctor assigned successfully"
  }
}
```

---

## 34. Add Insurance Agent

Onboard an insurance agent to the blockchain.

**Endpoint:** `POST /admin/insurance/agent/add`

**Headers:**
```json
{
  "Content-Type": "application/json",
  "x-userid": "insuranceAdmin"
}
```

**Request Body:**
```json
{
  "agentId": "IA-abc123",
  "insuranceId": "Insurance01",
  "name": "Agent John",
  "city": "New York"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "agentId": "IA-abc123",
    "message": "Insurance agent onboarded successfully"
  }
}
```

---

## 35. Assign Agent to Insurance Company

Assign an agent to a different insurance company.

**Endpoint:** `POST /admin/insurance/agent/assign`

**Headers:**
```json
{
  "Content-Type": "application/json",
  "x-userid": "insuranceAdmin"
}
```

**Request Body:**
```json
{
  "agentId": "IA-abc123",
  "insuranceId": "Insurance02"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Agent assigned successfully"
  }
}
```

---

## 36. List All Hospitals

Get list of all registered hospitals.

**Endpoint:** `GET /admin/hospitals`

**Headers:**
```json
{
  "x-userid": "hospitalAdmin"
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "hospitalId": "Hospital01",
      "name": "City General Hospital",
      "address": "123 Main St, New York"
    }
  ]
}
```

---

## 37. List All Doctors

Get list of all registered doctors.

**Endpoint:** `GET /admin/doctors`

**Headers:**
```json
{
  "x-userid": "hospitalAdmin"
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "doctorId": "D-abc123",
      "name": "Dr. Jane Smith",
      "hospitalId": "Hospital01",
      "city": "New York"
    }
  ]
}
```

---

## 38. List All Users

Get all users from the ledger (patients, doctors, agents).

**Endpoint:** `GET /admin/users`

**Headers:**
```json
{
  "x-userid": "hospitalAdmin"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "patients": [
      {
        "patientId": "P-abc123def456",
        "name": "John Doe",
        "city": "New York"
      }
    ],
    "doctors": [
      {
        "doctorId": "D-abc123",
        "name": "Dr. Jane Smith",
        "hospitalId": "Hospital01"
      }
    ],
    "agents": [
      {
        "agentId": "IA-abc123",
        "name": "Agent John",
        "insuranceId": "Insurance01"
      }
    ]
  }
}
```

---

## 39. Delete User

Delete a user from the ledger.

**Endpoint:** `DELETE /admin/user/:userId`

**Headers:**
```json
{
  "x-userid": "hospitalAdmin"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "User deleted successfully"
  }
}
```

---

# Document Management Endpoints

## 40. Upload Document

Upload a document (patient only).

**Endpoint:** `POST /documents/upload`

**Headers:**
```json
{
  "Content-Type": "multipart/form-data",
  "x-userid": "P-abc123def456"
}
```

**Request Body (Form Data):**
```
document: [file]
category: "medical_record"  // medical_record | prescription | lab_report | scan | insurance | other
description: "Lab test results from January 2024"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "document": {
      "documentId": "DOC-uuid-here",
      "fileName": "lab_results.pdf",
      "fileType": "application/pdf",
      "fileSize": 204800,
      "category": "lab_report",
      "description": "Lab test results from January 2024",
      "uploadedAt": "2024-01-15T10:30:00Z"
    },
    "message": "Document uploaded successfully"
  }
}
```

---

## 41. List User Documents

Get all documents uploaded by the user.

**Endpoint:** `GET /documents/list`

**Headers:**
```json
{
  "x-userid": "P-abc123def456"
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "documentId": "DOC-uuid-here",
      "fileName": "lab_results.pdf",
      "fileType": "application/pdf",
      "fileSize": 204800,
      "category": "lab_report",
      "description": "Lab test results from January 2024",
      "uploadedAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

## 42. Download Document

Download a specific document.

**Endpoint:** `GET /documents/download/:documentId`

**Headers:**
```json
{
  "x-userid": "P-abc123def456"
}
```

**Response:**
Binary file download with appropriate Content-Type and Content-Disposition headers.

---

## 43. Delete Document

Delete a specific document.

**Endpoint:** `DELETE /documents/:documentId`

**Headers:**
```json
{
  "x-userid": "P-abc123def456"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Document deleted successfully"
  }
}
```

---

## 44. Update Document Metadata

Update document category and description.

**Endpoint:** `PUT /documents/:documentId`

**Headers:**
```json
{
  "Content-Type": "application/json",
  "x-userid": "P-abc123def456"
}
```

**Request Body:**
```json
{
  "category": "prescription",
  "description": "Updated description"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "document": {
      "documentId": "DOC-uuid-here",
      "fileName": "lab_results.pdf",
      "fileType": "application/pdf",
      "fileSize": 204800,
      "category": "prescription",
      "description": "Updated description",
      "uploadedAt": "2024-01-15T10:30:00Z"
    },
    "message": "Document updated successfully"
  }
}
```

---

# Fraud Detection Endpoints 🆕

## 45. Get User Fraud Status

Check fraud detection status for a user.

**Endpoint:** `GET /fraud/status/:userId`

**Headers:**
```json
{
  "x-userid": "P-abc123def456"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "attemptCount": 2,
    "isBlocked": false,
    "warnings": [
      {
        "claimId": "C-xyz789",
        "reason": "Fraudulent claim detected by AI verification",
        "detectedAt": "2024-01-15T10:30:00Z",
        "fraudScore": 65,
        "details": "{...}"
      }
    ],
    "remainingAttempts": 1,
    "lastWarningAt": "2024-01-15T10:30:00Z"
  }
}
```

---

## 46. Get User Warning History

Get complete warning history for a user.

**Endpoint:** `GET /fraud/warnings/:userId`

**Headers:**
```json
{
  "x-userid": "P-abc123def456"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "P-abc123def456",
    "name": "John Doe",
    "email": "patient@example.com",
    "totalWarnings": 2,
    "attemptCount": 2,
    "isBlocked": false,
    "warnings": [
      {
        "claimId": "C-xyz789",
        "reason": "Fraudulent claim detected by AI verification",
        "detectedAt": "2024-01-15T10:30:00Z",
        "fraudScore": 65,
        "details": "..."
      }
    ]
  }
}
```

---

## 47. Get Fraudulent Users (Admin)

Get all users with fraud attempts.

**Endpoint:** `GET /fraud/users/fraudulent`

**Headers:**
```json
{
  "x-userid": "hospitalAdmin"
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "userId": "P-abc123def456",
      "name": "John Doe",
      "email": "patient@example.com",
      "role": "patient",
      "attemptCount": 2,
      "isBlocked": false,
      "blockedAt": null,
      "lastWarningAt": "2024-01-15T10:30:00Z",
      "warningCount": 2
    }
  ]
}
```

---

## 48. Get Blocked Users (Admin)

Get all blocked users.

**Endpoint:** `GET /fraud/users/blocked`

**Headers:**
```json
{
  "x-userid": "hospitalAdmin"
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "userId": "P-abc123def456",
      "name": "John Doe",
      "email": "patient@example.com",
      "role": "patient",
      "attemptCount": 3,
      "blockedAt": "2024-01-15T14:30:00Z",
      "warnings": [...]
    }
  ]
}
```

---

## 49. Unblock User (Admin)

Unblock a user who was blocked for fraud.

**Endpoint:** `POST /fraud/users/unblock/:userId`

**Headers:**
```json
{
  "Content-Type": "application/json",
  "x-userid": "hospitalAdmin"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "User P-abc123def456 has been unblocked",
    "userId": "P-abc123def456",
    "name": "John Doe"
  }
}
```

---

## 50. Get Fraud Statistics (Admin)

Get system-wide fraud detection statistics.

**Endpoint:** `GET /fraud/statistics`

**Headers:**
```json
{
  "x-userid": "hospitalAdmin"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalUsers": 150,
    "usersWithFraudAttempts": 12,
    "blockedUsers": 3,
    "fraudAttemptRate": "8.00%",
    "blockRate": "2.00%",
    "recentWarnings": {
      "count": 8,
      "avgFraudScore": "62.50"
    },
    "period": "Last 30 days"
  }
}
```

---

# Ledger Endpoints

## 51. Fetch Ledger

Fetch the entire ledger state.

**Endpoint:** `POST /ledger/fetch`

**Headers:**
```json
{
  "Content-Type": "application/json",
  "x-userid": "hospitalAdmin"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "ledgerState": "{ ... complete ledger state ... }"
  }
}
```

---

## 52. Query Asset History

Get the transaction history of a specific asset.

**Endpoint:** `GET /ledger/history/:assetId`

**Headers:**
```json
{
  "x-userid": "hospitalAdmin"
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "txId": "abc123...",
      "timestamp": "2024-01-15T10:30:00Z",
      "isDelete": false,
      "value": {
        "assetId": "C-xyz789",
        "status": "pending"
      }
    },
    {
      "txId": "def456...",
      "timestamp": "2024-01-17T15:20:00Z",
      "isDelete": false,
      "value": {
        "assetId": "C-xyz789",
        "status": "approved"
      }
    }
  ]
}
```

---

# Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 400 | Bad Request - Invalid payload |
| 401 | Unauthorized - Missing or invalid x-userid |
| 404 | Not Found - Resource doesn't exist |
| 500 | Internal Server Error |

---

# Fraud Detection System 🔒

## Overview
The system uses **AI-powered OCR and pattern recognition** to detect fraudulent insurance claims in real-time.

## How It Works

### 1. Document Analysis (OCR)
- **Tesseract.js** extracts text from uploaded documents
- Analyzes medical terminology presence
- Detects suspicious keywords (fake, forged, counterfeit, etc.)
- Checks document authenticity

### 2. Pattern Recognition
- Fraud keyword detection
- Medical term validation (minimum 2 required)
- Suspicious language detection
- Document structure analysis

### 3. Cross-Verification
- Claim amount matches documents
- Description matches document content
- Valid claim type verification

### 4. Fraud Scoring
```
Score 0-39:   Legitimate ✅
Score 40-49:  Suspicious ⚠️
Score 50+:    Fraudulent ❌
```

### 5. User Protection
- **Warning 1:** First fraudulent attempt - claim rejected, warning issued
- **Warning 2:** Second attempt - claim rejected, final warning
- **Warning 3:** Third attempt - **ACCOUNT BLOCKED** permanently

### 6. Admin Controls
- View all fraudulent users
- View blocked users
- Unblock users with reason
- View fraud statistics
- Access user warning history

## Fraud Detection Indicators

| Indicator | Points | Severity |
|-----------|--------|----------|
| Fraud keywords (fake, forged, etc.) | 25 | High |
| Missing medical terms | 15 | Medium |
| Suspicious language | 20 | High |
| Low OCR confidence (<60%) | 10 | Low |
| Insufficient content (<100 chars) | 10 | Low |
| Missing required fields | 15 | Medium |
| Small file size (<50KB) | 20 | Medium |
| Amount mismatch | 15 | Medium |
| Description mismatch | 10 | Low |
| Invalid claim type | 10 | Low |

## Best Practices

1. **Always attach legitimate medical documents** when submitting claims
2. **Ensure documents are clear** and readable (high OCR confidence)
3. **Use proper medical terminology** in descriptions
4. **Match claim amounts** with document amounts
5. **Provide complete information** in all fields

---

# Notes

1. **Authentication**: Most endpoints require the `x-userid` header for authentication
2. **File Uploads**: Maximum file size is 10MB
3. **Supported File Types**: PDF, JPEG, PNG, GIF, DOC, DOCX, XLS, XLSX
4. **Date Format**: ISO 8601 (e.g., "2024-01-15T10:30:00Z")
5. **Amounts**: All monetary amounts are in decimal format (e.g., 5000.00)
6. **IDs**: Generated automatically with prefixes:
   - Patient: `P-`
   - Doctor: `D-`
   - Insurance Agent: `IA-`
   - Claim: `C-`
   - Record: `R-`
   - Document: `DOC-`
7. **Fraud Detection**: Automatically runs on claim submission when documents are provided
8. **Account Blocking**: After 3 fraudulent attempts, users are permanently blocked (admin can unblock)

---

# Testing with Postman

Import the `EHR-CARECRYPT-API.postman_collection.json` file to get all endpoints pre-configured.

Example environment variables:
```json
{
  "baseUrl": "http://localhost:5000",
  "patientUserId": "P-abc123def456",
  "doctorUserId": "D-abc123",
  "agentUserId": "IA-abc123"
}
```

---

**Last Updated:** November 24, 2025  
**API Version:** 1.0.0  
**Base URL:** http://localhost:5000  
**Total Endpoints:** 52 (including 6 fraud detection endpoints) 🔒

