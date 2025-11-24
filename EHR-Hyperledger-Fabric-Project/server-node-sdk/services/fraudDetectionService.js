const Tesseract = require('tesseract.js');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');

/**
 * Fraud Detection Service
 * Uses OCR and AI-based verification to detect fraudulent claims
 */

class FraudDetectionService {
  constructor() {
    this.fraudPatterns = [
      // Suspicious text patterns
      /fake|forged|counterfeit|duplicate|photoshop|edited/i,
      /copy|scan of scan|reproduction/i,
      
      // Suspicious amount patterns
      /\$\s*9{4,}/, // amounts like $9999, $99999
      
      // Date manipulation indicators
      /\d{1,2}\/\d{1,2}\/202[0-9]\s+\d{1,2}\/\d{1,2}\/202[0-9]/, // multiple dates
    ];

    this.medicalTerms = [
      'diagnosis', 'treatment', 'prescription', 'patient', 'doctor',
      'hospital', 'medical', 'health', 'care', 'procedure', 'surgery',
      'consultation', 'examination', 'medication', 'therapy', 'clinic'
    ];

    this.suspiciousIndicators = [
      'urgent', 'immediate payment', 'rush', 'emergency fund',
      'maximum coverage', 'full reimbursement'
    ];
  }

  /**
   * Perform OCR on document
   */
  async performOCR(imagePath) {
    try {
      console.log(`Performing OCR on: ${imagePath}`);
      
      const { data: { text, confidence } } = await Tesseract.recognize(
        imagePath,
        'eng',
        {
          logger: info => console.log(info),
        }
      );

      return {
        text: text.trim(),
        confidence: confidence,
        success: true
      };
    } catch (error) {
      console.error('OCR Error:', error);
      return {
        text: '',
        confidence: 0,
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Analyze extracted text for fraud indicators
   */
  analyzeText(text, documentType) {
    const analysis = {
      fraudScore: 0,
      indicators: [],
      isSuspicious: false
    };

    // Check for fraud patterns
    this.fraudPatterns.forEach((pattern, index) => {
      if (pattern.test(text)) {
        analysis.fraudScore += 25;
        analysis.indicators.push({
          type: 'fraud_pattern',
          severity: 'high',
          description: `Detected suspicious pattern #${index + 1}`,
          matched: text.match(pattern)[0]
        });
      }
    });

    // Check for medical legitimacy
    const medicalTermCount = this.medicalTerms.filter(term => 
      text.toLowerCase().includes(term.toLowerCase())
    ).length;

    if (medicalTermCount < 2) {
      analysis.fraudScore += 15;
      analysis.indicators.push({
        type: 'missing_medical_terms',
        severity: 'medium',
        description: 'Document lacks sufficient medical terminology',
        medicalTermsFound: medicalTermCount
      });
    }

    // Check for suspicious language
    const suspiciousCount = this.suspiciousIndicators.filter(indicator =>
      text.toLowerCase().includes(indicator.toLowerCase())
    ).length;

    if (suspiciousCount > 2) {
      analysis.fraudScore += 20;
      analysis.indicators.push({
        type: 'suspicious_language',
        severity: 'high',
        description: 'Document contains multiple suspicious phrases',
        count: suspiciousCount
      });
    }

    // Check text length and quality
    if (text.length < 100) {
      analysis.fraudScore += 10;
      analysis.indicators.push({
        type: 'insufficient_content',
        severity: 'low',
        description: 'Document contains minimal text',
        textLength: text.length
      });
    }

    // Check for document-specific requirements
    if (documentType === 'medical_record') {
      const hasPatientName = /patient\s*[:]\s*[a-zA-Z\s]+/i.test(text);
      const hasDate = /\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2}/i.test(text);
      const hasDoctorSignature = /doctor|physician|dr\./i.test(text);

      if (!hasPatientName || !hasDate || !hasDoctorSignature) {
        analysis.fraudScore += 15;
        analysis.indicators.push({
          type: 'missing_required_fields',
          severity: 'medium',
          description: 'Medical record missing required fields',
          missing: {
            patientName: !hasPatientName,
            date: !hasDate,
            doctorSignature: !hasDoctorSignature
          }
        });
      }
    }

    // Determine if suspicious
    analysis.isSuspicious = analysis.fraudScore >= 40;

    return analysis;
  }

  /**
   * Analyze image quality and authenticity
   */
  analyzeImageQuality(imagePath) {
    const analysis = {
      qualityScore: 0,
      issues: []
    };

    try {
      const stats = fs.statSync(imagePath);
      const fileSize = stats.size;

      // Check file size (too small might be screenshot, too large might be uncompressed)
      if (fileSize < 50000) { // Less than 50KB
        analysis.qualityScore += 20;
        analysis.issues.push({
          type: 'low_file_size',
          description: 'File size suspiciously small for a scanned document',
          size: fileSize
        });
      }

      // Check file extension
      const ext = path.extname(imagePath).toLowerCase();
      if (!['.jpg', '.jpeg', '.png', '.pdf'].includes(ext)) {
        analysis.qualityScore += 15;
        analysis.issues.push({
          type: 'unusual_format',
          description: 'Unusual file format for medical document',
          format: ext
        });
      }

      // In a real implementation, you would also:
      // - Check image metadata for editing software
      // - Analyze compression artifacts
      // - Detect copy-paste boundaries
      // - Check for consistent lighting/shadows
      
    } catch (error) {
      console.error('Image quality analysis error:', error);
    }

    return analysis;
  }

  /**
   * Verify claim documents
   */
  async verifyClaimDocuments(claimData, documentPaths) {
    const verificationResults = {
      overallScore: 0,
      isFraudulent: false,
      confidence: 0,
      documents: [],
      recommendations: []
    };

    if (!documentPaths || documentPaths.length === 0) {
      verificationResults.overallScore = 30;
      verificationResults.recommendations.push('No supporting documents provided');
      return verificationResults;
    }

    // Analyze each document
    for (const docPath of documentPaths) {
      if (!fs.existsSync(docPath)) {
        continue;
      }

      const documentAnalysis = {
        path: docPath,
        fileName: path.basename(docPath),
        ocr: null,
        textAnalysis: null,
        imageAnalysis: null,
        fraudScore: 0
      };

      // Perform OCR
      documentAnalysis.ocr = await this.performOCR(docPath);

      if (documentAnalysis.ocr.success) {
        // Analyze extracted text
        documentAnalysis.textAnalysis = this.analyzeText(
          documentAnalysis.ocr.text,
          'medical_record'
        );
        documentAnalysis.fraudScore += documentAnalysis.textAnalysis.fraudScore;

        // Analyze image quality
        documentAnalysis.imageAnalysis = this.analyzeImageQuality(docPath);
        documentAnalysis.fraudScore += documentAnalysis.imageAnalysis.qualityScore;

        // Check OCR confidence
        if (documentAnalysis.ocr.confidence < 60) {
          documentAnalysis.fraudScore += 10;
        }
      } else {
        documentAnalysis.fraudScore += 50; // High penalty for OCR failure
      }

      verificationResults.documents.push(documentAnalysis);
    }

    // Calculate overall fraud score
    const avgFraudScore = verificationResults.documents.reduce(
      (sum, doc) => sum + doc.fraudScore, 0
    ) / verificationResults.documents.length;

    verificationResults.overallScore = avgFraudScore;

    // Cross-verify claim data with extracted text
    const crossVerification = this.crossVerifyClaimData(
      claimData,
      verificationResults.documents
    );
    verificationResults.overallScore += crossVerification.score;
    verificationResults.recommendations.push(...crossVerification.recommendations);

    // Determine if fraudulent
    verificationResults.isFraudulent = verificationResults.overallScore >= 50;
    verificationResults.confidence = Math.min(100, verificationResults.overallScore);

    return verificationResults;
  }

  /**
   * Cross-verify claim data with document content
   */
  crossVerifyClaimData(claimData, documents) {
    const result = {
      score: 0,
      recommendations: []
    };

    const allText = documents
      .filter(doc => doc.ocr && doc.ocr.success)
      .map(doc => doc.ocr.text)
      .join(' ')
      .toLowerCase();

    // Check if claim amount appears in documents
    if (claimData.claimAmount) {
      const amountStr = claimData.claimAmount.toString();
      if (!allText.includes(amountStr)) {
        result.score += 15;
        result.recommendations.push(
          `Claim amount $${amountStr} not found in supporting documents`
        );
      }
    }

    // Check if diagnosis/treatment appears
    if (claimData.description) {
      const descWords = claimData.description.toLowerCase().split(' ');
      const matchedWords = descWords.filter(word => 
        word.length > 4 && allText.includes(word)
      ).length;

      if (matchedWords < 2) {
        result.score += 10;
        result.recommendations.push(
          'Claim description does not match document content'
        );
      }
    }

    // Check claim type legitimacy
    const validClaimTypes = [
      'surgery', 'consultation', 'emergency', 'medication',
      'lab tests', 'diagnosis', 'treatment', 'therapy'
    ];

    if (claimData.claimType) {
      const claimTypeLower = claimData.claimType.toLowerCase();
      const isValidType = validClaimTypes.some(type => 
        claimTypeLower.includes(type)
      );

      if (!isValidType) {
        result.score += 10;
        result.recommendations.push('Unusual claim type specified');
      }
    }

    return result;
  }

  /**
   * Record fraud attempt in user record
   */
  async recordFraudAttempt(userId, claimId, verificationResults) {
    try {
      const user = await User.findOne({ userId });
      if (!user) {
        throw new Error('User not found');
      }

      // Initialize fraudDetection if it doesn't exist
      if (!user.fraudDetection) {
        user.fraudDetection = {
          attemptCount: 0,
          isBlocked: false,
          warnings: []
        };
      }

      // Increment attempt count
      user.fraudDetection.attemptCount += 1;
      user.fraudDetection.lastWarningAt = new Date();

      // Add warning
      user.fraudDetection.warnings.push({
        claimId: claimId,
        reason: 'Fraudulent claim detected by AI verification',
        detectedAt: new Date(),
        fraudScore: verificationResults.overallScore,
        details: JSON.stringify({
          confidence: verificationResults.confidence,
          recommendations: verificationResults.recommendations,
          documentsAnalyzed: verificationResults.documents.length
        })
      });

      // Block user if 3 or more attempts
      if (user.fraudDetection.attemptCount >= 3) {
        user.fraudDetection.isBlocked = true;
        user.fraudDetection.blockedAt = new Date();
      }

      await user.save();

      return {
        attemptCount: user.fraudDetection.attemptCount,
        isBlocked: user.fraudDetection.isBlocked,
        remainingAttempts: Math.max(0, 3 - user.fraudDetection.attemptCount)
      };
    } catch (error) {
      console.error('Error recording fraud attempt:', error);
      throw error;
    }
  }

  /**
   * Check if user is blocked
   */
  async isUserBlocked(userId) {
    try {
      const user = await User.findOne({ userId });
      if (!user || !user.fraudDetection) {
        return false;
      }

      return user.fraudDetection.isBlocked === true;
    } catch (error) {
      console.error('Error checking user block status:', error);
      return false;
    }
  }

  /**
   * Get user fraud status
   */
  async getUserFraudStatus(userId) {
    try {
      const user = await User.findOne({ userId });
      if (!user || !user.fraudDetection) {
        return {
          attemptCount: 0,
          isBlocked: false,
          warnings: [],
          remainingAttempts: 3
        };
      }

      return {
        attemptCount: user.fraudDetection.attemptCount,
        isBlocked: user.fraudDetection.isBlocked,
        warnings: user.fraudDetection.warnings,
        remainingAttempts: Math.max(0, 3 - user.fraudDetection.attemptCount),
        blockedAt: user.fraudDetection.blockedAt,
        lastWarningAt: user.fraudDetection.lastWarningAt
      };
    } catch (error) {
      console.error('Error getting user fraud status:', error);
      return null;
    }
  }
}

module.exports = new FraudDetectionService();

