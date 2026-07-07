import { useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import { Download, Upload, CheckCircle, XCircle, FileDown, X } from 'lucide-react'

const BRAND_BLUE = '#00A6FF'

// ==================== 模块字段配置 ====================
type ModuleKey = 'ticket' | 'interception' | 'incident' | 'majorCase'

interface FieldDef {
  key: string
  label: string
  required: boolean
  placeholder: string
  autoGen?: boolean
}

const MODULE_FIELDS: Record<ModuleKey, FieldDef[]> = {
  ticket: [
    { key: 'ticketNo', label: '工单编号', required: false, placeholder: '', autoGen: true },
    { key: 'caseOrderNo', label: '案件/订单号', required: true, placeholder: 'CASE-2026-001' },
    { key: 'riderId', label: '骑手ID', required: true, placeholder: 'RIDER001' },
    { key: 'riderName', label: '骑手姓名', required: true, placeholder: '张三' },
    { key: 'riderCity', label: '城市', required: true, placeholder: '北京' },
    { key: 'title', label: '标题', required: true, placeholder: '工单标题' },
    { key: 'priority', label: '优先级(low/medium/high/urgent)', required: true, placeholder: 'medium' },
    { key: 'responsiblePersonName', label: '负责人', required: true, placeholder: '李四' },
    { key: 'caseType', label: '案件类型(意外,三者)', required: true, placeholder: '意外' },
    { key: 'caseDesc', label: '案件描述', required: false, placeholder: '描述内容' },
  ],
  interception: [
    { key: 'handleTime', label: '处理时间', required: true, placeholder: '2026-07-02 10:00' },
    { key: 'riderId', label: '骑手ID', required: true, placeholder: 'RIDER001' },
    { key: 'riderName', label: '骑手姓名', required: true, placeholder: '张三' },
    { key: 'gender', label: '性别(男/女)', required: true, placeholder: '男' },
    { key: 'city', label: '城市', required: true, placeholder: '北京' },
    { key: 'idCard', label: '身份证号', required: true, placeholder: '110101199001011234' },
    { key: 'phone', label: '手机号', required: true, placeholder: '13800138000' },
    { key: 'reportOrderNo', label: '上报单号', required: true, placeholder: 'RP-2026-001' },
    { key: 'accidentTime', label: '事故时间', required: true, placeholder: '2026-07-01 14:00' },
    { key: 'insuranceType', label: '险种', required: true, placeholder: '意外险' },
    { key: 'accidentParty', label: '事故方', required: true, placeholder: '骑手方' },
    { key: 'accidentDesc', label: '事故描述', required: true, placeholder: '描述内容' },
    { key: 'estimatedLoss', label: '预估损失', required: true, placeholder: '1000' },
    { key: 'interceptType', label: '拦截类型', required: true, placeholder: '类型A' },
    { key: 'interceptReason', label: '拦截原因', required: true, placeholder: '原因说明' },
    { key: 'handleMethod', label: '处理方式', required: true, placeholder: '方式A' },
    { key: 'reportCrisis', label: '是否上报危机(是/否)', required: true, placeholder: '否' },
    { key: 'cityCollab', label: '是否城市协同(是/否)', required: true, placeholder: '否' },
    { key: 'interceptSuccess', label: '拦截成功(是/否)', required: true, placeholder: '是' },
  ],
  incident: [
    { key: 'insuranceType', label: '险种', required: true, placeholder: '意外险' },
    { key: 'riderId', label: '骑手ID', required: true, placeholder: 'RIDER001' },
    { key: 'riderName', label: '骑手姓名', required: true, placeholder: '张三' },
    { key: 'gender', label: '性别(男/女)', required: true, placeholder: '男' },
    { key: 'city', label: '城市', required: true, placeholder: '北京' },
    { key: 'idCard', label: '身份证号', required: true, placeholder: '110101199001011234' },
    { key: 'phone', label: '手机号', required: true, placeholder: '13800138000' },
    { key: 'orderNo', label: '订单号', required: true, placeholder: 'ORD-2026-001' },
    { key: 'accidentDate', label: '出险日期', required: true, placeholder: '2026-07-01' },
    { key: 'accidentTimeVal', label: '出险时间', required: true, placeholder: '14:00' },
    { key: 'reportDate', label: '上报日期', required: true, placeholder: '2026-07-01' },
    { key: 'reportTime', label: '上报时间', required: true, placeholder: '15:00' },
    { key: 'location', label: '出险地点', required: true, placeholder: '北京市朝阳区' },
    { key: 'accidentDesc', label: '事故描述', required: true, placeholder: '描述内容' },
    { key: 'injuryDesc', label: '伤情描述', required: true, placeholder: '轻伤' },
    { key: 'vehicleType', label: '车辆类型', required: true, placeholder: '电动自行车' },
    { key: 'isDeath', label: '是否死亡(是/否)', required: true, placeholder: '否' },
    { key: 'liability', label: '责任认定', required: true, placeholder: '骑手全责' },
    { key: 'cause', label: '事故原因', required: true, placeholder: '交通事故' },
    { key: 'accidentType', label: '事故类型', required: true, placeholder: '双方事故' },
    { key: 'isSupplier', label: '是否供应商(是/否)', required: true, placeholder: '否' },
    { key: 'isCancel', label: '是否取消(是/否)', required: true, placeholder: '否' },
    { key: 'isContacted', label: '是否已联系(是/否)', required: true, placeholder: '是' },
  ],
  majorCase: [
    { key: 'caseNo', label: '案件编号', required: false, placeholder: '', autoGen: true },
    { key: 'riderId', label: '骑手ID', required: true, placeholder: 'RIDER001' },
    { key: 'riderName', label: '骑手姓名', required: true, placeholder: '张三' },
    { key: 'gender', label: '性别(男/女)', required: true, placeholder: '男' },
    { key: 'city', label: '城市', required: true, placeholder: '北京' },
    { key: 'idCard', label: '身份证号', required: true, placeholder: '110101199001011234' },
    { key: 'phone', label: '手机号', required: true, placeholder: '13800138000' },
    { key: 'reportOrderNo', label: '上报单号', required: true, placeholder: 'RP-2026-001' },
    { key: 'accidentTime', label: '事故时间', required: true, placeholder: '2026-07-01 14:00' },
    { key: 'insuranceType', label: '险种', required: true, placeholder: '意外险' },
    { key: 'accidentParty', label: '事故方', required: true, placeholder: '骑手方' },
    { key: 'accidentDesc', label: '事故描述', required: true, placeholder: '描述内容' },
    { key: 'caseType', label: '案件类型(舆情/严重受伤/伤亡)', required: true, placeholder: '舆情' },
    { key: 'stage', label: '阶段(发现/上报/处置中/结案)', required: true, placeholder: '发现' },
    { key: 'responsibleName', label: '负责人', required: true, placeholder: '李四' },
  ],
}

// ==================== Props ====================
interface ExcelImportProps {
  onImport: (data: Record<string, unknown>[]) => void
  module: ModuleKey
  onClose: () => void
}

// ==================== 校验结果 ====================
interface ValidationResult {
  validRows: Record<string, unknown>[]
  failedRows: { row: Record<string, unknown>; index: number; error: string }[]
}

// ==================== 工具函数 ====================
function downloadTemplate(fields: FieldDef[]): void {
  const wb = XLSX.utils.book_new()
  // 表头行
  const header: string[] = fields.map((f) =>
    f.autoGen ? `${f.label}(自动生成)` : f.required ? `${f.label}*` : f.label,
  )
  // 示例数据行
  const sample: string[] = fields.map((f) =>
    f.autoGen ? '自动生成' : f.placeholder,
  )
  const ws = XLSX.utils.aoa_to_sheet([header, sample])

  // 必填标头红色字体
  fields.forEach((f, idx) => {
    if (f.required) {
      const addr = XLSX.utils.encode_cell({ r: 0, c: idx })
      if (!ws[addr]) return
      ws[addr].s = {
        font: { color: { rgb: 'FF0000' }, bold: true },
      }
    }
  })

  // 工单编号列标注为自动生成（灰色）
  fields.forEach((f, idx) => {
    if (f.autoGen) {
      const addr = XLSX.utils.encode_cell({ r: 0, c: idx })
      if (!ws[addr]) return
      ws[addr].s = {
        font: { color: { rgb: '808080' }, bold: true },
      }
      const addrSample = XLSX.utils.encode_cell({ r: 1, c: idx })
      if (!ws[addrSample]) return
      ws[addrSample].s = {
        font: { color: { rgb: '808080' }, italic: true },
      }
    }
  })

  // 列宽
  ws['!cols'] = fields.map(() => ({ wch: 25 }))
  XLSX.utils.book_append_sheet(wb, ws, '模板')
  XLSX.writeFile(wb, '导入模板.xlsx')
}

function validateRows(
  fields: FieldDef[],
  rows: Record<string, unknown>[],
): ValidationResult {
  const requiredKeys = fields.filter((f) => f.required).map((f) => f.key)
  const validRows: Record<string, unknown>[] = []
  const failedRows: { row: Record<string, unknown>; index: number; error: string }[] = []

  rows.forEach((row, idx) => {
    const missing = requiredKeys.filter(
      (key) => !row[key] || String(row[key]).trim() === '',
    )
    if (missing.length > 0) {
      failedRows.push({
        row,
        index: idx + 2, // Excel行号（含表头和示例）
        error: `缺少必填字段: ${missing.join(', ')}`,
      })
    } else {
      validRows.push(row)
    }
  })

  return { validRows, failedRows }
}

function exportFailedExcel(
  fields: FieldDef[],
  failedRows: { row: Record<string, unknown>; index: number; error: string }[],
): void {
  const wb = XLSX.utils.book_new()
  const header = [...fields.map((f) => f.label), '错误说明']
  const data = [header]

  failedRows.forEach(({ row, error }) => {
    const r = fields.map((f) => (row[f.key] ?? '') as string)
    r.push(error)
    data.push(r)
  })

  const ws = XLSX.utils.aoa_to_sheet(data)
  ws['!cols'] = [...fields.map(() => ({ wch: 25 }), { wch: 40 })]
  XLSX.utils.book_append_sheet(wb, ws, '失败记录')
  XLSX.writeFile(wb, '导入失败记录.xlsx')
}

// ==================== 主组件 ====================
export default function ExcelImport({ onImport, module, onClose }: ExcelImportProps) {
  const fields = MODULE_FIELDS[module]
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [fileName, setFileName] = useState('')
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [importing, setImporting] = useState(false)

  const handleFile = (file: File) => {
    setFileName(file.name)
    setValidationResult(null)

    const reader = new FileReader()
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer)
      const workbook = XLSX.read(data, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      const sheet = workbook.Sheets[sheetName]
      const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet)

      // 跳过空行
      const nonEmpty = rows.filter(
        (r) => Object.values(r).some((v) => v !== null && v !== undefined && String(v).trim() !== ''),
      )

      const result = validateRows(fields, nonEmpty)
      setValidationResult(result)
    }
    reader.readAsArrayBuffer(file)
  }

  const handleConfirmImport = () => {
    if (!validationResult || validationResult.validRows.length === 0) return
    setImporting(true)
    onImport(validationResult.validRows)
    setImporting(false)
  }

  const moduleLabel: Record<ModuleKey, string> = {
    ticket: '工单',
    interception: '拦截',
    incident: '出险',
    majorCase: '重大案件',
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[85vh] overflow-hidden flex flex-col">
        {/* 标题栏 */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="text-lg font-bold">导入{moduleLabel[module]}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        {/* 内容 */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {/* 下载模板 */}
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <span className="text-sm text-blue-700">第一步：下载导入模板</span>
            <button
              onClick={() => downloadTemplate(fields)}
              className="ml-auto flex items-center gap-1 px-3 py-1.5 rounded-md text-sm text-white"
              style={{ backgroundColor: BRAND_BLUE }}
            >
              <Download size={14} /> 下载模板
            </button>
          </div>

          {/* 上传文件 */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
            <span className="text-sm text-gray-700">第二步：上传填写好的 Excel</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFile(file)
              }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="ml-auto flex items-center gap-1 px-3 py-1.5 rounded-md text-sm border border-gray-200 hover:bg-white transition-colors"
            >
              <Upload size={14} /> 选择文件
            </button>
          </div>

          {fileName && (
            <div className="text-sm text-gray-500">
              已选择: <span className="font-medium text-gray-700">{fileName}</span>
            </div>
          )}

          {/* 校验结果 */}
          {validationResult && (
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <span className="inline-flex items-center gap-1 text-sm text-green-600">
                  <CheckCircle size={16} /> 成功 {validationResult.validRows.length} 条
                </span>
                {validationResult.failedRows.length > 0 && (
                  <span className="inline-flex items-center gap-1 text-sm text-red-600">
                    <XCircle size={16} /> 失败 {validationResult.failedRows.length} 条
                  </span>
                )}
              </div>

              {/* 失败详情 */}
              {validationResult.failedRows.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-red-600">失败详情</span>
                    <button
                      onClick={() => exportFailedExcel(fields, validationResult.failedRows)}
                      className="flex items-center gap-1 px-2 py-1 rounded text-xs text-red-600 border border-red-200 hover:bg-red-50"
                    >
                      <FileDown size={12} /> 导出失败记录
                    </button>
                  </div>
                  <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50 text-gray-500">
                        <tr>
                          <th className="px-3 py-1.5 text-left">Excel行号</th>
                          <th className="px-3 py-1.5 text-left">错误原因</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {validationResult.failedRows.map(({ index, error }, i) => (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="px-3 py-1.5">第 {index} 行</td>
                            <td className="px-3 py-1.5 text-red-600">{error}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="px-5 py-3 border-t flex justify-end gap-2">
          <button
            className="px-4 py-1.5 rounded border text-sm hover:bg-gray-50"
            onClick={onClose}
          >
            取消
          </button>
          {validationResult && validationResult.validRows.length > 0 && (
            <button
              disabled={importing}
              className="px-4 py-1.5 rounded text-sm text-white disabled:opacity-50"
              style={{ backgroundColor: BRAND_BLUE }}
              onClick={handleConfirmImport}
            >
              {importing ? '导入中...' : `确认导入 (${validationResult.validRows.length} 条)`}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
