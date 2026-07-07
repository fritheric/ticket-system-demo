import { useStore } from '../store/useStore'
import type { View, UserRole } from '../types'

const VIEW_LABELS: Record<View, string> = {
  dashboard: '仪表盘',
  tickets: '工单管理',
  create: '创建工单',
  edit: '编辑工单',
  detail: '工单详情',
  interceptions: '拦截记录',
  incidents: '出险记录',
  majorCases: '重大案件',
  statistics: '数据统计',
  ledger: '个人台账',
  knowledge: '知识库',
  notifications: '通知消息',
  settings: '系统设置',
  account: '个人中心',
}

const ROLE_BADGE: Record<UserRole, { color: string; label: string }> = {
  admin: { color: '#ef4444', label: '管理员' },
  supervisor: { color: '#3b82f6', label: '主管' },
  specialist: { color: '#94a3b8', label: '专员' },
}

function Header(): React.ReactElement {
  const currentUser = useStore((state) => state.currentUser)
  const view = useStore((state) => state.view)
  const logout = useStore((state) => state.logout)
  const badge = currentUser ? ROLE_BADGE[currentUser.role] : null

  return (
    <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/60 px-6 py-2.5 flex items-center justify-between flex-shrink-0 sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <h1 className="text-base font-semibold text-gray-800">{VIEW_LABELS[view]}</h1>
        <div className="w-px h-4 bg-gray-200" />
        <span className="text-xs text-gray-400">保险运营组</span>
      </div>

      {currentUser && badge && (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0"
              style={{ background: '#00A6FF' }}
            >
              {currentUser.name.charAt(0)}
            </div>
            <span className="text-sm text-gray-700 font-medium">{currentUser.name}</span>
            <span
              className="text-xs px-1.5 py-0.5 rounded font-medium"
              style={{
                color: badge.color,
                background: badge.color + '10',
              }}
            >
              {badge.label}
            </span>
          </div>

          <div className="w-px h-4 bg-gray-200" />

          <button
            onClick={logout}
            className="text-xs text-gray-400 hover:text-red-500 transition-colors px-2 py-1 rounded hover:bg-red-50/50"
          >
            退出
          </button>
        </div>
      )}
    </header>
  )
}

export default Header
