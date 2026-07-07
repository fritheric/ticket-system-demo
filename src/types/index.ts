// ==================== 角色 ====================
export type UserRole = 'admin' | 'specialist' | 'supervisor'

// ==================== 视图 ====================
export type View =
  | 'dashboard'
  | 'tickets'
  | 'create'
  | 'edit'
  | 'detail'
  | 'interceptions'
  | 'incidents'
  | 'majorCases'
  | 'statistics'
  | 'ledger'
  | 'knowledge'
  | 'notifications'
  | 'settings'
  | 'account'

// ==================== 工单 ====================
// 状态：待处理/已超时/已完成
export type TicketStatus = 'pending' | 'overdue' | 'completed'
// 优先级：低/中/高/紧急
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface Ticket {
  id: string
  ticketNo: string          // GD-YYYYMMDD-NNN
  caseOrderNo: string       // 关联案件/订单号
  riderId: string
  riderName: string
  riderCity: string
  title: string
  priority: TicketPriority
  status: TicketStatus
  responsiblePersonId: string
  responsiblePersonName: string
  creatorId: string
  creatorName: string
  caseType: ('意外' | '三者')[]
  caseDesc: string
  createdAt: string
  updatedAt: string
  completedAt?: string
  overdueAt: string
  isDeleted: boolean
  linkedIncidentId?: string
  transferStatus: 'none' | 'pending' | 'confirmed' | 'rejected'
  transferReason?: string
  transferRejectReason?: string
}

// ==================== 用户 ====================
export interface User {
  id: string
  username: string
  password: string
  name: string
  role: UserRole
  isPrimary?: boolean       // 主管理员
  isLocked: boolean
  isDeleted: boolean
  mustChangePassword?: boolean  // 首次登录强制改密码
  createdAt: string
}

// ==================== 拦截记录 ====================
export interface Interception {
  id: string
  reportYear: number
  reportMonth: number
  handleTime: string
  riderId: string
  riderName: string
  gender: '男' | '女'
  city: string
  idCard: string
  phone: string
  reportOrderNo: string
  accidentTime: string
  insuranceType: string     // 意外险/三者险/职伤险
  accidentParty: string     // 骑手方/对方/双方
  accidentDesc: string
  estimatedLoss: number
  discovererId: string
  discovererName: string
  handlerId: string
  handlerName: string
  interceptType: string     // 下拉可配置
  interceptReason: string
  handleMethod: string      // 下拉可配置
  fraudType?: string        // A类/B类/C类/D类/E类
  reportCrisis: boolean
  cityCollab: boolean
  cityCollabResult?: string
  interceptSuccess: boolean
  createdAt: string
  updatedAt: string
  isDeleted: boolean
  linkedTicketId?: string
  linkedIncidentId?: string
}

// ==================== 出险记录 ====================
export interface IncidentRecord {
  id: string
  insuranceType: string     // 意外险/三者险/职伤险
  riderId: string
  riderName: string
  gender: '男' | '女'
  city: string
  idCard: string
  phone: string
  orderNo: string
  accidentDate: string
  accidentTimeVal: string   // 出险时间
  reportDate: string
  reportTime: string
  location: string
  accidentDesc: string
  injuryDesc: string
  vehicleType: string
  isDeath: boolean
  liability: string         // 骑手全责/骑手主责/同等责任/对方主责/对方全责/无法认定
  violation?: string
  otherInjury?: string
  otherPerson?: string
  otherVehicle?: string
  cause: string             // 交通事故/摔倒/碰撞/疾病/其他
  accidentType: string      // 单方事故/双方事故/多方事故
  isSupplier: boolean
  isCancel: boolean
  isContacted: boolean
  creatorId: string
  creatorName: string
  createdAt: string
  updatedAt: string
  isDeleted: boolean
  linkedTicketId?: string
  linkedMajorCaseId?: string
}

// ==================== 重大案件 ====================
export interface MajorCase {
  id: string
  caseNo: string            // ZD-YYYYMMDD-NNN
  riderId: string
  riderName: string
  gender: '男' | '女'
  city: string
  idCard: string
  phone: string
  reportOrderNo: string
  accidentTime: string
  insuranceType: string
  accidentParty: string
  accidentDesc: string
  caseType: string          // 舆情/严重受伤/伤亡
  stage: string             // 发现/上报/处置中/结案
  responsibleId: string
  responsibleName: string
  creatorId: string
  creatorName: string
  // 结案字段
  payer?: string
  completeDate?: string
  paymentAmount?: number
  paymentTime?: string
  createdAt: string
  updatedAt: string
  isDeleted: boolean
  linkedIncidentId?: string
  followUps: MajorCaseFollowUp[]
}

export interface MajorCaseFollowUp {
  id: string
  caseId: string
  followTime: string
  followerId: string
  followerName: string
  content: string
  createdAt: string
}

// ==================== 知识库 ====================
export interface KnowledgeArticle {
  id: string
  title: string
  category: string
  tags: string[]
  content: string
  status: 'draft' | 'published' | 'archived'
  creatorId: string
  creatorName: string
  createdAt: string
  updatedAt: string
}

// ==================== 通知 ====================
export type NotificationType = 'timeout' | 'transfer' | 'system'

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  content: string
  isRead: boolean
  link?: string
  createdAt: string
}

// ==================== 操作日志 ====================
export interface AuditLog {
  id: string
  userId: string
  userName: string
  action: string
  module: string
  detail: Record<string, unknown>
  createdAt: string
}

// ==================== 系统设置 ====================
export interface SystemSettings {
  // 超时规则
  timeoutRules: Record<'low' | 'medium' | 'high' | 'urgent', number>
  // 下拉选项
  interceptTypes: string[]
  handleMethods: string[]
  fraudTypes: string[]
  insuranceTypes: string[]
  accidentParties: string[]
  liabilities: string[]
  causes: string[]
  accidentTypes: string[]
  caseTypes: string[]
  stages: string[]
  knowledgeCategories: string[]
  priorities: string[]
  ticketStatuses: string[]
  // 钉钉配置
  dingtalkWebhook?: string
}
