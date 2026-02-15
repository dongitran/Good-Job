#!/usr/bin/env node

/**
 * HTML to JPG Converter
 *
 * Usage:
 *   node html-to-jpg.js <html-file> [output-jpg]
 *
 * Examples:
 *   node html-to-jpg.js 00-landing-page/index.html
 *   node html-to-jpg.js 00-landing-page/index.html ../images/landing.jpg
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('❌ Error: HTML file path is required');
  console.log('\nUsage:');
  console.log('  node html-to-jpg.js <html-file> [output-jpg]');
  console.log('\nExamples:');
  console.log('  node html-to-jpg.js 00-landing-page/index.html');
  console.log('  node html-to-jpg.js 00-landing-page/index.html ../images/landing.jpg');
  process.exit(1);
}

const htmlFile = args[0];
const outputFile = args[1];

// Resolve absolute paths
const htmlPath = path.resolve(htmlFile);
const htmlDir = path.dirname(htmlPath);
const htmlBasename = path.basename(path.dirname(htmlPath));

// Default output: same folder as HTML, named after folder
const defaultOutput = path.join(htmlDir, `${htmlBasename}.jpg`);
const outputPath = outputFile ? path.resolve(outputFile) : defaultOutput;

// Check if HTML file exists
if (!fs.existsSync(htmlPath)) {
  console.error(`❌ Error: HTML file not found: ${htmlPath}`);
  process.exit(1);
}

console.log('🎨 HTML to JPG Converter');
console.log('========================');
console.log(`📄 Input:  ${htmlPath}`);
console.log(`📸 Output: ${outputPath}`);
console.log('');

(async () => {
  console.log('🚀 Starting browser...');
  const browser = await chromium.launch({
    headless: false,
    slowMo: 100
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 2 // Retina quality
  });

  const page = await context.newPage();

  console.log('📄 Loading HTML file...');
  await page.goto(`file://${htmlPath}`, {
    waitUntil: 'networkidle',
    timeout: 30000
  });

  console.log('✅ Page loaded successfully');
  console.log('📐 Page title:', await page.title());

  // Wait for page to fully render
  console.log('⏳ Waiting 5 seconds for page to fully render...');
  await page.waitForTimeout(5000);

  console.log('📸 Taking full page screenshot...');
  await page.screenshot({
    path: outputPath,
    fullPage: true,
    type: 'jpeg',
    quality: 95
  });

  console.log(`✅ Screenshot saved to: ${outputPath}`);

  // Show file size
  const stats = fs.statSync(outputPath);
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
  console.log(`📊 File size: ${sizeMB} MB`);

  console.log('🎉 Done!');

  await browser.close();
})().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
