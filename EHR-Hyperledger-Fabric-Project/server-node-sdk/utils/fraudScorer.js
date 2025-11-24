/**
 * Fraud Scoring Utility
 * Centralized fraud score calculation with detailed breakdown
 */

class FraudScorer {
  constructor() {
    // Score thresholds
    this.thresholds = {
      fraudulent: 50,
      suspicious: 40,
      clean: 0
    };

    // Weight configuration for different indicators
    this.weights = {
      fraudPatterns: 25,
      missingMedicalTerms: 15,
      suspiciousLanguage: 20,
      insufficientContent: 10,
      missingRequiredFields: 15,
      lowOCRConfidence: 10,
      imageQuality: 20,
      amountMismatch: 15,
      descriptionMismatch: 10,
      invalidClaimType: 10
    };
  }

  /**
   * Calculate comprehensive fraud score
   */
  calculateScore(analysis) {
    const breakdown = {
      total: 0,
      components: [],
      level: 'clean',
      isFraudulent: false
    };

    // Add each component
    if (analysis.fraudPatterns > 0) {
      const score = Math.min(this.weights.fraudPatterns, analysis.fraudPatterns * 25);
      breakdown.components.push({
        name: 'Fraud Patterns',
        score: score,
        details: `${analysis.fraudPatterns} suspicious pattern(s) detected`
      });
      breakdown.total += score;
    }

    if (analysis.medicalTermCount < 2) {
      const score = this.weights.missingMedicalTerms;
      breakdown.components.push({
        name: 'Medical Terminology',
        score: score,
        details: `Only ${analysis.medicalTermCount} medical term(s) found`
      });
      breakdown.total += score;
    }

    if (analysis.suspiciousLanguageCount > 0) {
      const score = Math.min(this.weights.suspiciousLanguage, analysis.suspiciousLanguageCount * 10);
      breakdown.components.push({
        name: 'Suspicious Language',
        score: score,
        details: `${analysis.suspiciousLanguageCount} suspicious phrase(s) detected`
      });
      breakdown.total += score;
    }

    if (analysis.textLength < 100) {
      const score = this.weights.insufficientContent;
      breakdown.components.push({
        name: 'Insufficient Content',
        score: score,
        details: `Document has only ${analysis.textLength} characters`
      });
      breakdown.total += score;
    }

    if (analysis.missingFields > 0) {
      const score = this.weights.missingRequiredFields;
      breakdown.components.push({
        name: 'Missing Required Fields',
        score: score,
        details: `${analysis.missingFields} required field(s) missing`
      });
      breakdown.total += score;
    }

    if (analysis.ocrConfidence < 60) {
      const score = this.weights.lowOCRConfidence;
      breakdown.components.push({
        name: 'Low OCR Confidence',
        score: score,
        details: `OCR confidence: ${analysis.ocrConfidence.toFixed(1)}%`
      });
      breakdown.total += score;
    }

    if (analysis.imageQualityIssues > 0) {
      const score = Math.min(this.weights.imageQuality, analysis.imageQualityIssues * 10);
      breakdown.components.push({
        name: 'Image Quality Issues',
        score: score,
        details: `${analysis.imageQualityIssues} quality issue(s) detected`
      });
      breakdown.total += score;
    }

    if (analysis.amountMismatch) {
      const score = this.weights.amountMismatch;
      breakdown.components.push({
        name: 'Amount Mismatch',
        score: score,
        details: 'Claim amount not found in documents'
      });
      breakdown.total += score;
    }

    if (analysis.descriptionMismatch) {
      const score = this.weights.descriptionMismatch;
      breakdown.components.push({
        name: 'Description Mismatch',
        score: score,
        details: 'Claim description does not match document content'
      });
      breakdown.total += score;
    }

    if (analysis.invalidClaimType) {
      const score = this.weights.invalidClaimType;
      breakdown.components.push({
        name: 'Invalid Claim Type',
        score: score,
        details: 'Unusual or invalid claim type'
      });
      breakdown.total += score;
    }

    // Determine fraud level
    if (breakdown.total >= this.thresholds.fraudulent) {
      breakdown.level = 'fraudulent';
      breakdown.isFraudulent = true;
    } else if (breakdown.total >= this.thresholds.suspicious) {
      breakdown.level = 'suspicious';
      breakdown.isFraudulent = false;
    } else {
      breakdown.level = 'clean';
      breakdown.isFraudulent = false;
    }

    return breakdown;
  }

  /**
   * Get fraud level description
   */
  getLevelDescription(score) {
    if (score >= this.thresholds.fraudulent) {
      return {
        level: 'fraudulent',
        color: 'red',
        emoji: '🔴',
        message: 'High risk of fraud detected',
        action: 'Reject claim and warn user'
      };
    } else if (score >= this.thresholds.suspicious) {
      return {
        level: 'suspicious',
        color: 'yellow',
        emoji: '🟡',
        message: 'Suspicious activity detected',
        action: 'Manual review recommended'
      };
    } else {
      return {
        level: 'clean',
        color: 'green',
        emoji: '🟢',
        message: 'No significant fraud indicators',
        action: 'Proceed with normal processing'
      };
    }
  }

  /**
   * Generate fraud report
   */
  generateReport(scoreBreakdown) {
    const level = this.getLevelDescription(scoreBreakdown.total);
    
    return {
      summary: {
        totalScore: scoreBreakdown.total,
        level: scoreBreakdown.level,
        isFraudulent: scoreBreakdown.isFraudulent,
        ...level
      },
      breakdown: scoreBreakdown.components,
      recommendations: this.generateRecommendations(scoreBreakdown)
    };
  }

  /**
   * Generate recommendations based on score
   */
  generateRecommendations(scoreBreakdown) {
    const recommendations = [];

    scoreBreakdown.components.forEach(component => {
      switch (component.name) {
        case 'Fraud Patterns':
          recommendations.push('Document contains suspicious keywords that may indicate forgery or tampering');
          break;
        case 'Medical Terminology':
          recommendations.push('Document lacks sufficient medical terminology for a legitimate medical record');
          break;
        case 'Suspicious Language':
          recommendations.push('Document contains unusual phrases that are uncommon in authentic medical documents');
          break;
        case 'Insufficient Content':
          recommendations.push('Document has very little text content, which may indicate a screenshot or incomplete scan');
          break;
        case 'Missing Required Fields':
          recommendations.push('Document is missing essential information like patient name, date, or doctor signature');
          break;
        case 'Low OCR Confidence':
          recommendations.push('Text extraction confidence is low, possibly due to poor image quality or handwritten content');
          break;
        case 'Image Quality Issues':
          recommendations.push('Document has quality issues such as unusual file size or format');
          break;
        case 'Amount Mismatch':
          recommendations.push('The claimed amount does not appear in the supporting documents');
          break;
        case 'Description Mismatch':
          recommendations.push('The claim description does not match the content of the supporting documents');
          break;
        case 'Invalid Claim Type':
          recommendations.push('The specified claim type is unusual or invalid for medical insurance');
          break;
      }
    });

    if (recommendations.length === 0) {
      recommendations.push('Document appears legitimate based on automated analysis');
    }

    return recommendations;
  }

  /**
   * Get score color for UI display
   */
  getScoreColor(score) {
    if (score >= 75) return '#DC2626'; // Red
    if (score >= 50) return '#EA580C'; // Orange
    if (score >= 40) return '#FBBF24'; // Yellow
    if (score >= 25) return '#84CC16'; // Light Green
    return '#10B981'; // Green
  }
}

module.exports = new FraudScorer();

