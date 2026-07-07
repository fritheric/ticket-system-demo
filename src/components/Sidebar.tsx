import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useStore } from '../store/useStore'
import type { UserRole, View } from '../types'
import {
  LayoutDashboard,
  Ticket,
  ShieldAlert,
  FileWarning,
  AlertTriangle,
  BarChart3,
  Download,
  BookOpen,
  Bell,
  Settings,
  UserCircle,
  LogOut,
} from 'lucide-react'

const BRAND_BLUE = '#00A6FF'

interface MenuItem {
  view: View
  label: string
  icon: React.ReactNode
  path: string
}

const ALL_MENU_ITEMS: MenuItem[] = [
  { view: 'dashboard', label: '仪表盘', icon: <LayoutDashboard size={18} />, path: '/dashboard' },
  { view: 'tickets', label: '工单管理', icon: <Ticket size={18} />, path: '/tickets' },
  { view: 'interceptions', label: '拦截记录', icon: <ShieldAlert size={18} />, path: '/interceptions' },
  { view: 'incidents', label: '出险记录', icon: <FileWarning size={18} />, path: '/incidents' },
  { view: 'majorCases', label: '重大案件', icon: <AlertTriangle size={18} />, path: '/major-cases' },
  { view: 'statistics', label: '数据统计', icon: <BarChart3 size={18} />, path: '/statistics' },
  { view: 'ledger', label: '个人台账', icon: <Download size={18} />, path: '/ledger' },
  { view: 'knowledge', label: '知识库', icon: <BookOpen size={18} />, path: '/knowledge' },
  { view: 'notifications', label: '通知消息', icon: <Bell size={18} />, path: '/notifications' },
  { view: 'settings', label: '系统设置', icon: <Settings size={18} />, path: '/settings' },
  { view: 'account', label: '个人中心', icon: <UserCircle size={18} />, path: '/account' },
]

const ROLE_VISIBLE_VIEWS: Record<UserRole, Set<View>> = {
  admin: new Set(ALL_MENU_ITEMS.map((m) => m.view)),
  supervisor: new Set(ALL_MENU_ITEMS.map((m) => m.view).filter((v) => v !== 'settings')),
  specialist: new Set<View>(['dashboard', 'tickets', 'interceptions', 'incidents', 'knowledge']),
}

const ROLE_LABELS: Record<UserRole, string> = {
  admin: '管理员',
  supervisor: '主管',
  specialist: '专员',
}

function Sidebar(): React.ReactElement {
  const currentUser = useStore((state) => state.currentUser)
  const setView = useStore((state) => state.setView)
  const logout = useStore((state) => state.logout)
  const [activeSection, setActiveSection] = useState<'main' | 'system'>('main')

  if (!currentUser) {
    return (
      <aside style={{ width: 230, minWidth: 230, background: '#0f172a' }} className="flex flex-col h-full" />
    )
  }

  const allowed = ROLE_VISIBLE_VIEWS[currentUser.role]
  const visibleItems = ALL_MENU_ITEMS.filter((item) => allowed.has(item.view))

  const mainItems = visibleItems.filter((i) => i.view !== 'settings' && i.view !== 'account')
  const systemItems = visibleItems.filter((i) => i.view === 'settings' || i.view === 'account')

  return (
    <aside
      style={{ width: 230, minWidth: 230, background: '#0f172a' }}
      className="flex flex-col h-full text-gray-300"
    >
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
            style={{ background: BRAND_BLUE }}
          >
            保
          </div>
          <div>
            <div className="text-white font-semibold text-sm leading-tight">保险运营组</div>
            <div className="text-xs text-gray-500">工单系统</div>
          </div>
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-4">
        {/* Main nav */}
        <div>
          {mainItems.map((item) => (
            <NavLink
              key={item.view}
              to={item.path}
              onClick={() => setView(item.view)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg mb-0.5 text-sm transition-all cursor-pointer ${
                  isActive
                    ? 'text-white'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                }`
              }
              style={({ isActive }) =>
                isActive
                  ? { background: 'rgba(0, 166, 255, 0.12)', color: BRAND_BLUE, fontWeight: 500 }
                  : {}
              }
            >
              <span className="flex-shrink-0 opacity-75">{item.icon}</span>
              <span className="truncate">{item.label}</span>
            </NavLink>
          ))}
        </div>

        {/* System nav */}
        {systemItems.length > 0 && (
          <div>
            <div className="px-3 py-1.5 text-xs text-gray-600 uppercase tracking-wider font-medium">
              系统
            </div>
            {systemItems.map((item) => (
              <NavLink
                key={item.view}
                to={item.path}
                onClick={() => setView(item.view)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg mb-0.5 text-sm transition-all cursor-pointer ${
                    isActive
                      ? 'text-white'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                  }`
                }
                style={({ isActive }) =>
                  isActive
                    ? { background: 'rgba(0, 166, 255, 0.12)', color: BRAND_BLUE, fontWeight: 500 }
                    : {}
                }
              >
                <span className="flex-shrink-0 opacity-75">{item.icon}</span>
                <span className="truncate">{item.label}</span>
              </NavLink>
            ))}
          </div>
        )}
      </nav>

      {/* Bottom: user info + logout */}
      <div className="px-3 py-3 border-t border-white/5">
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-medium text-xs flex-shrink-0"
            style={{ background: BRAND_BLUE }}
          >
            {currentUser.name.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm text-white truncate font-medium">{currentUser.name}</div>
            <div className="text-xs text-gray-500">{ROLE_LABELS[currentUser.role]}</div>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 text-xs text-gray-500 hover:text-red-400 transition-colors w-full px-2 py-1.5 rounded hover:bg-white/5"
        >
          <LogOut size={14} />
          <span>退出登录</span>
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
