const Tesseract = require('tesseract.js');
const path = require('path');
const fs = require('fs');

/**
 * OCR Helper Utilities
 * Additional helper functions for OCR processing
 */

class OCRHelper {
  constructor() {
    this.supportedFormats = ['.jpg', '.jpeg', '.png', '.pdf', '.tiff', '.bmp'];
  }

  /**
   * Check if file format is supported for OCR
   */
  isSupportedFormat(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return this.supportedFormats.includes(ext);
  }

  /**
   * Validate image file before OCR
   */
  async validateImageFile(filePath) {
    const errors = [];

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      errors.push('File does not exist');
      return { valid: false, errors };
    }

    // Check file size
    const stats = fs.statSync(filePath);
    const fileSizeInMB = stats.size / (1024 * 1024);
    
    if (fileSizeInMB > 10) {
      errors.push('File size exceeds 10MB limit');
    }

    if (fileSizeInMB < 0.01) {
      errors.push('File size too small (< 10KB), may be corrupted');
    }

    // Check file format
    if (!this.isSupportedFormat(filePath)) {
      errors.push(`Unsupported format. Supported formats: ${this.supportedFormats.join(', ')}`);
    }

    return {
      valid: errors.length === 0,
      errors,
      fileSize: stats.size,
      fileSizeMB: fileSizeInMB.toFixed(2)
    };
  }

  /**
   * Perform OCR with retry logic
   */
  async performOCRWithRetry(imagePath, maxRetries = 2) {
    let lastError = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`OCR Attempt ${attempt}/${maxRetries} for: ${path.basename(imagePath)}`);
        
        const { data: { text, confidence } } = await Tesseract.recognize(
          imagePath,
          'eng',
          {
            logger: (info) => {
              if (info.status === 'recognizing text') {
                console.log(`OCR Progress: ${(info.progress * 100).toFixed(1)}%`);
              }
            }
          }
        );

        return {
          success: true,
          text: text.trim(),
          confidence: confidence,
          attempts: attempt
        };
      } catch (error) {
        lastError = error;
        console.error(`OCR Attempt ${attempt} failed:`, error.message);
        
        if (attempt < maxRetries) {
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }

    return {
      success: false,
      text: '',
      confidence: 0,
      error: lastError?.message || 'OCR failed after multiple attempts',
      attempts: maxRetries
    };
  }

  /**
   * Extract specific information from OCR text
   */
  extractMedicalInfo(text) {
    const info = {
      patientName: null,
      dates: [],
      amounts: [],
      diagnosis: [],
      medications: []
    };

    // Extract patient name (common patterns)
    const namePatterns = [
      /patient\s*(?:name)?[\s:]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i,
      /name\s*:?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i
    ];

    for (const pattern of namePatterns) {
      const match = text.match(pattern);
      if (match) {
        info.patientName = match[1].trim();
        break;
      }
    }

    // Extract dates
    const datePattern = /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/g;
    info.dates = [...new Set((text.match(datePattern) || []))];

    // Extract amounts (currency)
    const amountPattern = /\$\s*\d{1,3}(?:,\d{3})*(?:\.\d{2})?|\d{1,3}(?:,\d{3})*(?:\.\d{2})?\s*(?:USD|dollars?)/gi;
    info.amounts = [...new Set((text.match(amountPattern) || []))];

    // Common medical terms (simplified diagnosis extraction)
    const medicalTerms = [
      'diabetes', 'hypertension', 'infection', 'fracture', 'surgery',
      'appendicitis', 'pneumonia', 'bronchitis', 'arthritis', 'cancer',
      'covid', 'fever', 'injury', 'trauma', 'emergency'
    ];

    const lowerText = text.toLowerCase();
    info.diagnosis = medicalTerms.filter(term => lowerText.includes(term));

    // Extract medication names (common patterns)
    const medicationPattern = /(?:medication|medicine|drug|prescription)[\s:]+([A-Za-z]+(?:\s+[A-Za-z]+)*)/gi;
    const medicationMatches = text.matchAll(medicationPattern);
    for (const match of medicationMatches) {
      info.medications.push(match[1].trim());
    }

    return info;
  }

  /**
   * Calculate text quality score
   */
  calculateTextQuality(text, ocrConfidence) {
    let score = 0;

    // Length score (0-25 points)
    if (text.length > 500) score += 25;
    else if (text.length > 200) score += 20;
    else if (text.length > 100) score += 15;
    else if (text.length > 50) score += 10;

    // OCR confidence (0-40 points)
    score += (ocrConfidence / 100) * 40;

    // Word count (0-15 points)
    const wordCount = text.split(/\s+/).length;
    if (wordCount > 100) score += 15;
    else if (wordCount > 50) score += 10;
    else if (wordCount > 20) score += 5;

    // Capital letters presence (0-10 points)
    const hasCapitals = /[A-Z]/.test(text);
    if (hasCapitals) score += 10;

    // Numbers presence (0-10 points)
    const hasNumbers = /\d/.test(text);
    if (hasNumbers) score += 10;

    return Math.min(100, score);
  }

  /**
   * Clean OCR text (remove noise)
   */
  cleanOCRText(text) {
    return text
      .replace(/[^\x20-\x7E\n]/g, '') // Remove non-printable characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/\n\s*\n/g, '\n') // Remove empty lines
      .trim();
  }

  /**
   * Get OCR statistics for debugging
   */
  getOCRStatistics(text) {
    const cleanText = this.cleanOCRText(text);
    
    return {
      originalLength: text.length,
      cleanedLength: cleanText.length,
      wordCount: cleanText.split(/\s+/).length,
      lineCount: cleanText.split('\n').length,
      characterTypes: {
        letters: (cleanText.match(/[a-zA-Z]/g) || []).length,
        digits: (cleanText.match(/\d/g) || []).length,
        spaces: (cleanText.match(/\s/g) || []).length,
        punctuation: (cleanText.match(/[.,!?;:]/g) || []).length
      },
      hasCapitals: /[A-Z]/.test(cleanText),
      hasLowercase: /[a-z]/.test(cleanText),
      hasNumbers: /\d/.test(cleanText)
    };
  }
}

module.exports = new OCRHelper();

