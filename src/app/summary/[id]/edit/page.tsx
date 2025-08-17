"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save, Share2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ThemeToggle } from "@/components/ThemeToggle"
import { SummaryEditor } from "@/components/SummaryEditor"
import { useToast } from "@/hooks/use-toast"
import { summariesApi, type Summary } from "@/lib/api"

export default function EditSummaryPage() {
  const params = useParams()
  const router = useRouter()
  const summaryId = params.id as string
  const { toast } = useToast()

  const [summary, setSummary] = useState<Summary | null>(null)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Generate title from AI summary if no title exists
  const generateTitle = (aiSummary: string): string => {
    const firstLine = aiSummary.split('\n')[0]
    if (firstLine.includes('Meeting Summary:')) {
      return firstLine.replace('Meeting Summary:', '').trim()
    }
    if (firstLine.includes(':')) {
      return firstLine.split(':')[0].trim()
    }
    return firstLine.substring(0, 60) + (firstLine.length > 60 ? '...' : '')
  }

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const summaryData = await summariesApi.getById(summaryId)
        setSummary(summaryData)
        
        // Use editedSummary if it exists, otherwise use aiSummary
        const summaryContent = summaryData.editedSummary || summaryData.aiSummary
        const summaryTitle = generateTitle(summaryData.aiSummary)
        
        setTitle(summaryTitle)
        setContent(summaryContent)
      } catch (err) {
        console.error('Error fetching summary:', err)
        setError('Failed to load summary. Please try again.')
        toast({
          title: "Error",
          description: "Failed to load summary. Please try again.",
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (summaryId) {
      fetchSummary()
    }
  }, [summaryId, toast])

  useEffect(() => {
    if (summary) {
      const originalTitle = generateTitle(summary.aiSummary)
      const originalContent = summary.editedSummary || summary.aiSummary
      setHasChanges(title !== originalTitle || content !== originalContent)
    }
  }, [title, content, summary])

  const handleSave = async () => {
    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please provide a title for your summary",
        variant: "destructive"
      })
      return
    }

    if (!content.trim()) {
      toast({
        title: "Content required", 
        description: "Please add some content to your summary",
        variant: "destructive"
      })
      return
    }

    setIsSaving(true)
    
    try {
      // Update the summary with the edited content
      await summariesApi.update(summaryId, {
        editedSummary: content
      })
      
      toast({
        title: "Summary updated!",
        description: "Your changes have been saved successfully",
        variant: "default"
      })
      
      setHasChanges(false)
      
      // Redirect to summary view
      router.push(`/summary/${summaryId}`)
    } catch (error) {
      console.error('Error saving summary:', error)
      toast({
        title: "Save failed",
        description: "There was an error saving your changes. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleShare = () => {
    // Navigate to the summary view page for sharing
    router.push(`/summary/${summaryId}`)
  }

  // Show loading spinner while fetching data
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading summary...</span>
        </div>
      </div>
    )
  }

  // Show error state
  if (error || !summary) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {error || "Summary not found"}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            The summary you&apos;re looking for could not be loaded.
          </p>
          <Link href="/">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href={`/summary/${summaryId}`}>
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Summary
                </Button>
              </Link>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Edit Summary
              </h1>
              {hasChanges && (
                <span className="text-sm text-orange-600 dark:text-orange-400">
                  • Unsaved changes
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={handleShare}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
                <Button 
                  onClick={handleSave} 
                  disabled={isSaving || !hasChanges}
                  size="sm"
                >
                  {isSaving ? (
                    <>
                      <Save className="h-4 w-4 mr-2 animate-pulse" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Summary Info */}
          <Card>
            <CardHeader>
              <CardTitle>Editing: {title}</CardTitle>
              <CardDescription>
                Edit your meeting summary content below. The title is automatically generated from your summary.
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Content Editor */}
          <Card>
            <CardHeader>
              <CardTitle>Summary Content</CardTitle>
              <CardDescription>
                Edit your meeting summary using the rich text editor below
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SummaryEditor
                content={content}
                onChange={setContent}
                placeholder="Start editing your summary content..."
              />
            </CardContent>
          </Card>

          {/* Save Actions */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {hasChanges ? "You have unsaved changes" : "All changes saved"}
            </div>
            <div className="flex items-center space-x-3">
              <Link href={`/summary/${summaryId}`}>
                <Button variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button 
                onClick={handleSave} 
                disabled={isSaving || !hasChanges}
              >
                {isSaving ? (
                  <>
                    <Save className="h-4 w-4 mr-2 animate-pulse" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
