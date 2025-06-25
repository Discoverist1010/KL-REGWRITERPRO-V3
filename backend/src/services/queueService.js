const PQueue = require('p-queue').default;
const Bottleneck = require('bottleneck');
const claudeService = require('./claudeService');

// Rate limiter configuration based on Claude API limits
// Configuration for Claude Max tier
const limiter = new Bottleneck({
  minTime: 1000, // 1 second between requests
  maxConcurrent: 6, // Process 6 requests concurrently
  reservoir: 500, // Initial capacity of 500 requests
  reservoirRefreshAmount: 400, // Refill to 400 requests
  reservoirRefreshInterval: 60 * 1000, // Refill every minute
  strategy: Bottleneck.strategy.LEAK, // Drop oldest jobs if overloaded
});

// Queue configuration with concurrency control
const queue = new PQueue({ 
  concurrency: 6, // Process up to 6 jobs concurrently
  interval: 1000, // Minimum 1 second between job starts
  intervalCap: 6, // Allow up to 6 jobs per interval
  timeout: 300000, // 5 minute timeout per job
  throwOnTimeout: true
});

// Track queue metrics
let totalProcessed = 0;
let totalErrors = 0;
let lastError = null;

// Queue event handlers
queue.on('active', () => {
  console.log(`[Queue] Processing job. Size: ${queue.size}, Pending: ${queue.pending}`);
});

queue.on('idle', () => {
  console.log('[Queue] All jobs completed. Queue is idle.');
});

queue.on('error', (error) => {
  totalErrors++;
  lastError = error;
  console.error('[Queue] Error:', error);
});

// Add job completed tracking
limiter.on('done', (info) => {
  totalProcessed++;
  console.log(`[Limiter] Job completed. Total processed: ${totalProcessed}`);
});

// Main function to queue analysis requests
async function queueAnalysis(analysisData, retries = 3) {
  const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  console.log(`[Queue] Adding job ${jobId} to queue. Current size: ${queue.size}`);
  
  try {
    const result = await queue.add(async () => {
      console.log(`[Queue] Starting job ${jobId}`);
      
      try {
        // Use the rate limiter to schedule the actual API call
        const analysisResult = await limiter.schedule({ id: jobId }, async () => {
          console.log(`[Queue] Executing Claude API call for job ${jobId}`);
          // Prepare submission data format expected by analyzeRegulatoryWriting
          const submissionData = {
            sessionId: analysisData.sessionCode,
            answers: {
              executiveSummary: analysisData.studentSummary,
              impactAnalysis: analysisData.studentImpact
            },
            language: analysisData.language,
            documentId: analysisData.documentId || null
          };
          
          console.log('[Queue] Submission data prepared:', {
            hasExecutiveSummary: !!submissionData.answers.executiveSummary,
            executiveSummaryLength: submissionData.answers.executiveSummary?.length || 0,
            hasImpactAnalysis: !!submissionData.answers.impactAnalysis,
            impactAnalysisLength: submissionData.answers.impactAnalysis?.length || 0
          });
          
          return await claudeService.analyzeRegulatoryWriting(
            submissionData,
            analysisData.documentText
          );
        });
        
        console.log(`[Queue] Job ${jobId} completed successfully`);
        return analysisResult;
        
      } catch (error) {
        console.error(`[Queue] Job ${jobId} failed:`, error.message);
        
        // Handle rate limit errors with retry
        if (error.status === 429 && retries > 0) {
          console.log(`[Queue] Rate limited. Retrying job ${jobId} (${retries} retries left)`);
          
          // Wait longer before retry (exponential backoff)
          const backoffTime = (4 - retries) * 30000; // 30s, 60s, 90s
          await new Promise(resolve => setTimeout(resolve, backoffTime));
          
          // Recursive retry with decremented count
          return queueAnalysis(analysisData, retries - 1);
        }
        
        // For other errors or exhausted retries, throw
        throw error;
      }
    }, { priority: analysisData.priority || 0 });
    
    return result;
    
  } catch (error) {
    console.error(`[Queue] Failed to process job ${jobId} after all retries:`, error);
    
    // Fallback to demo mode as last resort
    if (analysisData.allowDemoFallback !== false) {
      console.log(`[Queue] Falling back to demo mode for job ${jobId}`);
      // Generate placeholder analysis as fallback with complete structure
      const placeholderAnalysis = {
        sessionId: analysisData.sessionCode,
        timestamp: new Date().toISOString(),
        overallScore: 75,
        executiveSummary: {
          score: 80,
          strengths: [
            'Clear structure provided',
            'Professional tone attempted',
            'Key points addressed'
          ],
          improvements: [
            'Add specific regulatory details',
            'Include timeline information',
            'Quantify impacts'
          ],
          professionalExample: "The regulatory framework requires financial institutions to implement enhanced risk management procedures by Q4 2024, affecting 12,000 institutions with estimated compliance costs of $2.3 billion industry-wide."
        },
        impactAnalysis: {
          score: 70,
          strengths: [
            'Stakeholder identification attempted',
            'Implementation considerations noted',
            'Clear analysis structure'
          ],
          improvements: [
            'Provide more specific impacts',
            'Include mitigation strategies',
            'Add cost-benefit analysis'
          ],
          professionalExample: "Implementation will vary by institution size: community banks require 18-24 months at $850K average cost, while large banks need $25-50M for system upgrades. Phased approach recommended: Policy (Months 1-6), Technology (Months 7-12), Validation (Months 13-18)."
        },
        regulatoryCompliance: {
          score: 75,
          feedback: 'Basic regulatory understanding demonstrated. Analysis unavailable due to system limitations.',
          missingElements: [
            'Specific compliance deadlines',
            'Penalty structures',
            'Reporting requirements'
          ]
        },
        writingQuality: {
          score: 75,
          clarity: 75,
          conciseness: 75,
          professionalism: 80,
          feedback: 'Professional writing demonstrated. Full analysis unavailable - operating in demo mode.'
        },
        recommendations: [
          'Include specific regulatory citations',
          'Quantify all financial impacts',
          'Develop detailed implementation timeline',
          'Address risk mitigation strategies'
        ],
        nextSteps: [
          'Review additional regulatory scenarios',
          'Practice quantitative impact analysis'
        ],
        analysisType: 'demo-fallback',
        studentAnswers: {
          executiveSummary: analysisData.studentSummary || '',
          impactAnalysis: analysisData.studentImpact || ''
        },
        error: error.message
      };
      return placeholderAnalysis;
    }
    
    throw error;
  }
}

// Function to get queue status
function getQueueStatus() {
  return {
    queueSize: queue.size,
    pending: queue.pending,
    isPaused: queue.isPaused,
    isIdle: queue.size === 0 && queue.pending === 0,
    totalProcessed,
    totalErrors,
    lastError: lastError ? lastError.message : null,
    limiterStatus: {
      reservoir: limiter.reservoir,
      queued: limiter.queued(),
      running: limiter.running(),
    },
    estimatedWaitTime: queue.size * 12, // seconds
  };
}

// Function to pause the queue (useful for maintenance)
function pauseQueue() {
  queue.pause();
  console.log('[Queue] Queue has been paused');
}

// Function to resume the queue
function resumeQueue() {
  queue.start();
  console.log('[Queue] Queue has been resumed');
}

// Function to clear the queue (emergency use only)
function clearQueue() {
  queue.clear();
  console.log('[Queue] Queue has been cleared');
}

// Function to get estimated wait time for a new job
function getEstimatedWaitTime() {
  // With 6 concurrent jobs and 1 second minimum time
  const totalJobs = queue.size + queue.pending;
  const estimatedSeconds = Math.ceil(totalJobs / 6) * 1;
  return {
    seconds: estimatedSeconds,
    minutes: Math.ceil(estimatedSeconds / 60),
    humanReadable: estimatedSeconds > 60 
      ? `${Math.ceil(estimatedSeconds / 60)} minutes`
      : `${estimatedSeconds} seconds`
  };
}

module.exports = {
  queueAnalysis,
  getQueueStatus,
  pauseQueue,
  resumeQueue,
  clearQueue,
  getEstimatedWaitTime,
};