const Tesseract = require('tesseract.js');
const path = require('path');
const fs = require('fs');
const ocrHelper = require('../utils/ocrHelper');

/**
 * OCR Test Script
 * Run this script to test OCR functionality
 * 
 * Usage: node test/testOCR.js [path-to-image]
 */

async function testOCR(imagePath) {
  console.log('='.repeat(60));
  console.log('OCR TEST STARTED');
  console.log('='.repeat(60));
  console.log();

  // Validate file
  console.log('📄 File:', path.basename(imagePath));
  console.log('📍 Path:', imagePath);
  console.log();

  const validation = await ocrHelper.validateImageFile(imagePath);
  
  console.log('✓ Validation Results:');
  console.log(`  - Valid: ${validation.valid ? '✅ YES' : '❌ NO'}`);
  console.log(`  - File Size: ${validation.fileSizeMB} MB`);
  
  if (validation.errors.length > 0) {
    console.log('  - Errors:');
    validation.errors.forEach(err => console.log(`    • ${err}`));
    console.log();
    console.log('❌ Test failed: File validation errors');
    return;
  }
  console.log();

  // Perform OCR
  console.log('🔍 Performing OCR...');
  console.log('-'.repeat(60));
  
  const startTime = Date.now();
  const ocrResult = await ocrHelper.performOCRWithRetry(imagePath, 2);
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  console.log();
  console.log('✓ OCR Results:');
  console.log(`  - Success: ${ocrResult.success ? '✅ YES' : '❌ NO'}`);
  console.log(`  - Confidence: ${ocrResult.confidence.toFixed(2)}%`);
  console.log(`  - Duration: ${duration}s`);
  console.log(`  - Attempts: ${ocrResult.attempts}`);
  
  if (!ocrResult.success) {
    console.log(`  - Error: ${ocrResult.error}`);
    console.log();
    console.log('❌ Test failed: OCR processing error');
    return;
  }
  console.log();

  // Extracted text
  const cleanText = ocrHelper.cleanOCRText(ocrResult.text);
  console.log('📝 Extracted Text:');
  console.log('-'.repeat(60));
  console.log(cleanText.substring(0, 500));
  if (cleanText.length > 500) {
    console.log('... (truncated, full text available in result)');
  }
  console.log('-'.repeat(60));
  console.log();

  // Statistics
  const stats = ocrHelper.getOCRStatistics(ocrResult.text);
  console.log('📊 Text Statistics:');
  console.log(`  - Word Count: ${stats.wordCount}`);
  console.log(`  - Line Count: ${stats.lineCount}`);
  console.log(`  - Characters: ${stats.cleanedLength}`);
  console.log(`  - Letters: ${stats.characterTypes.letters}`);
  console.log(`  - Digits: ${stats.characterTypes.digits}`);
  console.log(`  - Has Capitals: ${stats.hasCapitals ? 'Yes' : 'No'}`);
  console.log(`  - Has Numbers: ${stats.hasNumbers ? 'Yes' : 'No'}`);
  console.log();

  // Text quality
  const qualityScore = ocrHelper.calculateTextQuality(ocrResult.text, ocrResult.confidence);
  console.log('⭐ Quality Score:', qualityScore.toFixed(2), '/100');
  console.log();

  // Extract medical information
  const medicalInfo = ocrHelper.extractMedicalInfo(ocrResult.text);
  console.log('🏥 Extracted Medical Information:');
  console.log(`  - Patient Name: ${medicalInfo.patientName || 'Not found'}`);
  console.log(`  - Dates Found: ${medicalInfo.dates.length > 0 ? medicalInfo.dates.join(', ') : 'None'}`);
  console.log(`  - Amounts Found: ${medicalInfo.amounts.length > 0 ? medicalInfo.amounts.join(', ') : 'None'}`);
  console.log(`  - Diagnoses: ${medicalInfo.diagnosis.length > 0 ? medicalInfo.diagnosis.join(', ') : 'None'}`);
  console.log(`  - Medications: ${medicalInfo.medications.length > 0 ? medicalInfo.medications.join(', ') : 'None'}`);
  console.log();

  // Fraud indicators
  console.log('🔒 Fraud Analysis:');
  const fraudIndicators = analyzeFraudIndicators(ocrResult.text);
  fraudIndicators.forEach(indicator => {
    console.log(`  - ${indicator.severity === 'high' ? '🔴' : indicator.severity === 'medium' ? '🟡' : '🟢'} ${indicator.message}`);
  });
  console.log();

  console.log('='.repeat(60));
  console.log('✅ OCR TEST COMPLETED SUCCESSFULLY');
  console.log('='.repeat(60));
}

function analyzeFraudIndicators(text) {
  const indicators = [];
  const lowerText = text.toLowerCase();

  // Check for fraud keywords
  const fraudKeywords = ['fake', 'forged', 'counterfeit', 'duplicate', 'photoshop', 'edited'];
  const foundFraudKeywords = fraudKeywords.filter(kw => lowerText.includes(kw));
  
  if (foundFraudKeywords.length > 0) {
    indicators.push({
      severity: 'high',
      message: `Fraud keywords detected: ${foundFraudKeywords.join(', ')}`
    });
  }

  // Check for medical terms
  const medicalTerms = ['diagnosis', 'treatment', 'prescription', 'patient', 'doctor', 'hospital'];
  const foundMedicalTerms = medicalTerms.filter(term => lowerText.includes(term));
  
  if (foundMedicalTerms.length < 2) {
    indicators.push({
      severity: 'medium',
      message: `Insufficient medical terminology (found: ${foundMedicalTerms.length})`
    });
  } else {
    indicators.push({
      severity: 'low',
      message: `Adequate medical terminology (found: ${foundMedicalTerms.length})`
    });
  }

  // Check text length
  if (text.length < 100) {
    indicators.push({
      severity: 'medium',
      message: `Document contains minimal text (${text.length} characters)`
    });
  } else {
    indicators.push({
      severity: 'low',
      message: `Document has sufficient content (${text.length} characters)`
    });
  }

  if (indicators.length === 0) {
    indicators.push({
      severity: 'low',
      message: 'No fraud indicators detected'
    });
  }

  return indicators;
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node test/testOCR.js <path-to-image>');
    console.log('Example: node test/testOCR.js uploads/P-abc123/sample.jpg');
    process.exit(1);
  }

  const imagePath = args[0];
  
  testOCR(imagePath)
    .then(() => {
      console.log();
      console.log('Test completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error();
      console.error('❌ Test failed with error:');
      console.error(error);
      process.exit(1);
    });
}

module.exports = testOCR;

