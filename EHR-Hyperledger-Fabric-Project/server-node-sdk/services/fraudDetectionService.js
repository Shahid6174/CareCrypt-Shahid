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

    // Cross-verify claim data with extracted text (now async)
    const crossVerification = await this.crossVerifyClaimData(
      claimData,
      verificationResults.documents
    );
    verificationResults.overallScore += crossVerification.score;
    verificationResults.recommendations.push(...crossVerification.recommendations);
    verificationResults.matchDetails = crossVerification.matches;

    // Normalize score to mean-centric range (10-90) - NEVER 0% or 100%
    // This creates a bell curve distribution centered around 50%
    const rawScore = verificationResults.overallScore;
    const normalizedScore = 10 + (Math.min(rawScore, 100) * 0.8); // Scale to 10-90 range
    verificationResults.overallScore = Math.max(10, Math.min(90, normalizedScore));

    // Determine if fraudulent (threshold at 50% normalized)
    verificationResults.isFraudulent = verificationResults.overallScore >= 50;
    verificationResults.confidence = verificationResults.overallScore;

    return verificationResults;
  }

  /**
   * Calculate similarity between two strings using Levenshtein-like approach
   */
  calculateStringSimilarity(str1, str2) {
    if (!str1 || !str2) return 0;
    
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();
    
    if (s1 === s2) return 100;
    
    // Calculate character-level similarity
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;
    
    if (longer.length === 0) return 100;
    
    // Check if shorter string is contained in longer
    if (longer.includes(shorter)) return 80;
    
    // Calculate edit distance
    const editDistance = this.levenshteinDistance(s1, s2);
    const similarity = ((longer.length - editDistance) / longer.length) * 100;
    
    return Math.max(0, similarity);
  }

  /**
   * Levenshtein distance algorithm
   */
  levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Extract patient name from user database
   */
  async getPatientName(patientId) {
    try {
      const user = await User.findOne({ userId: patientId });
      return user ? user.name : null;
    } catch (err) {
      console.error('Error fetching patient name:', err);
      return null;
    }
  }

  /**
   * Cross-verify claim data with document content (Enhanced)
   */
  async crossVerifyClaimData(claimData, documents) {
    const result = {
      score: 0,
      recommendations: [],
      matches: {
        patientName: { found: false, similarity: 0 },
        amount: { found: false, similarity: 0 },
        description: { found: false, similarity: 0 },
        claimType: { valid: false }
      }
    };

    // Keep both original and lowercase versions
    const allTextOriginal = documents
      .filter(doc => doc.ocr && doc.ocr.success)
      .map(doc => doc.ocr.text)
      .join(' ');
    
    const allText = allTextOriginal.toLowerCase();

    if (allText.length === 0) {
      result.score += 30;
      result.recommendations.push('No readable text found in documents');
      return result;
    }

    // 1. ENHANCED: Check patient name match
    if (claimData.patientId) {
      const patientName = await this.getPatientName(claimData.patientId);
      
      if (patientName) {
        // Extract name from OCR text (use original case for name matching)
        const namePatterns = [
          /patient\s*(?:name)?[\s:]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/gi,
          /name\s*:?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/gi,
          /\b([A-Z][a-z]+\s+[A-Z][a-z]+)\b/g // General name pattern
        ];

        let bestMatch = 0;
        let foundName = null;

        for (const pattern of namePatterns) {
          const matches = allTextOriginal.matchAll(pattern);
          for (const match of matches) {
            const extractedName = match[1];
            const similarity = this.calculateStringSimilarity(patientName, extractedName);
            if (similarity > bestMatch) {
              bestMatch = similarity;
              foundName = extractedName;
            }
          }
        }

        result.matches.patientName.similarity = bestMatch;
        result.matches.patientName.found = bestMatch >= 60;

        if (bestMatch < 60) {
          result.score += 20; // High penalty for name mismatch
          result.recommendations.push(
            `Patient name mismatch: Expected "${patientName}", ${foundName ? `found similar to "${foundName}" (${bestMatch.toFixed(0)}% match)` : 'name not found in documents'}`
          );
        } else if (bestMatch < 80) {
          result.score += 10; // Moderate penalty for partial match
          result.recommendations.push(
            `Patient name partially matches (${bestMatch.toFixed(0)}% confidence)`
          );
        }
      }
    }

    // 2. ENHANCED: Check if claim amount appears in documents with fuzzy matching
    if (claimData.claimAmount) {
      const amountStr = claimData.claimAmount.toString();
      const amountVariations = [
        amountStr,
        `$${amountStr}`,
        `$ ${amountStr}`,
        amountStr.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,') // Add commas
      ];

      const found = amountVariations.some(variation => 
        allText.includes(variation.toLowerCase())
      );

      // Also check for approximate amounts (within 10%)
      const extractedAmounts = allText.match(/\$?\s*\d{1,3}(?:,\d{3})*(?:\.\d{2})?/g) || [];
      const numericAmounts = extractedAmounts.map(a => 
        parseFloat(a.replace(/[$,\s]/g, ''))
      ).filter(n => !isNaN(n));

      const closeMatch = numericAmounts.some(amt => {
        const diff = Math.abs(amt - claimData.claimAmount);
        const percentDiff = (diff / claimData.claimAmount) * 100;
        return percentDiff <= 10;
      });

      result.matches.amount.found = found || closeMatch;

      if (!found && !closeMatch) {
        result.score += 15;
        result.recommendations.push(
          `Claim amount $${amountStr} not found in supporting documents`
        );
      } else if (!found && closeMatch) {
        result.score += 5;
        result.recommendations.push(
          `Exact claim amount not found, but similar amount detected in documents`
        );
      }
    }

    // 3. ENHANCED: Check if diagnosis/treatment description matches with better similarity
    if (claimData.description) {
      const descWords = claimData.description.toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 3); // Filter meaningful words

      const matchedWords = descWords.filter(word => 
        allText.includes(word)
      );

      const matchPercentage = (matchedWords.length / descWords.length) * 100;
      result.matches.description.similarity = matchPercentage;
      result.matches.description.found = matchPercentage >= 40;

      if (matchPercentage < 20) {
        result.score += 15; // High penalty for no match
        result.recommendations.push(
          'Claim description does not match document content (< 20% match)'
        );
      } else if (matchPercentage < 40) {
        result.score += 10; // Moderate penalty
        result.recommendations.push(
          `Claim description partially matches document content (${matchPercentage.toFixed(0)}% match)`
        );
      } else if (matchPercentage < 60) {
        result.score += 5; // Low penalty
        result.recommendations.push(
          `Claim description moderately matches (${matchPercentage.toFixed(0)}% match)`
        );
      }
    }

    // 4. Check hospital/doctor information if provided
    if (claimData.hospitalId) {
      const hospitalTerms = ['hospital', 'medical center', 'clinic', 'healthcare'];
      const hasHospitalMention = hospitalTerms.some(term => allText.includes(term));
      
      if (!hasHospitalMention) {
        result.score += 5;
        result.recommendations.push('No hospital or medical facility mentioned in documents');
      }
    }

    // 5. Check claim type legitimacy
    const validClaimTypes = [
      'surgery', 'consultation', 'emergency', 'medication', 'prescription',
      'lab tests', 'lab test', 'diagnosis', 'treatment', 'therapy', 'checkup',
      'vaccination', 'imaging', 'x-ray', 'mri', 'ct scan', 'dental', 'optical'
    ];

    if (claimData.claimType) {
      const claimTypeLower = claimData.claimType.toLowerCase();
      const isValidType = validClaimTypes.some(type => 
        claimTypeLower.includes(type) || type.includes(claimTypeLower)
      );

      result.matches.claimType.valid = isValidType;

      if (!isValidType) {
        result.score += 10;
        result.recommendations.push(`Unusual claim type: "${claimData.claimType}"`);
      }
    }

    // 6. Check for medical terminology consistency
    const medicalTermsFound = this.medicalTerms.filter(term => 
      allText.includes(term)
    ).length;

    if (medicalTermsFound < 2) {
      result.score += 10;
      result.recommendations.push(
        `Insufficient medical terminology in documents (found ${medicalTermsFound} terms)`
      );
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

