'use client'

import { useState } from 'react'
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import type { ProposalFileUpload, ProposalMetadata } from '@/types/content'

interface ProposalUploadProps {
  onUploadComplete: (metadata: ProposalMetadata) => void
  onCancel: () => void
}

export default function ProposalUpload({ onUploadComplete, onCancel }: ProposalUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [extractedData, setExtractedData] = useState<any>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    // Validate file type
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword']
    if (!validTypes.includes(selectedFile.type)) {
      setError('Please upload a PDF or Word document')
      return
    }

    // Validate file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB')
      return
    }

    setFile(selectedFile)
    setError(null)
    extractMetadata(selectedFile)
  }

  const extractMetadata = async (file: File) => {
    setExtracting(true)
    setError(null)

    try {
      // TODO: Implement actual extraction
      // For now, simulate extraction
      await new Promise(resolve => setTimeout(resolve, 2000))

      const mockExtracted = {
        clientName: { value: 'Wells Fargo', confidence: 0.95 },
        industry: { value: 'Financial Services', confidence: 0.92 },
        sector: { value: 'Commercial Banking', confidence: 0.85 },
        servicesOffered: {
          value: ['Threat Intelligence', 'Security Monitoring', 'Incident Response'],
          confidence: 0.88
        }
      }

      setExtractedData(mockExtracted)
    } catch (err) {
      console.error('Extraction error:', err)
      setError('Failed to extract metadata from file')
    } finally {
      setExtracting(false)
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('organizationId', 'org-id') // TODO: Get from context

      const response = await fetch('/api/proposals/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const data = await response.json()

      // Proceed to metadata wizard with extracted data
      onUploadComplete({
        industry: extractedData?.industry?.value || '',
        proposalType: 'new_business',
        servicesOffered: extractedData?.servicesOffered?.value || [],
        clientName: extractedData?.clientName?.value,
        sector: extractedData?.sector?.value,
        filePath: data.filePath,
        fileType: file.type,
        fileSizeBytes: file.size
      })
    } catch (err) {
      console.error('Upload error:', err)
      setError('Failed to upload file. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-semibold mb-6">Upload Proposal</h2>

        {/* File upload area */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Proposal File
          </label>

          <div className={`
            border-2 border-dashed rounded-lg p-8 text-center
            ${file ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-gray-400'}
            transition-colors cursor-pointer
          `}>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileSelect}
              className="hidden"
              id="proposal-file"
              disabled={uploading || extracting}
            />

            <label htmlFor="proposal-file" className="cursor-pointer">
              {file ? (
                <div className="flex items-center justify-center space-x-3">
                  <FileText className="h-8 w-8 text-green-600" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
              ) : (
                <>
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-600">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PDF or Word document (max 10MB)
                  </p>
                </>
              )}
            </label>
          </div>
        </div>

        {/* Extraction progress */}
        {extracting && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
              <div>
                <p className="text-sm font-medium text-blue-900">
                  Extracting metadata...
                </p>
                <p className="text-xs text-blue-700">
                  Using AI to analyze proposal content
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Extracted metadata preview */}
        {extractedData && !extracting && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start space-x-3 mb-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-900 mb-2">
                  Metadata extracted successfully
                </p>
                <div className="space-y-2">
                  {extractedData.clientName && (
                    <div className="flex items-center space-x-2 text-xs">
                      <span className="font-medium text-gray-700">Client:</span>
                      <span className="text-gray-900">{extractedData.clientName.value}</span>
                      <span className="text-gray-500">
                        ({Math.round(extractedData.clientName.confidence * 100)}% confident)
                      </span>
                    </div>
                  )}
                  {extractedData.industry && (
                    <div className="flex items-center space-x-2 text-xs">
                      <span className="font-medium text-gray-700">Industry:</span>
                      <span className="text-gray-900">{extractedData.industry.value}</span>
                      <span className="text-gray-500">
                        ({Math.round(extractedData.industry.confidence * 100)}% confident)
                      </span>
                    </div>
                  )}
                  {extractedData.servicesOffered && (
                    <div className="flex items-start space-x-2 text-xs">
                      <span className="font-medium text-gray-700">Services:</span>
                      <span className="text-gray-900">
                        {extractedData.servicesOffered.value.join(', ')}
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-green-700 mt-2">
                  You'll be able to review and edit this information in the next step
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-sm text-red-900">{error}</p>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            disabled={uploading || extracting}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>

          <button
            onClick={handleUpload}
            disabled={!file || uploading || extracting || !!error}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Uploading...</span>
              </>
            ) : (
              <span>Continue to Metadata</span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
