import { useState } from 'react'
import { useStore } from '../store/useStore'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  AlertTriangle,
  ArrowRightLeft,
  Settings,
  CheckCheck,
  Clock,
  Filter,
} from 'lucide-react'

const BRAND_BLUE = '#00A6FF'

type NotificationFilter = 'all' | 'unread' | 'read'

type NotificationType = 'timeout' | 'transfer' | 'system'

const TYPE_CONFIG: Record<NotificationType, { label: string; color: string; icon: React.ReactNode }> = {
  timeout: {
    label: '超时',
    color: '#ef4444',
    icon: <Clock size={14} />,
  },
  transfer: {
    label: '转交',
    color: '#3b82f6',
    icon: <ArrowRightLeft size={14} />,
  },
  system: {
    label: '系统',
    color: '#6b7280',
    icon: <Settings size={14} />,
  },
}

function NotificationCenter() {
  const currentUser = useStore((s) => s.currentUser)
  const notifications = useStore((s) => s.notifications)
  const markRead = useStore((s) => s.markRead)
  const markAllRead = useStore((s) => s.markAllRead)
  const navigate = useNavigate()

  const [filter, setFilter] = useState<NotificationFilter>('all')

  if (!currentUser) return null

  // 筛选当前用户的通知
  const userNotifications = notifications.filter((n) => n.userId === currentUser.id)

  // 应用筛选
  const filtered = userNotifications.filter((n) => {
    if (filter === 'unread') return !n.isRead
    if (filter === 'read') return n.isRead
    return true
  })

  // 按时间倒序
  const sorted = [...filtered].sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  const unreadCount = userNotifications.filter((n) => !n.isRead).length

  const filterTabs: { key: NotificationFilter; label: string; count?: number }[] = [
    { key: 'all', label: '全部', count: userNotifications.length },
    { key: 'unread', label: '未读', count: unreadCount },
    { key: 'read', label: '已读', count: userNotifications.length - unreadCount },
  ]

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell size={24} className="text-[#00A6FF]" />
            通知消息
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {unreadCount > 0 ? `您有 ${unreadCount} 条未读通知` : '暂无未读通知'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllRead(currentUser.id)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm text-white rounded-lg font-medium transition-colors hover:opacity-90"
            style={{ background: BRAND_BLUE }}
          >
            <CheckCheck size={16} />
            全部标记已读
          </button>
        )}
      </div>

      {/* 筛选标签 */}
      <div className="flex gap-2 border-b border-gray-200">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              filter === tab.key
                ? 'border-[#00A6FF] text-[#00A6FF]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Filter size={14} />
            {tab.label}
            {tab.count !== undefined && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                filter === tab.key
                  ? 'bg-[#00A6FF]/10 text-[#00A6FF]'
                  : 'bg-gray-100 text-gray-500'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 通知列表 */}
      <div className="space-y-2">
        {sorted.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm py-16 text-center">
            <Bell size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-400 text-sm">暂无通知</p>
          </div>
        ) : (
          sorted.map((notification) => {
            const typeCfg = TYPE_CONFIG[notification.type] || TYPE_CONFIG.system
            const time = new Date(notification.createdAt)
            const timeStr = formatTime(time)

            return (
              <div
                key={notification.id}
                className={`bg-white rounded-xl border shadow-sm p-4 transition-all ${
                  notification.isRead
                    ? 'border-gray-100'
                    : 'border-[#00A6FF]/20 bg-[#00A6FF]/[0.02]'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* 未读圆点 */}
                  <div className="mt-2 flex-shrink-0">
                    {!notification.isRead && (
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ background: BRAND_BLUE }}
                      />
                    )}
                  </div>

                  {/* 内容区域 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm text-gray-800">
                        {notification.title}
                      </span>
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium"
                        style={{
                          background: typeCfg.color + '15',
                          color: typeCfg.color,
                        }}
                      >
                        {typeCfg.icon}
                        {typeCfg.label}
                      </span>
                      <span className="text-xs text-gray-400 ml-auto flex-shrink-0">
                        {timeStr}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">
                      {notification.content}
                    </p>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                    {!notification.isRead && (
                      <button
                        onClick={() => markRead(notification.id)}
                        className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-[#00A6FF] transition-colors"
                        title="标记已读"
                      >
                        <CheckCheck size={15} />
                      </button>
                    )}
                    {notification.link && (
                      <button
                        onClick={() => navigate(notification.link!)}
                        className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-[#00A6FF] transition-colors"
                        title="查看详情"
                      >
                        <ArrowRightLeft size={15} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

function formatTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return '刚刚'
  if (diffMins < 60) return `${diffMins} 分钟前`
  if (diffHours < 24) return `${diffHours} 小时前`
  if (diffDays < 7) return `${diffDays} 天前`

  return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

export default NotificationCenter
