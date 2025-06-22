import React, { useState } from 'react'

const PDFViewer = ({ documentUrl, documentName, language }) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const handleIframeLoad = () => {
    setLoading(false)
    setError(false)
  }

  const handleIframeError = () => {
    setLoading(false)
    setError(true)
  }

  const openInNewTab = () => {
    if (documentUrl) {
      window.open(documentUrl, '_blank')
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Modern Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white">Document</h2>
        {documentUrl && (
          <button
            onClick={openInNewTab}
            className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors duration-200 flex items-center"
            title="Open PDF in new tab"
          >
            Open in New Tab
            <span className="ml-1">↗</span>
          </button>
        )}
      </div>

      {/* PDF Container */}
      <div className="flex-1 relative bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        {/* Loading State */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/5 backdrop-blur-sm z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-3"></div>
              <p className="text-slate-300 text-sm">Loading PDF...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-slate-400">
              <div className="text-4xl mb-3">📄</div>
              <p className="text-lg mb-2 text-slate-300">Unable to load PDF</p>
              <p className="text-sm text-slate-400 mb-4">The document may be corrupted or unavailable</p>
              {documentUrl && (
                <button
                  onClick={openInNewTab}
                  className="text-blue-400 hover:text-blue-300 text-sm underline transition-colors"
                >
                  Try opening in new tab
                </button>
              )}
            </div>
          </div>
        )}

        {/* PDF Iframe */}
        {documentUrl && !error && (
          <iframe
            src={documentUrl}
            className="w-full h-full border-0"
            title="Document Viewer"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            style={{ display: loading ? 'none' : 'block', minHeight: '500px' }}
          />
        )}

        {/* No Document State */}
        {!documentUrl && !loading && (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-slate-400">
              <div className="text-4xl mb-3">📄</div>
              <p className="text-lg text-slate-300">No document available</p>
            </div>
          </div>
        )}
      </div>

      {/* Modern Document Info */}
      <div className="mt-4 bg-white/5 border border-white/10 rounded-xl p-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-slate-400">Document:</span>
            <div className="text-slate-200 font-medium mt-1">{documentName || 'Unknown'}</div>
          </div>
          <div>
            <span className="text-slate-400">Language:</span>
            <div className="text-slate-200 font-medium mt-1">{language || 'English'}</div>
          </div>
          {documentUrl && (
            <>
              <div>
                <span className="text-slate-400">Status:</span>
                <div className="text-emerald-400 font-medium mt-1 flex items-center">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full mr-2"></div>
                  Loaded
                </div>
              </div>
              <div>
                <span className="text-slate-400">Actions:</span>
                <button
                  onClick={openInNewTab}
                  className="text-blue-400 hover:text-blue-300 text-sm font-medium mt-1 block transition-colors"
                >
                  View Fullscreen
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default PDFViewer