import { useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../store/useStore'
import {
  ArrowLeft, Edit2, Clock, User, MapPin, FileText,
  Shield, AlertCircle, ArrowRightLeft, X
} from 'lucide-react'
import type { TicketPriority, TicketStatus } from '../types'

const PRIORITY_COLORS: Record<TicketPriority, string> = {
  low: 'bg-gray-100 text-gray-600 border border-gray-200',
  medium: 'bg-blue-100 text-blue-700 border border-blue-200',
  high: 'bg-orange-100 text-orange-700 border border-orange-200',
  urgent: 'bg-red-100 text-red-700 border border-red-200',
}
const PRIORITY_LABELS: Record<TicketPriority, string> = { low: '低', medium: '中', high: '高', urgent: '紧急' }
const STATUS_COLORS: Record<TicketStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
  overdue: 'bg-red-100 text-red-700 border border-red-200',
  completed: 'bg-green-100 text-green-700 border border-green-200',
}
const STATUS_LABELS: Record<TicketStatus, string> = { pending: '待处理', overdue: '已超时', completed: '已完成' }

const TRANSFER_STATUS_LABELS: Record<string, string> = {
  none: '无', pending: '待确认', confirmed: '已确认', rejected: '已拒绝',
}
const TRANSFER_STATUS_COLORS: Record<string, string> = {
  none: 'text-gray-400', pending: 'text-yellow-600', confirmed: 'text-green-600', rejected: 'text-red-600',
}

function fmt(iso: string): string {
  if (!iso) return '-'
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/* ==================== 主页面 ==================== */
export default function TicketDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const ticket = useStore((s) => s.tickets.find((t) => t.id === id))
  const incidents = useStore((s) => s.incidents)
  const updateTicket = useStore((s) => s.updateTicket)
  const currentUser = useStore((s) => s.currentUser)

  if (!ticket) {
    return (
      <div className="p-4 flex items-center justify-center min-h-64">
        <div className="text-center text-gray-400">
          <AlertCircle size={48} className="mx-auto mb-2 opacity-40" />
          <p>工单不存在</p>
          <button onClick={() => navigate('/tickets')} className="mt-2 text-sm underline">返回列表</button>
        </div>
      </div>
    )
  }

  const linkedIncident = ticket.linkedIncidentId ? incidents.find((i) => i.id === ticket.linkedIncidentId) : null

  return (
    <div className="p-4 space-y-4 max-w-4xl">
      {/* 顶部：返回 + 标题 + 操作 */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/tickets')}
            className="flex items-center gap-1 px-2 py-1 rounded text-sm text-gray-500 hover:bg-gray-100"
          >
            <ArrowLeft size={16} /> 返回
          </button>
          <h2 className="text-lg font-bold">{ticket.ticketNo}</h2>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[ticket.status]}`}>
            {STATUS_LABELS[ticket.status]}
          </span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_COLORS[ticket.priority]}`}>
            {PRIORITY_LABELS[ticket.priority]}
          </span>
        </div>
        <div className="flex gap-2">
          {ticket.status !== 'completed' && currentUser && (
            <button
              onClick={() => { updateTicket(ticket.id, { status: 'completed' }) }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm bg-green-600 text-white"
            >
              完成工单
            </button>
          )}
          <button
            onClick={() => navigate(`/tickets/${ticket.id}/edit`)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm border text-gray-600 hover:bg-gray-50"
          >
            <Edit2 size={14} /> 编辑
          </button>
        </div>
      </div>

      {/* 基本信息 */}
      <Card title="基本信息" icon={<FileText size={16} />}>
        <GridRow label="案件/订单号" value={ticket.caseOrderNo} />
        <GridRow label="骑手ID" value={ticket.riderId} />
        <GridRow label="骑手姓名" value={ticket.riderName} />
        <GridRow label="城市" value={ticket.riderCity} />
      </Card>

      {/* 案件信息 */}
      <Card title="案件信息" icon={<Shield size={16} />}>
        <GridRow label="案件类型" value={ticket.caseType?.join('、') || '-'} />
        <GridRow label="案件描述" value={ticket.caseDesc || '-'} full />
      </Card>

      {/* 负责人信息 */}
      <Card title="负责人信息" icon={<User size={16} />}>
        <GridRow label="负责人" value={ticket.responsiblePersonName} />
        <GridRow label="创建人" value={ticket.creatorName} />
        <GridRow label="创建时间" value={fmt(ticket.createdAt)} />
        <GridRow label="更新时间" value={fmt(ticket.updatedAt)} />
        {ticket.completedAt && <GridRow label="完成时间" value={fmt(ticket.completedAt)} />}
      </Card>

      {/* 转办记录 */}
      <Card title="转办记录" icon={<ArrowRightLeft size={16} />}>
        <GridRow label="转办状态" value={
          <span className={TRANSFER_STATUS_COLORS[ticket.transferStatus]}>
            {TRANSFER_STATUS_LABELS[ticket.transferStatus] || '无'}
          </span>
        } />
        {ticket.transferReason && <GridRow label="转办原因" value={ticket.transferReason} full />}
        {ticket.transferStatus === 'rejected' && ticket.transferRejectReason && (
          <GridRow label="拒绝原因" value={ticket.transferRejectReason} full />
        )}
        {ticket.transferStatus === 'none' && (
          <p className="text-sm text-gray-400">暂无转办记录</p>
        )}
      </Card>

      {/* 关联出险记录 */}
      {linkedIncident && (
        <Card title="关联出险记录" icon={<Clock size={16} />}>
          <GridRow label="险种" value={linkedIncident.insuranceType} />
          <GridRow label="出险时间" value={linkedIncident.accidentTimeVal} />
          <GridRow label="出险地点" value={linkedIncident.location} />
          <GridRow label="事故描述" value={linkedIncident.accidentDesc} full />
          <button
            onClick={() => navigate(`/incidents/${linkedIncident.id}`)}
            className="mt-2 text-sm underline"
          >
            查看详情 →
          </button>
        </Card>
      )}
    </div>
  )
}

/* ==================== 小组件 ==================== */
function Card({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-4 py-2.5 border-b bg-gray-50 flex items-center gap-2">
        {icon}
        <h3 className="font-medium text-sm">{title}</h3>
      </div>
      <div className="p-4 space-y-2">{children}</div>
    </div>
  )
}

function GridRow({ label, value, full }: { label: string; value: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? '' : 'grid grid-cols-3 gap-2'}>
      <span className="text-sm text-gray-500">{label}：</span>
      <span className={`text-sm ${full ? 'block mt-1' : 'col-span-2'}`}>{value}</span>
    </div>
  )
}
