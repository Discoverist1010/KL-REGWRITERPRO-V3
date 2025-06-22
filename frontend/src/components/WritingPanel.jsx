import React from 'react'

const WritingPanel = ({ answers, onAnswerChange, language = 'English', disabled = false }) => {
  
  // Writing guides based on language
  const getWritingGuides = () => {
    const guides = {
      English: {
        executiveSummary: {
          title: "Executive Summary Writing Guide",
          tips: [
            "Summarize key regulatory requirements in 2-3 sentences",
            "Identify primary stakeholders affected",
            "State the main compliance objective clearly",
            "Keep it concise and executive-level appropriate",
            "Use professional, formal language"
          ]
        },
        impactAnalysis: {
          title: "Impact Analysis Writing Guide", 
          tips: [
            "Analyze impact on different stakeholder groups",
            "Consider implementation timeline and phases",
            "Identify potential risks and mitigation strategies",
            "Suggest practical implementation steps",
            "Include cost-benefit considerations"
          ]
        }
      },
      "Bahasa Indonesia": {
        executiveSummary: {
          title: "Panduan Menulis Ringkasan Eksekutif",
          tips: [
            "Ringkas persyaratan regulasi utama dalam 2-3 kalimat",
            "Identifikasi pemangku kepentingan utama yang terdampak",
            "Nyatakan tujuan kepatuhan utama dengan jelas",
            "Tetap ringkas dan sesuai tingkat eksekutif",
            "Gunakan bahasa formal dan profesional"
          ]
        },
        impactAnalysis: {
          title: "Panduan Menulis Analisis Dampak",
          tips: [
            "Analisis dampak pada kelompok pemangku kepentingan berbeda",
            "Pertimbangkan timeline dan fase implementasi",
            "Identifikasi risiko potensial dan strategi mitigasi",
            "Sarankan langkah implementasi praktis",
            "Sertakan pertimbangan cost-benefit"
          ]
        }
      },
      "Traditional Chinese": {
        executiveSummary: {
          title: "執行摘要寫作指南",
          tips: [
            "在2-3句話中總結關鍵監管要求",
            "識別受影響的主要利益相關者",
            "清楚陳述主要合規目標",
            "保持簡潔並適合執行層級",
            "使用專業正式的語言"
          ]
        },
        impactAnalysis: {
          title: "影響分析寫作指南",
          tips: [
            "分析對不同利益相關者群體的影響",
            "考慮實施時間表和階段",
            "識別潛在風險和緩解策略",
            "建議實用的實施步驟",
            "包括成本效益考量"
          ]
        }
      },
      "Simplified Chinese": {
        executiveSummary: {
          title: "执行摘要写作指南",
          tips: [
            "在2-3句话中总结关键监管要求",
            "识别受影响的主要利益相关者",
            "清楚陈述主要合规目标",
            "保持简洁并适合执行层级",
            "使用专业正式的语言"
          ]
        },
        impactAnalysis: {
          title: "影响分析写作指南",
          tips: [
            "分析对不同利益相关者群体的影响",
            "考虑实施时间表和阶段",
            "识别潜在风险和缓解策略",
            "建议实用的实施步骤",
            "包括成本效益考量"
          ]
        }
      }
    }
    
    return guides[language] || guides.English
  }

  const guides = getWritingGuides()

  // Character count with validation
  const getCharacterCountColor = (text, maxLength) => {
    const percentage = (text.length / maxLength) * 100
    if (percentage >= 95) return 'text-red-400'
    if (percentage >= 80) return 'text-yellow-400'
    return 'text-gray-400'
  }

  // Validation status
  const getValidationStatus = (text) => {
    if (text.length === 0) return { status: 'empty', message: 'Required field' }
    if (text.length < 50) return { status: 'warning', message: 'Too short - consider expanding' }
    if (text.length > 4500) return { status: 'warning', message: 'Approaching character limit' }
    return { status: 'valid', message: 'Good length' }
  }

  const executiveSummaryValidation = getValidationStatus(answers.executiveSummary)
  const impactAnalysisValidation = getValidationStatus(answers.impactAnalysis)

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-200">Your Response</h2>
      
      {/* Executive Summary Section */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-md font-medium text-blue-300">Executive Summary</h3>
          <div className="text-right">
            <span className={`text-sm ${getCharacterCountColor(answers.executiveSummary, 5000)}`}>
              {answers.executiveSummary.length}/5000 characters
            </span>
            {executiveSummaryValidation.status !== 'valid' && (
              <div className={`text-xs mt-1 ${
                executiveSummaryValidation.status === 'empty' ? 'text-red-400' : 'text-yellow-400'
              }`}>
                {executiveSummaryValidation.message}
              </div>
            )}
          </div>
        </div>
        
        {/* Executive Summary Writing Guide */}
        <div className="bg-gray-800 p-4 rounded-lg border-l-4 border-blue-500">
          <p className="font-medium mb-3 text-blue-300">{guides.executiveSummary.title}</p>
          <ul className="text-sm space-y-1.5 text-gray-300">
            {guides.executiveSummary.tips.map((tip, index) => (
              <li key={index} className="flex items-start">
                <span className="text-blue-400 mr-2 flex-shrink-0">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
        
        {/* Executive Summary Input */}
        <div className="relative">
          <textarea
            value={answers.executiveSummary}
            onChange={(e) => onAnswerChange('executiveSummary', e.target.value)}
            placeholder="Write your executive summary here..."
            maxLength={5000}
            disabled={disabled}
            className={`w-full h-40 p-4 bg-gray-800 border rounded-lg text-white placeholder-gray-400 focus:outline-none resize-none transition-colors ${
              disabled 
                ? 'border-gray-600 bg-gray-700 cursor-not-allowed' 
                : executiveSummaryValidation.status === 'empty'
                  ? 'border-red-500 focus:border-red-400'
                  : 'border-gray-600 focus:border-blue-500'
            }`}
          />
          {executiveSummaryValidation.status === 'valid' && answers.executiveSummary.length > 0 && (
            <div className="absolute top-2 right-2">
              <span className="text-green-400 text-sm">✓</span>
            </div>
          )}
        </div>
      </div>

      {/* Impact Analysis Section */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-md font-medium text-green-300">Impact Analysis</h3>
          <div className="text-right">
            <span className={`text-sm ${getCharacterCountColor(answers.impactAnalysis, 5000)}`}>
              {answers.impactAnalysis.length}/5000 characters
            </span>
            {impactAnalysisValidation.status !== 'valid' && (
              <div className={`text-xs mt-1 ${
                impactAnalysisValidation.status === 'empty' ? 'text-red-400' : 'text-yellow-400'
              }`}>
                {impactAnalysisValidation.message}
              </div>
            )}
          </div>
        </div>
        
        {/* Impact Analysis Writing Guide */}
        <div className="bg-gray-800 p-4 rounded-lg border-l-4 border-green-500">
          <p className="font-medium mb-3 text-green-300">{guides.impactAnalysis.title}</p>
          <ul className="text-sm space-y-1.5 text-gray-300">
            {guides.impactAnalysis.tips.map((tip, index) => (
              <li key={index} className="flex items-start">
                <span className="text-green-400 mr-2 flex-shrink-0">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
        
        {/* Impact Analysis Input */}
        <div className="relative">
          <textarea
            value={answers.impactAnalysis}
            onChange={(e) => onAnswerChange('impactAnalysis', e.target.value)}
            placeholder="Write your impact analysis here..."
            maxLength={5000}
            disabled={disabled}
            className={`w-full h-40 p-4 bg-gray-800 border rounded-lg text-white placeholder-gray-400 focus:outline-none resize-none transition-colors ${
              disabled 
                ? 'border-gray-600 bg-gray-700 cursor-not-allowed' 
                : impactAnalysisValidation.status === 'empty'
                  ? 'border-red-500 focus:border-red-400'
                  : 'border-gray-600 focus:border-blue-500'
            }`}
          />
          {impactAnalysisValidation.status === 'valid' && answers.impactAnalysis.length > 0 && (
            <div className="absolute top-2 right-2">
              <span className="text-green-400 text-sm">✓</span>
            </div>
          )}
        </div>
      </div>

      {/* Overall Progress Indicator */}
      <div className="bg-gray-800 p-4 rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-300">Completion Status</span>
          <span className="text-sm text-gray-400">
            {answers.executiveSummary && answers.impactAnalysis ? '2/2 sections completed' : 
             answers.executiveSummary || answers.impactAnalysis ? '1/2 sections completed' : 
             '0/2 sections completed'}
          </span>
        </div>
        <div className="flex space-x-2">
          <div className={`flex-1 h-2 rounded ${
            answers.executiveSummary && executiveSummaryValidation.status === 'valid' 
              ? 'bg-blue-500' : 'bg-gray-600'
          }`}></div>
          <div className={`flex-1 h-2 rounded ${
            answers.impactAnalysis && impactAnalysisValidation.status === 'valid' 
              ? 'bg-green-500' : 'bg-gray-600'
          }`}></div>
        </div>
      </div>
    </div>
  )
}

export default WritingPanel