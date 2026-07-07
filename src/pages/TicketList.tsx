import { useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import type { Ticket, TicketPriority, TicketStatus, User, SystemSettings } from '../types'
import ExcelImport from '../components/ExcelImport'
import {
  Plus, Search, Filter, Eye, Edit2, Trash2, RotateCcw,
  ChevronLeft, ChevronRight, Download, ArrowRightLeft, X, Check, Upload,
  Settings2, Users
} from 'lucide-react'

/* ==================== 常量 ==================== */
const PAGE_SIZE_OPTIONS = [50, 100, 200] as const

const PRIORITY_COLORS: Record<TicketPriority, string> = {
  low: 'bg-gray-100 text-gray-600 border border-gray-200',
  medium: 'bg-blue-100 text-blue-700 border border-blue-200',
  high: 'bg-orange-100 text-orange-700 border border-orange-200',
  urgent: 'bg-red-100 text-red-700 border border-red-200',
}

const PRIORITY_LABELS: Record<TicketPriority, string> = {
  low: '低', medium: '中', high: '高', urgent: '紧急',
}

const STATUS_COLORS: Record<TicketStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
  overdue: 'bg-red-100 text-red-700 border border-red-200',
  completed: 'bg-green-100 text-green-700 border border-green-200',
}

const STATUS_LABELS: Record<TicketStatus, string> = {
  pending: '待处理', overdue: '已超时', completed: '已完成',
}

/* ==================== 工具 ==================== */
function fmt(iso: string): string {
  if (!iso) return '-'
  const d = new Date(iso)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${day} ${hh}:${mm}`
}

function isOverdue(t: Ticket, rules: Record<string, number>): boolean {
  if (t.status === 'completed') return false
  const hrs = rules[t.priority] ?? 48
  const deadline = new Date(t.createdAt).getTime() + hrs * 3600_000
  return Date.now() > deadline
}

/* ==================== 主页面 ==================== */
export default function TicketList() {
  const navigate = useNavigate()
  const tickets = useStore((s) => s.tickets)
  const users = useStore((s) => s.users)
  const updateTicket = useStore((s) => s.updateTicket)
  const createTicket = useStore((s) => s.createTicket)
  const deleteTicket = useStore((s) => s.deleteTicket)
  const restoreTicket = useStore((s) => s.restoreTicket)
  const addAuditLog = useStore((s) => s.addAuditLog)
  const currentUser = useStore((s) => s.currentUser)
  const settings = useStore((s) => s.settings)

  // 自动超时标记
  const autoMarkOverdue = useCallback(() => {
    const rules = settings.timeoutRules
    tickets.forEach((t) => {
      if (!t.isDeleted && t.status === 'pending' && isOverdue(t, rules)) {
        updateTicket(t.id, { status: 'overdue' })
      }
    })
  }, [tickets, updateTicket, settings.timeoutRules])

  // 状态
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<TicketStatus | ''>('')
  const [filterPriority, setFilterPriority] = useState<TicketPriority | ''>('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const [showCreate, setShowCreate] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [editing, setEditing] = useState<Ticket | null>(null)
  const [showTransfer, setShowTransfer] = useState(false)
  const [transferTarget, setTransferTarget] = useState<Ticket | null>(null)
  const [transferOriginalId, setTransferOriginalId] = useState<string>('')
  const [transferOriginalName, setTransferOriginalName] = useState<string>('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showDeleted, setShowDeleted] = useState(false)
  const [showExcelImport, setShowExcelImport] = useState(false)

  // 批量操作状态
  const [showBatchStatus, setShowBatchStatus] = useState(false)
  const [showBatchAssign, setShowBatchAssign] = useState(false)
  // 转派确认/拒绝状态
  const [transferConfirmTarget, setTransferConfirmTarget] = useState<Ticket | null>(null)
  const [transferRejectTarget, setTransferRejectTarget] = useState<Ticket | null>(null)
  const [rejectReason, setRejectReason] = useState<string>('')

  // 初始化自动标记
  useMemo(() => { autoMarkOverdue(); return true }, [autoMarkOverdue])

  // 筛选逻辑
  const filtered = useMemo(() => {
    let list = tickets.filter((t) => {
      if (showDeleted) return t.isDeleted
      return !t.isDeleted
    })

    if (filterStatus) {
      list = list.filter((t) => t.status === filterStatus)
    }
    if (filterPriority) {
      list = list.filter((t) => t.priority === filterPriority)
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter((t) =>
        t.ticketNo.toLowerCase().includes(q) ||
        t.riderName.toLowerCase().includes(q) ||
        t.title.toLowerCase().includes(q) ||
        t.caseOrderNo.toLowerCase().includes(q),
      )
    }

    list.sort((a, b) => {
      // 紧急 > 高 > 中 > 低
      const pOrder: Record<TicketPriority, number> = { urgent: 0, high: 1, medium: 2, low: 3 }
      const pa = pOrder[a.priority] ?? 4
      const pb = pOrder[b.priority] ?? 4
      if (pa !== pb) return pa - pb
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    return list
  }, [tickets, search, filterStatus, filterPriority, showDeleted])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

  const handleCreate = (form: Record<string, string>) => {
    if (!currentUser) return
    const timeoutRule = settings.timeoutRules[form.priority as keyof typeof settings.timeoutRules]
    createTicket({
      caseOrderNo: form.caseOrderNo,
      riderId: form.riderId,
      riderName: form.riderName,
      riderCity: form.riderCity,
      title: form.title,
      priority: form.priority as TicketPriority,
      status: 'pending',
      responsiblePersonId: form.responsiblePersonId,
      responsiblePersonName: form.responsiblePersonName,
      creatorId: currentUser.id,
      creatorName: currentUser.name,
      caseType: (form.caseType?.split(',') || []) as ('意外' | '三者')[],
      caseDesc: form.caseDesc || '',
      overdueAt: new Date(Date.now() + (timeoutRule || 48) * 3600_000).toISOString(),
      linkedIncidentId: form.linkedIncidentId || undefined,
    })
    setShowCreate(false)
  }

  const handleEdit = (form: Record<string, string>) => {
    if (!editing) return
    updateTicket(editing.id, {
      caseOrderNo: form.caseOrderNo,
      riderName: form.riderName,
      riderId: form.riderId,
      riderCity: form.riderCity,
      title: form.title,
      priority: form.priority as TicketPriority,
      responsiblePersonId: form.responsiblePersonId,
      responsiblePersonName: form.responsiblePersonName,
      caseType: (form.caseType?.split(',') || []) as ('意外' | '三者')[],
      caseDesc: form.caseDesc,
      linkedIncidentId: form.linkedIncidentId || undefined,
    })
    setShowEdit(false)
    setEditing(null)
  }

  const handleTransfer = (reason: string, targetUserId: string): void => {
    if (!transferTarget || !currentUser) return
    const target = users.find((u) => u.id === targetUserId)
    if (!target) return
    // 保存原负责人信息用于拒绝时回退
    setTransferOriginalId(transferTarget.responsiblePersonId)
    setTransferOriginalName(transferTarget.responsiblePersonName)
    // 设置转派状态为 pending
    updateTicket(transferTarget.id, {
      transferStatus: 'pending',
      transferReason: reason,
      responsiblePersonId: target.id,
      responsiblePersonName: target.name,
    })
    // 记录操作日志
    addAuditLog(
      currentUser.id,
      currentUser.name,
      '发起转派',
      '工单',
      { ticketId: transferTarget.id, ticketNo: transferTarget.ticketNo, from: transferTarget.responsiblePersonName, to: target.name, reason },
    )
    setShowTransfer(false)
    setTransferTarget(null)
  }

  // 确认转派：被转派人确认后，清除 pending 状态
  const handleConfirmTransfer = (ticket: Ticket): void => {
    if (!currentUser) return
    updateTicket(ticket.id, {
      transferStatus: 'confirmed',
      transferRejectReason: undefined,
    })
    addAuditLog(
      currentUser.id,
      currentUser.name,
      '确认转派',
      '工单',
      { ticketId: ticket.id, ticketNo: ticket.ticketNo },
    )
    setTransferConfirmTarget(null)
  }

  // 拒绝转派：回退负责人为原负责人，清除 pending 状态
  const handleRejectTransfer = (ticket: Ticket, reason: string): void => {
    if (!currentUser) return
    updateTicket(ticket.id, {
      transferStatus: 'rejected',
      transferRejectReason: reason,
      responsiblePersonId: transferOriginalId || ticket.responsiblePersonId,
      responsiblePersonName: transferOriginalName || ticket.responsiblePersonName,
    })
    addAuditLog(
      currentUser.id,
      currentUser.name,
      '拒绝转派',
      '工单',
      { ticketId: ticket.id, ticketNo: ticket.ticketNo, reason },
    )
    setTransferRejectTarget(null)
    setRejectReason('')
  }

  // 批量改状态
  const handleBatchStatusChange = (newStatus: TicketStatus): void => {
    if (!currentUser) return
    const ids = selectedIds.size > 0 ? selectedIds : new Set(paginated.map((t) => t.id))
    const ticketsToUpdate = tickets.filter((t) => ids.has(t.id))
    ticketsToUpdate.forEach((t) => {
      updateTicket(t.id, { status: newStatus })
    })
    addAuditLog(
      currentUser.id,
      currentUser.name,
      '批量改状态',
      '工单',
      { count: ticketsToUpdate.length, newStatus: STATUS_LABELS[newStatus], ticketIds: Array.from(ids) },
    )
    setShowBatchStatus(false)
  }

  // 批量指派/转派
  const handleBatchAssign = (targetUserId: string, reason: string): void => {
    if (!currentUser) return
    const target = users.find((u) => u.id === targetUserId)
    if (!target) return
    const ids = selectedIds.size > 0 ? selectedIds : new Set(paginated.map((t) => t.id))
    const ticketsToUpdate = tickets.filter((t) => ids.has(t.id))
    ticketsToUpdate.forEach((t) => {
      updateTicket(t.id, {
        responsiblePersonId: target.id,
        responsiblePersonName: target.name,
        transferStatus: 'pending',
        transferReason: reason,
      })
    })
    addAuditLog(
      currentUser.id,
      currentUser.name,
      '批量转派',
      '工单',
      { count: ticketsToUpdate.length, targetName: target.name, reason, ticketIds: Array.from(ids) },
    )
    setShowBatchAssign(false)
  }

  const handleExcelImport = (data: Record<string, unknown>[]) => {
    if (!currentUser) return
    const timeoutRule = settings.timeoutRules
    data.forEach((row) => {
      const priority = String(row.priority || 'medium') as TicketPriority
      const hrs = timeoutRule[priority] ?? 48
      const caseTypeStr = String(row.caseType || '意外')
      createTicket({
        caseOrderNo: String(row.caseOrderNo || ''),
        riderId: String(row.riderId || ''),
        riderName: String(row.riderName || ''),
        riderCity: String(row.riderCity || ''),
        title: String(row.title || ''),
        priority,
        status: 'pending',
        responsiblePersonId: '',
        responsiblePersonName: String(row.responsiblePersonName || ''),
        creatorId: currentUser.id,
        creatorName: currentUser.name,
        caseType: caseTypeStr.split(/[,，]/).map((s) => s.trim() as '意外' | '三者'),
        caseDesc: String(row.caseDesc || ''),
        overdueAt: new Date(Date.now() + hrs * 3600_000).toISOString(),
        linkedIncidentId: undefined,
      })
    })
    setShowExcelImport(false)
  }

  const handleExport = () => {
    const ids = selectedIds.size > 0 ? selectedIds : new Set(paginated.map((t) => t.id))
    const rows: string[] = [
      '工单编号,案件/订单号,骑手姓名,城市,标题,优先级,状态,负责人,创建时间',
    ]
    tickets
      .filter((t) => ids.has(t.id))
      .forEach((t) => {
        rows.push(
          `"${t.ticketNo}","${t.caseOrderNo}","${t.riderName}","${t.riderCity}","${t.title}","${PRIORITY_LABELS[t.priority]}","${STATUS_LABELS[t.status]}","${t.responsiblePersonName}","${fmt(t.createdAt)}"`,
        )
      })
    const blob = new Blob(['\uFEFF' + rows.join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `工单导出_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-4 space-y-4">
      {/* 标题 + 操作栏 */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-xl font-bold text-gray-800">工单管理</h2>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-md text-white text-sm"
            style={{ backgroundColor: '#00A6FF' }}
          >
            <Plus size={16} /> 新建工单
          </button>
          {selectedIds.size > 0 && (
            <>
              <button
                onClick={() => setShowBatchStatus(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm text-white"
                style={{ backgroundColor: '#00A6FF' }}
              >
                <Settings2 size={16} /> 批量改状态 ({selectedIds.size})
              </button>
              <button
                onClick={() => setShowBatchAssign(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm text-white"
                style={{ backgroundColor: '#00A6FF' }}
              >
                <Users size={16} /> 批量转派 ({selectedIds.size})
              </button>
            </>
          )}
          <button
            onClick={() => { setShowDeleted(!showDeleted); setSelectedIds(new Set()); }}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm border ${showDeleted ? 'bg-red-50 text-red-600 border-red-200' : 'bg-white text-gray-600 border-gray-200'}`}
          >
            <RotateCcw size={16} /> {showDeleted ? '回收站' : '回收站'}
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm bg-green-600 text-white"
          >
            <Download size={16} /> 导出 {selectedIds.size > 0 ? `(${selectedIds.size})` : ''}
          </button>
          <button
            onClick={() => setShowExcelImport(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm border border-gray-200 hover:bg-gray-50"
          >
            <Upload size={16} /> 导入 Excel
          </button>
        </div>
      </div>

      {/* 搜索 + 筛选 */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-52">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#00A6FF]"
            placeholder="搜索工单号 / 骑手名 / 标题 / 案件号"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <div className="flex items-center gap-1">
          <Filter size={16} className="text-gray-400" />
          <select
            className="border border-gray-200 rounded-md text-sm px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#00A6FF]"
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value as TicketStatus | ''); setPage(1) }}
          >
            <option value="">全部状态</option>
            <option value="pending">待处理</option>
            <option value="overdue">已超时</option>
            <option value="completed">已完成</option>

          </select>
          <select
            className="border border-gray-200 rounded-md text-sm px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#00A6FF]"
            value={filterPriority}
            onChange={(e) => { setFilterPriority(e.target.value as TicketPriority | ''); setPage(1) }}
          >
            <option value="">全部优先级</option>
            <option value="urgent">紧急</option>
            <option value="high">高</option>
            <option value="medium">中</option>
            <option value="low">低</option>
          </select>
        </div>
      </div>

      {/* 表格 */}
      <div className="overflow-auto rounded-md border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="px-3 py-2 text-left w-8">
                <input
                  type="checkbox"
                  className="rounded"
                  checked={selectedIds.size === paginated.length && paginated.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedIds(new Set(paginated.map((t) => t.id)))
                    } else {
                      setSelectedIds(new Set())
                    }
                  }}
                />
              </th>
              <th className="px-3 py-2 text-left font-medium">工单编号</th>
              <th className="px-3 py-2 text-left font-medium">案件/订单号</th>
              <th className="px-3 py-2 text-left font-medium">骑手姓名</th>
              <th className="px-3 py-2 text-left font-medium">城市</th>
              <th className="px-3 py-2 text-left font-medium">标题</th>
              <th className="px-3 py-2 text-left font-medium">优先级</th>
              <th className="px-3 py-2 text-left font-medium">状态</th>
              <th className="px-3 py-2 text-left font-medium">负责人</th>
              <th className="px-3 py-2 text-left font-medium">创建时间</th>
              <th className="px-3 py-2 text-left font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginated.length === 0 && (
              <tr>
                <td colSpan={11} className="px-3 py-8 text-center text-gray-400">
                  暂无数据
                </td>
              </tr>
            )}
            {paginated.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-3 py-2">
                  <input
                    type="checkbox"
                    className="rounded"
                    checked={selectedIds.has(t.id)}
                    onChange={(e) => {
                      const next = new Set(selectedIds)
                      e.target.checked ? next.add(t.id) : next.delete(t.id)
                      setSelectedIds(next)
                    }}
                  />
                </td>
                <td className="px-3 py-2 font-mono text-xs">{t.ticketNo}</td>
                <td className="px-3 py-2">{t.caseOrderNo}</td>
                <td className="px-3 py-2">{t.riderName}</td>
                <td className="px-3 py-2">{t.riderCity}</td>
                <td className="px-3 py-2 max-w-xs truncate">{t.title}</td>
                <td className="px-3 py-2">
                  <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${PRIORITY_COLORS[t.priority]}`}>
                    {PRIORITY_LABELS[t.priority]}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[t.status]}`}>
                    {STATUS_LABELS[t.status]}
                  </span>
                </td>
                <td className="px-3 py-2">{t.responsiblePersonName}</td>
                <td className="px-3 py-2 text-gray-500 text-xs">{fmt(t.createdAt)}</td>
                <td className="px-3 py-2">
                  <div className="flex gap-1">
                    {showDeleted ? (
                      <button
                        onClick={() => restoreTicket(t.id)}
                        className="p-1 rounded text-green-600 hover:bg-green-50"
                        title="恢复"
                      >
                        <RotateCcw size={14} />
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => navigate(`/tickets/${t.id}`)}
                          className="p-1 rounded text-[#00A6FF] hover:bg-blue-50"
                          title="查看"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => { setEditing(t); setShowEdit(true) }}
                          className="p-1 rounded text-gray-500 hover:bg-gray-50"
                          title="编辑"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => { setTransferTarget(t); setShowTransfer(true) }}
                          className="p-1 rounded text-orange-500 hover:bg-orange-50"
                          title="转办"
                        >
                          <ArrowRightLeft size={14} />
                        </button>
                        {/* 确认转派按钮：仅对被转派人可见，当 transferStatus = pending */}
                        {t.transferStatus === 'pending' && currentUser && t.responsiblePersonId === currentUser.id && (
                          <button
                            onClick={() => setTransferConfirmTarget(t)}
                            className="p-1 rounded text-green-600 hover:bg-green-50"
                            title="确认转派"
                          >
                            <Check size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            const confirmed = window.confirm('确认删除该工单？')
                            if (confirmed) deleteTicket(t.id)
                          }}
                          className="p-1 rounded text-red-500 hover:bg-red-50"
                          title="删除"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 分页 */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <span>共 {filtered.length} 条</span>
          <select className="border rounded px-2 py-1" value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1) }}>
            {[50, 100, 200].map((s) => <option key={s} value={s}>每页{s}条</option>)}
          </select>
        </div>
        <div className="flex items-center gap-1">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-2 py-1 border rounded disabled:opacity-40"
          >
            <ChevronLeft size={14} />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-7 h-7 rounded text-xs ${p === page ? 'text-white font-medium' : 'border'}`}
              style={p === page ? { backgroundColor: '#00A6FF' } : {}}
            >
              {p}
            </button>
          ))}
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-2 py-1 border rounded disabled:opacity-40"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* 新建工单弹窗 */}
      {showCreate && (
        <TicketFormModal
          users={users}
          settings={settings}
          onClose={() => setShowCreate(false)}
          onSubmit={handleCreate}
          title="新建工单"
        />
      )}

      {/* 编辑工单弹窗 */}
      {showEdit && editing && (
        <TicketFormModal
          users={users}
          settings={settings}
          initial={editing}
          onClose={() => { setShowEdit(false); setEditing(null) }}
          onSubmit={handleEdit}
          title="编辑工单"
        />
      )}

      {/* 转办弹窗 */}
      {showTransfer && transferTarget && (
        <TransferModal
          users={users}
          currentId={transferTarget.responsiblePersonId}
          onClose={() => { setShowTransfer(false); setTransferTarget(null) }}
          onConfirm={handleTransfer}
        />
      )}

      {/* 批量改状态弹窗 */}
      {showBatchStatus && (
        <BatchStatusModal
          count={selectedIds.size}
          onClose={() => setShowBatchStatus(false)}
          onConfirm={handleBatchStatusChange}
        />
      )}

      {/* 批量转派弹窗 */}
      {showBatchAssign && (
        <BatchAssignModal
          users={users}
          count={selectedIds.size}
          onClose={() => setShowBatchAssign(false)}
          onConfirm={handleBatchAssign}
        />
      )}

      {/* 确认转派弹窗 */}
      {transferConfirmTarget && (
        <ConfirmTransferModal
          ticket={transferConfirmTarget}
          onClose={() => setTransferConfirmTarget(null)}
          onConfirm={() => handleConfirmTransfer(transferConfirmTarget)}
          onReject={() => {
            setTransferRejectTarget(transferConfirmTarget)
            setTransferConfirmTarget(null)
          }}
        />
      )}

      {/* 拒绝转派弹窗 */}
      {transferRejectTarget && (
        <RejectTransferModal
          ticket={transferRejectTarget}
          reason={rejectReason}
          onReasonChange={setRejectReason}
          onClose={() => { setTransferRejectTarget(null); setRejectReason('') }}
          onConfirm={() => handleRejectTransfer(transferRejectTarget, rejectReason)}
        />
      )}

      {/* Excel 导入弹窗 */}
      {showExcelImport && (
        <ExcelImport
          module="ticket"
          onClose={() => setShowExcelImport(false)}
          onImport={handleExcelImport}
        />
      )}
    </div>
  )
}

/* ==================== 工单表单弹窗 ==================== */
function TicketFormModal({ users, settings, initial, onClose, onSubmit, title }: {
  users: User[]
  settings: SystemSettings
  initial?: Ticket
  onClose: () => void
  onSubmit: (form: Record<string, string>) => void
  title: string
}) {
  const [form, setForm] = useState({
    caseOrderNo: initial?.caseOrderNo || '',
    riderId: initial?.riderId || '',
    riderName: initial?.riderName || '',
    riderCity: initial?.riderCity || '',
    title: initial?.title || '',
    priority: initial?.priority || 'medium',
    responsiblePersonId: initial?.responsiblePersonId || '',
    responsiblePersonName: initial?.responsiblePersonName || '',
    caseType: initial?.caseType?.join(',') || '意外',
    caseDesc: initial?.caseDesc || '',
    linkedIncidentId: initial?.linkedIncidentId || '',
  })

  const set = (k: string, v: string): void => setForm((f) => ({ ...f, [k]: v }))

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-bold">{title}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100"><X size={18} /></button>
        </div>
        <div className="p-4 space-y-3">
          <Field label="案件/订单号" required>
            <input className="input-std" value={form.caseOrderNo} onChange={(e) => set('caseOrderNo', e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="骑手ID" required>
              <input className="input-std" value={form.riderId} onChange={(e) => set('riderId', e.target.value)} />
            </Field>
            <Field label="骑手姓名" required>
              <input className="input-std" value={form.riderName} onChange={(e) => set('riderName', e.target.value)} />
            </Field>
          </div>
          <Field label="城市" required>
            <input className="input-std" value={form.riderCity} onChange={(e) => set('riderCity', e.target.value)} />
          </Field>
          <Field label="标题" required>
            <input className="input-std" value={form.title} onChange={(e) => set('title', e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="优先级">
              <select className="input-std" value={form.priority} onChange={(e) => set('priority', e.target.value)}>
                <option value="low">低</option>
                <option value="medium">中</option>
                <option value="high">高</option>
                <option value="urgent">紧急</option>
              </select>
            </Field>
            <Field label="负责人">
              <select className="input-std" value={form.responsiblePersonId} onChange={(e) => {
                set('responsiblePersonId', e.target.value)
                const u = users.find((u) => u.id === e.target.value)
                if (u) set('responsiblePersonName', u.name)
              }}>
                <option value="">请选择</option>
                {users.filter((u) => !u.isDeleted && !u.isLocked).map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="案件类型（多选，逗号分隔）">
            <select
              className="input-std"
              multiple
              value={form.caseType ? form.caseType.split(',').filter(Boolean) : []}
              onChange={(e) => {
                const vals = Array.from(e.target.selectedOptions).map((o) => o.value)
                set('caseType', vals.join(','))
              }}
            >
              {(settings.caseTypes?.length ? settings.caseTypes : ['意外', '三者']).map((c: string) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">按住 Ctrl 多选，或逗号分隔输入</p>
          </Field>
          <Field label="案件描述">
            <textarea
              className="input-std min-h-16 resize-y"
              value={form.caseDesc}
              onChange={(e) => set('caseDesc', e.target.value)}
            />
          </Field>
        </div>
        <div className="p-4 border-t flex justify-end gap-2">
          <button className="px-4 py-1.5 rounded border text-sm hover:bg-gray-50" onClick={onClose}>取消</button>
          <button
            className="px-4 py-1.5 rounded text-sm text-white"
            style={{ backgroundColor: '#00A6FF' }}
            onClick={() => onSubmit(form)}
          >
            确定
          </button>
        </div>
      </div>
    </div>
  )
}

/* ==================== 转办弹窗 ==================== */
function TransferModal({ users, currentId, onClose, onConfirm }: {
  users: User[]
  currentId: string
  onClose: () => void
  onConfirm: (reason: string, targetUserId: string) => void
}) {
  const [targetId, setTargetId] = useState('')
  const [reason, setReason] = useState('')

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-bold">转办工单</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100"><X size={18} /></button>
        </div>
        <div className="p-4 space-y-3">
          <Field label="转办给">
            <select className="input-std" value={targetId} onChange={(e) => setTargetId(e.target.value)}>
              <option value="">请选择</option>
              {users.filter((u) => !u.isDeleted && !u.isLocked && u.id !== currentId).map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </Field>
          <Field label="转办原因">
            <textarea className="input-std min-h-16 resize-y" value={reason} onChange={(e) => setReason(e.target.value)} />
          </Field>
        </div>
        <div className="p-4 border-t flex justify-end gap-2">
          <button className="px-4 py-1.5 rounded border text-sm hover:bg-gray-50" onClick={onClose}>取消</button>
          <button
            disabled={!targetId || !reason.trim()}
            className="px-4 py-1.5 rounded text-sm text-white disabled:opacity-40"
            style={{ backgroundColor: '#00A6FF' }}
            onClick={() => onConfirm(reason, targetId)}
          >
            确认转办
          </button>
        </div>
      </div>
    </div>
  )
}

/* ==================== 批量改状态弹窗 ==================== */
function BatchStatusModal({ count, onClose, onConfirm }: {
  count: number
  onClose: () => void
  onConfirm: (newStatus: TicketStatus) => void
}) {
  const [newStatus, setNewStatus] = useState<TicketStatus>('pending')
  const [showConfirm, setShowConfirm] = useState(false)

  const handleConfirm = (): void => {
    onConfirm(newStatus)
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-bold">批量改状态</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100"><X size={18} /></button>
        </div>
        <div className="p-4 space-y-3">
          <p className="text-sm text-gray-600">
            将 <span className="font-bold text-[#00A6FF]">{count}</span> 条工单的状态修改为：
          </p>
          <div className="space-y-2">
            {(['pending', 'overdue', 'completed'] as TicketStatus[]).map((s) => (
              <label key={s} className={`flex items-center gap-2 p-2 rounded-md cursor-pointer border transition-colors ${newStatus === s ? 'border-[#00A6FF] bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                <input
                  type="radio"
                  name="batchStatus"
                  value={s}
                  checked={newStatus === s}
                  onChange={() => setNewStatus(s)}
                  className="accent-[#00A6FF]"
                />
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[s]}`}>
                  {STATUS_LABELS[s]}
                </span>
              </label>
            ))}
          </div>
        </div>
        {showConfirm ? (
          <div className="p-4 border-t space-y-3">
            <p className="text-sm text-gray-700">
              确认将 <span className="font-bold">{count}</span> 条工单改为 <span className="font-bold">{STATUS_LABELS[newStatus]}</span>？
            </p>
            <div className="flex justify-end gap-2">
              <button className="px-4 py-1.5 rounded border text-sm hover:bg-gray-50" onClick={() => setShowConfirm(false)}>返回</button>
              <button
                className="px-4 py-1.5 rounded text-sm text-white"
                style={{ backgroundColor: '#00A6FF' }}
                onClick={handleConfirm}
              >
                确认修改
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 border-t flex justify-end gap-2">
            <button className="px-4 py-1.5 rounded border text-sm hover:bg-gray-50" onClick={onClose}>取消</button>
            <button
              className="px-4 py-1.5 rounded text-sm text-white"
              style={{ backgroundColor: '#00A6FF' }}
              onClick={() => setShowConfirm(true)}
            >
              下一步
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ==================== 批量指派/转派弹窗 ==================== */
function BatchAssignModal({ users, count, onClose, onConfirm }: {
  users: User[]
  count: number
  onClose: () => void
  onConfirm: (targetUserId: string, reason: string) => void
}) {
  const [targetId, setTargetId] = useState('')
  const [reason, setReason] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)

  const handleConfirm = (): void => {
    if (targetId && reason.trim()) {
      onConfirm(targetId, reason)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-bold">批量转派</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100"><X size={18} /></button>
        </div>
        <div className="p-4 space-y-3">
          <p className="text-sm text-gray-600">
            将 <span className="font-bold text-[#00A6FF]">{count}</span> 条工单转派给：
          </p>
          <Field label="转派给">
            <select className="input-std" value={targetId} onChange={(e) => setTargetId(e.target.value)}>
              <option value="">请选择</option>
              {users.filter((u) => !u.isDeleted && !u.isLocked).map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </Field>
          <Field label="转派原因" required>
            <textarea
              className="input-std min-h-16 resize-y"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="请输入转派原因"
            />
          </Field>
        </div>
        {showConfirm ? (
          <div className="p-4 border-t space-y-3">
            <p className="text-sm text-gray-700">
              确认将 <span className="font-bold">{count}</span> 条工单转派给{' '}
              <span className="font-bold">{users.find((u) => u.id === targetId)?.name}</span>？
            </p>
            <div className="flex justify-end gap-2">
              <button className="px-4 py-1.5 rounded border text-sm hover:bg-gray-50" onClick={() => setShowConfirm(false)}>返回</button>
              <button
                className="px-4 py-1.5 rounded text-sm text-white"
                style={{ backgroundColor: '#00A6FF' }}
                onClick={handleConfirm}
              >
                确认转派
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 border-t flex justify-end gap-2">
            <button className="px-4 py-1.5 rounded border text-sm hover:bg-gray-50" onClick={onClose}>取消</button>
            <button
              disabled={!targetId || !reason.trim()}
              className="px-4 py-1.5 rounded text-sm text-white disabled:opacity-40"
              style={{ backgroundColor: '#00A6FF' }}
              onClick={() => setShowConfirm(true)}
            >
              下一步
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ==================== 确认转派弹窗 ==================== */
function ConfirmTransferModal({ ticket, onClose, onConfirm, onReject }: {
  ticket: Ticket
  onClose: () => void
  onConfirm: () => void
  onReject: () => void
}) {
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-bold">转派确认</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100"><X size={18} /></button>
        </div>
        <div className="p-4 space-y-3">
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
            <p className="text-sm font-medium text-gray-800">工单：{ticket.ticketNo}</p>
            <p className="text-sm text-gray-600">标题：{ticket.title}</p>
            <p className="text-sm text-gray-600">转派原因：{ticket.transferReason || '无'}</p>
          </div>
          <p className="text-sm text-gray-700">确认接手该工单？</p>
        </div>
        <div className="p-4 border-t flex justify-between gap-2">
          <button
            className="px-4 py-1.5 rounded text-sm text-white"
            style={{ backgroundColor: '#ff4d4f' }}
            onClick={onReject}
          >
            拒绝转派
          </button>
          <div className="flex gap-2">
            <button className="px-4 py-1.5 rounded border text-sm hover:bg-gray-50" onClick={onClose}>取消</button>
            <button
              className="px-4 py-1.5 rounded text-sm text-white"
              style={{ backgroundColor: '#00A6FF' }}
              onClick={onConfirm}
            >
              确认接手
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ==================== 拒绝转派弹窗 ==================== */
function RejectTransferModal({ ticket, reason, onReasonChange, onClose, onConfirm }: {
  ticket: Ticket
  reason: string
  onReasonChange: (reason: string) => void
  onClose: () => void
  onConfirm: () => void
}) {
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-bold">拒绝转派</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100"><X size={18} /></button>
        </div>
        <div className="p-4 space-y-3">
          <div className="bg-red-50 border border-red-100 rounded-lg p-3">
            <p className="text-sm font-medium text-gray-800">工单：{ticket.ticketNo}</p>
            <p className="text-sm text-gray-600">标题：{ticket.title}</p>
          </div>
          <Field label="拒绝原因" required>
            <textarea
              className="input-std min-h-20 resize-y"
              value={reason}
              onChange={(e) => onReasonChange(e.target.value)}
              placeholder="请填写拒绝原因"
            />
          </Field>
        </div>
        <div className="p-4 border-t flex justify-end gap-2">
          <button className="px-4 py-1.5 rounded border text-sm hover:bg-gray-50" onClick={onClose}>取消</button>
          <button
            disabled={!reason.trim()}
            className="px-4 py-1.5 rounded text-sm text-white disabled:opacity-40"
            style={{ backgroundColor: '#ff4d4f' }}
            onClick={onConfirm}
          >
            确认拒绝
          </button>
        </div>
      </div>
    </div>
  )
}

/* ==================== 公共小组件 ==================== */
function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-gray-700">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  )
}
