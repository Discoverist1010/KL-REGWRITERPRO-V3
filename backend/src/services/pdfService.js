const fs = require('fs').promises
const pdfParse = require('pdf-parse')

/**
 * Service for PDF processing and text extraction
 */
class PDFService {
  /**
   * Extract text content from PDF file
   */
  async extractTextFromPDF(filePath) {
    try {
      console.log(`📄 Extracting text from PDF: ${filePath}`)

      // Read PDF file as buffer
      const pdfBuffer = await fs.readFile(filePath)

      // Parse PDF content
      const pdfData = await pdfParse(pdfBuffer)

      let extractedText = pdfData.text

      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error('No text content found in PDF')
      }

      // Clean and normalize extracted text
      extractedText = this.cleanExtractedText(extractedText)

      console.log(`✅ Text extraction successful: ${extractedText.length} characters`)

      return extractedText

    } catch (error) {
      console.error('❌ PDF text extraction failed:', error)
      throw new Error(`PDF processing failed: ${error.message}`)
    }
  }

  /**
   * Clean and normalize extracted PDF text
   */
  cleanExtractedText(text) {
    if (!text) return ''

    // Basic text cleaning
    let cleaned = text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]{2,}/g, ' ')
      .trim()

    return cleaned
  }
}

module.exports = new PDFService()