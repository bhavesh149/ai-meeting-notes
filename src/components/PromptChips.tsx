"use client"

import { Button } from "@/components/ui/button"

interface PromptChip {
  label: string
  prompt: string
}

const PRESET_PROMPTS: PromptChip[] = [
  {
    label: "Executive Summary",
    prompt: "Create a concise executive summary highlighting key decisions, outcomes, and strategic points from this meeting."
  },
  {
    label: "Action Items Only",
    prompt: "Extract and list only the action items, tasks, and next steps from this meeting with responsible parties and deadlines."
  },
  {
    label: "Bullet Points",
    prompt: "Summarize this meeting in clear bullet points covering main topics, decisions, and outcomes."
  },
  {
    label: "Detailed Notes",
    prompt: "Provide a comprehensive summary including all topics discussed, decisions made, action items, and participant contributions."
  },
  {
    label: "Quick Recap",
    prompt: "Give a brief 2-3 paragraph summary of the key points and outcomes from this meeting."
  }
]

interface PromptChipsProps {
  prompts?: string[]
  onSelect: (prompt: string) => void
  selectedPrompt?: string
  className?: string
}

export function PromptChips({ prompts, onSelect, selectedPrompt, className }: PromptChipsProps) {
  const displayPrompts = prompts || PRESET_PROMPTS
  
  return (
    <div className={className}>
      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
        Quick Templates
      </h4>
      <div className="flex flex-wrap gap-2">
        {displayPrompts.map((item, index) => {
          const isString = typeof item === 'string'
          const prompt = isString ? item : item.prompt
          const label = isString ? item.slice(0, 30) + (item.length > 30 ? '...' : '') : item.label
          
          return (
            <Button
              key={index}
              variant={selectedPrompt === prompt ? "default" : "outline"}
              size="sm"
              onClick={() => onSelect(prompt)}
              className="text-xs h-7 px-3 hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              {label}
            </Button>
          )
        })}
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
        Click any template to auto-fill the prompt, or write your own custom prompt below.
      </p>
    </div>
  )
}
