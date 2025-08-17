"use client"

import Link from "next/link"
import { Plus, Calendar, Clock, FileText, Share2, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ThemeToggle } from "@/components/ThemeToggle"

// Mock data - replace with real API call
const mockSummaries = [
  {
    id: "1",
    title: "Team Standup - Week 45",
    content: "Daily standup summary with updates from all team members...",
    createdAt: "2024-01-10T14:30:00Z",
    wordCount: 245,
    shares: [
      { id: "1", email: "john@example.com", viewedAt: "2024-01-10T15:00:00Z" },
      { id: "2", email: "sarah@example.com", viewedAt: null }
    ]
  },
  {
    id: "2", 
    title: "Product Planning Meeting",
    content: "Quarterly planning session covering Q1 2024 roadmap...",
    createdAt: "2024-01-08T10:00:00Z",
    wordCount: 512,
    shares: []
  },
  {
    id: "3",
    title: "Client Feedback Session",
    content: "Review of user feedback and feature requests...",
    createdAt: "2024-01-05T16:45:00Z", 
    wordCount: 178,
    shares: [
      { id: "3", email: "client@company.com", viewedAt: "2024-01-05T17:00:00Z" }
    ]
  }
]

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

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Meeting Notes
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <Link href="/new">
                <Button>
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
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Summaries</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockSummaries.length}</div>
              <p className="text-xs text-muted-foreground">
                {mockSummaries.reduce((acc, s) => acc + s.wordCount, 0).toLocaleString()} total words
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Shared</CardTitle>
              <Share2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {mockSummaries.filter(s => s.shares.length > 0).length}
              </div>
              <p className="text-xs text-muted-foreground">
                {mockSummaries.reduce((acc, s) => acc + s.shares.length, 0)} total shares
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Views</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {mockSummaries.reduce((acc, s) => 
                  acc + s.shares.filter(share => share.viewedAt).length, 0
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                From shared summaries
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Summaries List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Recent Summaries
            </h2>
          </div>

          {mockSummaries.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No summaries yet
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-center mb-6 max-w-sm">
                  Create your first meeting summary by uploading a transcript or entering text directly.
                </p>
                <Link href="/new">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Summary
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {mockSummaries.map((summary) => (
                <Card key={summary.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">
                          <Link 
                            href={`/summary/${summary.id}`}
                            className="hover:text-primary transition-colors"
                          >
                            {summary.title}
                          </Link>
                        </CardTitle>
                        <CardDescription className="flex items-center space-x-4">
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
                            {summary.wordCount} words
                          </span>
                        </CardDescription>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {summary.shares.length > 0 && (
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Share2 className="h-3 w-3 mr-1" />
                            {summary.shares.length}
                          </div>
                        )}
                        <Link href={`/summary/${summary.id}/edit`}>
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <p className="text-gray-600 dark:text-gray-300 line-clamp-2">
                      {summary.content}
                    </p>
                    
                    {summary.shares.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Shared with: {summary.shares.map(s => s.email).join(', ')}
                          </span>
                          <span className="text-muted-foreground">
                            {summary.shares.filter(s => s.viewedAt).length} viewed
                          </span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
