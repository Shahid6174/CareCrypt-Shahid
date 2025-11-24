const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const requireUser = require('../middleware/requireUser');
const upload = require('../config/upload');

// Upload document
router.post('/upload', requireUser, upload.single('document'), documentController.uploadDocument);

// Get user documents
router.get('/list', requireUser, documentController.getDocuments);

// Download document
router.get('/download/:documentId', requireUser, documentController.downloadDocument);

// Delete document
router.delete('/:documentId', requireUser, documentController.deleteDocument);

// Update document metadata
router.put('/:documentId', requireUser, documentController.updateDocument);

module.exports = router;

