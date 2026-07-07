import { useState, useMemo, useCallback } from 'react'
import { useStore } from '../store/useStore'
import type { Interception, SystemSettings } from '../types'
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
export default function InterceptionList() {
  const interceptions = useStore((s) => s.interceptions)
  const createInterception = useStore((s) => s.createInterception)
  const updateInterception = useStore((s) => s.updateInterception)
  const deleteInterception = useStore((s) => s.deleteInterception)
  const restoreInterception = useStore((s) => s.restoreInterception)
  const settings = useStore((s) => s.settings)
  const maskIdCard = useStore((s) => s.maskIdCard)
  const maskPhone = useStore((s) => s.maskPhone)
  const currentUser = useStore((s) => s.currentUser)

  const [search, setSearch] = useState('')
  const [filterYear, setFilterYear] = useState('')
  const [filterMonth, setFilterMonth] = useState('')
  const [filterInsurance, setFilterInsurance] = useState('')
  const [filterType, setFilterType] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const [showDeleted, setShowDeleted] = useState(false)
  const [showExcelImport, setShowExcelImport] = useState(false)

  const [showCreate, setShowCreate] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [editing, setEditing] = useState<Interception | null>(null)
  const [viewing, setViewing] = useState<Interception | null>(null)

  /* 年份月份选项 */
  const yearOptions = useMemo(() => {
    const years = new Set(interceptions.filter((i) => !i.isDeleted).map((i: Interception) => i.reportYear))
    return Array.from(years).sort((a, b) => b - a)
  }, [interceptions])

  const monthOptions = useMemo(() => {
    const months = new Set(interceptions.filter((i) => !i.isDeleted).map((i: Interception) => i.reportMonth))
    return Array.from(months).sort((a, b) => a - b)
  }, [interceptions])

  /* 筛选 */
  const filtered = useMemo(() => {
    let list = interceptions.filter((i) => (showDeleted ? i.isDeleted : !i.isDeleted))
    if (filterYear) list = list.filter((i) => i.reportYear === Number(filterYear))
    if (filterMonth) list = list.filter((i) => i.reportMonth === Number(filterMonth))
    if (filterInsurance) list = list.filter((i) => i.insuranceType === filterInsurance)
    if (filterType) list = list.filter((i) => i.interceptType === filterType)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter((i) =>
        i.riderName.toLowerCase().includes(q) ||
        i.phone.toLowerCase().includes(q) ||
        i.idCard.toLowerCase().includes(q),
      )
    }
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    return list
  }, [interceptions, search, filterYear, filterMonth, filterInsurance, filterType, showDeleted])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

  /* CRUD */
  const handleCreate = (form: Record<string, string | number | boolean>) => {
    if (!currentUser) return
    createInterception({
      reportYear: Number(form.reportYear) || new Date().getFullYear(),
      reportMonth: Number(form.reportMonth) || new Date().getMonth() + 1,
      handleTime: (form.handleTime as string) || new Date().toISOString(),
      riderId: (form.riderId as string) || '',
      riderName: (form.riderName as string) || '',
      gender: (form.gender as '男' | '女') || '男',
      city: (form.city as string) || '',
      idCard: (form.idCard as string) || '',
      phone: (form.phone as string) || '',
      reportOrderNo: (form.reportOrderNo as string) || '',
      accidentTime: (form.accidentTime as string) || '',
      insuranceType: (form.insuranceType as string) || '',
      accidentParty: (form.accidentParty as string) || '',
      accidentDesc: (form.accidentDesc as string) || '',
      estimatedLoss: Number(form.estimatedLoss) || 0,
      discovererId: (form.discovererId as string) || currentUser.id,
      discovererName: (form.discovererName as string) || currentUser.name,
      handlerId: (form.handlerId as string) || currentUser.id,
      handlerName: (form.handlerName as string) || currentUser.name,
      interceptType: (form.interceptType as string) || '',
      interceptReason: (form.interceptReason as string) || '',
      handleMethod: (form.handleMethod as string) || '',
      fraudType: (form.fraudType as string) || undefined,
      reportCrisis: !!form.reportCrisis,
      cityCollab: !!form.cityCollab,
      interceptSuccess: !!form.interceptSuccess,
    })
    setShowCreate(false)
  }

  const handleEdit = (form: Record<string, string | number | boolean>) => {
    if (!editing) return
    updateInterception(editing.id, {
      reportYear: Number(form.reportYear) || editing.reportYear,
      reportMonth: Number(form.reportMonth) || editing.reportMonth,
      handleTime: (form.handleTime as string) || editing.handleTime,
      riderId: (form.riderId as string) || editing.riderId,
      riderName: (form.riderName as string) || editing.riderName,
      gender: (form.gender as '男' | '女') || editing.gender,
      city: (form.city as string) || editing.city,
      idCard: (form.idCard as string) || editing.idCard,
      phone: (form.phone as string) || editing.phone,
      reportOrderNo: (form.reportOrderNo as string) || editing.reportOrderNo,
      accidentTime: (form.accidentTime as string) || editing.accidentTime,
      insuranceType: (form.insuranceType as string) || editing.insuranceType,
      accidentParty: (form.accidentParty as string) || editing.accidentParty,
      accidentDesc: (form.accidentDesc as string) || editing.accidentDesc,
      estimatedLoss: Number(form.estimatedLoss) || editing.estimatedLoss,
      interceptType: (form.interceptType as string) || editing.interceptType,
      interceptReason: (form.interceptReason as string) || editing.interceptReason,
      handleMethod: (form.handleMethod as string) || editing.handleMethod,
      fraudType: (form.fraudType as string) || editing.fraudType,
      reportCrisis: !!form.reportCrisis,
      cityCollab: !!form.cityCollab,
      interceptSuccess: !!form.interceptSuccess,
    })
    setShowEdit(false)
    setEditing(null)
  }

  const handleExcelImport = (data: Record<string, unknown>[]) => {
    if (!currentUser) return
    data.forEach((row) => {
      createInterception({
        reportYear: Number(row.reportYear) || new Date().getFullYear(),
        reportMonth: Number(row.reportMonth) || new Date().getMonth() + 1,
        handleTime: String(row.handleTime || new Date().toISOString()),
        riderId: String(row.riderId || ''),
        riderName: String(row.riderName || ''),
        gender: (row.gender as '男' | '女') || '男',
        city: String(row.city || ''),
        idCard: String(row.idCard || ''),
        phone: String(row.phone || ''),
        reportOrderNo: String(row.reportOrderNo || ''),
        accidentTime: String(row.accidentTime || ''),
        insuranceType: String(row.insuranceType || ''),
        accidentParty: String(row.accidentParty || ''),
        accidentDesc: String(row.accidentDesc || ''),
        estimatedLoss: Number(row.estimatedLoss) || 0,
        discovererId: currentUser.id,
        discovererName: currentUser.name,
        handlerId: currentUser.id,
        handlerName: currentUser.name,
        interceptType: String(row.interceptType || ''),
        interceptReason: String(row.interceptReason || ''),
        handleMethod: String(row.handleMethod || ''),
        fraudType: String(row.fraudType || undefined),
        reportCrisis: String(row.reportCrisis || '').trim() === '是',
        cityCollab: String(row.cityCollab || '').trim() === '是',
        interceptSuccess: String(row.interceptSuccess || '').trim() === '是',
      })
    })
    setShowExcelImport(false)
  }

  return (
    <div className="p-4 space-y-4">
      {/* 标题 + 操作 */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-xl font-bold text-gray-800">拦截记录</h2>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-md text-white text-sm"
            style={{ backgroundColor: '#00A6FF' }}
          >
            <Plus size={16} /> 新建记录
          </button>
          <button
            onClick={() => { setShowDeleted(!showDeleted) }}
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
            placeholder="搜索骑手名 / 手机号 / 身份证"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          <Filter size={16} className="text-gray-400" />
          {yearOptions.length > 0 && (
            <select className="border border-gray-200 rounded-md text-sm px-2 py-1.5 focus:outline-none"
              value={filterYear}
              onChange={(e) => { setFilterYear(e.target.value); setPage(1) }}>
              <option value="">全部年份</option>
              {yearOptions.map((y: number) => <option key={y} value={y}>{y}</option>)}
            </select>
          )}
          {monthOptions.length > 0 && (
            <select className="border border-gray-200 rounded-md text-sm px-2 py-1.5 focus:outline-none"
              value={filterMonth}
              onChange={(e) => { setFilterMonth(e.target.value); setPage(1) }}>
              <option value="">全部月份</option>
              {monthOptions.map((m: number) => <option key={m} value={m}>{m}月</option>)}
            </select>
          )}
          {settings.insuranceTypes?.length > 0 && (
            <select className="border border-gray-200 rounded-md text-sm px-2 py-1.5 focus:outline-none"
              value={filterInsurance}
              onChange={(e) => { setFilterInsurance(e.target.value); setPage(1) }}>
              <option value="">全部险种</option>
              {settings.insuranceTypes.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          )}
          {settings.interceptTypes?.length > 0 && (
            <select className="border border-gray-200 rounded-md text-sm px-2 py-1.5 focus:outline-none"
              value={filterType}
              onChange={(e) => { setFilterType(e.target.value); setPage(1) }}>
              <option value="">全部类型</option>
              {settings.interceptTypes.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* 表格 */}
      <div className="overflow-auto rounded-md border border-gray-200">
        <table className="w-full text-xs whitespace-nowrap">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="px-2 py-2 text-left">年份</th>
              <th className="px-2 py-2 text-left">月份</th>
              <th className="px-2 py-2 text-left">处理时间</th>
              <th className="px-2 py-2 text-left">骑手ID</th>
              <th className="px-2 py-2 text-left">骑手姓名</th>
              <th className="px-2 py-2 text-left">性别</th>
              <th className="px-2 py-2 text-left">城市</th>
              <th className="px-2 py-2 text-left">身份证</th>
              <th className="px-2 py-2 text-left">手机号</th>
              <th className="px-2 py-2 text-left">报案订单号</th>
              <th className="px-2 py-2 text-left">出险时间</th>
              <th className="px-2 py-2 text-left">险种</th>
              <th className="px-2 py-2 text-left">事故方</th>
              <th className="px-2 py-2 text-left">事故描述</th>
              <th className="px-2 py-2 text-left">估算损失</th>
              <th className="px-2 py-2 text-left">发现人</th>
              <th className="px-2 py-2 text-left">处理人</th>
              <th className="px-2 py-2 text-left">拦截类型</th>
              <th className="px-2 py-2 text-left">拦截原因</th>
              <th className="px-2 py-2 text-left">处理方式</th>
              <th className="px-2 py-2 text-left">欺诈类型</th>
              <th className="px-2 py-2 text-left">舆情</th>
              <th className="px-2 py-2 text-left">联动</th>
              <th className="px-2 py-2 text-left">成功</th>
              <th className="px-2 py-2 text-left w-20">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginated.length === 0 && (
              <tr><td colSpan={25} className="px-3 py-8 text-center text-gray-400">暂无数据</td></tr>
            )}
            {paginated.map((i) => (
              <tr key={i.id} className="hover:bg-gray-50">
                <td className="px-2 py-1.5">{i.reportYear}</td>
                <td className="px-2 py-1.5">{i.reportMonth}月</td>
                <td className="px-2 py-1.5">{fmt(i.handleTime)}</td>
                <td className="px-2 py-1.5 font-mono">{i.riderId}</td>
                <td className="px-2 py-1.5">{i.riderName}</td>
                <td className="px-2 py-1.5">{i.gender}</td>
                <td className="px-2 py-1.5">{i.city}</td>
                <td className="px-2 py-1.5 font-mono">{maskIdCard(i.idCard)}</td>
                <td className="px-2 py-1.5 font-mono">{maskPhone(i.phone)}</td>
                <td className="px-2 py-1.5">{i.reportOrderNo}</td>
                <td className="px-2 py-1.5">{i.accidentTime ? fmt(i.accidentTime) : '-'}</td>
                <td className="px-2 py-1.5">{i.insuranceType}</td>
                <td className="px-2 py-1.5">{i.accidentParty}</td>
                <td className="px-2 py-1.5 max-w-32 truncate">{i.accidentDesc}</td>
                <td className="px-2 py-1.5">{i.estimatedLoss ? `¥${i.estimatedLoss}` : '-'}</td>
                <td className="px-2 py-1.5">{i.discovererName}</td>
                <td className="px-2 py-1.5">{i.handlerName}</td>
                <td className="px-2 py-1.5">{i.interceptType}</td>
                <td className="px-2 py-1.5 max-w-24 truncate">{i.interceptReason}</td>
                <td className="px-2 py-1.5">{i.handleMethod}</td>
                <td className="px-2 py-1.5">{i.fraudType || '-'}</td>
                <td className="px-2 py-1.5">{i.reportCrisis ? '✅' : '-'}</td>
                <td className="px-2 py-1.5">{i.cityCollab ? '✅' : '-'}</td>
                <td className="px-2 py-1.5">{i.interceptSuccess ? '✅' : '❌'}</td>
                <td className="px-2 py-1.5">
                  <div className="flex gap-0.5">
                    {showDeleted ? (
                      <button onClick={() => restoreInterception(i.id)} className="p-1 rounded text-green-600 hover:bg-green-50" title="恢复"><RotateCcw size={12} /></button>
                    ) : (
                      <>
                        <button onClick={() => setViewing(i)} className="p-1 rounded text-[#00A6FF] hover:bg-blue-50" title="查看"><Eye size={12} /></button>
                        <button onClick={() => { setEditing(i); setShowEdit(true) }} className="p-1 rounded text-gray-500 hover:bg-gray-50" title="编辑"><Edit2 size={12} /></button>
                        <button onClick={() => { if (confirm('确认删除？')) deleteInterception(i.id) }} className="p-1 rounded text-red-500 hover:bg-red-50" title="删除"><Trash2 size={12} /></button>
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
        <InterceptionFormModal
          settings={settings}
          onClose={() => setShowCreate(false)}
          onSubmit={handleCreate}
          title="新建拦截记录"
        />
      )}

      {/* 编辑弹窗 */}
      {showEdit && editing && (
        <InterceptionFormModal
          settings={settings}
          initial={editing}
          onClose={() => { setShowEdit(false); setEditing(null) }}
          onSubmit={handleEdit}
          title="编辑拦截记录"
        />
      )}

      {/* 详情弹窗 */}
      {viewing && (
        <InterceptionDetail interception={viewing} onClose={() => setViewing(null)} maskIdCard={maskIdCard} maskPhone={maskPhone} />
      )}

      {/* Excel 导入弹窗 */}
      {showExcelImport && (
        <ExcelImport
          module="interception"
          onClose={() => setShowExcelImport(false)}
          onImport={handleExcelImport}
        />
      )}
    </div>
  )
}

/* ==================== 拦截表单弹窗 ==================== */
function InterceptionFormModal({ settings, initial, onClose, onSubmit, title }: {
  settings: SystemSettings
  initial?: Interception
  onClose: () => void
  onSubmit: (form: Record<string, string | number | boolean>) => void
  title: string
}) {
  const [form, setForm] = useState({
    reportYear: initial?.reportYear || new Date().getFullYear(),
    reportMonth: initial?.reportMonth || new Date().getMonth() + 1,
    handleTime: initial?.handleTime ? initial.handleTime.slice(0, 10) : '',
    riderId: initial?.riderId || '',
    riderName: initial?.riderName || '',
    gender: initial?.gender || '男',
    city: initial?.city || '',
    idCard: initial?.idCard || '',
    phone: initial?.phone || '',
    reportOrderNo: initial?.reportOrderNo || '',
    accidentTime: initial?.accidentTime ? initial.accidentTime.slice(0, 10) : '',
    insuranceType: initial?.insuranceType || '',
    accidentParty: initial?.accidentParty || '',
    accidentDesc: initial?.accidentDesc || '',
    estimatedLoss: initial?.estimatedLoss || '',
    discovererId: initial?.discovererId || '',
    discovererName: initial?.discovererName || '',
    handlerId: initial?.handlerId || '',
    handlerName: initial?.handlerName || '',
    interceptType: initial?.interceptType || '',
    interceptReason: initial?.interceptReason || '',
    handleMethod: initial?.handleMethod || '',
    fraudType: initial?.fraudType || '',
    reportCrisis: initial?.reportCrisis || false,
    cityCollab: initial?.cityCollab || false,
    interceptSuccess: initial?.interceptSuccess || false,
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
            <Field label="年份"><input type="number" className="input-std" value={form.reportYear} onChange={(e) => set('reportYear', Number(e.target.value))} /></Field>
            <Field label="月份"><input type="number" className="input-std" min={1} max={12} value={form.reportMonth} onChange={(e) => set('reportMonth', Number(e.target.value))} /></Field>
            <Field label="处理时间"><input type="date" className="input-std" value={form.handleTime} onChange={(e) => set('handleTime', e.target.value)} /></Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="骑手ID"><input className="input-std" value={form.riderId} onChange={(e) => set('riderId', e.target.value)} /></Field>
            <Field label="骑手姓名"><input className="input-std" value={form.riderName} onChange={(e) => set('riderName', e.target.value)} /></Field>
            <Field label="性别">
              <select className="input-std" value={form.gender} onChange={(e) => set('gender', e.target.value)}>
                <option value="男">男</option><option value="女">女</option>
              </select>
            </Field>
          </div>
          <Field label="城市"><input className="input-std" value={form.city} onChange={(e) => set('city', e.target.value)} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="身份证"><input className="input-std" value={form.idCard} onChange={(e) => set('idCard', e.target.value)} /></Field>
            <Field label="手机号"><input className="input-std" value={form.phone} onChange={(e) => set('phone', e.target.value)} /></Field>
          </div>
          <Field label="报案订单号"><input className="input-std" value={form.reportOrderNo} onChange={(e) => set('reportOrderNo', e.target.value)} /></Field>
          <Field label="出险时间"><input type="date" className="input-std" value={form.accidentTime} onChange={(e) => set('accidentTime', e.target.value)} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="险种">
              <select className="input-std" value={form.insuranceType} onChange={(e) => set('insuranceType', e.target.value)}>
                <option value="">请选择</option>
                {settings.insuranceTypes.map((t: string) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="事故方">
              <select className="input-std" value={form.accidentParty} onChange={(e) => set('accidentParty', e.target.value)}>
                <option value="">请选择</option>
                {settings.accidentParties.map((t: string) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
          </div>
          <Field label="事故描述"><textarea className="input-std min-h-14 resize-y" value={form.accidentDesc} onChange={(e) => set('accidentDesc', e.target.value)} /></Field>
          <Field label="估算损失(元)"><input type="number" className="input-std" value={form.estimatedLoss} onChange={(e) => set('estimatedLoss', e.target.value)} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="发现人ID"><input className="input-std" value={form.discovererId} onChange={(e) => set('discovererId', e.target.value)} /></Field>
            <Field label="发现人姓名"><input className="input-std" value={form.discovererName} onChange={(e) => set('discovererName', e.target.value)} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="处理人ID"><input className="input-std" value={form.handlerId} onChange={(e) => set('handlerId', e.target.value)} /></Field>
            <Field label="处理人姓名"><input className="input-std" value={form.handlerName} onChange={(e) => set('handlerName', e.target.value)} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="拦截类型">
              <select className="input-std" value={form.interceptType} onChange={(e) => set('interceptType', e.target.value)}>
                <option value="">请选择</option>
                {settings.interceptTypes.map((t: string) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="处理方式">
              <select className="input-std" value={form.handleMethod} onChange={(e) => set('handleMethod', e.target.value)}>
                <option value="">请选择</option>
                {settings.handleMethods.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
          </div>
          <Field label="拦截原因"><textarea className="input-std min-h-14 resize-y" value={form.interceptReason} onChange={(e) => set('interceptReason', e.target.value)} /></Field>
          <Field label="欺诈类型">
            <select className="input-std" value={form.fraudType} onChange={(e) => set('fraudType', e.target.value)}>
              <option value="">无</option>
              {settings.fraudTypes.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.reportCrisis as boolean} onChange={(e) => set('reportCrisis', e.target.checked)} /> 舆情汇报</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.cityCollab as boolean} onChange={(e) => set('cityCollab', e.target.checked)} /> 城市联动</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.interceptSuccess as boolean} onChange={(e) => set('interceptSuccess', e.target.checked)} /> 拦截成功</label>
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
function InterceptionDetail({ interception: i, onClose, maskIdCard, maskPhone }: {
  interception: Interception
  onClose: () => void
  maskIdCard: (v: string) => string
  maskPhone: (v: string) => string
}) {
  return (
    <div className="fixed inset-0 bg-black/30 flex items-start justify-center z-50 overflow-y-auto py-8">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-bold">拦截记录详情</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100"><XIcon size={18} /></button>
        </div>
        <div className="p-4 space-y-3">
          <DetailGrid label="年份/月份" value={`${i.reportYear}年${i.reportMonth}月`} />
          <DetailGrid label="处理时间" value={fmt(i.handleTime)} />
          <DetailGrid label="骑手" value={`${i.riderName} (${i.riderId})`} />
          <DetailGrid label="性别/城市" value={`${i.gender} / ${i.city}`} />
          <DetailGrid label="身份证" value={maskIdCard(i.idCard)} />
          <DetailGrid label="手机号" value={maskPhone(i.phone)} />
          <DetailGrid label="报案订单号" value={i.reportOrderNo} />
          <DetailGrid label="出险时间" value={i.accidentTime ? fmt(i.accidentTime) : '-'} />
          <DetailGrid label="险种/事故方" value={`${i.insuranceType} / ${i.accidentParty}`} />
          <DetailGrid label="事故描述" value={i.accidentDesc} full />
          <DetailGrid label="估算损失" value={i.estimatedLoss ? `¥${i.estimatedLoss}` : '-'} />
          <DetailGrid label="发现人/处理人" value={`${i.discovererName} / ${i.handlerName}`} />
          <DetailGrid label="拦截类型" value={i.interceptType} />
          <DetailGrid label="拦截原因" value={i.interceptReason} full />
          <DetailGrid label="处理方式" value={i.handleMethod} />
          <DetailGrid label="欺诈类型" value={i.fraudType || '无'} />
          <DetailGrid label="舆情/联动/成功" value={`${i.reportCrisis ? '是' : '否'} / ${i.cityCollab ? '是' : '否'} / ${i.interceptSuccess ? '是' : '否'}`} />
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
