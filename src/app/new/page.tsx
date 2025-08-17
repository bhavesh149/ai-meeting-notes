"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Sparkles, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileInput } from "@/components/FileInput"
import { PromptChips } from "@/components/PromptChips"
import { SummaryEditor } from "@/components/SummaryEditor"
import { useToast } from "@/hooks/use-toast"
import { summariesApi } from "@/lib/api"

const suggestedPrompts = [
  "Create a detailed meeting summary with action items",
  "Extract key decisions and next steps",
  "Summarize main discussion points and outcomes",
  "Generate action items with owners and deadlines",
  "Create executive summary for leadership team"
]

export default function NewSummaryPage() {
  const [activeTab, setActiveTab] = useState("text")
  const [title, setTitle] = useState("")
  const [inputText, setInputText] = useState("")
  const [customPrompt, setCustomPrompt] = useState("")
  const [summary, setSummary] = useState("")
  const [summaryId, setSummaryId] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  
  const { toast } = useToast()

  const handlePromptSelect = (prompt: string) => {
    setCustomPrompt(prompt)
  }

  const handleGenerate = async () => {
    if (!inputText.trim() && !file) {
      toast({
        title: "Input required",
        description: "Please provide text input or upload a file",
        variant: "destructive"
      })
      return
    }

    setIsGenerating(true)
    
    try {
      let result
      
      if (file) {
        // Use file upload API
        result = await summariesApi.createWithFile(file, customPrompt || suggestedPrompts[0])
      } else {
        // Use text input API
        result = await summariesApi.create({
          transcript: inputText,
          prompt: customPrompt || suggestedPrompts[0]
        })
      }
      
      setSummary(result.aiSummary)
      setSummaryId(result.id)
      
      // Refresh the dashboard to show the new summary
      if (typeof window !== 'undefined' && (window as any).refreshSummaries) {
        (window as any).refreshSummaries()
      }
      
      toast({
        title: "Summary generated!",
        description: `Generated ${result.tokensOut} tokens using ${result.model}`,
        variant: "success"
      })
    } catch (error) {
      console.error('Generation error:', error)
      toast({
        title: "Generation failed",
        description: "There was an error generating your summary. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSave = async () => {
    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please provide a title for your summary",
        variant: "destructive"
      })
      return
    }

    if (!summary.trim() || !summaryId) {
      toast({
        title: "Content required", 
        description: "Please generate a summary first",
        variant: "destructive"
      })
      return
    }

    try {
      // Update the summary with the title and edited content
      await summariesApi.update(summaryId, {
        editedSummary: summary
      })
      
      toast({
        title: "Summary saved!",
        description: "Your meeting summary has been saved successfully",
        variant: "success"
      })
      
      // Redirect to summary view
      window.location.href = `/summary/${summaryId}`
    } catch (error) {
      console.error('Save error:', error)
      toast({
        title: "Save failed",
        description: "There was an error saving your summary. Please try again.",
        variant: "destructive"
      })
    }
  }

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
                  Back
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-white">
                New Summary
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {summaryId && (
                <Link href={`/summary/${summaryId}`}>
                  <Button variant="outline" className="border-white text-white hover:bg-gray-800">
                    View Summary
                  </Button>
                </Link>
              )}
              <Button onClick={handleSave} disabled={!summary.trim() || !summaryId} className="bg-white text-black border border-white hover:bg-gray-100 disabled:bg-gray-200 disabled:text-gray-500 shadow-md">
                <Send className="h-4 w-4 mr-2" />
                Save Summary
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            <Card className="bg-white border border-gray-200 shadow-lg">
              <CardHeader>
                <CardTitle className="text-black">Meeting Details</CardTitle>
                <CardDescription className="text-gray-600">
                  Provide basic information about your meeting
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Title
                  </label>
                  <Input
                    placeholder="Enter meeting title..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="border-gray-300 text-black bg-white placeholder:text-gray-500"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200 shadow-lg">
              <CardHeader>
                <CardTitle className="text-black">Content Input</CardTitle>
                <CardDescription className="text-gray-600">
                  Upload a transcript file or paste meeting content
                </CardDescription>
              </CardHeader>
              <CardContent className="bg-white">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="bg-white rounded-lg shadow">
                  <TabsList className="grid w-full grid-cols-2 bg-white p-1">
                    <TabsTrigger value="text" className="data-[state=active]:bg-black data-[state=active]:text-white text-gray-700 hover:text-black transition-colors">Text Input</TabsTrigger>
                    <TabsTrigger value="file" className="data-[state=active]:bg-black data-[state=active]:text-white text-gray-700 hover:text-black transition-colors">File Upload</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="text" className="space-y-4">
                    <Textarea
                      placeholder="Paste your meeting transcript or notes here..."
                      className="min-h-[200px] border-gray-300 text-black bg-white placeholder:text-gray-500"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                    />
                  </TabsContent>
                  
                  <TabsContent value="file" className="space-y-4">
                    <FileInput
                      onFileSelect={setFile}
                      acceptedTypes=".txt,.docx,.pdf"
                      maxSize={10}
                    />
                    {file && (
                      <div className="text-sm text-gray-600">
                        Selected: {file.name} ({Math.round(file.size / 1024)}KB)
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200 shadow-lg">
              <CardHeader>
                <CardTitle className="text-black">Summary Instructions</CardTitle>
                <CardDescription className="text-gray-600">
                  Customize how you want your summary to be generated
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <PromptChips
                  prompts={suggestedPrompts}
                  onSelect={handlePromptSelect}
                  selectedPrompt={customPrompt}
                />
                
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Custom Instructions (optional)
                  </label>
                  <Textarea
                    placeholder="Add any specific instructions for the AI..."
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    rows={3}
                    className="border-gray-300 text-black bg-white placeholder:text-gray-500"
                  />
                </div>

                <Button 
                  onClick={handleGenerate} 
                  disabled={isGenerating || (!inputText.trim() && !file)}
                  className="w-full bg-white border-1 border-gray-300 text-black hover:bg-gray-800 disabled:bg-gray-400 disabled:text-black"
                >
                  {isGenerating ? (
                    <>
                      <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                      Generating Summary...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Summary
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Output Section */}
          <div className="space-y-6">
            <Card className="bg-white border border-gray-200 shadow-lg">
              <CardHeader>
                <CardTitle className="text-black">Generated Summary</CardTitle>
                <CardDescription className="text-gray-600">
                  Review and edit your AI-generated meeting summary
                </CardDescription>
              </CardHeader>
              <CardContent>
                {summary ? (
                  <>
                    <SummaryEditor
                      content={summary}
                      onChange={setSummary}
                      placeholder="Your generated summary will appear here..."
                    />
                    {summaryId && (
                      <div className="mt-4 flex justify-center">
                        <Link href={`/summary/${summaryId}`}>
                          <Button variant="outline" size="sm" className="border-black text-white ">
                            View Summary Page
                          </Button>
                        </Link>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="min-h-[400px] border border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <Sparkles className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-black mb-2">
                        No summary yet
                      </h3>
                      <p className="text-gray-600 max-w-sm">
                        Add your meeting content and click "Generate Summary" to create an AI-powered summary.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
