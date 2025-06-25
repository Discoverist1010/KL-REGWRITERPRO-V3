const PQueue = require('p-queue').default;
const Bottleneck = require('bottleneck');
const claudeService = require('./claudeService');

// Rate limiter configuration based on Claude API limits
// Adjust these values based on your Claude API tier
const limiter = new Bottleneck({
  minTime: 12000, // 12 seconds between requests (5 requests per minute)
  maxConcurrent: 1, // Process one request at a time
  reservoir: 5, // Initial capacity of 5 requests
  reservoirRefreshAmount: 5, // Refill to 5 requests
  reservoirRefreshInterval: 60 * 1000, // Refill every minute
  strategy: Bottleneck.strategy.LEAK, // Drop oldest jobs if overloaded
});

// Queue configuration with concurrency control
const queue = new PQueue({ 
  concurrency: 1, // Process one job at a time
  interval: 12000, // Minimum 12 seconds between job starts
  intervalCap: 1, // Allow 1 job per interval
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
      // Generate placeholder analysis as fallback
      const placeholderAnalysis = {
        sessionId: analysisData.sessionCode,
        timestamp: new Date().toISOString(),
        overallScore: 75,
        executiveSummary: {
          score: 80,
          professionalExample: "This is a demo executive summary.",
          feedback: "Demo mode - actual AI analysis unavailable"
        },
        impactAnalysis: {
          score: 70,
          professionalExample: "This is a demo impact analysis.",
          feedback: "Demo mode - actual AI analysis unavailable"
        },
        analysisType: 'demo-fallback',
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
  // Each job takes minimum 12 seconds due to rate limiting
  const estimatedSeconds = (queue.size + queue.pending) * 12;
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