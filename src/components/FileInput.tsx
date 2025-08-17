"use client"

import { useRef, useState } from "react"
import { Upload, File, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface FileInputProps {
  onFileSelect: (file: File | null) => void
  acceptedTypes?: string
  maxSize?: number
  className?: string
}

export function FileInput({ 
  onFileSelect, 
  acceptedTypes = ".txt,.docx,.pdf", 
  maxSize = 10, 
  className 
}: FileInputProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (file: File) => {
    const maxSizeBytes = maxSize * 1024 * 1024 // Convert MB to bytes
    
    if (file.size > maxSizeBytes) {
      alert(`File size exceeds ${maxSize}MB limit`)
      return
    }
    
    setSelectedFile(file)
    onFileSelect(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    onFileSelect(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
          isDragOver
            ? "border-primary bg-primary/5"
            : selectedFile
            ? "border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/20"
            : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes}
          onChange={handleInputChange}
          className="hidden"
        />
        
        {selectedFile ? (
          <div className="space-y-2">
            <File className="h-12 w-12 text-green-600 dark:text-green-400 mx-auto" />
            <div>
              <p className="font-medium text-green-800 dark:text-green-200">
                {selectedFile.name}
              </p>
              <p className="text-sm text-green-600 dark:text-green-400">
                {Math.round(selectedFile.size / 1024)}KB
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                handleRemoveFile()
              }}
              className="mt-2"
            >
              <X className="h-3 w-3 mr-1" />
              Remove
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <Upload className="h-12 w-12 text-gray-400 mx-auto" />
            <div>
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                Upload a file
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Drag and drop or click to browse
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Supported: {acceptedTypes.replace(/\./g, "").toUpperCase()} (max {maxSize}MB)
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
