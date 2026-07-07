import React, { useState, useMemo } from 'react'
import { useStore } from '../store/useStore'
import type { Ticket, Interception, IncidentRecord, MajorCase } from '../types'
import { Download, FileSpreadsheet, FileText, Search, Calendar, X, Eye } from 'lucide-react'

const BRAND = '#00A6FF'

type ModuleType = 'tickets' | 'interceptions' | 'incidents' | 'majorCases'

interface ExportLogEntry {
  id: string
  module: string
  moduleLabel: string
  filters: string
  rowCount: number
  exportedAt: string
}

function fmtDate(iso?: string): string {
  if (!iso) return '-'
  return new Date(iso).toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

function fmtShort(iso?: string): string {
  if (!iso) return '-'
  return new Date(iso).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

const MODULE_LABELS: Record<ModuleType, string> = {
  tickets: '工单',
  interceptions: '拦截记录',
  incidents: '出险记录',
  majorCases: '重大案件',
}

export default function LedgerExport() {
  const { tickets, interceptions, incidents, majorCases } = useStore()

  const [module, setModule] = useState<ModuleType>('tickets')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [exportLog, setExportLog] = useState<ExportLogEntry[]>([])

  /* ── filtered data ────────────────────────────────── */
  const filteredData = useMemo(() => {
    let rows: (Ticket | Interception | IncidentRecord | MajorCase)[] = []

    switch (module) {
      case 'tickets': {
        let list = tickets.filter((t) => !t.isDeleted) as (Ticket | Interception | IncidentRecord | MajorCase)[]
        if (statusFilter) list = list.filter((t) => (t as Ticket).status === statusFilter)
        if (dateFrom) list = list.filter((t) => (t as Ticket).createdAt >= dateFrom)
        if (dateTo) list = list.filter((t) => (t as Ticket).createdAt <= new Date(new Date(dateTo).getTime() + 86400000).toISOString())
        if (search) {
          const q = search.toLowerCase()
          list = list.filter((t) =>
            (t as Ticket).ticketNo.toLowerCase().includes(q) ||
            (t as Ticket).riderName.toLowerCase().includes(q) ||
            (t as Ticket).title.toLowerCase().includes(q),
          )
        }
        rows = list
        break
      }
      case 'interceptions': {
        let list = interceptions.filter((i) => !i.isDeleted) as (Ticket | Interception | IncidentRecord | MajorCase)[]
        if (dateFrom) list = list.filter((i) => (i as Interception).createdAt >= dateFrom)
        if (dateTo) list = list.filter((i) => (i as Interception).createdAt <= new Date(new Date(dateTo).getTime() + 86400000).toISOString())
        if (search) {
          const q = search.toLowerCase()
          list = list.filter((i) =>
            (i as Interception).riderName.toLowerCase().includes(q) ||
            (i as Interception).reportOrderNo.toLowerCase().includes(q),
          )
        }
        rows = list
        break
      }
      case 'incidents': {
        let list = incidents.filter((i) => !i.isDeleted) as (Ticket | Interception | IncidentRecord | MajorCase)[]
        if (dateFrom) list = list.filter((i) => (i as IncidentRecord).createdAt >= dateFrom)
        if (dateTo) list = list.filter((i) => (i as IncidentRecord).createdAt <= new Date(new Date(dateTo).getTime() + 86400000).toISOString())
        if (search) {
          const q = search.toLowerCase()
          list = list.filter((i) =>
            (i as IncidentRecord).riderName.toLowerCase().includes(q) ||
            (i as IncidentRecord).orderNo.toLowerCase().includes(q),
          )
        }
        rows = list
        break
      }
      case 'majorCases': {
        let list = majorCases.filter((m) => !m.isDeleted) as (Ticket | Interception | IncidentRecord | MajorCase)[]
        if (statusFilter) list = list.filter((m) => (m as MajorCase).stage === statusFilter)
        if (dateFrom) list = list.filter((m) => (m as MajorCase).createdAt >= dateFrom)
        if (dateTo) list = list.filter((m) => (m as MajorCase).createdAt <= new Date(new Date(dateTo).getTime() + 86400000).toISOString())
        if (search) {
          const q = search.toLowerCase()
          list = list.filter((m) =>
            (m as MajorCase).caseNo.toLowerCase().includes(q) ||
            (m as MajorCase).riderName.toLowerCase().includes(q),
          )
        }
        rows = list
        break
      }
    }

    return rows
  }, [module, dateFrom, dateTo, statusFilter, search, tickets, interceptions, incidents, majorCases])

  const previewRows = filteredData.slice(0, 10)

  /* ── CSV export ────────────────────────────────────── */
  function exportCSV() {
    if (filteredData.length === 0) return
    const headers = getHeaders(module)
    const rows = filteredData.map((item) => getRowValues(module, item))
    const csvLines = [headers, ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))]
    const csv = '\uFEFF' + csvLines.join('\n')
    downloadFile(csv, `导出_${MODULE_LABELS[module]}_${nowStr()}.csv`, 'text/csv;charset=utf-8')
    logExport(filteredData.length)
  }

  /* ── XLSX export ───────────────────────────────────── */
  async function exportXLSX() {
    if (filteredData.length === 0) return
    try {
      const XLSX = await import('xlsx')
      const headers = getHeaders(module)
      const data = [headers, ...filteredData.map((item) => getRowValues(module, item))]
      const ws = XLSX.utils.aoa_to_sheet(data)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, MODULE_LABELS[module])
      XLSX.writeFile(wb, `导出_${MODULE_LABELS[module]}_${nowStr()}.xlsx`)
      logExport(filteredData.length)
    } catch (err) {
      console.error('XLSX export failed:', err)
    }
  }

  function nowStr(): string {
    return new Date().toISOString().slice(0, 10)
  }

  function downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  function logExport(rowCount: number) {
    const entry: ExportLogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      module: module,
      moduleLabel: MODULE_LABELS[module],
      filters: buildFilterDesc(),
      rowCount,
      exportedAt: new Date().toLocaleString('zh-CN'),
    }
    setExportLog((prev) => [entry, ...prev])
  }

  function buildFilterDesc(): string {
    const parts: string[] = []
    if (dateFrom) parts.push(`自 ${fmtShort(dateFrom)}`)
    if (dateTo) parts.push(`至 ${fmtShort(dateTo)}`)
    if (statusFilter) parts.push(`状态=${statusFilter}`)
    if (search) parts.push(`搜索=${search}`)
    return parts.length > 0 ? parts.join(', ') : '无筛选'
  }

  /* ── header / row helpers ──────────────────────────── */
  function getHeaders(mod: ModuleType): string[] {
    switch (mod) {
      case 'tickets': return ['工单号', '骑手姓名', '城市', '标题', '优先级', '状态', '负责人', '创建时间', '完成时间']
      case 'interceptions': return ['上报年月', '处理时间', '骑手', '性别', '城市', '上报单号', '出险时间', '险种', '事故方', '拦截类型', '拦截结果', '创建时间']
      case 'incidents': return ['单号', '骑手', '性别', '城市', '出险时间', '地点', '险种', '责任', '事故原因', '事故类型', '是否死亡', '创建时间']
      case 'majorCases': return ['案件编号', '骑手姓名', '城市', '案件类型', '阶段', '负责人', '创建时间', '结案日期', '赔付金额']
    }
  }

  function getRowValues(mod: ModuleType, item: Ticket | Interception | IncidentRecord | MajorCase): string[] {
    switch (mod) {
      case 'tickets': {
        const t = item as Ticket
        return [t.ticketNo, t.riderName, t.riderCity, t.title, t.priority, t.status, t.responsiblePersonName, fmtDate(t.createdAt), t.completedAt ? fmtDate(t.completedAt) : '-']
      }
      case 'interceptions': {
        const i = item as Interception
        return [`${i.reportYear}-${String(i.reportMonth).padStart(2, '0')}`, fmtDate(i.handleTime), i.riderName, i.gender, i.city, i.reportOrderNo, fmtDate(i.accidentTime), i.insuranceType, i.accidentParty, i.interceptType, i.interceptSuccess ? '成功' : '失败', fmtDate(i.createdAt)]
      }
      case 'incidents': {
        const i = item as IncidentRecord
        return [i.orderNo, i.riderName, i.gender, i.city, fmtDate(i.accidentDate), i.location, i.insuranceType, i.liability, i.cause, i.accidentType, i.isDeath ? '是' : '否', fmtDate(i.createdAt)]
      }
      case 'majorCases': {
        const m = item as MajorCase
        return [m.caseNo, m.riderName, m.city, m.caseType, m.stage, m.responsibleName, fmtDate(m.createdAt), m.completeDate ? fmtShort(m.completeDate) : '-', m.paymentAmount ? String(m.paymentAmount) : '-']
      }
    }
  }

  /* ── render ───────────────────────────────────────── */
  const statusOptions = getStatusOptions(module)

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <h1 className="text-2xl font-bold mb-6">台账导出</h1>

      {/* filter panel */}
      <div className="bg-white rounded-xl shadow p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* module select */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">导出模块</label>
            <select value={module} onChange={(e) => { setModule(e.target.value as ModuleType); setStatusFilter('') }}
              className="border rounded-lg px-3 py-2 text-sm bg-white">
              <option value="tickets">工单</option>
              <option value="interceptions">拦截记录</option>
              <option value="incidents">出险记录</option>
              <option value="majorCases">重大案件</option>
            </select>
          </div>

          {/* date range */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
              <Calendar size={14} /> 开始日期
            </label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
              <Calendar size={14} /> 结束日期
            </label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm" />
          </div>

          {/* status filter */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">状态筛选</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm bg-white">
              <option value="">全部</option>
              {statusOptions.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>

          {/* search */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
              <Search size={14} /> 搜索
            </label>
            <div className="relative">
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="关键词..."
                className="w-full border rounded-lg px-3 py-2 text-sm pr-8" />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* result count */}
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-gray-500">匹配 <span className="font-medium text-gray-800">{filteredData.length}</span> 条记录（预览前10条）</span>
          <div className="flex gap-2">
            <button onClick={exportCSV}
              disabled={filteredData.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium shadow disabled:opacity-40"
              style={{ background: BRAND }}>
              <FileText size={16} /> 导出 CSV
            </button>
            <button onClick={exportXLSX}
              disabled={filteredData.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium shadow disabled:opacity-40"
              style={{ background: BRAND }}>
              <FileSpreadsheet size={16} /> 导出 XLSX
            </button>
          </div>
        </div>
      </div>

      {/* preview table */}
      <div className="bg-white rounded-xl shadow overflow-hidden mb-6">
        <div className="px-5 py-3 border-b bg-gray-50 flex items-center gap-2">
          <Eye size={16} className="text-gray-500" />
          <span className="text-sm font-semibold text-gray-700">导出预览</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                {getHeaders(module).map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-semibold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {previewRows.length === 0 && (
                <tr><td colSpan={getHeaders(module).length} className="text-center py-12 text-gray-400">暂无匹配数据</td></tr>
              )}
              {previewRows.map((item, idx) => (
                <tr key={idx} className="border-t hover:bg-gray-50/50">
                  {getRowValues(module, item).map((v, vi) => (
                    <td key={vi} className="px-4 py-2.5 whitespace-nowrap text-gray-700">{v}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredData.length > 10 && (
          <div className="px-5 py-2 text-xs text-gray-400 border-t">仅显示前 10 条，共 {filteredData.length} 条</div>
        )}
      </div>

      {/* export log */}
      {exportLog.length > 0 && (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="px-5 py-3 border-b bg-gray-50">
            <span className="text-sm font-semibold text-gray-700">导出操作日志</span>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                {['导出时间', '模块', '筛选条件', '导出条数'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {exportLog.map((log) => (
                <tr key={log.id} className="border-t">
                  <td className="px-4 py-2.5 whitespace-nowrap text-gray-700">{log.exportedAt}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap text-gray-700">{log.moduleLabel}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap text-gray-500">{log.filters}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap text-gray-700 font-medium">{log.rowCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function getStatusOptions(mod: ModuleType): { value: string; label: string }[] {
  switch (mod) {
    case 'tickets':
      return [
        { value: 'pending', label: '待处理' },
        { value: 'overdue', label: '已超时' },
        { value: 'completed', label: '已完成' },
      ]
    case 'interceptions':
      return [
        { value: 'none', label: '无' },
        { value: 'pending', label: '待审核' },
        { value: 'approved', label: '已通过' },
        { value: 'rejected', label: '已驳回' },
      ]
    case 'incidents':
      return [
        { value: 'none', label: '无' },
        { value: 'pending', label: '待审核' },
        { value: 'approved', label: '已通过' },
        { value: 'rejected', label: '已驳回' },
      ]
    case 'majorCases':
      return [
        { value: '发现', label: '发现' },
        { value: '上报', label: '上报' },
        { value: '处置中', label: '处置中' },
        { value: '结案', label: '结案' },
      ]
  }
}
