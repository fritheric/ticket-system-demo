import React, { useState, useMemo } from 'react'
import { useStore } from '../store/useStore'
import type { MajorCase, MajorCaseFollowUp } from '../types'
import ExcelImport from '../components/ExcelImport'
import {
  Plus,
  Search,
  Edit3,
  Eye,
  Trash2,
  RotateCcw,
  CheckCircle,
  MessageSquare,
  X,
  Filter,
  ChevronLeft,
  ChevronRight,
  Upload,
} from 'lucide-react'

const BRAND = '#00A6FF'

/* ── helpers ──────────────────────────────────────────── */
const STAGE_COLORS: Record<string, string> = {
  发现: 'bg-yellow-100 text-yellow-700',
  上报: 'bg-blue-100 text-blue-700',
  处置中: 'bg-orange-100 text-orange-700',
  结案: 'bg-green-100 text-green-700',
}

const TYPE_COLORS: Record<string, string> = {
  舆情: 'bg-red-100 text-red-700',
  严重受伤: 'bg-orange-100 text-orange-700',
  伤亡: 'bg-purple-100 text-purple-700',
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
  return new Date(iso).toLocaleDateString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  })
}

/* ── Modal shell ──────────────────────────────────────── */
function Modal({ open, onClose, title, children }: {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="text-lg font-bold">{title}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100"><X size={18} /></button>
        </div>
        <div className="p-5 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  )
}

function DetailGrid({ label, value, full }: { label: string; value: string | number | boolean | undefined; full?: boolean }) {
  const display = typeof value === 'boolean' ? (value ? '是' : '否') : (value ?? '-')
  return (
    <div className={`grid ${full ? 'grid-cols-1' : 'grid-cols-3'} border-b border-gray-100 py-2 text-sm`}>
      <span className="text-gray-500">{label}</span>
      <span className={`col-span-${full ? '1' : '2'} text-gray-900`}>{String(display)}</span>
    </div>
  )
}

/* ── 新建/编辑表单 ───────────────────────────────────── */
function MajorCaseForm({ initial, onSave, onClose }: {
  initial?: MajorCase
  onSave: (data: Record<string, unknown>) => void
  onClose: () => void
}) {
  const settings = useStore((s) => s.settings)
  const users = useStore((s) => s.users)
  const currentUser = useStore((s) => s.currentUser)

  const [form, setForm] = useState({
    riderId: initial?.riderId ?? '',
    riderName: initial?.riderName ?? '',
    gender: initial?.gender ?? '男' as '男' | '女',
    city: initial?.city ?? '',
    idCard: initial?.idCard ?? '',
    phone: initial?.phone ?? '',
    reportOrderNo: initial?.reportOrderNo ?? '',
    accidentTime: initial?.accidentTime ?? '',
    insuranceType: initial?.insuranceType ?? '',
    accidentParty: initial?.accidentParty ?? '',
    accidentDesc: initial?.accidentDesc ?? '',
    caseType: initial?.caseType ?? '',
    stage: initial?.stage ?? '',
    responsibleName: initial?.responsibleName ?? '',
  })

  const set = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }))

  const handleSubmit = () => {
    if (!form.riderId || !form.riderName || !form.caseType) {
      alert('请填写必填字段：骑手ID、姓名、案件类型')
      return
    }
    const data: Record<string, unknown> = {
      ...form,
      responsibleId: currentUser?.id ?? '',
      creatorId: currentUser?.id ?? '',
      creatorName: currentUser?.name ?? '',
    }
    if (initial) data.id = initial.id
    onSave(data)
    onClose()
  }

  const inputCls = "w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#00A6FF]"
  const labelCls = "block text-sm font-medium text-gray-700 mb-1"

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div><label className={labelCls}>骑手ID *</label><input className={inputCls} value={form.riderId} onChange={(e) => set('riderId', e.target.value)} /></div>
        <div><label className={labelCls}>骑手姓名 *</label><input className={inputCls} value={form.riderName} onChange={(e) => set('riderName', e.target.value)} /></div>
        <div><label className={labelCls}>性别</label>
          <select className={inputCls} value={form.gender} onChange={(e) => set('gender', e.target.value)}>
            <option value="男">男</option><option value="女">女</option>
          </select>
        </div>
        <div><label className={labelCls}>城市</label><input className={inputCls} value={form.city} onChange={(e) => set('city', e.target.value)} /></div>
        <div><label className={labelCls}>身份证号</label><input className={inputCls} value={form.idCard} onChange={(e) => set('idCard', e.target.value)} /></div>
        <div><label className={labelCls}>手机号</label><input className={inputCls} value={form.phone} onChange={(e) => set('phone', e.target.value)} /></div>
        <div><label className={labelCls}>上报单号</label><input className={inputCls} value={form.reportOrderNo} onChange={(e) => set('reportOrderNo', e.target.value)} /></div>
        <div><label className={labelCls}>事故时间</label><input className={inputCls} type="datetime-local" value={form.accidentTime} onChange={(e) => set('accidentTime', e.target.value)} /></div>
        <div><label className={labelCls}>险种</label>
          <select className={inputCls} value={form.insuranceType} onChange={(e) => set('insuranceType', e.target.value)}>
            <option value="">请选择</option>
            {settings.insuranceTypes.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div><label className={labelCls}>事故方</label>
          <select className={inputCls} value={form.accidentParty} onChange={(e) => set('accidentParty', e.target.value)}>
            <option value="">请选择</option>
            {settings.accidentParties.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div><label className={labelCls}>案件类型 *</label>
          <select className={inputCls} value={form.caseType} onChange={(e) => set('caseType', e.target.value)}>
            <option value="">请选择</option>
            {settings.caseTypes.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div><label className={labelCls}>阶段</label>
          <select className={inputCls} value={form.stage} onChange={(e) => set('stage', e.target.value)}>
            <option value="">请选择</option>
            {settings.stages.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div><label className={labelCls}>负责人</label>
          <select className={inputCls} value={form.responsibleName} onChange={(e) => set('responsibleName', e.target.value)}>
            <option value="">请选择</option>
            {users.map((u) => <option key={u.id} value={u.name}>{u.name}</option>)}
          </select>
        </div>
      </div>
      <div><label className={labelCls}>事故描述</label><textarea className={`${inputCls} h-20`} value={form.accidentDesc} onChange={(e) => set('accidentDesc', e.target.value)} /></div>
      <div className="flex justify-end gap-2 pt-2">
        <button onClick={onClose} className="px-4 py-1.5 rounded border text-sm hover:bg-gray-50">取消</button>
        <button onClick={handleSubmit} className="px-4 py-1.5 rounded text-sm text-white" style={{ backgroundColor: BRAND }}>保存</button>
      </div>
    </div>
  )
}

/* ── 详情弹窗 ────────────────────────────────────────── */
function CaseDetailModal({ mc, open, onClose }: {
  mc: MajorCase | null
  open: boolean
  onClose: () => void
}) {
  const addFollowUp = useStore((s) => s.addFollowUp)
  const maskIdCard = useStore((s) => s.maskIdCard)
  const maskPhone = useStore((s) => s.maskPhone)
  const [followContent, setFollowContent] = useState('')

  if (!mc) return null

  const handleFollow = () => {
    if (!followContent.trim()) return
    addFollowUp(mc.id, followContent)
    setFollowContent('')
  }

  return (
    <Modal open={open} onClose={onClose} title={`案件详情 — ${mc.caseNo}`}>
      <div className="space-y-4">
        <DetailGrid label="案件编号" value={mc.caseNo} />
        <DetailGrid label="骑手ID" value={mc.riderId} />
        <DetailGrid label="骑手姓名" value={mc.riderName} />
        <DetailGrid label="性别" value={mc.gender} />
        <DetailGrid label="城市" value={mc.city} />
        <DetailGrid label="身份证号" value={maskIdCard(mc.idCard)} />
        <DetailGrid label="手机号" value={maskPhone(mc.phone)} />
        <DetailGrid label="上报单号" value={mc.reportOrderNo} />
        <DetailGrid label="事故时间" value={fmtDate(mc.accidentTime)} />
        <DetailGrid label="险种" value={mc.insuranceType} />
        <DetailGrid label="事故方" value={mc.accidentParty} />
        <DetailGrid label="事故描述" value={mc.accidentDesc} full />
        <DetailGrid label="案件类型" value={<span className={`px-2 py-0.5 rounded text-xs font-medium ${TYPE_COLORS[mc.caseType] || 'bg-gray-100 text-gray-700'}`}>{mc.caseType}</span> as unknown as string} />
        <DetailGrid label="阶段" value={<span className={`px-2 py-0.5 rounded text-xs font-medium ${STAGE_COLORS[mc.stage] || 'bg-gray-100 text-gray-700'}`}>{mc.stage}</span> as unknown as string} />
        <DetailGrid label="负责人" value={mc.responsibleName} />
        <DetailGrid label="创建人" value={mc.creatorName} />
        <DetailGrid label="创建时间" value={fmtDate(mc.createdAt)} />
        <DetailGrid label="结案付款人" value={mc.payer} />
        <DetailGrid label="结案日期" value={fmtShort(mc.completeDate)} />
        <DetailGrid label="付款金额" value={mc.paymentAmount ? `¥${mc.paymentAmount}` : undefined} />
        <DetailGrid label="付款时间" value={fmtDate(mc.paymentTime)} />

        {/* 跟进记录 */}
        <div className="pt-3 border-t">
          <h4 className="font-semibold text-sm mb-2">跟进记录</h4>
          <div className="flex gap-2 mb-3">
            <input className="flex-1 px-3 py-2 border rounded-md text-sm" placeholder="输入跟进内容..." value={followContent} onChange={(e) => setFollowContent(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleFollow()} />
            <button onClick={handleFollow} className="px-3 py-2 rounded text-sm text-white flex items-center gap-1" style={{ backgroundColor: BRAND }}>
              <MessageSquare size={14} /> 添加
            </button>
          </div>
          {mc.followUps.length === 0 ? (
            <p className="text-xs text-gray-400">暂无跟进记录</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {mc.followUps.map((fu) => (
                <div key={fu.id} className="bg-gray-50 rounded p-2 text-sm">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{fu.followerName}</span><span>{fmtDate(fu.followTime)}</span>
                  </div>
                  <p className="text-gray-700 mt-1">{fu.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}

/* ── 结案弹窗 ────────────────────────────────────────── */
function CloseCaseModal({ mc, open, onClose, onSave }: {
  mc: MajorCase | null
  open: boolean
  onClose: () => void
  onSave: (id: string, data: Partial<MajorCase>) => void
}) {
  const [payer, setPayer] = useState('')
  const [amount, setAmount] = useState('')
  const [paymentTime, setPaymentTime] = useState('')
  const [completeDate, setCompleteDate] = useState('')

  if (!mc) return null

  const handleSave = () => {
    onSave(mc.id, {
      stage: '结案',
      payer,
      paymentAmount: amount ? parseFloat(amount) : undefined,
      paymentTime: paymentTime ? new Date(paymentTime).toISOString() : undefined,
      completeDate: completeDate ? new Date(completeDate).toISOString() : undefined,
    })
    onClose()
  }

  const inputCls = "w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#00A6FF]"
  const labelCls = "block text-sm font-medium text-gray-700 mb-1"

  return (
    <Modal open={open} onClose={onClose} title={`结案 — ${mc.caseNo}`}>
      <div className="space-y-3">
        <div><label className={labelCls}>付款人</label><input className={inputCls} value={payer} onChange={(e) => setPayer(e.target.value)} /></div>
        <div><label className={labelCls}>付款金额</label><input className={inputCls} type="number" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
        <div><label className={labelCls}>付款时间</label><input className={inputCls} type="datetime-local" value={paymentTime} onChange={(e) => setPaymentTime(e.target.value)} /></div>
        <div><label className={labelCls}>结案日期</label><input className={inputCls} type="date" value={completeDate} onChange={(e) => setCompleteDate(e.target.value)} /></div>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-1.5 rounded border text-sm hover:bg-gray-50">取消</button>
          <button onClick={handleSave} className="px-4 py-1.5 rounded text-sm text-white flex items-center gap-1" style={{ backgroundColor: BRAND }}><CheckCircle size={14} /> 确认结案</button>
        </div>
      </div>
    </Modal>
  )
}

/* ==================== 主页面 ==================== */
export default function MajorCaseList() {
  const cases = useStore((s) => s.majorCases)
  const createMajorCase = useStore((s) => s.createMajorCase)
  const updateMajorCase = useStore((s) => s.updateMajorCase)
  const deleteMajorCase = useStore((s) => s.deleteMajorCase)
  const restoreMajorCase = useStore((s) => s.restoreMajorCase)
  const settings = useStore((s) => s.settings)

  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterStage, setFilterStage] = useState('')
  const [filterInsurance, setFilterInsurance] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)

  // 弹窗
  const [showForm, setShowForm] = useState(false)
  const [editingCase, setEditingCase] = useState<MajorCase | null>(null)
  const [viewCase, setViewCase] = useState<MajorCase | null>(null)
  const [closingCase, setClosingCase] = useState<MajorCase | null>(null)
  const [showExcelImport, setShowExcelImport] = useState(false)

  // 过滤
  const filtered = useMemo(() => {
    return cases.filter((mc) => {
      if (mc.isDeleted) return false
      if (search) {
        const q = search.toLowerCase()
        const hay = `${mc.caseNo}${mc.riderId}${mc.riderName}${mc.city}${mc.insuranceType}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      if (filterType && mc.caseType !== filterType) return false
      if (filterStage && mc.stage !== filterStage) return false
      if (filterInsurance && mc.insuranceType !== filterInsurance) return false
      return true
    })
  }, [cases, search, filterType, filterStage, filterInsurance])

  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const pageData = filtered.slice((page - 1) * pageSize, page * pageSize)

  const handleCreate = (data: Record<string, unknown>) => {
    createMajorCase({
      riderId: String(data.riderId ?? ''),
      riderName: String(data.riderName ?? ''),
      gender: (data.gender as '男' | '女') || '男',
      city: String(data.city ?? ''),
      idCard: String(data.idCard ?? ''),
      phone: String(data.phone ?? ''),
      reportOrderNo: String(data.reportOrderNo ?? ''),
      accidentTime: String(data.accidentTime ?? ''),
      insuranceType: String(data.insuranceType ?? ''),
      accidentParty: String(data.accidentParty ?? ''),
      accidentDesc: String(data.accidentDesc ?? ''),
      caseType: String(data.caseType ?? ''),
      stage: String(data.stage ?? '发现'),
      responsibleId: String(data.responsibleId ?? ''),
      responsibleName: String(data.responsibleName ?? ''),
      creatorId: String(data.creatorId ?? ''),
      creatorName: String(data.creatorName ?? ''),
    })
  }

  const handleEdit = (data: Record<string, unknown>) => {
    if (!editingCase) return
    updateMajorCase(editingCase.id, {
      riderName: String(data.riderName ?? editingCase.riderName),
      city: String(data.city ?? editingCase.city),
      caseType: String(data.caseType ?? editingCase.caseType),
      stage: String(data.stage ?? editingCase.stage),
      responsibleName: String(data.responsibleName ?? editingCase.responsibleName),
      accidentDesc: String(data.accidentDesc ?? editingCase.accidentDesc),
      insuranceType: String(data.insuranceType ?? editingCase.insuranceType),
      accidentParty: String(data.accidentParty ?? editingCase.accidentParty),
      reportOrderNo: String(data.reportOrderNo ?? editingCase.reportOrderNo),
      accidentTime: String(data.accidentTime ?? editingCase.accidentTime),
    })
    setEditingCase(null)
  }

  const handleExcelImport = (data: Record<string, unknown>[]) => {
    let imported = 0
    data.forEach((row) => {
      const cityVal = String(row.city ?? '').trim()
      if (!cityVal) return
      const riderId = String(row.riderId ?? '').trim()
      const riderName = String(row.riderName ?? '').trim()
      if (!riderId || !riderName) return

      createMajorCase({
        riderId,
        riderName,
        gender: (String(row.gender ?? '男') as '男' | '女') || '男',
        city: cityVal,
        idCard: String(row.idCard ?? ''),
        phone: String(row.phone ?? ''),
        reportOrderNo: String(row.reportOrderNo ?? ''),
        accidentTime: String(row.accidentTime ?? ''),
        insuranceType: String(row.insuranceType ?? ''),
        accidentParty: String(row.accidentParty ?? ''),
        accidentDesc: String(row.accidentDesc ?? ''),
        caseType: String(row.caseType ?? '舆情'),
        stage: String(row.stage ?? '发现'),
        responsibleId: '',
        responsibleName: String(row.responsibleName ?? ''),
        creatorId: '',
        creatorName: '',
      })
      imported++
    })
    setShowExcelImport(false)
    if (imported > 0) alert(`成功导入 ${imported} 条重大案件记录`)
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">重大案件</h2>
        <div className="flex gap-2">
          <button onClick={() => setShowExcelImport(true)} className="flex items-center gap-1 px-3 py-1.5 rounded text-sm border border-gray-200 hover:bg-gray-50">
            <Upload size={14} /> 导入
          </button>
          <button onClick={() => { setEditingCase(null); setShowForm(true) }} className="flex items-center gap-1 px-3 py-1.5 rounded text-sm text-white" style={{ backgroundColor: BRAND }}>
            <Plus size={14} /> 新建
          </button>
        </div>
      </div>

      {/* 筛选 */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="flex items-center gap-1 bg-white border rounded px-2">
          <Search size={14} className="text-gray-400" />
          <input className="py-1.5 text-sm outline-none w-48" placeholder="搜索案件号/骑手/城市/险种..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
        </div>
        <select className="border rounded px-2 py-1.5 text-sm" value={filterType} onChange={(e) => { setFilterType(e.target.value); setPage(1) }}>
          <option value="">全部案件类型</option>
          {settings.caseTypes.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select className="border rounded px-2 py-1.5 text-sm" value={filterStage} onChange={(e) => { setFilterStage(e.target.value); setPage(1) }}>
          <option value="">全部阶段</option>
          {settings.stages.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select className="border rounded px-2 py-1.5 text-sm" value={filterInsurance} onChange={(e) => { setFilterInsurance(e.target.value); setPage(1) }}>
          <option value="">全部险种</option>
          {settings.insuranceTypes.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <span className="text-sm text-gray-500 self-center">共 {total} 条</span>
      </div>

      {/* 表格 */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="px-3 py-2 text-left">案件编号</th>
              <th className="px-3 py-2 text-left">骑手姓名</th>
              <th className="px-3 py-2 text-left">城市</th>
              <th className="px-3 py-2 text-left">案件类型</th>
              <th className="px-3 py-2 text-left">阶段</th>
              <th className="px-3 py-2 text-left">险种</th>
              <th className="px-3 py-2 text-left">负责人</th>
              <th className="px-3 py-2 text-left">创建时间</th>
              <th className="px-3 py-2 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {pageData.map((mc) => (
              <tr key={mc.id} className="hover:bg-gray-50">
                <td className="px-3 py-2 font-mono text-xs">{mc.caseNo}</td>
                <td className="px-3 py-2">{mc.riderName}</td>
                <td className="px-3 py-2">{mc.city}</td>
                <td className="px-3 py-2"><span className={`px-1.5 py-0.5 rounded text-xs font-medium ${TYPE_COLORS[mc.caseType] || 'bg-gray-100'}`}>{mc.caseType}</span></td>
                <td className="px-3 py-2"><span className={`px-1.5 py-0.5 rounded text-xs font-medium ${STAGE_COLORS[mc.stage] || 'bg-gray-100'}`}>{mc.stage}</span></td>
                <td className="px-3 py-2">{mc.insuranceType}</td>
                <td className="px-3 py-2">{mc.responsibleName}</td>
                <td className="px-3 py-2 text-xs text-gray-500">{fmtDate(mc.createdAt)}</td>
                <td className="px-3 py-2 text-right">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => setViewCase(mc)} className="p-1 rounded hover:bg-blue-50 text-blue-600" title="查看"><Eye size={14} /></button>
                    <button onClick={() => { setEditingCase(mc); setShowForm(true) }} className="p-1 rounded hover:bg-gray-100" title="编辑"><Edit3 size={14} /></button>
                    {mc.stage !== '结案' && (
                      <button onClick={() => setClosingCase(mc)} className="p-1 rounded hover:bg-green-50 text-green-600" title="结案"><CheckCircle size={14} /></button>
                    )}
                    <button onClick={() => { if (confirm('确定删除？')) deleteMajorCase(mc.id) }} className="p-1 rounded hover:bg-red-50 text-red-600" title="删除"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {pageData.length === 0 && (
              <tr><td colSpan={9} className="text-center py-8 text-gray-400">暂无数据</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <span>每页</span>
            <select className="border rounded px-1 py-0.5" value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1) }}>
              {[50, 100, 200].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <span>条</span>
          </div>
          <div className="flex items-center gap-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="p-1 rounded border disabled:opacity-30"><ChevronLeft size={14} /></button>
            <span>{page} / {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="p-1 rounded border disabled:opacity-30"><ChevronRight size={14} /></button>
          </div>
        </div>
      )}

      {/* 弹窗 */}
      <Modal open={showForm} onClose={() => { setShowForm(false); setEditingCase(null) }} title={editingCase ? '编辑案件' : '新建重大案件'}>
        <MajorCaseForm initial={editingCase ?? undefined} onSave={editingCase ? handleEdit : handleCreate} onClose={() => { setShowForm(false); setEditingCase(null) }} />
      </Modal>

      <CaseDetailModal mc={viewCase} open={!!viewCase} onClose={() => setViewCase(null)} />

      <CloseCaseModal mc={closingCase} open={!!closingCase} onClose={() => setClosingCase(null)} onSave={updateMajorCase} />

      {showExcelImport && (
        <ExcelImport
          module="majorCase"
          onClose={() => setShowExcelImport(false)}
          onImport={handleExcelImport}
        />
      )}
    </div>
  )
}
