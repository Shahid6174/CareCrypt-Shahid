const User = require('../models/User');
const path = require('path');
const fs = require('fs');
const responses = require('../utils/responses');
const rewardService = require('../services/rewardService');
const { v4: uuidv4 } = require('uuid');

// Upload document
exports.uploadDocument = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { category, description } = req.body;

    if (!req.file) {
      return res.status(400).send(responses.error('No file uploaded'));
    }

    // Find user
    const user = await User.findOne({ userId });
    if (!user) {
      // Delete uploaded file if user not found
      fs.unlinkSync(req.file.path);
      return res.status(404).send(responses.error('User not found'));
    }

    // Create document record
    const documentId = uuidv4();
    const document = {
      documentId,
      fileName: req.file.originalname,
      filePath: req.file.path,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      category: category || 'other',
      description: description || '',
      uploadedAt: new Date()
    };

    // Add document to user
    user.documents.push(document);
    user.updatedAt = new Date();
    await user.save();

    // Award coins for document upload
    const rewardResult = await rewardService.rewardDocumentUploaded(userId, documentId);

    res.status(200).send(responses.ok({
      success: true,
      document: {
        documentId: document.documentId,
        fileName: document.fileName,
        fileType: document.fileType,
        fileSize: document.fileSize,
        category: document.category,
        description: document.description,
        uploadedAt: document.uploadedAt
      },
      rewards: rewardResult,
      message: 'Document uploaded successfully'
    }));
  } catch (err) {
    // Delete uploaded file if error occurs
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkErr) {
        console.error('Error deleting file:', unlinkErr);
      }
    }
    next(err);
  }
};

// Get user documents
exports.getDocuments = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).send(responses.error('User not found'));
    }

    // Return documents without file paths (for security)
    const documents = user.documents.map(doc => ({
      documentId: doc.documentId,
      fileName: doc.fileName,
      fileType: doc.fileType,
      fileSize: doc.fileSize,
      category: doc.category,
      description: doc.description,
      uploadedAt: doc.uploadedAt
    }));

    res.status(200).send(responses.ok(documents));
  } catch (err) {
    next(err);
  }
};

// Download document
exports.downloadDocument = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { documentId } = req.params;

    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).send(responses.error('User not found'));
    }

    // Find document
    const document = user.documents.find(doc => doc.documentId === documentId);
    if (!document) {
      return res.status(404).send(responses.error('Document not found'));
    }

    // Check if file exists
    if (!fs.existsSync(document.filePath)) {
      return res.status(404).send(responses.error('File not found on server'));
    }

    // Send file
    res.download(document.filePath, document.fileName);
  } catch (err) {
    next(err);
  }
};

// Delete document
exports.deleteDocument = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { documentId } = req.params;

    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).send(responses.error('User not found'));
    }

    // Find document index
    const docIndex = user.documents.findIndex(doc => doc.documentId === documentId);
    if (docIndex === -1) {
      return res.status(404).send(responses.error('Document not found'));
    }

    const document = user.documents[docIndex];

    // Delete file from filesystem
    if (fs.existsSync(document.filePath)) {
      fs.unlinkSync(document.filePath);
    }

    // Remove from user documents
    user.documents.splice(docIndex, 1);
    user.updatedAt = new Date();
    await user.save();

    res.status(200).send(responses.ok({
      success: true,
      message: 'Document deleted successfully'
    }));
  } catch (err) {
    next(err);
  }
};

// Update document metadata
exports.updateDocument = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { documentId } = req.params;
    const { category, description } = req.body;

    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).send(responses.error('User not found'));
    }

    // Find document
    const document = user.documents.find(doc => doc.documentId === documentId);
    if (!document) {
      return res.status(404).send(responses.error('Document not found'));
    }

    // Update metadata
    if (category) document.category = category;
    if (description !== undefined) document.description = description;

    user.updatedAt = new Date();
    await user.save();

    res.status(200).send(responses.ok({
      success: true,
      document: {
        documentId: document.documentId,
        fileName: document.fileName,
        fileType: document.fileType,
        fileSize: document.fileSize,
        category: document.category,
        description: document.description,
        uploadedAt: document.uploadedAt
      },
      message: 'Document updated successfully'
    }));
  } catch (err) {
    next(err);
  }
};

