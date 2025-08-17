"use client"

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { Button } from "@/components/ui/button"
import { Bold, Italic, List, ListOrdered, Quote, Undo, Redo } from "lucide-react"
import { cn } from "@/lib/utils"

interface SummaryEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  className?: string
}

export function SummaryEditor({ content, onChange, placeholder = "Start editing your summary...", className }: SummaryEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'tiptap prose prose-sm sm:prose lg:prose-lg xl:prose-2xl max-w-none dark:prose-invert focus:outline-none',
      },
    },
  })

  if (!editor) {
    return null
  }

  return (
    <div className={cn("border rounded-lg overflow-hidden", className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b bg-gray-50 dark:bg-gray-800/50">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={cn(
            "h-7 w-7 p-0",
            editor.isActive('bold') && "bg-primary text-primary-foreground"
          )}
        >
          <Bold className="h-3.5 w-3.5" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={cn(
            "h-7 w-7 p-0",
            editor.isActive('italic') && "bg-primary text-primary-foreground"
          )}
        >
          <Italic className="h-3.5 w-3.5" />
        </Button>

        <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1" />

        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={cn(
            "h-7 w-7 p-0",
            editor.isActive('bulletList') && "bg-primary text-primary-foreground"
          )}
        >
          <List className="h-3.5 w-3.5" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={cn(
            "h-7 w-7 p-0",
            editor.isActive('orderedList') && "bg-primary text-primary-foreground"
          )}
        >
          <ListOrdered className="h-3.5 w-3.5" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={cn(
            "h-7 w-7 p-0",
            editor.isActive('blockquote') && "bg-primary text-primary-foreground"
          )}
        >
          <Quote className="h-3.5 w-3.5" />
        </Button>

        <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1" />

        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="h-7 w-7 p-0"
        >
          <Undo className="h-3.5 w-3.5" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="h-7 w-7 p-0"
        >
          <Redo className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Editor */}
      <div className="min-h-[300px] p-4 bg-white dark:bg-gray-900">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
