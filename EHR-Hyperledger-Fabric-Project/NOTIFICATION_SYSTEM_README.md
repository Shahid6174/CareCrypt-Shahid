# 🔔 Notification System Documentation

**EHR CareCrypt Notification System**  
**Version:** 1.0.0  
**Last Updated:** November 24, 2025

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Notification Types](#notification-types)
4. [User-Specific Notifications](#user-specific-notifications)
5. [API Endpoints](#api-endpoints)
6. [Frontend Integration](#frontend-integration)
7. [Backend Implementation](#backend-implementation)
8. [Usage Examples](#usage-examples)
9. [Best Practices](#best-practices)

---

## Overview

The EHR CareCrypt Notification System provides **real-time, role-based notifications** for all user types (patients, doctors, insurance agents, and admins). It ensures users stay informed about critical events like claim status changes, fraud warnings, access grants, and more.

### ✨ Key Features

- ✅ **Real-time notifications** with 30-second polling
- ✅ **Role-based notifications** for each user type
- ✅ **Priority levels**: Low, Medium, High, Urgent
- ✅ **Unread count badge** on notification bell
- ✅ **Mark as read/unread** functionality
- ✅ **Action buttons** for quick navigation
- ✅ **Auto-expiration** after 30 days
- ✅ **Persistent storage** in MongoDB
- ✅ **Modern UI** with dropdown interface

---

## Architecture

### 🏗️ System Components

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend (React)                     │
│  ┌──────────────────────────────────────────────────┐  │
│  │         NotificationBell Component                │  │
│  │  - Bell icon with unread count badge             │  │
│  │  - Dropdown with notifications list              │  │
│  │  - Mark as read/delete actions                   │  │
│  │  - Auto-refresh every 30 seconds                 │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                           ↕️ API Calls
┌─────────────────────────────────────────────────────────┐
│                  Backend (Node.js/Express)              │
│  ┌──────────────────────────────────────────────────┐  │
│  │        Notification Routes & Controller           │  │
│  │  - GET /notifications (list)                      │  │
│  │  - GET /notifications/unread-count                │  │
│  │  - PUT /notifications/:id/read                    │  │
│  │  - DELETE /notifications/:id                      │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │         Notification Service                      │  │
│  │  - createNotification()                           │  │
│  │  - notifyClaimSubmitted()                         │  │
│  │  - notifyFraudWarning()                           │  │
│  │  - notifyAccessGranted()                          │  │
│  │  - ... (role-specific methods)                    │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                           ↕️ Database
┌─────────────────────────────────────────────────────────┐
│                    MongoDB Database                      │
│  ┌──────────────────────────────────────────────────┐  │
│  │         Notification Collection                   │  │
│  │  - userId (indexed)                               │  │
│  │  - userRole                                       │  │
│  │  - type                                           │  │
│  │  - title, message                                 │  │
│  │  - priority, read                                 │  │
│  │  - data, actionUrl                                │  │
│  │  - createdAt (auto-expire after 30 days)         │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## Notification Types

### 📝 All Notification Types

| Type | Description | Users |
|------|-------------|-------|
| `claim_submitted` | Claim submitted successfully | Patient, Doctor |
| `claim_approved` | Claim approved by insurance | Patient, Agent |
| `claim_rejected` | Claim rejected by insurance | Patient, Agent |
| `claim_verified` | Claim verified by doctor | Doctor |
| `fraud_warning` | Fraudulent claim detected | Patient, Agent, Admin |
| `account_blocked` | Account blocked due to fraud | Patient, Admin |
| `access_granted` | Access granted to doctor | Patient, Doctor |
| `access_revoked` | Access revoked from doctor | Patient |
| `document_uploaded` | Document uploaded | Patient |
| `record_added` | Medical record added | Doctor |
| `registration_approved` | Registration approved | Admin |
| `registration_rejected` | Registration rejected | Admin |
| `user_unblocked` | User unblocked by admin | Admin |
| `system_alert` | System-wide alert | Admin |

---

## User-Specific Notifications

### 👤 Patient Notifications

#### 1. Claim Submitted ✅
```javascript
await notificationService.notifyClaimSubmitted(patientId, {
  claimId: 'C12345',
  claimAmount: 5000
});
```
**Result:**
- Title: "✅ Claim Submitted Successfully"
- Message: "Your insurance claim for $5000 has been submitted and is pending review."
- Priority: Medium
- Action: "View Claim" → `/patient/claims`

#### 2. Claim Approved 🎉
```javascript
await notificationService.notifyClaimApproved(patientId, {
  claimId: 'C12345',
  amount: 5000,
  amountApproved: 4800
});
```
**Result:**
- Title: "🎉 Claim Approved!"
- Message: "Great news! Your claim for $5000 has been approved. Amount: $4800"
- Priority: High
- Action: "View Details" → `/patient/claims`

#### 3. Claim Rejected ❌
```javascript
await notificationService.notifyClaimRejected(patientId, {
  claimId: 'C12345',
  reason: 'Insufficient documentation'
});
```
**Result:**
- Title: "❌ Claim Rejected"
- Message: "Your claim has been rejected. Reason: Insufficient documentation"
- Priority: High
- Action: "View Details" → `/patient/claims`

#### 4. Fraud Warning ⚠️
```javascript
await notificationService.notifyFraudWarning(patientId, {
  attemptCount: 1,
  remainingAttempts: 2,
  fraudScore: 65
});
```
**Result:**
- Title: "⚠️ Fraud Warning"
- Message: "Fraud detected! Attempt 1 of 3. Please ensure your documents are genuine."
- Priority: Urgent
- Action: "View Status" → `/patient/profile`

#### 5. Account Blocked 🚫
```javascript
await notificationService.notifyAccountBlocked(patientId, 
  'multiple fraudulent claim attempts'
);
```
**Result:**
- Title: "🚫 Account Blocked"
- Message: "Your account has been blocked due to multiple fraudulent claim attempts. Please contact support."
- Priority: Urgent
- Action: "Contact Support" → `/patient/support`

#### 6. Access Granted 🔓
```javascript
await notificationService.notifyAccessGranted(patientId, {
  doctorId: 'D123',
  doctorName: 'Dr. Smith'
});
```
**Result:**
- Title: "🔓 Access Granted"
- Message: "You granted access to Dr. Smith to view your medical records."
- Priority: Low
- Action: "Manage Access" → `/patient/access`

#### 7. Access Revoked 🔒
```javascript
await notificationService.notifyAccessRevoked(patientId, {
  doctorId: 'D123',
  doctorName: 'Dr. Smith'
});
```
**Result:**
- Title: "🔒 Access Revoked"
- Message: "You revoked access from Dr. Smith."
- Priority: Low
- Action: "Manage Access" → `/patient/access`

---

### 👨‍⚕️ Doctor Notifications

#### 1. New Patient Access 🔓
```javascript
await notificationService.notifyNewPatientAccess(doctorId, {
  patientId: 'P123',
  patientName: 'John Doe'
});
```
**Result:**
- Title: "🔓 New Patient Access"
- Message: "John Doe granted you access to their medical records."
- Priority: Medium
- Action: "View Patient" → `/doctor/patients`

#### 2. Claim Verification Needed 📋
```javascript
await notificationService.notifyClaimToVerify(doctorId, {
  claimId: 'C12345',
  amount: 5000
});
```
**Result:**
- Title: "📋 Claim Verification Needed"
- Message: "A new claim for $5000 requires your verification."
- Priority: High
- Action: "Review Claim" → `/doctor/claims`

#### 3. Claim Verified ✅
```javascript
await notificationService.notifyClaimVerified(doctorId, {
  claimId: 'C12345'
});
```
**Result:**
- Title: "✅ Claim Verified"
- Message: "You successfully verified claim C12345."
- Priority: Low
- Action: "View Claim" → `/doctor/claims`

#### 4. Record Added 📝
```javascript
await notificationService.notifyRecordAdded(doctorId, {
  patientId: 'P123',
  recordId: 'R456'
});
```
**Result:**
- Title: "📝 Medical Record Added"
- Message: "Medical record for patient P123 has been added successfully."
- Priority: Low
- Action: "View Records" → `/doctor/records`

---

### 🏥 Insurance Agent Notifications

#### 1. New Claim for Review 📋
```javascript
await notificationService.notifyNewClaimForReview(agentId, {
  claimId: 'C12345',
  amount: 5000,
  patientName: 'John Doe'
});
```
**Result:**
- Title: "📋 New Claim for Review"
- Message: "New claim submitted for $5000. Patient: John Doe"
- Priority: High
- Action: "Review Claim" → `/insurance/claims`

#### 2. Claim Approved ✅
```javascript
await notificationService.notifyClaimApprovedByAgent(agentId, {
  claimId: 'C12345',
  amount: 4800
});
```
**Result:**
- Title: "✅ Claim Approved"
- Message: "You approved claim C12345 for $4800."
- Priority: Medium
- Action: "View Claim" → `/insurance/claims`

#### 3. Claim Rejected ❌
```javascript
await notificationService.notifyClaimRejectedByAgent(agentId, {
  claimId: 'C12345',
  reason: 'Insufficient documentation'
});
```
**Result:**
- Title: "❌ Claim Rejected"
- Message: "You rejected claim C12345. Reason: Insufficient documentation"
- Priority: Medium
- Action: "View Claim" → `/insurance/claims`

#### 4. Fraud Detected ⚠️
```javascript
await notificationService.notifyFraudDetected(agentId, {
  patientId: 'P123',
  fraudScore: 75
});
```
**Result:**
- Title: "⚠️ Fraud Detected"
- Message: "Fraudulent claim detected from patient P123. Score: 75/100"
- Priority: Urgent
- Action: "Review Details" → `/insurance/fraud`

---

### 👑 Admin Notifications

#### 1. New Registration Request 👤
```javascript
await notificationService.notifyNewRegistration(adminId, {
  role: 'doctor',
  name: 'Dr. Smith',
  email: 'smith@hospital.com'
});
```
**Result:**
- Title: "👤 New Registration Request"
- Message: "New doctor registration: Dr. Smith (smith@hospital.com)"
- Priority: High
- Action: "Review Request" → `/admin/requests`

#### 2. User Blocked 🚫
```javascript
await notificationService.notifyUserBlocked(adminId, {
  userId: 'P123',
  reason: 'fraud attempts'
});
```
**Result:**
- Title: "🚫 User Blocked"
- Message: "User P123 has been automatically blocked due to fraud attempts."
- Priority: Urgent
- Action: "View Details" → `/admin/fraud`

#### 3. Fraud Alert ⚠️
```javascript
await notificationService.notifyFraudAlert(adminId, {
  count: 5,
  users: 3
});
```
**Result:**
- Title: "⚠️ Fraud Alert"
- Message: "Multiple fraud attempts detected today: 5 attempts across 3 users."
- Priority: Urgent
- Action: "View Dashboard" → `/admin/fraud`

#### 4. System Alert 🔔
```javascript
await notificationService.notifySystemAlert(adminId, {
  message: 'Database backup completed successfully',
  priority: 'low',
  actionUrl: '/admin/system'
});
```
**Result:**
- Title: "🔔 System Alert"
- Message: "Database backup completed successfully"
- Priority: Low
- Action: "View Details" → `/admin/system`

---

## API Endpoints

### Base URL
```
http://localhost:5000/notifications
```

### 1. Get User Notifications
```http
GET /notifications
```

**Query Parameters:**
- `limit` (optional): Number of notifications to return (default: 50)
- `skip` (optional): Number of notifications to skip (default: 0)
- `unreadOnly` (optional): Return only unread notifications (true/false)
- `type` (optional): Filter by notification type

**Response:**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "_id": "abc123",
        "userId": "P123",
        "userRole": "patient",
        "type": "claim_approved",
        "title": "🎉 Claim Approved!",
        "message": "Great news! Your claim for $5000 has been approved.",
        "priority": "high",
        "read": false,
        "data": { "claimId": "C12345", "amount": 5000 },
        "actionUrl": "/patient/claims",
        "actionLabel": "View Details",
        "createdAt": "2025-11-24T10:30:00.000Z"
      }
    ],
    "unreadCount": 5,
    "totalCount": 23
  }
}
```

### 2. Get Unread Count
```http
GET /notifications/unread-count
```

**Response:**
```json
{
  "success": true,
  "data": {
    "unreadCount": 5
  }
}
```

### 3. Mark Notification as Read
```http
PUT /notifications/:notificationId/read
```

**Response:**
```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

### 4. Mark All as Read
```http
PUT /notifications/read-all
```

**Response:**
```json
{
  "success": true,
  "message": "All notifications marked as read",
  "modifiedCount": 5
}
```

### 5. Delete Notification
```http
DELETE /notifications/:notificationId
```

**Response:**
```json
{
  "success": true,
  "message": "Notification deleted"
}
```

### 6. Get Notification Statistics
```http
GET /notifications/statistics
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 23,
    "unread": 5,
    "byType": {
      "claim_submitted": 10,
      "claim_approved": 5,
      "fraud_warning": 2
    },
    "byPriority": {
      "urgent": 2,
      "high": 8,
      "medium": 10,
      "low": 3
    }
  }
}
```

---

## Frontend Integration

### 1. Install NotificationBell Component

Add the `NotificationBell` component to your navigation or header:

```jsx
import NotificationBell from './components/NotificationBell';

function Header() {
  return (
    <header className="flex items-center justify-between p-4">
      <h1>EHR CareCrypt</h1>
      <div className="flex items-center space-x-4">
        <NotificationBell />
        <UserMenu />
      </div>
    </header>
  );
}
```

### 2. Component Features

- **Bell Icon**: Shows notification count badge
- **Dropdown**: Displays recent 10 notifications
- **Auto-refresh**: Polls for new notifications every 30 seconds
- **Mark as Read**: Click notification or use "Mark all as read"
- **Delete**: Remove individual notifications
- **Navigate**: Click on notification to go to action URL

---

## Backend Implementation

### 1. Creating Notifications

In any controller where an event occurs:

```javascript
const notificationService = require('../services/notificationService');

// Example: After claim submission
const result = await invoke.invokeTransaction('submitClaim', payload, userId);

await notificationService.notifyClaimSubmitted(userId, {
  claimId: result.claimId,
  claimAmount: payload.claimAmount
});
```

### 2. Custom Notifications

Create custom notifications using the base method:

```javascript
await notificationService.createNotification({
  userId: 'P123',
  userRole: 'patient',
  type: 'system_alert',
  title: 'Maintenance Notice',
  message: 'System will be down for maintenance on Sunday',
  priority: 'medium',
  data: { maintenanceDate: '2025-11-30' },
  actionUrl: null,
  actionLabel: null,
  expiresAt: new Date('2025-11-30')
});
```

---

## Usage Examples

### Example 1: Patient Submits Claim

```javascript
// In patientController.js
exports.submitClaim = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const payload = { /* claim data */ };
    
    // Submit to blockchain
    const result = await invoke.invokeTransaction('submitClaim', payload, userId);
    
    // Notify patient
    await notificationService.notifyClaimSubmitted(userId, {
      claimId: result.claimId,
      claimAmount: payload.claimAmount
    });
    
    // Notify insurance agent (if assigned)
    if (payload.insuranceAgentId) {
      await notificationService.notifyNewClaimForReview(
        payload.insuranceAgentId,
        {
          claimId: result.claimId,
          amount: payload.claimAmount,
          patientName: 'Patient Name'
        }
      );
    }
    
    res.status(200).send(responses.ok(result));
  } catch (err) {
    next(err);
  }
};
```

### Example 2: Fraud Detection Triggers

```javascript
// In fraudDetectionService.js
if (verificationResults.isFraudulent) {
  const fraudRecord = await recordFraudAttempt(userId, claimId, verificationResults);
  
  // Notify patient
  await notificationService.notifyFraudWarning(userId, {
    attemptCount: fraudRecord.attemptCount,
    remainingAttempts: fraudRecord.remainingAttempts,
    fraudScore: verificationResults.overallScore
  });
  
  // If blocked, notify patient and admin
  if (fraudRecord.isBlocked) {
    await notificationService.notifyAccountBlocked(
      userId,
      'multiple fraudulent claim attempts'
    );
    
    // Notify admin
    const admins = await User.find({ role: 'admin' });
    for (const admin of admins) {
      await notificationService.notifyUserBlocked(admin.userId, {
        userId: userId,
        reason: 'fraud attempts'
      });
    }
  }
}
```

---

## Best Practices

### 1. **Always Notify Users**
- Notify users immediately after important events
- Include clear, actionable messages
- Provide action buttons for quick navigation

### 2. **Set Appropriate Priorities**
```javascript
// Urgent: Account-blocking, security issues
priority: 'urgent'

// High: Claim approvals/rejections, verification needed
priority: 'high'

// Medium: Claim submissions, routine updates
priority: 'medium'

// Low: Access changes, document uploads
priority: 'low'
```

### 3. **Include Contextual Data**
```javascript
data: {
  claimId: 'C12345',
  amount: 5000,
  patientName: 'John Doe',
  // ... other relevant info
}
```

### 4. **Provide Action URLs**
```javascript
actionUrl: '/patient/claims',
actionLabel: 'View Claim'
```

### 5. **Handle Errors Gracefully**
```javascript
try {
  await notificationService.notifyClaimSubmitted(userId, data);
} catch (error) {
  console.error('Failed to send notification:', error);
  // Don't fail the main operation
}
```

---

## 🎉 Summary

The EHR CareCrypt Notification System provides a **comprehensive, real-time notification experience** for all users. With role-based notifications, priority levels, and an intuitive UI, users stay informed about all critical events in the system.

**Key Benefits:**
- ✅ Improved user engagement
- ✅ Real-time updates
- ✅ Better transparency
- ✅ Enhanced security awareness
- ✅ Streamlined workflows

---

**Last Updated:** November 24, 2025  
**Version:** 1.0.0  
**Maintained By:** EHR CareCrypt Team

