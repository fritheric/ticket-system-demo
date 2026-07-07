import React, { useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Code,
  Minus,
} from 'lucide-react'

const BRAND = '#00A6FF'

interface RichEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

const toolbarBtnBase =
  'inline-flex items-center justify-center w-8 h-8 rounded-md text-sm transition-colors hover:bg-gray-100 text-gray-600'

const toolbarBtnActive = 'bg-blue-50 text-blue-600'

export default function RichEditor({
  value,
  onChange,
  placeholder = '请输入内容...',
  className = '',
}: RichEditorProps): React.ReactElement {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2] },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML())
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-sm max-w-none focus:outline-none min-h-[200px] px-4 py-3 text-gray-800 leading-relaxed',
      },
    },
  })

  const isActive = useCallback(
    (name: string) => {
      if (!editor) return false
      if (name === 'bold') return editor.isActive('bold')
      if (name === 'italic') return editor.isActive('italic')
      if (name === 'heading' && editor.isActive('heading', { level: 1 })) return true
      if (name === 'heading2' && editor.isActive('heading', { level: 2 })) return true
      if (name === 'bulletList') return editor.isActive('bulletList')
      if (name === 'orderedList') return editor.isActive('orderedList')
      if (name === 'codeBlock') return editor.isActive('codeBlock')
      return false
    },
    [editor],
  )

  if (!editor) return <div className="border rounded-lg p-4 text-gray-400 text-sm">编辑器加载中...</div>

  return (
    <div className={`border rounded-lg overflow-hidden ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b bg-gray-50 flex-wrap">
        <button
          type="button"
          title="加粗"
          className={`${toolbarBtnBase} ${isActive('bold') ? toolbarBtnActive : ''}`}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold size={16} />
        </button>
        <button
          type="button"
          title="斜体"
          className={`${toolbarBtnBase} ${isActive('italic') ? toolbarBtnActive : ''}`}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic size={16} />
        </button>

        <div className="w-px h-5 bg-gray-200 mx-1" />

        <button
          type="button"
          title="标题 1"
          className={`${toolbarBtnBase} ${isActive('heading') ? toolbarBtnActive : ''}`}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        >
          <Heading1 size={16} />
        </button>
        <button
          type="button"
          title="标题 2"
          className={`${toolbarBtnBase} ${isActive('heading2') ? toolbarBtnActive : ''}`}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 size={16} />
        </button>

        <div className="w-px h-5 bg-gray-200 mx-1" />

        <button
          type="button"
          title="无序列表"
          className={`${toolbarBtnBase} ${isActive('bulletList') ? toolbarBtnActive : ''}`}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List size={16} />
        </button>
        <button
          type="button"
          title="有序列表"
          className={`${toolbarBtnBase} ${isActive('orderedList') ? toolbarBtnActive : ''}`}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered size={16} />
        </button>
        <button
          type="button"
          title="代码块"
          className={`${toolbarBtnBase} ${isActive('codeBlock') ? toolbarBtnActive : ''}`}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        >
          <Code size={16} />
        </button>
        <button
          type="button"
          title="分割线"
          className={toolbarBtnBase}
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          <Minus size={16} />
        </button>
      </div>

      {/* Editor content */}
      <EditorContent editor={editor} className="min-h-[200px]" />

      {/* Hidden textarea for form submission compatibility */}
      <textarea
        className="hidden"
        readOnly
        value={value}
        onChange={() => {}}
      />
    </div>
  )
}
