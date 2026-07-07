import { useState } from 'react'
import { useStore } from '../store/useStore'
import type { SystemSettings } from '../types'
import {
  Plus,
  Trash2,
  Save,
  Info,
  Tag,
  Clock,
  Settings2,
  Send,
  Link2,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react'

const BRAND_BLUE = '#00A6FF'

type SettingsTab = 'dropdowns' | 'timeout' | 'dingtalk' | 'about'

interface DropdownConfig {
  key: keyof Pick<
    SystemSettings,
    | 'interceptTypes'
    | 'handleMethods'
    | 'fraudTypes'
    | 'insuranceTypes'
    | 'accidentParties'
    | 'liabilities'
    | 'causes'
    | 'accidentTypes'
    | 'caseTypes'
    | 'stages'
    | 'knowledgeCategories'
    | 'priorities'
    | 'ticketStatuses'
  >
  label: string
}

const DROPDOWN_CONFIGS: DropdownConfig[] = [
  { key: 'interceptTypes', label: '拦截类型' },
  { key: 'handleMethods', label: '处理方式' },
  { key: 'fraudTypes', label: '欺诈类型' },
  { key: 'insuranceTypes', label: '险种' },
  { key: 'accidentParties', label: '事故方' },
  { key: 'liabilities', label: '责任认定' },
  { key: 'causes', label: '事故原因' },
  { key: 'accidentTypes', label: '事故类型' },
  { key: 'caseTypes', label: '案件类型' },
  { key: 'stages', label: '案件阶段' },
  { key: 'knowledgeCategories', label: '知识库分类' },
  { key: 'priorities', label: '优先级标签' },
  { key: 'ticketStatuses', label: '工单状态标签' },
]

function Settings() {
  const settings = useStore((s) => s.settings)
  const updateSettings = useStore((s) => s.updateSettings)
  const [activeTab, setActiveTab] = useState<SettingsTab>('dropdowns')

  const currentUser = useStore((s) => s.currentUser)

  const tabs: { key: SettingsTab; label: string; icon: React.ReactNode; adminOnly?: boolean }[] = [
    { key: 'dropdowns', label: '下拉选项管理', icon: <Tag size={16} /> },
    { key: 'timeout', label: '超时规则设置', icon: <Clock size={16} /> },
    { key: 'dingtalk', label: '钉钉通知配置', icon: <Link2 size={16} />, adminOnly: true },
    { key: 'about', label: '关于系统', icon: <Info size={16} /> },
  ]

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold">系统设置</h1>
        <p className="text-gray-500 text-sm mt-1">管理系统配置与选项</p>
      </div>

      {/* 标签页切换 */}
      <div className="flex gap-2 border-b border-gray-200">
        {tabs
          .filter((tab) => !(tab.adminOnly && currentUser?.role !== 'admin'))
          .map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-[#00A6FF] text-[#00A6FF]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
      </div>

      {/* 标签页内容 */}
      {activeTab === 'dropdowns' && (
        <DropdownManager settings={settings} onUpdate={updateSettings} />
      )}
      {activeTab === 'timeout' && (
        <TimeoutRules settings={settings} onUpdate={updateSettings} />
      )}
      {activeTab === 'dingtalk' && (
        <DingtalkConfig settings={settings} onUpdate={updateSettings} />
      )}
      {activeTab === 'about' && <AboutSystem />}
    </div>
  )
}

// ==================== 下拉选项管理 ====================
function DropdownManager({
  settings,
  onUpdate,
}: {
  settings: SystemSettings
  onUpdate: (data: Partial<SystemSettings>) => void
}) {
  const [editing, setEditing] = useState<string | null>(null)
  const [newValue, setNewValue] = useState('')

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        管理各模块的下拉选项，修改后立即生效。
      </p>
      {DROPDOWN_CONFIGS.map((cfg) => {
        const items = settings[cfg.key] as string[]
        const isOpen = editing === cfg.key
        return (
          <div
            key={cfg.key}
            className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
          >
            <button
              onClick={() => setEditing(isOpen ? null : cfg.key)}
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Settings2 size={18} className="text-gray-400" />
                <span className="font-medium text-sm">{cfg.label}</span>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                  {items.length} 项
                </span>
              </div>
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {isOpen && (
              <div className="px-5 pb-4 border-t border-gray-100 pt-4">
                {/* 当前选项列表 */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {items.map((item, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-lg text-sm group"
                    >
                      {item}
                      <button
                        onClick={() => {
                          const next = [...items]
                          next.splice(idx, 1)
                          onUpdate({ [cfg.key]: next })
                        }}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </span>
                  ))}
                  {items.length === 0 && (
                    <span className="text-xs text-gray-400">暂无选项</span>
                  )}
                </div>

                {/* 新增输入 */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newValue.trim()) {
                        onUpdate({ [cfg.key]: [...items, newValue.trim()] })
                        setNewValue('')
                      }
                    }}
                    placeholder={`添加新的${cfg.label}...`}
                    className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00A6FF]"
                  />
                  <button
                    onClick={() => {
                      if (newValue.trim()) {
                        onUpdate({ [cfg.key]: [...items, newValue.trim()] })
                        setNewValue('')
                      }
                    }}
                    disabled={!newValue.trim()}
                    className="px-4 py-2 text-sm rounded-lg text-white font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: BRAND_BLUE }}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ==================== 超时规则设置 ====================
function TimeoutRules({
  settings,
  onUpdate,
}: {
  settings: SystemSettings
  onUpdate: (data: Partial<SystemSettings>) => void
}) {
  const priorityLabels: Record<string, { label: string; color: string }> = {
    low: { label: '低优先级', color: '#6b7280' },
    medium: { label: '中优先级', color: '#f59e0b' },
    high: { label: '高优先级', color: '#ef4444' },
    urgent: { label: '紧急', color: '#dc2626' },
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        设置各优先级工单的超时时限（小时），修改后立即保存。
      </p>
      {Object.entries(priorityLabels).map(([key, { label, color }]) => {
        const value = settings.timeoutRules[key as keyof typeof settings.timeoutRules]
        return (
          <div
            key={key}
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ background: color }}
                />
                <span className="font-medium text-sm">{label}</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={720}
                  value={value}
                  onChange={(e) => {
                    const v = parseInt(e.target.value) || 1
                    onUpdate({
                      timeoutRules: { ...settings.timeoutRules, [key]: v },
                    })
                  }}
                  className="w-20 px-3 py-2 text-sm text-center border border-gray-200 rounded-lg focus:outline-none focus:border-[#00A6FF]"
                />
                <span className="text-sm text-gray-500">小时</span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ==================== 关于系统 ====================
function AboutSystem() {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xl"
            style={{ background: BRAND_BLUE }}
          >
            保
          </div>
          <div>
            <h3 className="text-lg font-semibold">保险运营组工单系统</h3>
            <p className="text-sm text-gray-500">Demo v1.0.0</p>
          </div>
        </div>

        <div className="space-y-4 text-sm">
          <InfoRow label="系统名称" value="保险运营组工单系统" />
          <InfoRow label="版本号" value="v1.0.0 (Demo)" />
          <InfoRow label="技术栈" value="React 18 + TypeScript + Vite + Tailwind CSS + Zustand + React Router v7" />
          <InfoRow label="状态管理" value="Zustand + localStorage 持久化" />
          <InfoRow label="UI 组件" value="Tailwind CSS + lucide-react 图标" />
          <InfoRow label="品牌色" value={BRAND_BLUE} />
        </div>
      </div>
    </div>
  )
}

// ==================== 钉钉通知配置 ====================
function DingtalkConfig({
  settings,
  onUpdate,
}: {
  settings: SystemSettings
  onUpdate: (data: Partial<SystemSettings>) => void
}) {
  const [webhookUrl, setWebhookUrl] = useState(settings.dingtalkWebhook || '')
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null)
  const [testMsg, setTestMsg] = useState('')

  const handleSave = () => {
    onUpdate({ dingtalkWebhook: webhookUrl.trim() || undefined })
  }

  const handleTest = async () => {
    if (!webhookUrl.trim()) return
    setTesting(true)
    setTestResult(null)
    setTestMsg('')
    try {
      const response = await fetch(webhookUrl.trim(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          msgtype: 'text',
          text: { content: '【测试】钉钉通知连接测试，来自保险运营组工单系统' },
        }),
      })
      if (!response.ok) {
        setTestResult('error')
        setTestMsg(`请求失败: HTTP ${response.status}`)
        return
      }
      const result = await response.json() as Record<string, unknown>
      const errcode = result.errcode as number | undefined
      if (errcode && errcode !== 0) {
        setTestResult('error')
        setTestMsg(`钉钉返回错误: errcode=${errcode}, errmsg=${String(result.errmsg || '未知错误')}`)
        return
      }
      setTestResult('success')
      setTestMsg('连接成功！')
    } catch (err) {
      setTestResult('error')
      setTestMsg(err instanceof Error ? err.message : '请求失败')
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        配置钉钉群机器人 Webhook，用于系统消息推送。仅管理员可见。
      </p>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <Link2 size={18} className="text-gray-400" />
          <span className="font-medium text-sm">Webhook URL</span>
        </div>

        <div className="space-y-3">
          <input
            type="text"
            value={webhookUrl}
            onChange={(e) => {
              setWebhookUrl(e.target.value)
              setTestResult(null)
              setTestMsg('')
            }}
            placeholder="https://oapi.dingtalk.com/robot/send?access_token=..."
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00A6FF]"
          />

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm text-white font-medium transition-colors"
              style={{ background: BRAND_BLUE }}
            >
              <Save size={14} /> 保存配置
            </button>
            <button
              onClick={handleTest}
              disabled={!webhookUrl.trim() || testing}
              className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send size={14} /> {testing ? '测试中...' : '测试连接'}
            </button>
          </div>

          {/* 测试结果 */}
          {testResult && (
            <div
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                testResult === 'success'
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {testResult === 'success' ? (
                <CheckCircle size={16} />
              ) : (
                <AlertTriangle size={16} />
              )}
              {testMsg}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center py-3 border-b border-gray-50 last:border-0">
      <span className="text-gray-500 w-24 flex-shrink-0">{label}</span>
      <span className="text-gray-800 font-medium">{value}</span>
    </div>
  )
}

export default Settings
