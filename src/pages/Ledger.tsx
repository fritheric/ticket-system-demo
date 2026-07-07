import React, { useState, useMemo, useCallback } from 'react'
import { useStore } from '../store/useStore'
import type { Ticket, Interception, IncidentRecord, MajorCase, User, SystemSettings } from '../types'
import {
  FileText,
  ShieldAlert,
  AlertTriangle,
  FileWarning,
  ArrowRightLeft,
  Search,
  X,
  Plus,
} from 'lucide-react'

const BRAND = '#00A6FF'

type LedgerModule = 'tickets' | 'interceptions' | 'incidents' | 'majorCases'
type ConvertSource = 'ticket' | 'incident' | 'interception'
type CreateTarget = 'incident' | 'majorCase' | 'interception' | 'ticket'

/* ── date helpers ─────────────────────────────────────── */
function fmtDate(iso?: string): string {
  if (!iso) return '-'
  return new Date(iso).toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

function fmtShort(iso?: string): string {
  if (!iso) return '-'
  return new Date(iso).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/* ── Modal shell ──────────────────────────────────────── */
function Modal({
  open, onClose, title, children,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}): React.ReactElement | null {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100"><X size={20} /></button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-4">{children}</div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }): React.ReactElement {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      {children}
    </div>
  )
}

/* ── Stat Card ────────────────────────────────────────── */
function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }): React.ReactElement {
  return (
    <div className="bg-white rounded-xl shadow p-5 flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white" style={{ background: BRAND }}>
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-800">{value}</div>
        <div className="text-sm text-gray-500">{label}</div>
      </div>
    </div>
  )
}

/* ── Shared field renderers (used by both Create & Convert) ── */

interface IncidentFormFields {
  insuranceType: string; riderId: string; riderName: string;
  gender: '男' | '女'; city: string; idCard: string; phone: string;
  orderNo: string; accidentDate: string; accidentTimeVal: string;
  reportDate: string; reportTime: string; location: string;
  accidentDesc: string; injuryDesc: string; vehicleType: string;
  isDeath: boolean; liability: string; violation: string;
  otherInjury: string; otherPerson: string; otherVehicle: string;
  cause: string; accidentType: string;
  isSupplier: boolean; isCancel: boolean; isContacted: boolean;
}

interface MajorCaseFormFields {
  riderId: string; riderName: string; gender: '男' | '女';
  city: string; idCard: string; phone: string;
  reportOrderNo: string; accidentTime: string;
  insuranceType: string; accidentParty: string;
  accidentDesc: string; caseType: string; stage: string;
}

interface InterceptionFormFields {
  reportYear: number; reportMonth: number; handleTime: string;
  riderId: string; riderName: string; gender: '男' | '女';
  city: string; idCard: string; phone: string;
  reportOrderNo: string; accidentTime: string;
  insuranceType: string; accidentParty: string;
  accidentDesc: string; estimatedLoss: number;
  interceptType: string; interceptReason: string;
  handleMethod: string; fraudType: string;
  reportCrisis: boolean; cityCollab: boolean; cityCollabResult: string; interceptSuccess: boolean;
}

interface IncidentRendererProps {
  fields: Partial<IncidentFormFields>
  set: (k: keyof IncidentFormFields, v: string | number | boolean) => void
  settings: SystemSettings
}

function IncidentFields({ fields, set, settings }: IncidentRendererProps): React.ReactElement {
  return (
    <>
      <div className="grid grid-cols-3 gap-3">
        <Field label="骑手ID"><input className="input-std" value={fields.riderId || ''} onChange={(e) => set('riderId', e.target.value)} /></Field>
        <Field label="骑手姓名"><input className="input-std" value={fields.riderName || ''} onChange={(e) => set('riderName', e.target.value)} /></Field>
        <Field label="性别">
          <select className="input-std" value={fields.gender || '男'} onChange={(e) => set('gender', e.target.value)}>
            <option value="男">男</option><option value="女">女</option>
          </select>
        </Field>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Field label="城市"><input className="input-std" value={fields.city || ''} onChange={(e) => set('city', e.target.value)} /></Field>
        <Field label="身份证"><input className="input-std" value={fields.idCard || ''} onChange={(e) => set('idCard', e.target.value)} /></Field>
        <Field label="手机号"><input className="input-std" value={fields.phone || ''} onChange={(e) => set('phone', e.target.value)} /></Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="险种">
          <select className="input-std" value={fields.insuranceType || ''} onChange={(e) => set('insuranceType', e.target.value)}>
            <option value="">请选择</option>
            {settings.insuranceTypes.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="订单号"><input className="input-std" value={fields.orderNo || ''} onChange={(e) => set('orderNo', e.target.value)} /></Field>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Field label="出险日期"><input type="date" className="input-std" value={fields.accidentDate || ''} onChange={(e) => set('accidentDate', e.target.value)} /></Field>
        <Field label="出险时间"><input className="input-std" placeholder="如 14:30" value={fields.accidentTimeVal || ''} onChange={(e) => set('accidentTimeVal', e.target.value)} /></Field>
        <Field label="出险地点"><input className="input-std" value={fields.location || ''} onChange={(e) => set('location', e.target.value)} /></Field>
      </div>
      <Field label="事故描述"><textarea className="input-std min-h-12 resize-y" value={fields.accidentDesc || ''} onChange={(e) => set('accidentDesc', e.target.value)} /></Field>
      <Field label="受伤描述"><textarea className="input-std min-h-12 resize-y" value={fields.injuryDesc || ''} onChange={(e) => set('injuryDesc', e.target.value)} /></Field>
      <Field label="车辆类型"><input className="input-std" value={fields.vehicleType || ''} onChange={(e) => set('vehicleType', e.target.value)} /></Field>
      <div className="grid grid-cols-3 gap-3">
        <Field label="事故原因">
          <select className="input-std" value={fields.cause || ''} onChange={(e) => set('cause', e.target.value)}>
            <option value="">请选择</option>
            {settings.causes.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="事故类型">
          <select className="input-std" value={fields.accidentType || ''} onChange={(e) => set('accidentType', e.target.value)}>
            <option value="">请选择</option>
            {settings.accidentTypes.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="责任认定">
          <select className="input-std" value={fields.liability || ''} onChange={(e) => set('liability', e.target.value)}>
            <option value="">请选择</option>
            {settings.liabilities.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Field label="违反交规"><input className="input-std" value={fields.violation || ''} onChange={(e) => set('violation', e.target.value)} placeholder="无则留空" /></Field>
        <Field label="对方伤亡"><input className="input-std" value={fields.otherInjury || ''} onChange={(e) => set('otherInjury', e.target.value)} placeholder="无则留空" /></Field>
        <Field label="对方人员"><input className="input-std" value={fields.otherPerson || ''} onChange={(e) => set('otherPerson', e.target.value)} placeholder="无则留空" /></Field>
      </div>
      <Field label="对方车辆"><input className="input-std" value={fields.otherVehicle || ''} onChange={(e) => set('otherVehicle', e.target.value)} placeholder="无则留空" /></Field>
      <div className="flex gap-6 flex-wrap">
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!fields.isDeath} onChange={(e) => set('isDeath', e.target.checked)} /> 是否死亡</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!fields.isSupplier} onChange={(e) => set('isSupplier', e.target.checked)} /> 增值商维修</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!fields.isCancel} onChange={(e) => set('isCancel', e.target.checked)} /> 是否销案</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!fields.isContacted} onChange={(e) => set('isContacted', e.target.checked)} /> 是否联系</label>
      </div>
    </>
  )
}

function MajorCaseFields({ fields, set, settings }: { fields: Partial<MajorCaseFormFields>; set: (k: keyof MajorCaseFormFields, v: string | number | boolean) => void; settings: SystemSettings }): React.ReactElement {
  return (
    <>
      <div className="grid grid-cols-3 gap-3">
        <Field label="骑手ID"><input className="input-std" value={fields.riderId || ''} onChange={(e) => set('riderId', e.target.value)} /></Field>
        <Field label="骑手姓名"><input className="input-std" value={fields.riderName || ''} onChange={(e) => set('riderName', e.target.value)} /></Field>
        <Field label="性别">
          <select className="input-std" value={fields.gender || '男'} onChange={(e) => set('gender', e.target.value)}>
            <option value="男">男</option><option value="女">女</option>
          </select>
        </Field>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Field label="城市"><input className="input-std" value={fields.city || ''} onChange={(e) => set('city', e.target.value)} /></Field>
        <Field label="身份证"><input className="input-std" value={fields.idCard || ''} onChange={(e) => set('idCard', e.target.value)} /></Field>
        <Field label="手机号"><input className="input-std" value={fields.phone || ''} onChange={(e) => set('phone', e.target.value)} /></Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="险种">
          <select className="input-std" value={fields.insuranceType || ''} onChange={(e) => set('insuranceType', e.target.value)}>
            <option value="">请选择</option>
            {settings.insuranceTypes.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="事故方">
          <select className="input-std" value={fields.accidentParty || ''} onChange={(e) => set('accidentParty', e.target.value)}>
            <option value="">请选择</option>
            {settings.accidentParties.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="出险时间"><input type="date" className="input-std" value={fields.accidentTime || ''} onChange={(e) => set('accidentTime', e.target.value)} /></Field>
        <Field label="报案订单号"><input className="input-std" value={fields.reportOrderNo || ''} onChange={(e) => set('reportOrderNo', e.target.value)} /></Field>
      </div>
      <Field label="事故描述"><textarea className="input-std min-h-12 resize-y" value={fields.accidentDesc || ''} onChange={(e) => set('accidentDesc', e.target.value)} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="案件类型">
          <select className="input-std" value={fields.caseType || ''} onChange={(e) => set('caseType', e.target.value)}>
            <option value="">请选择</option>
            {settings.caseTypes.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="阶段">
          <select className="input-std" value={fields.stage || '发现'} onChange={(e) => set('stage', e.target.value)}>
            {settings.stages.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
      </div>
    </>
  )
}

function InterceptionFields({ fields, set, settings }: { fields: Partial<InterceptionFormFields>; set: (k: keyof InterceptionFormFields, v: string | number | boolean) => void; settings: SystemSettings }): React.ReactElement {
  return (
    <>
      <div className="grid grid-cols-3 gap-3">
        <Field label="年份"><input type="number" className="input-std" value={fields.reportYear || new Date().getFullYear()} onChange={(e) => set('reportYear', Number(e.target.value))} /></Field>
        <Field label="月份"><input type="number" className="input-std" min={1} max={12} value={fields.reportMonth || new Date().getMonth() + 1} onChange={(e) => set('reportMonth', Number(e.target.value))} /></Field>
        <Field label="处理时间"><input type="date" className="input-std" value={fields.handleTime || ''} onChange={(e) => set('handleTime', e.target.value)} /></Field>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Field label="骑手ID"><input className="input-std" value={fields.riderId || ''} onChange={(e) => set('riderId', e.target.value)} /></Field>
        <Field label="骑手姓名"><input className="input-std" value={fields.riderName || ''} onChange={(e) => set('riderName', e.target.value)} /></Field>
        <Field label="性别">
          <select className="input-std" value={fields.gender || '男'} onChange={(e) => set('gender', e.target.value)}>
            <option value="男">男</option><option value="女">女</option>
          </select>
        </Field>
      </div>
      <Field label="城市"><input className="input-std" value={fields.city || ''} onChange={(e) => set('city', e.target.value)} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="身份证"><input className="input-std" value={fields.idCard || ''} onChange={(e) => set('idCard', e.target.value)} /></Field>
        <Field label="手机号"><input className="input-std" value={fields.phone || ''} onChange={(e) => set('phone', e.target.value)} /></Field>
      </div>
      <Field label="报案订单号"><input className="input-std" value={fields.reportOrderNo || ''} onChange={(e) => set('reportOrderNo', e.target.value)} /></Field>
      <Field label="出险时间"><input type="date" className="input-std" value={fields.accidentTime || ''} onChange={(e) => set('accidentTime', e.target.value)} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="险种">
          <select className="input-std" value={fields.insuranceType || ''} onChange={(e) => set('insuranceType', e.target.value)}>
            <option value="">请选择</option>
            {settings.insuranceTypes.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="事故方">
          <select className="input-std" value={fields.accidentParty || ''} onChange={(e) => set('accidentParty', e.target.value)}>
            <option value="">请选择</option>
            {settings.accidentParties.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
      </div>
      <Field label="事故描述"><textarea className="input-std min-h-12 resize-y" value={fields.accidentDesc || ''} onChange={(e) => set('accidentDesc', e.target.value)} /></Field>
      <Field label="估算损失(元)"><input type="number" className="input-std" value={fields.estimatedLoss || 0} onChange={(e) => set('estimatedLoss', e.target.value)} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="拦截类型">
          <select className="input-std" value={fields.interceptType || ''} onChange={(e) => set('interceptType', e.target.value)}>
            <option value="">请选择</option>
            {settings.interceptTypes.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="处理方式">
          <select className="input-std" value={fields.handleMethod || ''} onChange={(e) => set('handleMethod', e.target.value)}>
            <option value="">请选择</option>
            {settings.handleMethods.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
      </div>
      <Field label="拦截原因"><textarea className="input-std min-h-12 resize-y" value={fields.interceptReason || ''} onChange={(e) => set('interceptReason', e.target.value)} /></Field>
      <Field label="城市协同处理结果"><textarea className="input-std min-h-12 resize-y" value={fields.cityCollabResult || ''} onChange={(e) => set('cityCollabResult', e.target.value)} placeholder="城市协同后的反馈结果" /></Field>
      <div className="flex gap-6 flex-wrap">
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!fields.reportCrisis} onChange={(e) => set('reportCrisis', e.target.checked)} /> 舆情汇报</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!fields.cityCollab} onChange={(e) => set('cityCollab', e.target.checked)} /> 城市联动</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!fields.interceptSuccess} onChange={(e) => set('interceptSuccess', e.target.checked)} /> 拦截成功</label>
      </div>
    </>
  )
}

/* ── Ticket form fields ──────────────────────────────── */
interface TicketFormFields {
  riderId: string; riderName: string; riderCity: string;
  caseOrderNo: string;
  title: string; caseType: ('意外' | '三者')[];
  caseDesc: string; priority: 'low' | 'medium' | 'high' | 'urgent';
  responsiblePersonId: string; responsiblePersonName: string;
}

function TicketFields({ fields, set, users }: {
  fields: Partial<TicketFormFields>
  set: (k: keyof TicketFormFields, v: string | number | boolean | ('意外' | '三者')[]) => void
  users: User[]
}): React.ReactElement {
  const specialistOptions = useMemo(
    () => users.filter((u) => !u.isDeleted && !u.isLocked),
    [users],
  )
  function toggleCaseType(val: string): void {
    const arr: ('意外' | '三者')[] = (fields.caseType as ('意外' | '三者')[]) || []
    set('caseType', arr.includes(val as '意外' | '三者') ? arr.filter((x) => x !== val) : [...arr, val as '意外' | '三者'])
  }
  return (
    <>
      <div className="grid grid-cols-3 gap-3">
        <Field label="骑手ID"><input className="input-std" value={fields.riderId || ''} onChange={(e) => set('riderId', e.target.value)} /></Field>
        <Field label="骑手姓名"><input className="input-std" value={fields.riderName || ''} onChange={(e) => set('riderName', e.target.value)} /></Field>
        <Field label="城市"><input className="input-std" value={fields.riderCity || ''} onChange={(e) => set('riderCity', e.target.value)} /></Field>
      </div>
      <Field label="关联案件/订单号"><input className="input-std" value={fields.caseOrderNo || ''} onChange={(e) => set('caseOrderNo', e.target.value)} /></Field>
      <Field label="标题"><input className="input-std" value={fields.title || ''} onChange={(e) => set('title', e.target.value)} /></Field>
      <Field label="案件类型">
        <div className="flex gap-4">
          {(['意外', '三者'] as const).map((t) => (
            <label key={t} className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={(fields.caseType || []).includes(t)} onChange={() => toggleCaseType(t)} /> {t}
            </label>
          ))}
        </div>
      </Field>
      <Field label="描述"><textarea className="input-std min-h-12 resize-y" value={fields.caseDesc || ''} onChange={(e) => set('caseDesc', e.target.value)} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="优先级">
          <select className="input-std" value={fields.priority || 'medium'} onChange={(e) => set('priority', e.target.value)}>
            <option value="low">低</option><option value="medium">中</option><option value="high">高</option><option value="urgent">紧急</option>
          </select>
        </Field>
        <Field label="负责人">
          <select className="input-std" value={fields.responsiblePersonId || ''} onChange={(e) => {
            const u = specialistOptions.find((x) => x.id === e.target.value)
            set('responsiblePersonId', e.target.value)
            set('responsiblePersonName', u?.name || '')
          }}>
            <option value="">请选择</option>
            {specialistOptions.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </Field>
      </div>
    </>
  )
}

/* ── Create Modal ─────────────────────────────────────── */

interface CreateModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (targetType: CreateTarget, form: Record<string, unknown>) => void
  settings: SystemSettings
}

function CreateFormModal({ open, onClose, onSubmit, settings }: CreateModalProps): React.ReactElement | null {
  const { users } = useStore()
  const [targetType, setTargetType] = useState<CreateTarget>('incident')

  const [incident, setIncident] = useState<Partial<IncidentFormFields>>({
    insuranceType: '', riderId: '', riderName: '', gender: '男',
    city: '', idCard: '', phone: '', orderNo: '',
    accidentDate: '', accidentTimeVal: '',
    reportDate: todayStr(), reportTime: '',
    location: '', accidentDesc: '', injuryDesc: '',
    vehicleType: '', isDeath: false, liability: '',
    violation: '', otherInjury: '', otherPerson: '', otherVehicle: '',
    cause: '', accidentType: '', isSupplier: false,
    isCancel: false, isContacted: false,
  })
  const [majorCase, setMajorCase] = useState<Partial<MajorCaseFormFields>>({
    riderId: '', riderName: '', gender: '男', city: '',
    idCard: '', phone: '', reportOrderNo: '', accidentTime: '',
    insuranceType: '', accidentParty: '', accidentDesc: '',
    caseType: '', stage: '发现',
  })
  const [interception, setInterception] = useState<Partial<InterceptionFormFields>>({
    reportYear: new Date().getFullYear(), reportMonth: new Date().getMonth() + 1,
    handleTime: todayStr(), riderId: '', riderName: '', gender: '男',
    city: '', idCard: '', phone: '', reportOrderNo: '',
    accidentTime: '', insuranceType: '', accidentParty: '', accidentDesc: '',
    estimatedLoss: 0, interceptType: '', interceptReason: '',
    handleMethod: '', fraudType: '', reportCrisis: false,
    cityCollab: false, interceptSuccess: false,
  })
  const [ticket, setTicket] = useState<Partial<TicketFormFields>>({
    riderId: '', riderName: '', riderCity: '', caseOrderNo: '',
    title: '', caseType: [], caseDesc: '', priority: 'medium',
    responsiblePersonId: '', responsiblePersonName: '',
  })

  const setI = useCallback((k: keyof IncidentFormFields, v: string | number | boolean) => {
    setIncident((prev) => ({ ...prev, [k]: v }))
  }, [])
  const setM = useCallback((k: keyof MajorCaseFormFields, v: string | number | boolean) => {
    setMajorCase((prev) => ({ ...prev, [k]: v }))
  }, [])
  const setInter = useCallback((k: keyof InterceptionFormFields, v: string | number | boolean) => {
    setInterception((prev) => ({ ...prev, [k]: v }))
  }, [])
  const setT = useCallback((k: keyof TicketFormFields, v: string | number | boolean | ('意外' | '三者')[]) => {
    setTicket((prev) => ({ ...prev, [k]: v }))
  }, [])

  const labels: Record<CreateTarget, string> = { incident: '出险记录', interception: '拦截记录', majorCase: '重大案件', ticket: '工单' }

  function handleSubmit(): void {
    if (targetType === 'incident') onSubmit('incident', { ...incident })
    else if (targetType === 'majorCase') onSubmit('majorCase', { ...majorCase })
    else if (targetType === 'interception') onSubmit('interception', { ...interception })
    else onSubmit('ticket', { ...ticket })
  }

  return (
    <Modal open={open} onClose={onClose} title="新建记录">
      <div className="space-y-3">
        {/* Type selector */}
        <div className="flex gap-2 flex-wrap">
          {(['incident', 'interception', 'majorCase', 'ticket'] as CreateTarget[]).map((t) => (
            <button
              key={t}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${targetType === t ? 'text-white border-transparent' : 'text-gray-600'}`}
              style={targetType === t ? { background: BRAND } : {}}
              onClick={() => setTargetType(t)}
            >
              {labels[t]}
            </button>
          ))}
        </div>

        {targetType === 'ticket' && <TicketFields fields={ticket} set={setT} users={users} />}
        {targetType === 'incident' && <IncidentFields fields={incident} set={setI} settings={settings} />}
        {targetType === 'majorCase' && <MajorCaseFields fields={majorCase} set={setM} settings={settings} />}
        {targetType === 'interception' && <InterceptionFields fields={interception} set={setInter} settings={settings} />}
      </div>
      <div className="flex justify-end gap-3 mt-6">
        <button onClick={onClose} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">取消</button>
        <button onClick={handleSubmit} className="px-4 py-2 rounded-lg text-white text-sm" style={{ background: BRAND }}>确认创建</button>
      </div>
    </Modal>
  )
}

/* ── Convert Modal ────────────────────────────────────── */

interface ConvertModalProps {
  source: ConvertSource
  defaults: Partial<IncidentFormFields & MajorCaseFormFields & InterceptionFormFields>
  onClose: () => void
  onSubmit: (
    targetType: 'incident' | 'majorCase' | 'interception',
    form: Partial<IncidentFormFields & MajorCaseFormFields & InterceptionFormFields>,
  ) => void
  settings: SystemSettings
}

function ConvertFormModal({
  source, defaults, onClose, onSubmit, settings,
}: ConvertModalProps): React.ReactElement {
  const [targetType, setTargetType] = useState<'incident' | 'majorCase' | 'interception'>(
    source === 'ticket' ? 'incident' : source === 'incident' ? 'majorCase' : 'incident',
  )
  const [incident, setIncident] = useState<Partial<IncidentFormFields>>({
    insuranceType: defaults.insuranceType || '', riderId: defaults.riderId || '',
    riderName: defaults.riderName || '', gender: defaults.gender || '男',
    city: defaults.city || '', idCard: defaults.idCard || '', phone: defaults.phone || '',
    orderNo: defaults.orderNo || defaults.reportOrderNo || '',
    accidentDate: defaults.accidentDate || '', accidentTimeVal: defaults.accidentTimeVal || '',
    reportDate: defaults.reportDate || todayStr(), reportTime: defaults.reportTime || '',
    location: defaults.location || '', accidentDesc: defaults.accidentDesc || '',
    injuryDesc: defaults.injuryDesc || '', vehicleType: defaults.vehicleType || '',
    isDeath: defaults.isDeath || false, liability: defaults.liability || '',
    violation: defaults.violation || '', otherInjury: defaults.otherInjury || '',
    otherPerson: defaults.otherPerson || '', otherVehicle: defaults.otherVehicle || '',
    cause: defaults.cause || '', accidentType: defaults.accidentType || '',
    isSupplier: defaults.isSupplier || false, isCancel: defaults.isCancel || false,
    isContacted: defaults.isContacted || false,
  })
  const [majorCase, setMajorCase] = useState<Partial<MajorCaseFormFields>>({
    riderId: defaults.riderId || '', riderName: defaults.riderName || '',
    gender: defaults.gender || '男', city: defaults.city || '',
    idCard: defaults.idCard || '', phone: defaults.phone || '',
    reportOrderNo: defaults.reportOrderNo || defaults.orderNo || '',
    accidentTime: defaults.accidentTime || '',
    insuranceType: defaults.insuranceType || '', accidentParty: defaults.accidentParty || '',
    accidentDesc: defaults.accidentDesc || '', caseType: defaults.caseType || '',
    stage: defaults.stage || '发现',
  })
  const [interception, setInterception] = useState<Partial<InterceptionFormFields>>({
    reportYear: defaults.reportYear || new Date().getFullYear(),
    reportMonth: defaults.reportMonth || new Date().getMonth() + 1,
    handleTime: defaults.handleTime || todayStr(),
    riderId: defaults.riderId || '', riderName: defaults.riderName || '',
    gender: defaults.gender || '男', city: defaults.city || '',
    idCard: defaults.idCard || '', phone: defaults.phone || '',
    reportOrderNo: defaults.reportOrderNo || defaults.orderNo || '',
    accidentTime: defaults.accidentTime || '',
    insuranceType: defaults.insuranceType || '', accidentParty: defaults.accidentParty || '',
    accidentDesc: defaults.accidentDesc || '',
    estimatedLoss: defaults.estimatedLoss || 0,
    interceptType: defaults.interceptType || '', interceptReason: defaults.interceptReason || '',
    handleMethod: defaults.handleMethod || '', fraudType: defaults.fraudType || '',
    reportCrisis: defaults.reportCrisis || false, cityCollab: defaults.cityCollab || false,
    interceptSuccess: defaults.interceptSuccess || false,
  })

  const setI = useCallback((k: keyof IncidentFormFields, v: string | number | boolean) => {
    setIncident((prev) => ({ ...prev, [k]: v }))
  }, [])
  const setM = useCallback((k: keyof MajorCaseFormFields, v: string | number | boolean) => {
    setMajorCase((prev) => ({ ...prev, [k]: v }))
  }, [])
  const setInter = useCallback((k: keyof InterceptionFormFields, v: string | number | boolean) => {
    setInterception((prev) => ({ ...prev, [k]: v }))
  }, [])

  const targetLabel = targetType === 'incident' ? '出险记录' : targetType === 'majorCase' ? '重大案件' : '拦截记录'

  function handleSubmit(): void {
    if (targetType === 'incident') onSubmit('incident', incident)
    else if (targetType === 'majorCase') onSubmit('majorCase', majorCase)
    else onSubmit('interception', interception)
  }

  return (
    <Modal open onClose={onClose} title={`转为${targetLabel}`}>
      <div className="space-y-3">
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-700">
          源记录字段已自动填充，请核对并补充必要信息后提交。
        </div>
        {source === 'incident' && (
          <div className="flex gap-2">
            <button
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${targetType === 'majorCase' ? 'text-white border-transparent' : 'text-gray-600'}`}
              style={targetType === 'majorCase' ? { background: BRAND } : {}}
              onClick={() => setTargetType('majorCase')}
            >重大案件</button>
            <button
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${targetType === 'interception' ? 'text-white border-transparent' : 'text-gray-600'}`}
              style={targetType === 'interception' ? { background: BRAND } : {}}
              onClick={() => setTargetType('interception')}
            >拦截记录</button>
          </div>
        )}
        {targetType === 'incident' && <IncidentFields fields={incident} set={setI} settings={settings} />}
        {targetType === 'majorCase' && <MajorCaseFields fields={majorCase} set={setM} settings={settings} />}
        {targetType === 'interception' && <InterceptionFields fields={interception} set={setInter} settings={settings} />}
      </div>
      <div className="flex justify-end gap-3 mt-6">
        <button onClick={onClose} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">取消</button>
        <button onClick={handleSubmit} className="px-4 py-2 rounded-lg text-white text-sm" style={{ background: BRAND }}>确认转换</button>
      </div>
    </Modal>
  )
}

/* ── Main Ledger Page ─────────────────────────────────── */
const MODULE_LABELS: Record<LedgerModule, string> = {
  tickets: '工单记录',
  interceptions: '拦截记录',
  incidents: '出险记录',
  majorCases: '重大案件',
}

const MODULE_ICONS: Record<LedgerModule, React.ReactNode> = {
  tickets: <FileText size={20} />,
  interceptions: <ShieldAlert size={20} />,
  incidents: <FileWarning size={20} />,
  majorCases: <AlertTriangle size={20} />,
}

export default function Ledger(): React.ReactElement {
  const {
    tickets, interceptions, incidents, majorCases, users,
    currentUser, settings,
    createTicket, createIncident, createMajorCase, createInterception,
  } = useStore()

  const isManager = currentUser?.role === 'admin' || currentUser?.role === 'supervisor'

  const [activeModule, setActiveModule] = useState<LedgerModule>('tickets')
  const [filterSpecialistId, setFilterSpecialistId] = useState<string>(currentUser?.id || '')
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)

  interface ConvertState {
    open: boolean
    source: ConvertSource
    defaults: Partial<IncidentFormFields & MajorCaseFormFields & InterceptionFormFields>
  }
  const [convertState, setConvertState] = useState<ConvertState>({ open: false, source: 'ticket', defaults: {} })

  const specialistOptions: User[] = useMemo(
    () => users.filter((u) => !u.isDeleted && !u.isLocked),
    [users],
  )

  /* Filter data */
  function filterTickets(list: Ticket[]): Ticket[] {
    if (isManager) { if (filterSpecialistId) return list.filter((t) => t.creatorId === filterSpecialistId); return list }
    const uid = currentUser?.id || ''
    return list.filter((t) => t.creatorId === uid)
  }
  function filterInterceptions(list: Interception[]): Interception[] {
    if (isManager) { if (filterSpecialistId) return list.filter((i) => i.discovererId === filterSpecialistId); return list }
    const uid = currentUser?.id || ''
    return list.filter((i) => i.discovererId === uid)
  }
  function filterIncidents(list: IncidentRecord[]): IncidentRecord[] {
    if (isManager) { if (filterSpecialistId) return list.filter((i) => i.creatorId === filterSpecialistId); return list }
    const uid = currentUser?.id || ''
    return list.filter((i) => i.creatorId === uid)
  }
  function filterMajorCases(list: MajorCase[]): MajorCase[] {
    if (isManager) { if (filterSpecialistId) return list.filter((m) => m.creatorId === filterSpecialistId); return list }
    const uid = currentUser?.id || ''
    return list.filter((m) => m.creatorId === uid)
  }

  const filteredTickets = useMemo(() => filterTickets(tickets.filter((t) => !t.isDeleted)), [tickets, isManager, filterSpecialistId, currentUser?.id])
  const filteredInterceptions = useMemo(() => filterInterceptions(interceptions.filter((i) => !i.isDeleted)), [interceptions, isManager, filterSpecialistId, currentUser?.id])
  const filteredIncidents = useMemo(() => filterIncidents(incidents.filter((i) => !i.isDeleted)), [incidents, isManager, filterSpecialistId, currentUser?.id])
  const filteredMajorCases = useMemo(() => filterMajorCases(majorCases.filter((m) => !m.isDeleted)), [majorCases, isManager, filterSpecialistId, currentUser?.id])

  const stats = useMemo(() => ({
    tickets: filteredTickets.length, interceptions: filteredInterceptions.length,
    majorCases: filteredMajorCases.length, incidents: filteredIncidents.length,
  }), [filteredTickets, filteredInterceptions, filteredMajorCases, filteredIncidents])

  /* Search */
  function searchTickets(list: Ticket[], q: string): Ticket[] {
    if (!q) return list; const lower = q.toLowerCase()
    return list.filter((t) => t.ticketNo.toLowerCase().includes(lower) || t.riderName.toLowerCase().includes(lower) || t.title.toLowerCase().includes(lower))
  }
  function searchInterceptions(list: Interception[], q: string): Interception[] {
    if (!q) return list; const lower = q.toLowerCase()
    return list.filter((i) => i.riderName.toLowerCase().includes(lower) || i.reportOrderNo.toLowerCase().includes(lower))
  }
  function searchIncidents(list: IncidentRecord[], q: string): IncidentRecord[] {
    if (!q) return list; const lower = q.toLowerCase()
    return list.filter((i) => i.riderName.toLowerCase().includes(lower) || i.orderNo.toLowerCase().includes(lower) || i.phone.toLowerCase().includes(lower))
  }
  function searchMajorCases(list: MajorCase[], q: string): MajorCase[] {
    if (!q) return list; const lower = q.toLowerCase()
    return list.filter((m) => m.caseNo.toLowerCase().includes(lower) || m.riderName.toLowerCase().includes(lower))
  }

  const displayTickets = useMemo(() => searchTickets(filteredTickets, search.trim()), [filteredTickets, search])
  const displayInterceptions = useMemo(() => searchInterceptions(filteredInterceptions, search.trim()), [filteredInterceptions, search])
  const displayIncidents = useMemo(() => searchIncidents(filteredIncidents, search.trim()), [filteredIncidents, search])
  const displayMajorCases = useMemo(() => searchMajorCases(filteredMajorCases, search.trim()), [filteredMajorCases, search])

  /* Convert handlers */
  function openConvertTicket(ticket: Ticket): void {
    setConvertState({ open: true, source: 'ticket', defaults: {
      riderId: ticket.riderId, riderName: ticket.riderName, city: ticket.riderCity,
      accidentDesc: ticket.caseDesc,
    }})
  }
  function openConvertIncidentToMajor(incident: IncidentRecord): void {
    setConvertState({ open: true, source: 'incident', defaults: {
      riderId: incident.riderId, riderName: incident.riderName, gender: incident.gender,
      city: incident.city, idCard: incident.idCard, phone: incident.phone,
      insuranceType: incident.insuranceType, orderNo: incident.orderNo,
      accidentTime: incident.accidentTimeVal, accidentDesc: incident.accidentDesc,
    }})
  }
  function openConvertIncidentToIntercept(incident: IncidentRecord): void {
    setConvertState({ open: true, source: 'incident', defaults: {
      riderId: incident.riderId, riderName: incident.riderName, gender: incident.gender,
      city: incident.city, idCard: incident.idCard, phone: incident.phone,
      insuranceType: incident.insuranceType, reportOrderNo: incident.orderNo,
      accidentTime: incident.accidentDate ? incident.accidentDate.slice(0, 10) : '',
      accidentDesc: incident.accidentDesc,
    }})
  }
  function openConvertInterception(interception: Interception): void {
    setConvertState({ open: true, source: 'interception', defaults: {
      riderId: interception.riderId, riderName: interception.riderName,
      gender: interception.gender, city: interception.city,
      idCard: interception.idCard, phone: interception.phone,
      insuranceType: interception.insuranceType, accidentParty: interception.accidentParty,
      accidentDesc: interception.accidentDesc,
      reportYear: interception.reportYear, reportMonth: interception.reportMonth,
      handleTime: interception.handleTime ? interception.handleTime.slice(0, 10) : '',
      reportOrderNo: interception.reportOrderNo,
      accidentTime: interception.accidentTime ? interception.accidentTime.slice(0, 10) : '',
      interceptType: interception.interceptType, interceptReason: interception.interceptReason,
      handleMethod: interception.handleMethod, fraudType: interception.fraudType || '',
      reportCrisis: interception.reportCrisis, cityCollab: interception.cityCollab,
      interceptSuccess: interception.interceptSuccess, estimatedLoss: interception.estimatedLoss,
    }})
  }

  function handleConvertSubmit(
    targetType: 'incident' | 'majorCase' | 'interception',
    form: Partial<IncidentFormFields & MajorCaseFormFields & InterceptionFormFields>,
  ): void {
    if (!currentUser) return
    if (targetType === 'incident') {
      const f = form as Partial<IncidentFormFields>
      createIncident({
        insuranceType: f.insuranceType || '', riderId: f.riderId || '', riderName: f.riderName || '',
        gender: f.gender || '男', city: f.city || '', idCard: f.idCard || '', phone: f.phone || '',
        orderNo: f.orderNo || '', accidentDate: f.accidentDate || '', accidentTimeVal: f.accidentTimeVal || '',
        reportDate: f.reportDate || todayStr(), reportTime: f.reportTime || '',
        location: f.location || '', accidentDesc: f.accidentDesc || '', injuryDesc: f.injuryDesc || '',
        vehicleType: f.vehicleType || '', isDeath: f.isDeath || false, liability: f.liability || '',
        violation: f.violation || '', otherInjury: f.otherInjury || '', otherPerson: f.otherPerson || '',
        otherVehicle: f.otherVehicle || '', cause: f.cause || '', accidentType: f.accidentType || '',
        isSupplier: f.isSupplier || false, isCancel: f.isCancel || false, isContacted: f.isContacted || false,
        creatorId: currentUser.id, creatorName: currentUser.name,
      })
    } else if (targetType === 'majorCase') {
      const f = form as Partial<MajorCaseFormFields>
      createMajorCase({
        riderId: f.riderId || '', riderName: f.riderName || '', gender: f.gender || '男',
        city: f.city || '', idCard: f.idCard || '', phone: f.phone || '',
        reportOrderNo: f.reportOrderNo || '', accidentTime: f.accidentTime || '',
        insuranceType: f.insuranceType || '', accidentParty: f.accidentParty || '',
        accidentDesc: f.accidentDesc || '', caseType: f.caseType || '', stage: f.stage || '发现',
        responsibleId: currentUser.id, responsibleName: currentUser.name,
        creatorId: currentUser.id, creatorName: currentUser.name,
      })
    } else {
      const f = form as Partial<InterceptionFormFields>
      createInterception({
        reportYear: f.reportYear || new Date().getFullYear(), reportMonth: f.reportMonth || new Date().getMonth() + 1,
        handleTime: f.handleTime || new Date().toISOString(), riderId: f.riderId || '',
        riderName: f.riderName || '', gender: f.gender || '男', city: f.city || '',
        idCard: f.idCard || '', phone: f.phone || '', reportOrderNo: f.reportOrderNo || '',
        accidentTime: f.accidentTime || '', insuranceType: f.insuranceType || '',
        accidentParty: f.accidentParty || '', accidentDesc: f.accidentDesc || '',
        estimatedLoss: f.estimatedLoss || 0, discovererId: currentUser.id,
        discovererName: currentUser.name, handlerId: currentUser.id, handlerName: currentUser.name,
        interceptType: f.interceptType || '', interceptReason: f.interceptReason || '',
        handleMethod: f.handleMethod || '', fraudType: f.fraudType || undefined,
        reportCrisis: f.reportCrisis || false, cityCollab: f.cityCollab || false,
        interceptSuccess: f.interceptSuccess || false,
      })
    }
    setConvertState({ open: false, source: 'ticket', defaults: {} })
  }

  /* ── Render ───────────────────────────────────────── */
  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <h1 className="text-2xl font-bold mb-6">个人台账</h1>

      {/* Stats cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard icon={<FileText size={20} />} label="工单数" value={stats.tickets} />
        <StatCard icon={<ShieldAlert size={20} />} label="拦截记录数" value={stats.interceptions} />
        <StatCard icon={<AlertTriangle size={20} />} label="重大案件数" value={stats.majorCases} />
        <StatCard icon={<FileWarning size={20} />} label="出险记录数" value={stats.incidents} />
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-xl shadow p-4 mb-4">
        <div className="flex items-center gap-4 flex-wrap">
          {/* New record button */}
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-sm font-medium shadow transition-colors hover:opacity-90"
            style={{ background: BRAND }}
          >
            <Plus size={16} /> 新建记录
          </button>

          {/* Module tabs */}
          <div className="flex gap-1">
            {(['tickets', 'interceptions', 'incidents', 'majorCases'] as LedgerModule[]).map((mod) => (
              <button
                key={mod}
                onClick={() => { setActiveModule(mod); setSearch('') }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeModule === mod ? 'text-white shadow' : 'text-gray-600 hover:bg-gray-100'
                }`}
                style={activeModule === mod ? { background: BRAND } : {}}
              >
                {MODULE_ICONS[mod]}
                {MODULE_LABELS[mod]}
                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${
                  activeModule === mod ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                }`}>
                  {stats[mod]}
                </span>
              </button>
            ))}
          </div>

          {/* Specialist filter */}
          {isManager && (
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm text-gray-500">查看专员：</span>
              <select value={filterSpecialistId} onChange={(e) => setFilterSpecialistId(e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm bg-white">
                <option value="">全部</option>
                {specialistOptions.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
          )}

          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索..." className="pl-8 pr-8 py-1.5 border rounded-lg text-sm w-48" />
            {search && (<button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"><X size={14} /></button>)}
          </div>
        </div>
      </div>

      {/* Data table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            {activeModule === 'tickets' && <tr>{['工单编号','标题','骑手','优先级','状态','对应负责人','工单创建人','创建时间','操作'].map((h) => <th key={h} className="px-4 py-3 text-left font-semibold whitespace-nowrap">{h}</th>)}</tr>}
            {activeModule === 'interceptions' && <tr>{['处置时间','骑手姓名','城市','拦截类型','预估损失','是否拦截成功','处置人','操作'].map((h) => <th key={h} className="px-4 py-3 text-left font-semibold whitespace-nowrap">{h}</th>)}</tr>}
            {activeModule === 'incidents' && <tr>{['保险类型','骑手姓名','性别','城市','订单号','出险日期','报险日期','是否死亡','交通责任','事故类型','是否供应商','是否撤销/放弃','是否联系','录入人','操作'].map((h) => <th key={h} className="px-4 py-3 text-left font-semibold whitespace-nowrap">{h}</th>)}</tr>}
            {activeModule === 'majorCases' && <tr>{['案件编号','骑手姓名','城市','案件类型','处理阶段','责任人','创建时间','操作'].map((h) => <th key={h} className="px-4 py-3 text-left font-semibold whitespace-nowrap">{h}</th>)}</tr>}
          </thead>
          <tbody>
            {activeModule === 'tickets' && displayTickets.length === 0 && <tr><td colSpan={9} className="text-center py-12 text-gray-400">暂无工单记录</td></tr>}
            {activeModule === 'interceptions' && displayInterceptions.length === 0 && <tr><td colSpan={8} className="text-center py-12 text-gray-400">暂无拦截记录</td></tr>}
            {activeModule === 'incidents' && displayIncidents.length === 0 && <tr><td colSpan={15} className="text-center py-12 text-gray-400">暂无出险记录</td></tr>}
            {activeModule === 'majorCases' && displayMajorCases.length === 0 && <tr><td colSpan={8} className="text-center py-12 text-gray-400">暂无重大案件</td></tr>}

            {/* Ticket rows */}
            {activeModule === 'tickets' && displayTickets.map((t) => (
              <tr key={t.id} className="border-t hover:bg-gray-50/50">
                <td className="px-4 py-2.5 font-mono text-xs">{t.ticketNo}</td>
                <td className="px-4 py-2.5 max-w-48 truncate">{t.title}</td>
                <td className="px-4 py-2.5">{t.riderName}</td>
                <td className="px-4 py-2.5"><PriorityBadge priority={t.priority} /></td>
                <td className="px-4 py-2.5"><StatusBadge status={t.status} /></td>
                <td className="px-4 py-2.5">{t.responsiblePersonName}</td>
                <td className="px-4 py-2.5">{t.creatorName}</td>
                <td className="px-4 py-2.5 text-gray-500 text-xs">{fmtDate(t.createdAt)}</td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-1 relative group">
                    <button className="p-1 rounded text-[#00A6FF] hover:bg-blue-50" title="转为..." onClick={() => openConvertTicket(t)}>
                      <ArrowRightLeft size={14} />
                    </button>
                    <div className="hidden group-hover:flex absolute top-full left-0 z-10 bg-white border rounded-lg shadow-lg py-1">
                      <button onClick={() => openConvertTicket(t)} className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 whitespace-nowrap">→ 出险记录</button>
                    </div>
                  </div>
                </td>
              </tr>
            ))}

            {/* Interception rows */}
            {activeModule === 'interceptions' && displayInterceptions.map((i) => (
              <tr key={i.id} className="border-t hover:bg-gray-50/50">
                <td className="px-4 py-2.5 text-xs">{fmtShort(i.handleTime)}</td>
                <td className="px-4 py-2.5">{i.riderName}</td>
                <td className="px-4 py-2.5">{i.city}</td>
                <td className="px-4 py-2.5">{i.interceptType}</td>
                <td className="px-4 py-2.5">{i.estimatedLoss ? `¥${i.estimatedLoss}` : '-'}</td>
                <td className="px-4 py-2.5">{i.interceptSuccess ? '✅ 成功' : '❌ 失败'}</td>
                <td className="px-4 py-2.5">{i.handlerName}</td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-1 relative group">
                    <button className="p-1 rounded text-[#00A6FF] hover:bg-blue-50" title="转为..." onClick={() => openConvertInterception(i)}>
                      <ArrowRightLeft size={14} />
                    </button>
                    <div className="hidden group-hover:flex absolute top-full left-0 z-10 bg-white border rounded-lg shadow-lg py-1">
                      <button onClick={() => openConvertInterception(i)} className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 whitespace-nowrap">→ 出险记录</button>
                    </div>
                  </div>
                </td>
              </tr>
            ))}

            {/* Incident rows */}
            {activeModule === 'incidents' && displayIncidents.map((i) => (
              <tr key={i.id} className="border-t hover:bg-gray-50/50">
                <td className="px-4 py-2.5">{i.insuranceType}</td>
                <td className="px-4 py-2.5">{i.riderName}</td>
                <td className="px-4 py-2.5">{i.gender}</td>
                <td className="px-4 py-2.5">{i.city}</td>
                <td className="px-4 py-2.5">{i.orderNo}</td>
                <td className="px-4 py-2.5 text-xs">{fmtShort(i.accidentDate)}</td>
                <td className="px-4 py-2.5 text-xs">{i.reportDate ? fmtShort(i.reportDate) : '-'}</td>
                <td className="px-4 py-2.5">{i.isDeath ? '⚠️ 是' : '否'}</td>
                <td className="px-4 py-2.5">{i.liability}</td>
                <td className="px-4 py-2.5">{i.accidentType}</td>
                <td className="px-4 py-2.5">{i.isSupplier ? '是' : '否'}</td>
                <td className="px-4 py-2.5">{i.isCancel ? '是' : '否'}</td>
                <td className="px-4 py-2.5">{i.isContacted ? '是' : '否'}</td>
                <td className="px-4 py-2.5">{i.creatorName}</td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-1 relative group">
                    <button className="p-1 rounded text-[#00A6FF] hover:bg-blue-50" title="转为..." onClick={() => openConvertIncidentToMajor(i)}>
                      <ArrowRightLeft size={14} />
                    </button>
                    <div className="hidden group-hover:flex absolute top-full left-0 z-10 bg-white border rounded-lg shadow-lg py-1">
                      <button onClick={() => openConvertIncidentToMajor(i)} className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 whitespace-nowrap">→ 重大案件</button>
                      <button onClick={() => openConvertIncidentToIntercept(i)} className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 whitespace-nowrap">→ 拦截记录</button>
                    </div>
                  </div>
                </td>
              </tr>
            ))}

            {/* MajorCase rows */}
            {activeModule === 'majorCases' && displayMajorCases.map((m) => (
              <tr key={m.id} className="border-t hover:bg-gray-50/50">
                <td className="px-4 py-2.5 font-mono text-xs">{m.caseNo}</td>
                <td className="px-4 py-2.5">{m.riderName}</td>
                <td className="px-4 py-2.5">{m.city}</td>
                <td className="px-4 py-2.5">{m.caseType}</td>
                <td className="px-4 py-2.5">{m.stage}</td>
                <td className="px-4 py-2.5">{m.responsibleName}</td>
                <td className="px-4 py-2.5 text-gray-500 text-xs">{fmtDate(m.createdAt)}</td>
                <td className="px-4 py-2.5 text-gray-400">-</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Convert Modal */}
      {convertState.open && (
        <ConvertFormModal source={convertState.source} defaults={convertState.defaults}
          settings={settings} onClose={() => setConvertState({ open: false, source: 'ticket', defaults: {} })}
          onSubmit={handleConvertSubmit} />
      )}

      {/* Create Modal */}
      <CreateFormModal open={createOpen} settings={settings} onClose={() => setCreateOpen(false)}
        onSubmit={(targetType, form) => {
          if (!currentUser) return
          if (targetType === 'ticket') {
            const f = form as Partial<TicketFormFields>
            createTicket({
              riderId: f.riderId || '', riderName: f.riderName || '', riderCity: f.riderCity || '',
              caseOrderNo: f.caseOrderNo || '',
              title: f.title || '', caseType: (f.caseType || []) as ('意外' | '三者')[],
              caseDesc: f.caseDesc || '', priority: f.priority || 'medium',
              responsiblePersonId: f.responsiblePersonId || '', responsiblePersonName: f.responsiblePersonName || '',
              status: 'pending', overdueAt: null as unknown as string,
              creatorId: currentUser.id, creatorName: currentUser.name,
            })
          } else if (targetType === 'incident') {
            const f = form as Partial<IncidentFormFields>
            createIncident({
              insuranceType: f.insuranceType || '', riderId: f.riderId || '', riderName: f.riderName || '',
              gender: f.gender || '男', city: f.city || '', idCard: f.idCard || '', phone: f.phone || '',
              orderNo: f.orderNo || '', accidentDate: f.accidentDate || '', accidentTimeVal: f.accidentTimeVal || '',
              reportDate: f.reportDate || todayStr(), reportTime: f.reportTime || '',
              location: f.location || '', accidentDesc: f.accidentDesc || '', injuryDesc: f.injuryDesc || '',
              vehicleType: f.vehicleType || '', isDeath: f.isDeath || false, liability: f.liability || '',
              violation: f.violation || '', otherInjury: f.otherInjury || '', otherPerson: f.otherPerson || '',
              otherVehicle: f.otherVehicle || '', cause: f.cause || '', accidentType: f.accidentType || '',
              isSupplier: f.isSupplier || false, isCancel: f.isCancel || false, isContacted: f.isContacted || false,
              creatorId: currentUser.id, creatorName: currentUser.name,
            })
          } else if (targetType === 'majorCase') {
            const f = form as Partial<MajorCaseFormFields>
            createMajorCase({
              riderId: f.riderId || '', riderName: f.riderName || '', gender: f.gender || '男',
              city: f.city || '', idCard: f.idCard || '', phone: f.phone || '',
              reportOrderNo: f.reportOrderNo || '', accidentTime: f.accidentTime || '',
              insuranceType: f.insuranceType || '', accidentParty: f.accidentParty || '',
              accidentDesc: f.accidentDesc || '', caseType: f.caseType || '', stage: f.stage || '发现',
              responsibleId: currentUser.id, responsibleName: currentUser.name,
              creatorId: currentUser.id, creatorName: currentUser.name,
            })
          } else {
            const f = form as Partial<InterceptionFormFields>
            createInterception({
              reportYear: f.reportYear || new Date().getFullYear(), reportMonth: f.reportMonth || new Date().getMonth() + 1,
              handleTime: f.handleTime || new Date().toISOString(), riderId: f.riderId || '',
              riderName: f.riderName || '', gender: f.gender || '男', city: f.city || '',
              idCard: f.idCard || '', phone: f.phone || '', reportOrderNo: f.reportOrderNo || '',
              accidentTime: f.accidentTime || '', insuranceType: f.insuranceType || '',
              accidentParty: f.accidentParty || '', accidentDesc: f.accidentDesc || '',
              estimatedLoss: f.estimatedLoss || 0, discovererId: currentUser.id,
              discovererName: currentUser.name, handlerId: currentUser.id, handlerName: currentUser.name,
              interceptType: f.interceptType || '', interceptReason: f.interceptReason || '',
              handleMethod: f.handleMethod || '', fraudType: f.fraudType || undefined,
              reportCrisis: f.reportCrisis || false, cityCollab: f.cityCollab || false,
              interceptSuccess: f.interceptSuccess || false,
            })
          }
          setCreateOpen(false)
        }} />
    </div>
  )
}

/* ── Small sub-components ─────────────────────────────── */
function PriorityBadge({ priority }: { priority: string }): React.ReactElement {
  const map: Record<string, string> = {
    low: 'bg-gray-100 text-gray-600', medium: 'bg-blue-100 text-blue-700',
    high: 'bg-orange-100 text-orange-700', urgent: 'bg-red-100 text-red-700',
  }
  const labels: Record<string, string> = { low: '低', medium: '中', high: '高', urgent: '紧急' }
  return <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${map[priority] || 'bg-gray-100 text-gray-500'}`}>{labels[priority] || priority}</span>
}

function StatusBadge({ status }: { status: string }): React.ReactElement {
  const map: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700', overdue: 'bg-red-100 text-red-700', completed: 'bg-green-100 text-green-700',
  }
  const labels: Record<string, string> = { pending: '待处理', overdue: '已超时', completed: '已完成' }
  return <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${map[status] || 'bg-gray-100 text-gray-500'}`}>{labels[status] || status}</span>
}
