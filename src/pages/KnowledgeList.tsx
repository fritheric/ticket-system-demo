import React, { useState, useMemo } from 'react'
import { useStore } from '../store/useStore'
import type { KnowledgeArticle } from '../types'
import {
  Plus,
  Search,
  Edit3,
  Eye,
  Trash2,
  X,
  Filter,
  Send,
  Archive,
  ChevronLeft,
  ChevronRight,
  Tag,
} from 'lucide-react'
import RichEditor from '../components/RichEditor'

const BRAND = '#00A6FF'

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  published: 'bg-green-100 text-green-700',
  archived: 'bg-blue-100 text-blue-700',
}

const STATUS_LABELS: Record<string, string> = {
  draft: '草稿',
  published: '已发布',
  archived: '已归档',
}

function fmtDate(iso?: string): string {
  if (!iso) return '-'
  return new Date(iso).toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

/* ── Modal shell ──────────────────────────────────────── */
function Modal({
  open, onClose, title, children, size = 'md',
}: {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  size?: 'md' | 'lg' | 'xl'
}) {
  if (!open) return null
  const width = size === 'xl' ? 'max-w-5xl' : size === 'lg' ? 'max-w-3xl' : 'max-w-xl'
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${width} max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100"><X size={20} /></button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-4">{children}</div>
      </div>
    </div>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-700">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

/* ── main page ────────────────────────────────────────── */
export default function KnowledgeList() {
  const {
    articles, settings, currentUser,
    createArticle, updateArticle, deleteArticle,
  } = useStore()

  /* state */
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)

  /* modals */
  const [modalCreate, setModalCreate] = useState(false)
  const [modalEdit, setModalEdit] = useState<KnowledgeArticle | null>(null)
  const [modalView, setModalView] = useState<KnowledgeArticle | null>(null)

  /* form state */
  const [formTitle, setFormTitle] = useState('')
  const [formCategory, setFormCategory] = useState('')
  const [formTagInput, setFormTagInput] = useState('')
  const [formTags, setFormTags] = useState<string[]>([])
  const [formContent, setFormContent] = useState('')
  const [formStatus, setFormStatus] = useState<'draft' | 'published' | 'archived'>('draft')

  /* edit form state */
  const [editTitle, setEditTitle] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [editTagInput, setEditTagInput] = useState('')
  const [editTags, setEditTags] = useState<string[]>([])
  const [editContent, setEditContent] = useState('')
  const [editStatus, setEditStatus] = useState<'draft' | 'published' | 'archived'>('draft')

  /* ── filtered / paged ─────────────────────────────── */
  const rows = useMemo(() => {
    let list = [...articles]
    if (search) {
      const q = search.toLowerCase()
      list = list.filter((a) => a.title.toLowerCase().includes(q) || a.tags.some((t) => t.toLowerCase().includes(q)))
    }
    if (filterCategory) list = list.filter((a) => a.category === filterCategory)
    if (filterStatus) list = list.filter((a) => a.status === filterStatus)
    return list
  }, [articles, search, filterCategory, filterStatus])

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize))
  const paged = rows.slice((page - 1) * pageSize, page * pageSize)
  if (page > totalPages) setPage(totalPages)

  /* ── handlers ─────────────────────────────────────── */
  function openCreate() {
    setFormTitle('')
    setFormCategory(settings.knowledgeCategories[0] || '')
    setFormTagInput('')
    setFormTags([])
    setFormContent('')
    setFormStatus('draft')
    setModalCreate(true)
  }

  function handleCreate() {
    if (!formTitle.trim()) return
    createArticle({
      title: formTitle,
      category: formCategory,
      tags: formTags,
      content: formContent,
      status: formStatus,
      creatorId: currentUser?.id || '',
      creatorName: currentUser?.name || '',
    })
    setModalCreate(false)
  }

  function openEdit(a: KnowledgeArticle) {
    setModalEdit(a)
    setEditTitle(a.title)
    setEditCategory(a.category)
    setEditTagInput('')
    setEditTags([...a.tags])
    setEditContent(a.content)
    setEditStatus(a.status)
  }

  function handleEditSave() {
    if (!modalEdit || !editTitle.trim()) return
    updateArticle(modalEdit.id, {
      title: editTitle,
      category: editCategory,
      tags: editTags,
      content: editContent,
      status: editStatus,
    })
    setModalEdit(null)
  }

  function handlePublish(a: KnowledgeArticle) {
    updateArticle(a.id, { status: 'published' })
  }

  function handleArchive(a: KnowledgeArticle) {
    updateArticle(a.id, { status: 'archived' })
  }

  function addFormTag() {
    const t = formTagInput.trim()
    if (t && !formTags.includes(t)) {
      setFormTags((prev) => [...prev, t])
      setFormTagInput('')
    }
  }

  function addEditTag() {
    const t = editTagInput.trim()
    if (t && !editTags.includes(t)) {
      setEditTags((prev) => [...prev, t])
      setEditTagInput('')
    }
  }

  function removeFormTag(tag: string) {
    setFormTags((prev) => prev.filter((t) => t !== tag))
  }

  function removeEditTag(tag: string) {
    setEditTags((prev) => prev.filter((t) => t !== tag))
  }

  /* ── render ───────────────────────────────────────── */
  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">知识库</h1>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium shadow"
          style={{ background: BRAND }}
        >
          <Plus size={16} /> 新建文章
        </button>
      </div>

      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="搜索标题 / 标签"
            className="pl-9 pr-3 py-2 border rounded-lg text-sm w-64 focus:outline-none focus:ring-2"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-gray-400" />
          <select value={filterCategory} onChange={(e) => { setFilterCategory(e.target.value); setPage(1) }}
            className="border rounded-lg px-3 py-2 text-sm bg-white">
            <option value="">全部分类</option>
            {settings.knowledgeCategories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1) }}
            className="border rounded-lg px-3 py-2 text-sm bg-white">
            <option value="">全部状态</option>
            <option value="draft">草稿</option>
            <option value="published">已发布</option>
            <option value="archived">已归档</option>
          </select>
        </div>
        <span className="ml-auto text-sm text-gray-500">共 {rows.length} 篇</span>
      </div>

      {/* table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              {['标题', '分类', '标签', '状态', '创建人', '更新时间', '操作'].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-semibold whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 && (
              <tr><td colSpan={7} className="text-center py-12 text-gray-400">暂无文章</td></tr>
            )}
            {paged.map((a) => (
              <tr key={a.id} className="border-t hover:bg-gray-50/50">
                <td className="px-4 py-3 font-medium max-w-xs truncate" style={{ color: BRAND }}>{a.title}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">{a.category || '-'}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {a.tags.map((t) => (
                      <span key={t} className="px-1.5 py-0.5 rounded text-xs border border-gray-200 text-gray-500">{t}</span>
                    ))}
                    {a.tags.length === 0 && <span className="text-gray-300">-</span>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[a.status]}`}>
                    {STATUS_LABELS[a.status]}
                  </span>
                </td>
                <td className="px-4 py-3">{a.creatorName}</td>
                <td className="px-4 py-3 text-gray-500">{fmtDate(a.updatedAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <Btn title="查看" onClick={() => setModalView(a)}><Eye size={15} /></Btn>
                    <Btn title="编辑" onClick={() => openEdit(a)}><Edit3 size={15} /></Btn>
                    {a.status === 'draft' && (
                      <Btn title="发布" onClick={() => handlePublish(a)}><Send size={15} /></Btn>
                    )}
                    {a.status === 'published' && (
                      <Btn title="归档" onClick={() => handleArchive(a)}><Archive size={15} /></Btn>
                    )}
                    <Btn title="删除" danger onClick={() => deleteArticle(a.id)}><Trash2 size={15} /></Btn>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* pagination */}
      <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <span>共 {rows.length} 篇，第 {page}/{totalPages} 页</span>
          <select className="border rounded px-2 py-1" value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1) }}>
            {[50, 100, 200].map((s) => <option key={s} value={s}>每页{s}条</option>)}
          </select>
        </div>
        <div className="flex gap-1">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1.5 border rounded-lg disabled:opacity-40 hover:bg-gray-50">
            <ChevronLeft size={16} />
          </button>
          <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 border rounded-lg disabled:opacity-40 hover:bg-gray-50">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* ── Modals ──────────────────────────────────── */}

      {/* Create */}
      <Modal open={modalCreate} onClose={() => setModalCreate(false)} title="新建文章" size="lg">
        <div className="space-y-4">
          <Field label="标题" required>
            <input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="请输入文章标题" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="分类">
              <select value={formCategory} onChange={(e) => setFormCategory(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm bg-white">
                <option value="">请选择</option>
                {settings.knowledgeCategories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="状态">
              <select value={formStatus} onChange={(e) => setFormStatus(e.target.value as 'draft' | 'published' | 'archived')} className="w-full border rounded-lg px-3 py-2 text-sm bg-white">
                <option value="draft">草稿</option>
                <option value="published">已发布</option>
                <option value="archived">已归档</option>
              </select>
            </Field>
          </div>
          <Field label="标签">
            <div className="flex gap-2">
              <input value={formTagInput} onChange={(e) => setFormTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addFormTag()
                  }
                }}
                className="flex-1 border rounded-lg px-3 py-2 text-sm" placeholder="输入标签后回车" />
              <button onClick={addFormTag} className="px-3 py-2 border rounded-lg text-sm hover:bg-gray-50">添加</button>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {formTags.map((t) => (
                <span key={t} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs text-white" style={{ background: BRAND }}>
                  <Tag size={10} />{t}
                  <button onClick={() => removeFormTag(t)} className="ml-0.5">×</button>
                </span>
              ))}
            </div>
          </Field>
          <Field label="内容">
            <RichEditor
              value={formContent}
              onChange={setFormContent}
              placeholder="请输入文章内容..."
            />
          </Field>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setModalCreate(false)} className="px-4 py-2 border rounded-lg text-sm">取消</button>
          <button onClick={handleCreate} className="px-4 py-2 rounded-lg text-white text-sm" style={{ background: BRAND }}>创建</button>
        </div>
      </Modal>

      {/* Edit */}
      <Modal open={!!modalEdit} onClose={() => setModalEdit(null)} title="编辑文章" size="lg">
        <div className="space-y-4">
          <Field label="标题" required>
            <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="分类">
              <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm bg-white">
                <option value="">请选择</option>
                {settings.knowledgeCategories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="状态">
              <select value={editStatus} onChange={(e) => setEditStatus(e.target.value as 'draft' | 'published' | 'archived')} className="w-full border rounded-lg px-3 py-2 text-sm bg-white">
                <option value="draft">草稿</option>
                <option value="published">已发布</option>
                <option value="archived">已归档</option>
              </select>
            </Field>
          </div>
          <Field label="标签">
            <div className="flex gap-2">
              <input value={editTagInput} onChange={(e) => setEditTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addEditTag()
                  }
                }}
                className="flex-1 border rounded-lg px-3 py-2 text-sm" placeholder="输入标签后回车" />
              <button onClick={addEditTag} className="px-3 py-2 border rounded-lg text-sm hover:bg-gray-50">添加</button>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {editTags.map((t) => (
                <span key={t} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs text-white" style={{ background: BRAND }}>
                  <Tag size={10} />{t}
                  <button onClick={() => removeEditTag(t)} className="ml-0.5">×</button>
                </span>
              ))}
            </div>
          </Field>
          <Field label="内容">
            <RichEditor
              value={editContent}
              onChange={setEditContent}
              placeholder="请输入文章内容..."
            />
          </Field>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setModalEdit(null)} className="px-4 py-2 border rounded-lg text-sm">取消</button>
          <button onClick={handleEditSave} className="px-4 py-2 rounded-lg text-white text-sm" style={{ background: BRAND }}>保存</button>
        </div>
      </Modal>

      {/* View */}
      <Modal open={!!modalView} onClose={() => setModalView(null)} title={modalView?.title || '文章详情'} size="xl">
        {modalView && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm text-gray-500 flex-wrap">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[modalView.status]}`}>
                {STATUS_LABELS[modalView.status]}
              </span>
              {modalView.category && (
                <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">{modalView.category}</span>
              )}
              <span>创建人：{modalView.creatorName}</span>
              <span>更新时间：{fmtDate(modalView.updatedAt)}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {modalView.tags.map((t) => (
                <span key={t} className="px-2 py-0.5 rounded-full text-xs border border-gray-200 text-gray-500">{t}</span>
              ))}
            </div>
            <div className="border-t pt-4 whitespace-pre-wrap text-sm text-gray-800 leading-relaxed">
              {modalView.content || '暂无内容'}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

function Btn({ title, children, danger, onClick }: { title: string; children: React.ReactNode; danger?: boolean; onClick: () => void }) {
  return (
    <button title={title} onClick={onClick}
      className={`p-1.5 rounded-lg transition-colors ${danger ? 'text-red-500 hover:bg-red-50' : 'text-gray-500 hover:bg-gray-100'}`}>
      {children}
    </button>
  )
}
