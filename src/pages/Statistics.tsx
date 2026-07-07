import React, { useMemo } from 'react'
import { useStore } from '../store/useStore'
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { FileText, Clock, AlertTriangle, CheckCircle, ShieldAlert, FileWarning, AlertCircle, TrendingUp, Download } from 'lucide-react'

const BRAND = '#00A6FF'

const COLORS = ['#00A6FF', '#FF6B6B', '#FFB74D', '#81C784', '#BA68C8', '#4DD0E1', '#FF8A65', '#AED581']

function fmtDate(iso?: string): string {
  if (!iso) return '-'
  return new Date(iso).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

export default function Statistics() {
  const { tickets, interceptions, incidents, majorCases } = useStore()

  const activeTickets = tickets.filter((t) => !t.isDeleted)
  const activeInterceptions = interceptions.filter((i) => !i.isDeleted)
  const activeIncidents = incidents.filter((i) => !i.isDeleted)
  const activeMajorCases = majorCases.filter((m) => !m.isDeleted)

  /* ── stat cards ────────────────────────────────────── */
  const stats = [
    { label: '总工单数', value: activeTickets.length, icon: FileText, color: BRAND },
    { label: '待处理工单', value: activeTickets.filter((t) => t.status === 'pending').length, icon: Clock, color: '#FFB74D' },
    { label: '超时工单', value: activeTickets.filter((t) => t.status === 'overdue').length, icon: AlertTriangle, color: '#FF6B6B' },
    { label: '已完成工单', value: activeTickets.filter((t) => t.status === 'completed').length, icon: CheckCircle, color: '#81C784' },
    { label: '拦截记录数', value: activeInterceptions.length, icon: ShieldAlert, color: '#BA68C8' },
    { label: '出险记录数', value: activeIncidents.length, icon: FileWarning, color: '#4DD0E1' },
    { label: '重大案件（进行中）', value: activeMajorCases.filter((m) => m.stage !== '结案').length, icon: AlertCircle, color: '#FF8A65' },
    { label: '成功拦截数', value: activeInterceptions.filter((i) => i.interceptSuccess).length, icon: TrendingUp, color: '#AED581' },
  ]

  /* ── 7-day trend ──────────────────────────────────── */
  const trendData = useMemo(() => {
    const days: { date: string; count: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
      const count = activeTickets.filter((t) => fmtDate(t.createdAt) === dateStr).length
      days.push({ date: dateStr.slice(5), count })
    }
    return days
  }, [activeTickets])

  /* ── priority distribution ─────────────────────────── */
  const priorityData = useMemo(() => {
    const labels: Record<string, string> = { low: '低', medium: '中', high: '高', urgent: '紧急' }
    return (['low', 'medium', 'high', 'urgent'] as const).map((p) => ({
      name: labels[p],
      value: activeTickets.filter((t) => t.priority === p).length,
    }))
  }, [activeTickets])

  /* ── status distribution ───────────────────────────── */
  const statusData = useMemo(() => {
    const labels: Record<string, string> = { pending: '待处理', overdue: '已超时', completed: '已完成' }
    return (['pending', 'overdue', 'completed'] as const).map((s) => ({
      name: labels[s],
      value: activeTickets.filter((t) => t.status === s).length,
    }))
  }, [activeTickets])

  /* ── interceptions by month ────────────────────────── */
  const interceptionByMonth = useMemo(() => {
    const monthMap: Record<string, number> = {}
    activeInterceptions.forEach((i) => {
      const key = `${i.reportYear}-${String(i.reportMonth).padStart(2, '0')}`
      monthMap[key] = (monthMap[key] || 0) + 1
    })
    return Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, count]) => ({ month, count }))
  }, [activeInterceptions])

  /* ── incidents by cause ────────────────────────────── */
  const incidentsByCause = useMemo(() => {
    const causeMap: Record<string, number> = {}
    activeIncidents.forEach((i) => {
      causeMap[i.cause] = (causeMap[i.cause] || 0) + 1
    })
    return Object.entries(causeMap).map(([name, value]) => ({ name, value }))
  }, [activeIncidents])

  /* ── export CSV ────────────────────────────────────── */
  function exportCSV() {
    const rows: string[] = ['指标,数值']
    stats.forEach((s) => rows.push(`${s.label},${s.value}`))
    const blob = new Blob(['\uFEFF' + rows.join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `统计报表_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">数据统计</h1>
        <button onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium shadow"
          style={{ background: BRAND }}>
          <Download size={16} /> 导出报表
        </button>
      </div>

      {/* stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <div key={s.label} className="bg-white rounded-xl p-4 shadow flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: s.color + '20' }}>
                <Icon size={20} style={{ color: s.color }} />
              </div>
              <div>
                <div className="text-xs text-gray-500">{s.label}</div>
                <div className="text-xl font-bold">{s.value}</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* charts row 1: trend + priority */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* 7-day trend */}
        <div className="bg-white rounded-xl p-5 shadow">
          <h3 className="text-base font-bold mb-4">近7天工单趋势</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={BRAND} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={BRAND} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip />
              <Area type="monotone" dataKey="count" name="新增工单" stroke={BRAND} fill="url(#trendGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* priority distribution */}
        <div className="bg-white rounded-xl p-5 shadow">
          <h3 className="text-base font-bold mb-4">工单按优先级分布</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={priorityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" name="工单数" radius={[4, 4, 0, 0]}>
                {priorityData.map((_entry, idx) => (
                  <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* charts row 2: status + interceptions + incidents */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* status distribution */}
        <div className="bg-white rounded-xl p-5 shadow">
          <h3 className="text-base font-bold mb-4">工单按状态分布</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={statusData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={(entry: { name?: string; value?: number }) => `${entry.name ?? ''}: ${entry.value ?? 0}`}
              >
                {statusData.map((_entry, idx) => (
                  <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* interceptions by month */}
        <div className="bg-white rounded-xl p-5 shadow">
          <h3 className="text-base font-bold mb-4">拦截记录（近6月）</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={interceptionByMonth.length > 0 ? interceptionByMonth : [{ month: '暂无数据', count: 0 }]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" name="拦截数" fill={BRAND} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* incidents by cause */}
        <div className="bg-white rounded-xl p-5 shadow">
          <h3 className="text-base font-bold mb-4">出险记录按事故原因</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={incidentsByCause.length > 0 ? incidentsByCause : [{ name: '暂无数据', value: 0 }]}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={(entry: { name?: string; value?: number }) => `${entry.name ?? ''}: ${entry.value ?? 0}`}
              >
                {incidentsByCause.map((_entry, idx) => (
                  <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
