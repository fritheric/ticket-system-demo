import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import {
  PlusCircle,
  ShieldCheck,
  AlertCircle,
  Clock,
  FileText,
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  TrendingUp,
  Zap,
} from 'lucide-react'

const BRAND_BLUE = '#00A6FF'

function Dashboard() {
  const navigate = useNavigate()
  const currentUser = useStore((s) => s.currentUser)
  const tickets = useStore((s) => s.tickets)
  const interceptions = useStore((s) => s.interceptions)
  const incidents = useStore((s) => s.incidents)
  const majorCases = useStore((s) => s.majorCases)
  const auditLogs = useStore((s) => s.auditLogs)

  if (!currentUser) return null

  const today = new Date().toISOString().slice(0, 10)

  const todayTickets = tickets.filter((t) => !t.isDeleted && t.createdAt.startsWith(today))
  const pendingTickets = tickets.filter((t) => !t.isDeleted && t.status === 'pending')
  const overdueTickets = tickets.filter((t) => !t.isDeleted && t.status === 'overdue')

  const thisMonth = new Date().toISOString().slice(0, 7)
  const monthSuccessIntercepts = interceptions.filter(
    (i) => !i.isDeleted && i.createdAt.startsWith(thisMonth) && i.interceptSuccess,
  )
  const totalIntercepts = interceptions.filter((i) => !i.isDeleted)
  const totalIncidents = incidents.filter((i) => !i.isDeleted)
  const activeMajorCases = majorCases.filter((m) => !m.isDeleted && m.stage !== '结案')
  const pendingReviews = interceptions.filter((i) => !i.isDeleted)

  const recentLogs = [...auditLogs]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 10)

  const quickActions = [
    {
      label: '新建工单',
      icon: <PlusCircle size={18} />,
      onClick: () => navigate('/tickets'),
    },
    {
      label: '新建拦截记录',
      icon: <ShieldCheck size={18} />,
      onClick: () => navigate('/interceptions'),
    },
    {
      label: '查看待审核拦截',
      icon: <AlertCircle size={18} />,
      onClick: () => navigate('/interceptions?review=pending'),
    },
  ]

  const topCards = [
    {
      label: '今日新增',
      value: todayTickets.length,
      icon: <FileText size={20} />,
      color: 'text-[#00A6FF]',
      bgIcon: 'bg-[#00A6FF]/10',
      badge: todayTickets.length > 0 ? '今日' : null,
    },
    {
      label: '待处理',
      value: pendingTickets.length,
      icon: <Clock size={20} />,
      color: 'text-amber-600',
      bgIcon: 'bg-amber-50',
      badge: pendingTickets.length > 5 ? '较多' : null,
    },
    {
      label: '已超时',
      value: overdueTickets.length,
      icon: <AlertTriangle size={20} />,
      color: 'text-red-600',
      bgIcon: 'bg-red-50',
      badge: overdueTickets.length > 0 ? '紧急' : null,
    },
    {
      label: '本月拦截成功',
      value: monthSuccessIntercepts.length,
      icon: <CheckCircle size={20} />,
      color: 'text-emerald-600',
      bgIcon: 'bg-emerald-50',
      badge: null,
    },
  ]

  const secondCards = [
    { label: '拦截记录总数', value: totalIntercepts.length, icon: <ShieldCheck size={16} /> },
    { label: '出险记录总数', value: totalIncidents.length, icon: <Zap size={16} /> },
    { label: '进行中重大案件', value: activeMajorCases.length, icon: <AlertTriangle size={16} /> },
  ]

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">仪表盘</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            欢迎回来，{currentUser.name}
            <span className="mx-1 text-gray-300">·</span>
            <span className="text-gray-400">{today}</span>
          </p>
        </div>
        <button
          onClick={() => navigate('/tickets')}
          className="flex items-center gap-2 px-4 py-2 bg-[#00A6FF] text-white rounded-lg text-sm font-medium hover:bg-[#0095e6] active:scale-[0.98] transition-all shadow-sm"
        >
          <PlusCircle size={16} />
          新建工单
        </button>
      </div>

      {/* 顶部统计卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {topCards.map((card) => (
          <div
            key={card.label}
            className="stat-card bg-white border border-gray-100 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{card.label}</p>
                <p className="text-3xl font-semibold mt-1 data-num">{card.value}</p>
              </div>
              <div className={`p-2.5 rounded-lg ${card.bgIcon} ${card.color}`}>
                {card.icon}
              </div>
            </div>
            {card.badge && (
              <div className="mt-3">
                <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                  card.badge === '紧急' ? 'bg-red-50 text-red-600' :
                  card.badge === '较多' ? 'bg-amber-50 text-amber-600' :
                  'bg-[#00A6FF]/10 text-[#00A6FF]'
                }`}>
                  <TrendingUp size={12} />
                  {card.badge}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 第二行统计 — 浅色卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {secondCards.map((card) => (
          <div
            key={card.label}
            className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow"
          >
            <span className="text-gray-400">{card.icon}</span>
            <div>
              <p className="text-xs text-gray-500">{card.label}</p>
              <p className="text-xl font-semibold data-num">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 快捷操作 */}
      <div>
        <h2 className="text-sm font-semibold text-gray-600 mb-3">快捷操作</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={action.onClick}
              className="flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 hover:border-[#00A6FF]/40 hover:bg-[#00A6FF]/5 transition-all text-left group active:scale-[0.98]"
            >
              <span className="text-gray-400 group-hover:text-[#00A6FF] transition-colors">
                {action.icon}
              </span>
              <span className="text-sm font-medium text-gray-700 group-hover:text-[#00A6FF] transition-colors flex-1">
                {action.label}
              </span>
              <ArrowRight
                size={14}
                className="text-gray-300 group-hover:text-[#00A6FF] transition-all group-hover:translate-x-0.5"
              />
            </button>
          ))}
        </div>
      </div>

      {/* 近期动态 + 待办 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 近期动态 */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold">近期动态</h2>
            <span className="text-xs text-gray-400">{recentLogs.length} 条</span>
          </div>
          <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
            {recentLogs.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <p className="text-sm text-gray-400">暂无操作记录</p>
              </div>
            ) : (
              recentLogs.map((log) => {
                const time = new Date(log.createdAt)
                const hhmm = `${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}`
                return (
                  <div key={log.id} className="px-5 py-2.5 flex items-center gap-3 hover:bg-gray-50/50 transition-colors">
                    <span className="mono-label text-gray-400 w-12 flex-shrink-0">{hhmm}</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 flex-shrink-0">
                      {log.userName}
                    </span>
                    <span className="text-sm text-gray-700 truncate">{log.action}</span>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* 待办事项 */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold">待办事项</h2>
            {(pendingReviews.length + overdueTickets.length) > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-xs font-medium">
                {pendingReviews.length + overdueTickets.length}
              </span>
            )}
          </div>
          <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
            {pendingReviews.length > 0 && (
              <div>
                <div className="px-5 py-2 bg-amber-50/60 text-amber-700 text-xs font-medium">
                  待审核拦截（{pendingReviews.length}）
                </div>
                {pendingReviews.map((item) => (
                  <div
                    key={item.id}
                    className="px-5 py-2.5 flex items-center gap-3 cursor-pointer hover:bg-gray-50/50 transition-colors"
                    onClick={() => navigate('/interceptions?review=pending')}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700 flex-1 truncate">
                      {item.riderName} — {item.interceptType}
                    </span>
                    <span className="text-xs text-gray-400 mono-label">{item.createdAt.slice(5, 10)}</span>
                  </div>
                ))}
              </div>
            )}

            {overdueTickets.length > 0 && (
              <div>
                <div className="px-5 py-2 bg-red-50/60 text-red-700 text-xs font-medium">
                  超时工单（{overdueTickets.length}）
                </div>
                {overdueTickets.slice(0, 5).map((t) => (
                  <div
                    key={t.id}
                    className="px-5 py-2.5 flex items-center gap-3 cursor-pointer hover:bg-gray-50/50 transition-colors"
                    onClick={() => navigate(`/tickets/detail/${t.id}`)}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700 flex-1 truncate">
                      {t.ticketNo} — {t.title}
                    </span>
                    <span className="text-xs text-gray-400 mono-label">{t.createdAt.slice(5, 10)}</span>
                  </div>
                ))}
              </div>
            )}

            {pendingReviews.length === 0 && overdueTickets.length === 0 && (
              <div className="px-5 py-10 text-center">
                <p className="text-sm text-gray-400">暂无待办事项</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
