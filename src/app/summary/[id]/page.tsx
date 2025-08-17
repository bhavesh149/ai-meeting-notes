"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Edit3, Share2, Download, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { summariesApi, Summary } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export default function SummaryViewPage() {
  const params = useParams()
  const router = useRouter()
  const summaryId = params.id as string
  const { toast } = useToast()
  
  const [summary, setSummary] = useState<Summary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [shareEmails, setShareEmails] = useState("")
  const [isSharing, setIsSharing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const data = await summariesApi.getById(summaryId)
        setSummary(data)
      } catch (error) {
        console.error('Failed to load summary:', error)
        toast({
          title: "Error",
          description: "Failed to load summary",
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (summaryId) {
      loadSummary()
    }
  }, [summaryId, toast])

  const handleShare = async () => {
    if (!shareEmails.trim()) {
      toast({
        title: "Email required",
        description: "Please enter at least one email address",
        variant: "destructive"
      })
      return
    }

    setIsSharing(true)
    try {
      const emails = shareEmails.split(',').map(e => e.trim()).filter(e => e)
      await summariesApi.share(summaryId, {
        recipients: emails,
        subject: `Meeting Summary: ${summary?.aiSummary.split('\n')[0].replace(/^#+\s*/, '') || 'Untitled'}`
      })
      
      toast({
        title: "Summary shared!",
        description: `Sent to ${emails.length} recipient(s)`,
        variant: "success"
      })
      
      setShareEmails("")
    } catch (error) {
      console.error('Share error:', error)
      toast({
        title: "Share failed",
        description: "There was an error sharing the summary",
        variant: "destructive"
      })
    } finally {
      setIsSharing(false)
    }
  }

  const handleDownload = () => {
    if (!summary) return
    
    const title = summary.aiSummary.split('\n')[0].replace(/^#+\s*/, '') || 'Untitled Summary'
    const element = document.createElement("a")
    const file = new Blob([summary.editedSummary || summary.aiSummary], {type: 'text/html'})
    element.href = URL.createObjectURL(file)
    element.download = `${title}.html`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const handleDelete = async () => {
    if (!summary) return
    
    const confirmed = window.confirm('Are you sure you want to delete this summary? This action cannot be undone.')
    if (!confirmed) return

    setIsDeleting(true)
    
    try {
      await summariesApi.delete(summaryId)
      
      // Refresh the dashboard to update the count
      if (typeof window !== 'undefined' && (window as any).refreshSummaries) {
        (window as any).refreshSummaries()
      }
      
      toast({
        title: "Summary deleted",
        description: "The summary has been permanently deleted",
        variant: "default"
      })
      
      // Redirect to dashboard
      router.push('/')
    } catch (error) {
      console.error('Error deleting summary:', error)
      toast({
        title: "Delete failed",
        description: "There was an error deleting the summary. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    )
  }

  if (!summary) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-black mb-2">
            Summary not found
          </h1>
          <Link href="/">
            <Button className="bg-black text-white hover:bg-gray-800">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  const title = summary.aiSummary.split('\n')[0].replace(/^#+\s*/, '') || 'Untitled Summary'

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-black border-b border-gray-200 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="text-white hover:bg-gray-800">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="border-white text-white hover:bg-gray-800">
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-white border-gray-200">
                    <DialogHeader>
                      <DialogTitle className="text-black">Share Summary</DialogTitle>
                      <DialogDescription className="text-gray-600">
                        Enter email addresses separated by commas to share this summary
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Input
                        placeholder="email1@example.com, email2@example.com"
                        value={shareEmails}
                        onChange={(e) => setShareEmails(e.target.value)}
                        className="border-gray-300 text-black bg-white placeholder:text-gray-500"
                      />
                      <Button 
                        onClick={handleShare} 
                        disabled={isSharing || !shareEmails.trim()}
                        className="w-full bg-black text-black hover:bg-gray-800"
                      >
                        {isSharing ? "Sharing..." : "Send"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button variant="outline" size="sm" onClick={handleDownload} className="border-white text-white hover:bg-gray-800">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Link href={`/summary/${summaryId}/edit`}>
                  <Button variant="outline" size="sm" className="border-white text-white hover:bg-gray-800">
                    <Edit3 className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </Link>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="bg-red-600 text-white hover:bg-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {isDeleting ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="bg-white border border-gray-200 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-black">
              {title}
            </CardTitle>
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Created on {formatDate(summary.createdAt)}</span>
              <div className="flex items-center space-x-4">
                <span>{summary.aiSummary.split(' ').length} words</span>
                <span>Model: {summary.model}</span>
                {summary.shares && summary.shares.length > 0 && (
                  <span>Shared with {summary.shares.length} people</span>
                )}
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <div 
              className="prose prose-sm sm:prose lg:prose-lg max-w-none text-gray-700"
              dangerouslySetInnerHTML={{ 
                __html: (summary.editedSummary || summary.aiSummary)
                  .replace(/\n/g, '<br>')
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
                  .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic
                  .replace(/^### (.*$)/gm, '<h3>$1</h3>') // H3 headers
                  .replace(/^## (.*$)/gm, '<h2>$1</h2>') // H2 headers
                  .replace(/^# (.*$)/gm, '<h1>$1</h1>') // H1 headers
                  .replace(/^\* (.*$)/gm, '<li>$1</li>') // List items
              }}
            />
            
            {summary.shares && summary.shares.length > 0 && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-medium text-black mb-3">
                  Sharing Activity
                </h4>
                <div className="space-y-2">
                  {summary.shares.map((share) => (
                    <div key={share.id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-300">
                        {share.recipients.join(', ')}
                      </span>
                      <span className="text-muted-foreground">
                        Shared {formatDate(share.createdAt)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
