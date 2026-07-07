import { useState } from 'react'
import { useStore } from '../store/useStore'
import type { User as UserType, UserRole } from '../types'
import {
  UserCircle,
  Lock,
  Unlock,
  Trash2,
  Edit,
  Plus,
  KeyRound,
  X,
  Shield,
  ShieldCheck,
  User as UserIcon,
} from 'lucide-react'

const BRAND_BLUE = '#00A6FF'

const ROLE_BADGE: Record<UserRole, { label: string; bg: string; text: string }> = {
  admin: { label: '管理员', bg: '#fef2f2', text: '#dc2626' },
  supervisor: { label: '主管', bg: '#eff6ff', text: '#3b82f6' },
  specialist: { label: '专员', bg: '#f3f4f6', text: '#6b7280' },
}

function Account() {
  const currentUser = useStore((s) => s.currentUser)
  const users = useStore((s) => s.users)
  const updateSettings = useStore // for role check

  if (!currentUser) return null

  const isAdmin = currentUser.role === 'admin'

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold">个人中心</h1>
        <p className="text-gray-500 text-sm mt-1">管理您的账户信息</p>
      </div>

      {/* 用户信息卡片 */}
      <UserInfoCard />

      {/* 修改密码 */}
      <ChangePasswordCard />

      {/* 账号管理（仅 admin） */}
      {isAdmin && <AdminUserManagement users={users.filter((u) => !u.isDeleted)} />}
    </div>
  )
}

// ==================== 用户信息卡片 ====================
function UserInfoCard() {
  const currentUser = useStore((s) => s.currentUser)
  if (!currentUser) return null

  const roleBadge = ROLE_BADGE[currentUser.role]

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center gap-4">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl flex-shrink-0"
          style={{ background: BRAND_BLUE }}
        >
          {currentUser.name.charAt(0)}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold">{currentUser.name}</h2>
            <span
              className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
              style={{ background: roleBadge.bg, color: roleBadge.text }}
            >
              {roleBadge.label}
            </span>
          </div>
          <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">用户名</span>
              <p className="font-medium mt-0.5">{currentUser.username}</p>
            </div>
            <div>
              <span className="text-gray-500">角色</span>
              <p className="font-medium mt-0.5">{roleBadge.label}</p>
            </div>
            <div>
              <span className="text-gray-500">状态</span>
              <p className="font-medium mt-0.5">
                {currentUser.isLocked ? (
                  <span className="text-red-600">已锁定</span>
                ) : (
                  <span className="text-green-600">正常</span>
                )}
              </p>
            </div>
            <div>
              <span className="text-gray-500">创建时间</span>
              <p className="font-medium mt-0.5">
                {new Date(currentUser.createdAt).toLocaleDateString('zh-CN')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ==================== 修改密码 ====================
function ChangePasswordCard() {
  const currentUser = useStore((s) => s.currentUser)
  const updateCurrent = useStore((s) => s.updateUser)
  const [oldPwd, setOldPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  if (!currentUser) return null

  const handleSubmit = () => {
    setMsg(null)
    if (!oldPwd || !newPwd || !confirmPwd) {
      setMsg({ type: 'error', text: '请填写所有字段' })
      return
    }
    if (oldPwd !== currentUser.password) {
      setMsg({ type: 'error', text: '原密码不正确' })
      return
    }
    if (newPwd !== confirmPwd) {
      setMsg({ type: 'error', text: '两次输入的新密码不一致' })
      return
    }
    if (newPwd.length < 4) {
      setMsg({ type: 'error', text: '密码长度不能少于4位' })
      return
    }
    updateCurrent(currentUser.id, { password: newPwd })
    setMsg({ type: 'success', text: '密码修改成功' })
    setOldPwd('')
    setNewPwd('')
    setConfirmPwd('')
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Lock size={18} className="text-gray-400" />
        <h2 className="text-lg font-semibold">修改密码</h2>
      </div>

      <div className="space-y-3 max-w-md">
        <div>
          <label className="block text-sm text-gray-600 mb-1">原密码</label>
          <input
            type="password"
            value={oldPwd}
            onChange={(e) => setOldPwd(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00A6FF]"
            placeholder="请输入原密码"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">新密码</label>
          <input
            type="password"
            value={newPwd}
            onChange={(e) => setNewPwd(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00A6FF]"
            placeholder="请输入新密码（至少4位）"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">确认新密码</label>
          <input
            type="password"
            value={confirmPwd}
            onChange={(e) => setConfirmPwd(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00A6FF]"
            placeholder="请再次输入新密码"
          />
        </div>

        {msg && (
          <div
            className={`text-sm px-3 py-2 rounded-lg ${
              msg.type === 'success'
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-700'
            }`}
          >
            {msg.text}
          </div>
        )}

        <button
          onClick={handleSubmit}
          className="px-6 py-2 text-sm text-white rounded-lg font-medium transition-colors hover:opacity-90"
          style={{ background: BRAND_BLUE }}
        >
          保存
        </button>
      </div>
    </div>
  )
}

// ==================== 管理员用户管理 ====================
function AdminUserManagement({ users }: { users: UserType[] }) {
  const { createUser, updateUser, deleteUser, resetPassword, lockUser } = useStore()
  const [showCreate, setShowCreate] = useState(false)
  const [editingUser, setEditingUser] = useState<UserType | null>(null)
  const [resettingUser, setResettingUser] = useState<UserType | null>(null)

  const roleOptions: { value: UserRole; label: string }[] = [
    { value: 'admin', label: '管理员' },
    { value: 'supervisor', label: '主管' },
    { value: 'specialist', label: '专员' },
  ]

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} className="text-gray-400" />
          <h2 className="text-lg font-semibold">账号管理</h2>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-sm text-white rounded-lg font-medium transition-colors hover:opacity-90"
          style={{ background: BRAND_BLUE }}
        >
          <Plus size={16} />
          新增用户
        </button>
      </div>

      {/* 用户列表表格 */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-600">
              <th className="text-left px-5 py-3 font-medium">用户名</th>
              <th className="text-left px-5 py-3 font-medium">姓名</th>
              <th className="text-left px-5 py-3 font-medium">角色</th>
              <th className="text-left px-5 py-3 font-medium">状态</th>
              <th className="text-left px-5 py-3 font-medium">创建时间</th>
              <th className="text-left px-5 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.map((u) => {
              const rb = ROLE_BADGE[u.role]
              return (
                <tr key={u.id} className="hover:bg-gray-50/50">
                  <td className="px-5 py-3 font-mono text-xs">{u.username}</td>
                  <td className="px-5 py-3">{u.name}</td>
                  <td className="px-5 py-3">
                    <span
                      className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                      style={{ background: rb.bg, color: rb.text }}
                    >
                      {rb.label}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    {u.isLocked ? (
                      <span className="text-red-600 text-xs font-medium">已锁定</span>
                    ) : (
                      <span className="text-green-600 text-xs font-medium">正常</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-gray-500">
                    {new Date(u.createdAt).toLocaleDateString('zh-CN')}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingUser(u)}
                        className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-blue-600 transition-colors"
                        title="编辑"
                      >
                        <Edit size={15} />
                      </button>
                      <button
                        onClick={() => lockUser(u.id, !u.isLocked)}
                        className={`p-1.5 rounded hover:bg-gray-100 transition-colors ${
                          u.isLocked
                            ? 'text-gray-500 hover:text-green-600'
                            : 'text-gray-500 hover:text-amber-600'
                        }`}
                        title={u.isLocked ? '解锁' : '锁定'}
                      >
                        {u.isLocked ? <Unlock size={15} /> : <Lock size={15} />}
                      </button>
                      <button
                        onClick={() => setResettingUser(u)}
                        className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-orange-600 transition-colors"
                        title="重置密码"
                      >
                        <KeyRound size={15} />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`确定要删除用户 "${u.name}" 吗？`)) {
                            deleteUser(u.id)
                          }
                        }}
                        className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-red-600 transition-colors"
                        title="删除"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {users.length === 0 && (
          <div className="py-12 text-center text-gray-400 text-sm">暂无用户</div>
        )}
      </div>

      {/* 弹窗 */}
      {showCreate && (
        <CreateUserModal
          roleOptions={roleOptions}
          onClose={() => setShowCreate(false)}
        />
      )}
      {editingUser && (
        <EditUserModal
          user={editingUser}
          roleOptions={roleOptions}
          onClose={() => setEditingUser(null)}
        />
      )}
      {resettingUser && (
        <ResetPasswordModal
          user={resettingUser}
          onClose={() => setResettingUser(null)}
        />
      )}
    </div>
  )
}

// ==================== 新建用户弹窗 ====================
function CreateUserModal({
  roleOptions,
  onClose,
}: {
  roleOptions: { value: UserRole; label: string }[]
  onClose: () => void
}) {
  const { createUser } = useStore()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState<UserRole>('specialist')
  const [err, setErr] = useState('')

  const handleCreate = () => {
    setErr('')
    if (!username.trim() || !password.trim() || !name.trim()) {
      setErr('请填写所有字段')
      return
    }
    if (password.length < 4) {
      setErr('密码长度不能少于4位')
      return
    }
    createUser({
      username: username.trim(),
      password,
      name: name.trim(),
      role,
      isLocked: false,
      isDeleted: false,
    })
    onClose()
  }

  return (
    <Modal title="新增用户" onClose={onClose}>
      <div className="space-y-3">
        <div>
          <label className="block text-sm text-gray-600 mb-1">用户名</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00A6FF]"
            placeholder="请输入用户名"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">密码</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00A6FF]"
            placeholder="请输入密码（至少4位）"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">姓名</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00A6FF]"
            placeholder="请输入姓名"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">角色</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00A6FF] bg-white"
          >
            {roleOptions.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
        {err && <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{err}</div>}
        <div className="flex gap-2 justify-end pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
            取消
          </button>
          <button
            onClick={handleCreate}
            className="px-4 py-2 text-sm text-white rounded-lg font-medium"
            style={{ background: BRAND_BLUE }}
          >
            创建
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ==================== 编辑用户弹窗 ====================
function EditUserModal({
  user,
  roleOptions,
  onClose,
}: {
  user: UserType
  roleOptions: { value: UserRole; label: string }[]
  onClose: () => void
}) {
  const { updateUser } = useStore()
  const [name, setName] = useState(user.name)
  const [role, setRole] = useState<UserRole>(user.role)

  const handleSave = () => {
    updateUser(user.id, { name: name.trim(), role })
    onClose()
  }

  return (
    <Modal title="编辑用户" onClose={onClose}>
      <div className="space-y-3">
        <div>
          <label className="block text-sm text-gray-600 mb-1">姓名</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00A6FF]"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">角色</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00A6FF] bg-white"
          >
            {roleOptions.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2 justify-end pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm text-white rounded-lg font-medium"
            style={{ background: BRAND_BLUE }}
          >
            保存
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ==================== 重置密码弹窗 ====================
function ResetPasswordModal({
  user,
  onClose,
}: {
  user: UserType
  onClose: () => void
}) {
  const { resetPassword } = useStore()
  const [newPwd, setNewPwd] = useState('')
  const [err, setErr] = useState('')

  const handleReset = () => {
    setErr('')
    if (!newPwd.trim()) {
      setErr('请输入新密码')
      return
    }
    if (newPwd.length < 4) {
      setErr('密码长度不能少于4位')
      return
    }
    resetPassword(user.id, newPwd)
    onClose()
  }

  return (
    <Modal title="重置密码" onClose={onClose}>
      <div className="space-y-3">
        <p className="text-sm text-gray-500">
          将重置用户 <span className="font-medium text-gray-700">{user.name}</span> 的密码
        </p>
        <div>
          <label className="block text-sm text-gray-600 mb-1">新密码</label>
          <input
            type="password"
            value={newPwd}
            onChange={(e) => setNewPwd(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleReset()}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00A6FF]"
            placeholder="请输入新密码（至少4位）"
          />
        </div>
        {err && <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{err}</div>}
        <div className="flex gap-2 justify-end pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
            取消
          </button>
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm text-white rounded-lg font-medium"
            style={{ background: BRAND_BLUE }}
          >
            确认重置
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ==================== 通用 Modal ====================
function Modal({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold">{title}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 text-gray-400">
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

export default Account
