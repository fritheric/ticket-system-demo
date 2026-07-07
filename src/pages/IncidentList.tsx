import { useState, useMemo } from 'react'
import { useStore } from '../store/useStore'
import type { IncidentRecord, SystemSettings } from '../types'
import ExcelImport from '../components/ExcelImport'
import {
  Plus, Search, Filter, Eye, Edit2, Trash2, RotateCcw,
  ChevronLeft, ChevronRight, X as XIcon, Upload
} from 'lucide-react'

const PAGE_SIZE_OPTIONS = [50, 100, 200] as const

function fmt(iso: string): string {
  if (!iso) return '-'
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function fmtFull(iso: string): string {
  if (!iso) return '-'
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/* ==================== 主页面 ==================== */
export default function IncidentList() {
  const incidents = useStore((s) => s.incidents)
  const createIncident = useStore((s) => s.createIncident)
  const updateIncident = useStore((s) => s.updateIncident)
  const deleteIncident = useStore((s) => s.deleteIncident)
  const restoreIncident = useStore((s) => s.restoreIncident)
  const settings = useStore((s) => s.settings)
  const maskIdCard = useStore((s) => s.maskIdCard)
  const maskPhone = useStore((s) => s.maskPhone)
  const maskRiderId = useStore((s) => s.maskRiderId)
  const currentUser = useStore((s) => s.currentUser)

  const [search, setSearch] = useState('')
  const [filterInsurance, setFilterInsurance] = useState('')
  const [filterCause, setFilterCause] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterLiability, setFilterLiability] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const [showDeleted, setShowDeleted] = useState(false)
  const [showExcelImport, setShowExcelImport] = useState(false)

  const [showCreate, setShowCreate] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [editing, setEditing] = useState<IncidentRecord | null>(null)
  const [viewing, setViewing] = useState<IncidentRecord | null>(null)

  /* 筛选 */
  const filtered = useMemo(() => {
    let list = incidents.filter((i) => (showDeleted ? i.isDeleted : !i.isDeleted))
    if (filterInsurance) list = list.filter((i) => i.insuranceType === filterInsurance)
    if (filterCause) list = list.filter((i) => i.cause === filterCause)
    if (filterType) list = list.filter((i) => i.accidentType === filterType)
    if (filterLiability) list = list.filter((i) => i.liability === filterLiability)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter((i) =>
        i.riderName.toLowerCase().includes(q) ||
        i.phone.toLowerCase().includes(q) ||
        i.idCard.toLowerCase().includes(q) ||
        i.orderNo.toLowerCase().includes(q),
      )
    }
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    return list
  }, [incidents, search, filterInsurance, filterCause, filterType, filterLiability, showDeleted])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

  /* CRUD */
  const handleCreate = (form: Record<string, string | number | boolean>) => {
    if (!currentUser) return
    createIncident({
      insuranceType: (form.insuranceType as string) || '',
      riderId: (form.riderId as string) || '',
      riderName: (form.riderName as string) || '',
      gender: (form.gender as '男' | '女') || '男',
      city: (form.city as string) || '',
      idCard: (form.idCard as string) || '',
      phone: (form.phone as string) || '',
      orderNo: (form.orderNo as string) || '',
      accidentDate: (form.accidentDate as string) || '',
      accidentTimeVal: (form.accidentTimeVal as string) || '',
      reportDate: (form.reportDate as string) || '',
      reportTime: (form.reportTime as string) || '',
      location: (form.location as string) || '',
      accidentDesc: (form.accidentDesc as string) || '',
      injuryDesc: (form.injuryDesc as string) || '',
      vehicleType: (form.vehicleType as string) || '',
      isDeath: !!form.isDeath,
      liability: (form.liability as string) || '',
      violation: (form.violation as string) || '',
      otherInjury: (form.otherInjury as string) || '',
      otherPerson: (form.otherPerson as string) || '',
      otherVehicle: (form.otherVehicle as string) || '',
      cause: (form.cause as string) || '',
      accidentType: (form.accidentType as string) || '',
      isSupplier: !!form.isSupplier,
      isCancel: !!form.isCancel,
      isContacted: !!form.isContacted,
      creatorId: currentUser.id,
      creatorName: currentUser.name,
    })
    setShowCreate(false)
  }

  const handleExcelImport = (data: Record<string, unknown>[]) => {
    if (!currentUser) return
    data.forEach((row) => {
      createIncident({
        insuranceType: String(row.insuranceType || ''),
        riderId: String(row.riderId || ''),
        riderName: String(row.riderName || ''),
        gender: (row.gender as '男' | '女') || '男',
        city: String(row.city || ''),
        idCard: String(row.idCard || ''),
        phone: String(row.phone || ''),
        orderNo: String(row.orderNo || ''),
        accidentDate: String(row.accidentDate || ''),
        accidentTimeVal: String(row.accidentTimeVal || ''),
        reportDate: String(row.reportDate || ''),
        reportTime: String(row.reportTime || ''),
        location: String(row.location || ''),
        accidentDesc: String(row.accidentDesc || ''),
        injuryDesc: String(row.injuryDesc || ''),
        vehicleType: String(row.vehicleType || ''),
        isDeath: String(row.isDeath || '').trim() === '是',
        liability: String(row.liability || ''),
        violation: String(row.violation || ''),
        otherInjury: String(row.otherInjury || ''),
        otherPerson: String(row.otherPerson || ''),
        otherVehicle: String(row.otherVehicle || ''),
        cause: String(row.cause || ''),
        accidentType: String(row.accidentType || ''),
        isSupplier: String(row.isSupplier || '').trim() === '是',
        isCancel: String(row.isCancel || '').trim() === '是',
        isContacted: String(row.isContacted || '').trim() === '是',
        creatorId: currentUser.id,
        creatorName: currentUser.name,
      })
    })
    setShowExcelImport(false)
  }

  const handleEdit = (form: Record<string, string | number | boolean>) => {
    if (!editing) return
    updateIncident(editing.id, {
      insuranceType: (form.insuranceType as string) || editing.insuranceType,
      riderId: (form.riderId as string) || editing.riderId,
      riderName: (form.riderName as string) || editing.riderName,
      gender: (form.gender as '男' | '女') || editing.gender,
      city: (form.city as string) || editing.city,
      idCard: (form.idCard as string) || editing.idCard,
      phone: (form.phone as string) || editing.phone,
      orderNo: (form.orderNo as string) || editing.orderNo,
      accidentDate: (form.accidentDate as string) || editing.accidentDate,
      accidentTimeVal: (form.accidentTimeVal as string) || editing.accidentTimeVal,
      reportDate: (form.reportDate as string) || editing.reportDate,
      reportTime: (form.reportTime as string) || editing.reportTime,
      location: (form.location as string) || editing.location,
      accidentDesc: (form.accidentDesc as string) || editing.accidentDesc,
      injuryDesc: (form.injuryDesc as string) || editing.injuryDesc,
      vehicleType: (form.vehicleType as string) || editing.vehicleType,
      isDeath: !!form.isDeath,
      liability: (form.liability as string) || editing.liability,
      violation: (form.violation as string) || editing.violation,
      otherInjury: (form.otherInjury as string) || editing.otherInjury,
      otherPerson: (form.otherPerson as string) || editing.otherPerson,
      otherVehicle: (form.otherVehicle as string) || editing.otherVehicle,
      cause: (form.cause as string) || editing.cause,
      accidentType: (form.accidentType as string) || editing.accidentType,
      isSupplier: !!form.isSupplier,
      isCancel: !!form.isCancel,
      isContacted: !!form.isContacted,
    })
    setShowEdit(false)
    setEditing(null)
  }

  return (
    <div className="p-4 space-y-4">
      {/* 标题 + 操作 */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-xl font-bold text-gray-800">出险记录</h2>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-md text-white text-sm"
            style={{ backgroundColor: '#00A6FF' }}
          >
            <Plus size={16} /> 新建记录
          </button>
          <button
            onClick={() => setShowDeleted(!showDeleted)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm border text-gray-600 hover:bg-gray-50"
          >
            <RotateCcw size={14} /> {showDeleted ? '回收站' : '回收站'}
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
            placeholder="搜索骑手名 / 手机号 / 身份证 / 订单号"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          <Filter size={16} className="text-gray-400" />
          {settings.insuranceTypes?.length > 0 && (
            <select className="border border-gray-200 rounded-md text-sm px-2 py-1.5 focus:outline-none"
              value={filterInsurance}
              onChange={(e) => { setFilterInsurance(e.target.value); setPage(1) }}>
              <option value="">全部险种</option>
              {settings.insuranceTypes.map((t: string) => <option key={t} value={t}>{t}</option>)}
            </select>
          )}
          {settings.causes?.length > 0 && (
            <select className="border border-gray-200 rounded-md text-sm px-2 py-1.5 focus:outline-none"
              value={filterCause}
              onChange={(e) => { setFilterCause(e.target.value); setPage(1) }}>
              <option value="">全部原因</option>
              {settings.causes.map((t: string) => <option key={t} value={t}>{t}</option>)}
            </select>
          )}
          {settings.accidentTypes?.length > 0 && (
            <select className="border border-gray-200 rounded-md text-sm px-2 py-1.5 focus:outline-none"
              value={filterType}
              onChange={(e) => { setFilterType(e.target.value); setPage(1) }}>
              <option value="">全部类型</option>
              {settings.accidentTypes.map((t: string) => <option key={t} value={t}>{t}</option>)}
            </select>
          )}
          {settings.liabilities?.length > 0 && (
            <select className="border border-gray-200 rounded-md text-sm px-2 py-1.5 focus:outline-none"
              value={filterLiability}
              onChange={(e) => { setFilterLiability(e.target.value); setPage(1) }}>
              <option value="">全部责任认定</option>
              {settings.liabilities.map((t: string) => <option key={t} value={t}>{t}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* 表格 */}
      <div className="overflow-auto rounded-md border border-gray-200">
        <table className="w-full text-xs whitespace-nowrap">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="px-2 py-2 text-left">险种</th>
              <th className="px-2 py-2 text-left">骑手ID</th>
              <th className="px-2 py-2 text-left">骑手姓名</th>
              <th className="px-2 py-2 text-left">性别</th>
              <th className="px-2 py-2 text-left">城市</th>
              <th className="px-2 py-2 text-left">身份证</th>
              <th className="px-2 py-2 text-left">手机号</th>
              <th className="px-2 py-2 text-left">订单号</th>
              <th className="px-2 py-2 text-left">出险时间</th>
              <th className="px-2 py-2 text-left">出险地点</th>
              <th className="px-2 py-2 text-left">事故描述</th>
              <th className="px-2 py-2 text-left">受伤描述</th>
              <th className="px-2 py-2 text-left">车辆类型</th>
              <th className="px-2 py-2 text-left">死亡</th>
              <th className="px-2 py-2 text-left">责任认定</th>
              <th className="px-2 py-2 text-left">违反交规</th>
              <th className="px-2 py-2 text-left">对方伤亡</th>
              <th className="px-2 py-2 text-left">对方人员</th>
              <th className="px-2 py-2 text-left">对方车辆</th>
              <th className="px-2 py-2 text-left">事故原因</th>
              <th className="px-2 py-2 text-left">事故类型</th>
              <th className="px-2 py-2 text-left">增值商</th>
              <th className="px-2 py-2 text-left">销案</th>
              <th className="px-2 py-2 text-left">联系</th>
              <th className="px-2 py-2 text-left w-20">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginated.length === 0 && (
              <tr><td colSpan={25} className="px-3 py-8 text-center text-gray-400">暂无数据</td></tr>
            )}
            {paginated.map((i) => (
              <tr key={i.id} className="hover:bg-gray-50">
                <td className="px-2 py-1.5">{i.insuranceType}</td>
                <td className="px-2 py-1.5 font-mono">{maskRiderId(i.riderId)}</td>
                <td className="px-2 py-1.5">{i.riderName}</td>
                <td className="px-2 py-1.5">{i.gender}</td>
                <td className="px-2 py-1.5">{i.city}</td>
                <td className="px-2 py-1.5 font-mono">{maskIdCard(i.idCard)}</td>
                <td className="px-2 py-1.5 font-mono">{maskPhone(i.phone)}</td>
                <td className="px-2 py-1.5">{i.orderNo}</td>
                <td className="px-2 py-1.5">{i.accidentTimeVal || fmt(i.accidentDate)}</td>
                <td className="px-2 py-1.5 max-w-24 truncate">{i.location}</td>
                <td className="px-2 py-1.5 max-w-24 truncate">{i.accidentDesc}</td>
                <td className="px-2 py-1.5 max-w-24 truncate">{i.injuryDesc}</td>
                <td className="px-2 py-1.5">{i.vehicleType}</td>
                <td className="px-2 py-1.5">{i.isDeath ? '⚠️' : '-'}</td>
                <td className="px-2 py-1.5">{i.liability}</td>
                <td className="px-2 py-1.5 max-w-16 truncate">{i.violation || '-'}</td>
                <td className="px-2 py-1.5">{i.otherInjury || '-'}</td>
                <td className="px-2 py-1.5">{i.otherPerson || '-'}</td>
                <td className="px-2 py-1.5">{i.otherVehicle || '-'}</td>
                <td className="px-2 py-1.5">{i.cause}</td>
                <td className="px-2 py-1.5">{i.accidentType}</td>
                <td className="px-2 py-1.5">{i.isSupplier ? '是' : '否'}</td>
                <td className="px-2 py-1.5">{i.isCancel ? '是' : '否'}</td>
                <td className="px-2 py-1.5">{i.isContacted ? '是' : '否'}</td>
                <td className="px-2 py-1.5">
                  <div className="flex gap-0.5">
                    {showDeleted ? (
                      <button onClick={() => restoreIncident(i.id)} className="p-1 rounded text-green-600 hover:bg-green-50" title="恢复"><RotateCcw size={12} /></button>
                    ) : (
                      <>
                        <button onClick={() => setViewing(i)} className="p-1 rounded text-[#00A6FF] hover:bg-blue-50" title="查看"><Eye size={12} /></button>
                        <button onClick={() => { setEditing(i); setShowEdit(true) }} className="p-1 rounded text-gray-500 hover:bg-gray-50" title="编辑"><Edit2 size={12} /></button>
                        <button onClick={() => { if (confirm('确认删除？')) deleteIncident(i.id) }} className="p-1 rounded text-red-500 hover:bg-red-50" title="删除"><Trash2 size={12} /></button>
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
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-2 py-1 border rounded disabled:opacity-40">
            <ChevronLeft size={14} />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)}
              className={`w-7 h-7 rounded text-xs ${p === page ? 'text-white font-medium' : 'border'}`}
              style={p === page ? { backgroundColor: '#00A6FF' } : {}}>
              {p}
            </button>
          ))}
          <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="px-2 py-1 border rounded disabled:opacity-40">
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* 新建弹窗 */}
      {showCreate && (
        <IncidentFormModal
          settings={settings}
          onClose={() => setShowCreate(false)}
          onSubmit={handleCreate}
          title="新建出险记录"
        />
      )}

      {/* 编辑弹窗 */}
      {showEdit && editing && (
        <IncidentFormModal
          settings={settings}
          initial={editing}
          onClose={() => { setShowEdit(false); setEditing(null) }}
          onSubmit={handleEdit}
          title="编辑出险记录"
        />
      )}

      {/* 详情弹窗 */}
      {viewing && (
        <IncidentDetail record={viewing} onClose={() => setViewing(null)} maskIdCard={maskIdCard} maskPhone={maskPhone} maskRiderId={maskRiderId} />
      )}

      {/* Excel 导入弹窗 */}
      {showExcelImport && (
        <ExcelImport
          module="incident"
          onClose={() => setShowExcelImport(false)}
          onImport={handleExcelImport}
        />
      )}
    </div>
  )
}

/* ==================== 出险表单弹窗 ==================== */
function IncidentFormModal({ settings, initial, onClose, onSubmit, title }: {
  settings: SystemSettings
  initial?: IncidentRecord
  onClose: () => void
  onSubmit: (form: Record<string, string | number | boolean>) => void
  title: string
}) {
  const [form, setForm] = useState({
    insuranceType: initial?.insuranceType || '',
    riderId: initial?.riderId || '',
    riderName: initial?.riderName || '',
    gender: initial?.gender || '男',
    city: initial?.city || '',
    idCard: initial?.idCard || '',
    phone: initial?.phone || '',
    orderNo: initial?.orderNo || '',
    accidentDate: initial?.accidentDate ? initial.accidentDate.slice(0, 10) : '',
    accidentTimeVal: initial?.accidentTimeVal || '',
    reportDate: initial?.reportDate ? initial.reportDate.slice(0, 10) : '',
    reportTime: initial?.reportTime || '',
    location: initial?.location || '',
    accidentDesc: initial?.accidentDesc || '',
    injuryDesc: initial?.injuryDesc || '',
    vehicleType: initial?.vehicleType || '',
    isDeath: initial?.isDeath || false,
    liability: initial?.liability || '',
    violation: initial?.violation || '',
    otherInjury: initial?.otherInjury || '',
    otherPerson: initial?.otherPerson || '',
    otherVehicle: initial?.otherVehicle || '',
    cause: initial?.cause || '',
    accidentType: initial?.accidentType || '',
    isSupplier: initial?.isSupplier || false,
    isCancel: initial?.isCancel || false,
    isContacted: initial?.isContacted || false,
  })

  const set = (k: string, v: string | number | boolean) => setForm((f) => ({ ...f, [k]: v }))

  return (
    <div className="fixed inset-0 bg-black/30 flex items-start justify-center z-50 overflow-y-auto py-8">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl mx-4">
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white rounded-t-lg z-10">
          <h3 className="text-lg font-bold">{title}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100"><XIcon size={18} /></button>
        </div>
        <div className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-3 gap-3">
            <Field label="险种">
              <select className="input-std" value={form.insuranceType} onChange={(e) => set('insuranceType', e.target.value)}>
                <option value="">请选择</option>
                {settings.insuranceTypes.map((t: string) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="骑手ID"><input className="input-std" value={form.riderId} onChange={(e) => set('riderId', e.target.value)} /></Field>
            <Field label="骑手姓名"><input className="input-std" value={form.riderName} onChange={(e) => set('riderName', e.target.value)} /></Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="性别">
              <select className="input-std" value={form.gender} onChange={(e) => set('gender', e.target.value)}>
                <option value="男">男</option><option value="女">女</option>
              </select>
            </Field>
            <Field label="城市"><input className="input-std" value={form.city} onChange={(e) => set('city', e.target.value)} /></Field>
            <Field label="订单号"><input className="input-std" value={form.orderNo} onChange={(e) => set('orderNo', e.target.value)} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="身份证"><input className="input-std" value={form.idCard} onChange={(e) => set('idCard', e.target.value)} /></Field>
            <Field label="手机号"><input className="input-std" value={form.phone} onChange={(e) => set('phone', e.target.value)} /></Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="出险日期"><input type="date" className="input-std" value={form.accidentDate} onChange={(e) => set('accidentDate', e.target.value)} /></Field>
            <Field label="出险时间"><input className="input-std" placeholder="如 14:30" value={form.accidentTimeVal} onChange={(e) => set('accidentTimeVal', e.target.value)} /></Field>
            <Field label="出险地点"><input className="input-std" value={form.location} onChange={(e) => set('location', e.target.value)} /></Field>
          </div>
          <Field label="事故描述"><textarea className="input-std min-h-12 resize-y" value={form.accidentDesc} onChange={(e) => set('accidentDesc', e.target.value)} /></Field>
          <Field label="受伤描述"><textarea className="input-std min-h-12 resize-y" value={form.injuryDesc} onChange={(e) => set('injuryDesc', e.target.value)} /></Field>
          <Field label="车辆类型"><input className="input-std" value={form.vehicleType} onChange={(e) => set('vehicleType', e.target.value)} /></Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="事故原因">
              <select className="input-std" value={form.cause} onChange={(e) => set('cause', e.target.value)}>
                <option value="">请选择</option>
                {settings.causes.map((t: string) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="事故类型">
              <select className="input-std" value={form.accidentType} onChange={(e) => set('accidentType', e.target.value)}>
                <option value="">请选择</option>
                {settings.accidentTypes.map((t: string) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="责任认定">
              <select className="input-std" value={form.liability} onChange={(e) => set('liability', e.target.value)}>
                <option value="">请选择</option>
                {settings.liabilities.map((t: string) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="违反交规"><input className="input-std" value={form.violation} onChange={(e) => set('violation', e.target.value)} placeholder="无则留空" /></Field>
            <Field label="对方伤亡"><input className="input-std" value={form.otherInjury} onChange={(e) => set('otherInjury', e.target.value)} placeholder="无则留空" /></Field>
            <Field label="对方人员"><input className="input-std" value={form.otherPerson} onChange={(e) => set('otherPerson', e.target.value)} placeholder="无则留空" /></Field>
          </div>
          <Field label="对方车辆"><input className="input-std" value={form.otherVehicle} onChange={(e) => set('otherVehicle', e.target.value)} placeholder="无则留空" /></Field>
          <div className="flex gap-6 flex-wrap">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isDeath as boolean} onChange={(e) => set('isDeath', e.target.checked)} /> 是否死亡</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isSupplier as boolean} onChange={(e) => set('isSupplier', e.target.checked)} /> 增值商维修</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isCancel as boolean} onChange={(e) => set('isCancel', e.target.checked)} /> 是否销案</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isContacted as boolean} onChange={(e) => set('isContacted', e.target.checked)} /> 是否联系</label>
          </div>
        </div>
        <div className="p-4 border-t flex justify-end gap-2">
          <button className="px-4 py-1.5 rounded border text-sm hover:bg-gray-50" onClick={onClose}>取消</button>
          <button className="px-4 py-1.5 rounded text-sm text-white" style={{ backgroundColor: '#00A6FF' }} onClick={() => onSubmit(form)}>确定</button>
        </div>
      </div>
    </div>
  )
}

/* ==================== 详情弹窗 ==================== */
function IncidentDetail({ record: i, onClose, maskIdCard, maskPhone, maskRiderId }: {
  record: IncidentRecord
  onClose: () => void
  maskIdCard: (v: string) => string
  maskPhone: (v: string) => string
  maskRiderId: (v: string) => string
}) {
  return (
    <div className="fixed inset-0 bg-black/30 flex items-start justify-center z-50 overflow-y-auto py-8">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-bold">出险记录详情</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100"><XIcon size={18} /></button>
        </div>
        <div className="p-4 space-y-3">
          <DetailGrid label="险种" value={i.insuranceType} />
          <DetailGrid label="骑手" value={`${i.riderName} (${maskRiderId(i.riderId)})`} />
          <DetailGrid label="性别/城市" value={`${i.gender} / ${i.city}`} />
          <DetailGrid label="身份证" value={maskIdCard(i.idCard)} />
          <DetailGrid label="手机号" value={maskPhone(i.phone)} />
          <DetailGrid label="订单号" value={i.orderNo} />
          <DetailGrid label="出险时间" value={i.accidentTimeVal || fmt(i.accidentDate)} />
          <DetailGrid label="出险地点" value={i.location} />
          <DetailGrid label="事故描述" value={i.accidentDesc} full />
          <DetailGrid label="受伤描述" value={i.injuryDesc} full />
          <DetailGrid label="车辆类型" value={i.vehicleType} />
          <DetailGrid label="是否死亡" value={i.isDeath ? '⚠️ 是' : '否'} />
          <DetailGrid label="责任认定" value={i.liability} />
          <DetailGrid label="违反交规" value={i.violation || '-'} />
          <DetailGrid label="对方伤亡" value={i.otherInjury || '-'} />
          <DetailGrid label="对方人员/车辆" value={`${i.otherPerson || '-'} / ${i.otherVehicle || '-'}`} />
          <DetailGrid label="事故原因/类型" value={`${i.cause} / ${i.accidentType}`} />
          <DetailGrid label="增值商维修/销案/联系" value={`${i.isSupplier ? '是' : '否'} / ${i.isCancel ? '是' : '否'} / ${i.isContacted ? '是' : '否'}`} />
          {i.linkedTicketId && <DetailGrid label="关联工单" value={i.linkedTicketId} />}
          {i.linkedMajorCaseId && <DetailGrid label="关联重大案件" value={i.linkedMajorCaseId} />}
        </div>
        <div className="p-4 border-t flex justify-end">
          <button className="px-4 py-1.5 rounded text-sm text-white" style={{ backgroundColor: '#00A6FF' }} onClick={onClose}>关闭</button>
        </div>
      </div>
    </div>
  )
}

/* ==================== 公共小组件 ==================== */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  )
}

function DetailGrid({ label, value, full }: { label: string; value: string; full?: boolean }) {
  return (
    <div className={full ? '' : 'grid grid-cols-3 gap-2'}>
      <span className="text-sm text-gray-500">{label}：</span>
      <span className={`text-sm ${full ? 'block mt-1' : 'col-span-2'}`}>{value || '-'}</span>
    </div>
  )
}
