"use client"

import { useCallback, useEffect } from "react"
import { useDropzone } from "react-dropzone"
import { Upload, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface DropzoneOverlayProps {
  isVisible: boolean
  onDrop: (file: File) => void
  onClose: () => void
}

export function DropzoneOverlay({ isVisible, onDrop, onClose }: DropzoneOverlayProps) {
  const handleDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onDrop(acceptedFiles[0])
    }
    onClose()
  }, [onDrop, onClose])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
    accept: {
      'text/plain': ['.txt']
    },
    multiple: false,
    disabled: !isVisible
  })

  // Close overlay on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isVisible) {
        onClose()
      }
    }

    if (isVisible) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isVisible, onClose])

  if (!isVisible) return null

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center",
        "drag-overlay transition-all duration-300"
      )}
      {...getRootProps()}
    >
      <input {...getInputProps()} />
      
      {/* Close button */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
        className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
      >
        <X className="h-6 w-6 text-white" />
      </button>

      {/* Drop area */}
      <div className={cn(
        "flex flex-col items-center justify-center",
        "w-96 h-96 border-4 border-dashed rounded-2xl",
        "transition-all duration-300",
        isDragActive 
          ? "border-primary bg-primary/5 scale-105" 
          : "border-gray-300 dark:border-gray-600"
      )}>
        <Upload className={cn(
          "h-16 w-16 mb-4 transition-all duration-300",
          isDragActive 
            ? "text-primary scale-110" 
            : "text-gray-400 dark:text-gray-500"
        )} />
        
        <h3 className={cn(
          "text-2xl font-semibold mb-2 transition-colors",
          isDragActive 
            ? "text-primary" 
            : "text-gray-700 dark:text-gray-300"
        )}>
          {isDragActive ? "Drop your file here" : "Drop transcript file"}
        </h3>
        
        <p className="text-gray-500 dark:text-gray-400 text-center max-w-xs">
          {isDragActive 
            ? "Release to upload your .txt file" 
            : "Drag & drop a .txt file anywhere on this page to get started"
          }
        </p>

        <div className="mt-4 text-sm text-gray-400 dark:text-gray-500">
          Press <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">Esc</kbd> to cancel
        </div>
      </div>
    </div>
  )
}
