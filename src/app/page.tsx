"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import { Plus, Calendar, Clock, FileText, Share2, Eye, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { summariesApi, Summary, PaginatedResponse } from "@/lib/api"

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function formatTimeAgo(dateString: string) {
  const now = new Date()
  const date = new Date(dateString)
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
  
  if (diffInHours < 1) return 'Just now'
  if (diffInHours < 24) return `${diffInHours}h ago`
  
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) return `${diffInDays}d ago`
  
  const diffInWeeks = Math.floor(diffInDays / 7)
  return `${diffInWeeks}w ago`
}

export default function HomePage() {
  const [summaries, setSummaries] = useState<Summary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const observer = useRef<IntersectionObserver | null>(null)

  // Clean markdown from title text
  const cleanTitle = (text: string): string => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove **bold**
      .replace(/\*(.*?)\*/g, '$1')     // Remove *italic*
      .replace(/#{1,6}\s*/g, '')       // Remove ### headers
      .replace(/={3,}/g, '')           // Remove === rules
      .replace(/`(.*?)`/g, '$1')       // Remove `code`
      .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove [links](url)
      .replace(/<[^>]*>/g, '')         // Remove HTML tags
      .replace(/&\w+;/g, '')           // Remove HTML entities
      .replace(/\s+/g, ' ')            // Normalize whitespace
      .trim()
  }

  // Extract title from summary content
  const extractTitle = (summary: Summary): string => {
    const content = summary.editedSummary || summary.aiSummary || summary.transcript || ''
    
    // Try to find a title in the first few lines
    const lines = content.split('\n').filter(line => line.trim())
    
    for (const line of lines.slice(0, 5)) {
      const trimmed = line.trim()
      if (trimmed && 
          !trimmed.startsWith('**Key') && 
          !trimmed.startsWith('**Discussion') && 
          !trimmed.startsWith('**Decision') &&
          !trimmed.startsWith('**Attendees') &&
          !trimmed.startsWith('**Date') &&
          !trimmed.startsWith('Team:') &&
          !trimmed.includes('=======') &&
          !trimmed.startsWith('Date:') &&
          !trimmed.startsWith('Attendees:')) {
        const cleaned = cleanTitle(trimmed)
        // Check if it's a reasonable title length and doesn't contain too much detail
        if (cleaned.length >= 10 && cleaned.length <= 80 && !cleaned.includes('Complete user testing')) {
          return cleaned
        }
      }
    }
    
    // Enhanced fallback: try to extract a meaningful short phrase
    const firstSentence = content.split(/[.!?]/)[0]?.trim()
    if (firstSentence && firstSentence.length >= 10 && firstSentence.length <= 80) {
      return cleanTitle(firstSentence)
    }
    
    // Final fallback: look for patterns like "Summary" or "Meeting" 
    const summaryMatch = content.match(/(.*?(?:summary|meeting|standup|review|session).*?)(?:\n|\.)/i)
    if (summaryMatch && summaryMatch[1]) {
      const matched = cleanTitle(summaryMatch[1].trim())
      if (matched.length <= 80) {
        return matched
      }
    }
    
    return 'Meeting Summary'
  }

  const loadSummaries = useCallback(async (page: number = 1, append: boolean = false) => {
    try {
      if (page === 1) {
        setIsLoading(true)
      } else {
        setIsLoadingMore(true)
      }

      const response: PaginatedResponse<Summary> = await summariesApi.getAll(page, 10)
      
      if (append) {
        // Filter out any duplicates when appending
        setSummaries(prev => {
          const existingIds = new Set(prev.map(s => s.id))
          const newSummaries = response.summaries.filter(s => !existingIds.has(s.id))
          return [...prev, ...newSummaries]
        })
      } else {
        setSummaries(response.summaries)
      }
      
      setTotalCount(response.pagination.total)
      setHasMore(response.pagination.hasNext)
      
    } catch (error) {
      console.error('Failed to load summaries:', error)
      // Fall back to empty array on error for the first page
      if (page === 1) {
        setSummaries([])
        setTotalCount(0)
      }
    } finally {
      if (page === 1) {
        setIsLoading(false)
      } else {
        setIsLoadingMore(false)
      }
    }
  }, [])

  // Last element ref for infinite scroll
  const lastSummaryElementRef = useCallback((node: HTMLDivElement | null) => {
    if (isLoadingMore) return
    if (observer.current) observer.current.disconnect()
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setCurrentPage(prevPage => {
          const nextPage = prevPage + 1
          loadSummaries(nextPage, true)
          return nextPage
        })
      }
    })
    if (node) observer.current.observe(node)
  }, [isLoadingMore, hasMore, loadSummaries])

  // Initial load
  useEffect(() => {
    loadSummaries(1, false)
  }, [loadSummaries])

  // Function to refresh data (for when summaries are created/deleted)
  const refreshSummaries = useCallback(() => {
    setCurrentPage(1)
    setHasMore(true)
    loadSummaries(1, false)
  }, [loadSummaries])

  // Make refresh function available globally for other components
  useEffect(() => {
    (window as any).refreshSummaries = refreshSummaries
    return () => {
      delete (window as any).refreshSummaries
    }
  }, [refreshSummaries])

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-black border-b border-gray-200 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-white">
                Meeting Notes
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link href="/new">
                <Button className="bg-white text-black hover:bg-gray-100 shadow-md">
                  <Plus className="h-4 w-4 mr-2" />
                  New Summary
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white border border-gray-200 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-900">Total Summaries</CardTitle>
              <FileText className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">{totalCount}</div>
              <p className="text-xs text-gray-600">
                {summaries.reduce((acc, s) => acc + (s.tokensOut || 0), 0).toLocaleString()} total tokens
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-900">Shared</CardTitle>
              <Share2 className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">
                {summaries.reduce((acc, s) => acc + (s._count?.shares || 0), 0)}
              </div>
              <p className="text-xs text-gray-600">
                {summaries.filter(s => s._count && s._count.shares > 0).length} summaries shared
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-900">Views</CardTitle>
              <Eye className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">
                {summaries.reduce((acc, s) => 
                  acc + (s._count?.shares || 0), 0
                )}
              </div>
              <p className="text-xs text-gray-600">
                From shared summaries
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Summaries List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-black">
              Recent Summaries
            </h2>
          </div>

          {summaries.length === 0 && !isLoading ? (
            <Card className="bg-white border border-gray-200 shadow-lg">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-black mb-2">
                  No summaries yet
                </h3>
                <p className="text-gray-600 text-center mb-6 max-w-sm">
                  Create your first meeting summary by uploading a transcript or entering text directly.
                </p>
                <Link href="/new">
                  <Button className="bg-black text-white hover:bg-gray-800 shadow-md">
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Summary
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : isLoading ? (
            <Card className="bg-white border border-gray-200 shadow-lg">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mb-4"></div>
                <h3 className="text-lg font-medium text-black mb-2">
                  Loading summaries...
                </h3>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {summaries.map((summary, index) => {
                const title = extractTitle(summary)
                const wordCount = summary.aiSummary.split(' ').length
                
                return (
                <Card 
                  key={summary.id} 
                  className="bg-white border border-gray-200 shadow-lg hover:shadow-xl transition-shadow"
                  ref={index === summaries.length - 1 ? lastSummaryElementRef : null}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg text-black">
                          <Link 
                            href={`/summary/${summary.id}`}
                            className="hover:text-gray-700 transition-colors"
                          >
                            {title}
                          </Link>
                        </CardTitle>
                        <CardDescription className="flex items-center space-x-4 text-gray-600">
                          <span className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDate(summary.createdAt)}
                          </span>
                          <span className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatTimeAgo(summary.createdAt)}
                          </span>
                          <span className="flex items-center">
                            <FileText className="h-3 w-3 mr-1" />
                            {wordCount} words
                          </span>
                        </CardDescription>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {(summary._count?.shares || 0) > 0 && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Share2 className="h-3 w-3 mr-1" />
                            {summary._count?.shares || 0}
                          </div>
                        )}
                        <Link href={`/summary/${summary.id}/edit`}>
                          <Button variant="outline" size="sm" className="border-black bg-black text-white hover:bg-gray-800">
                            Edit
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div 
                      className="text-gray-700 line-clamp-3 prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{
                        __html: (summary.editedSummary || summary.aiSummary)
                          .replace(/^#+\s*/gm, '') // Remove markdown headers
                          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
                          .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic
                          .replace(/\n/g, '<br>') // Line breaks
                          .substring(0, 200) + '...'
                      }}
                    />
                    
                    {(summary._count?.shares || 0) > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">
                            Shared {summary._count?.shares || 0} time{(summary._count?.shares || 0) !== 1 ? 's' : ''}
                          </span>
                          <span className="text-gray-600">
                            Model: {summary.model}
                          </span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )})}
              
              {/* Infinite scroll loading indicator */}
              {isLoadingMore && (
                <div className="flex justify-center py-8">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin text-black" />
                    <span className="text-sm text-gray-600">Loading more summaries...</span>
                  </div>
                </div>
              )}
              
              {/* End of list indicator */}
              {!hasMore && summaries.length > 0 && (
                <div className="flex justify-center py-8">
                  <span className="text-sm text-gray-600">
                    You've reached the end of your summaries
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
