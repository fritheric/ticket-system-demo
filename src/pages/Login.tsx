import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { ShieldCheck } from 'lucide-react'

function Login(): React.ReactElement {
  const navigate = useNavigate()
  const login = useStore((state) => state.login)
  const currentUser = useStore((state) => state.currentUser)
  const updateCurrentUser = useStore((state) => state.updateCurrentUser)

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [showForceChange, setShowForceChange] = useState(false)
  const [newPwd, setNewPwd] = useState('')
  const [confirmNewPwd, setConfirmNewPwd] = useState('')
  const [changeError, setChangeError] = useState<string | null>(null)

  // 如果已经登录且无需强制改密码，跳转 dashboard
  if (currentUser && !currentUser.mustChangePassword) {
    navigate('/dashboard', { replace: true })
  }

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault()
    setError(null)

    if (!username.trim()) {
      setError('请输入用户名')
      return
    }
    if (!password) {
      setError('请输入密码')
      return
    }

    const success = login(username.trim(), password)
    if (success) {
      const user = useStore.getState().currentUser
      if (user?.mustChangePassword) {
        setShowForceChange(true)
      } else {
        navigate('/dashboard')
      }
    } else {
      setError('用户名或密码错误')
    }
  }

  const handleForceChange = (e: React.FormEvent): void => {
    e.preventDefault()
    setChangeError(null)
    if (!newPwd || newPwd.length < 4) {
      setChangeError('密码至少 4 位')
      return
    }
    if (newPwd !== confirmNewPwd) {
      setChangeError('两次密码不一致')
      return
    }
    if (currentUser) {
      updateCurrentUser({ password: newPwd, mustChangePassword: false })
      setShowForceChange(false)
      navigate('/dashboard')
    }
  }

  if (showForceChange && currentUser) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="w-[400px] bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-6">
            <div className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-4" style={{ background: '#00A6FF' }}>
              <ShieldCheck size={28} className="text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-800">首次登录</h1>
            <p className="text-sm text-gray-400 mt-1">请修改默认密码后继续使用</p>
          </div>
          <form onSubmit={handleForceChange} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">新密码</label>
              <input type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)}
                placeholder="请输入新密码"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00A6FF]/40 focus:border-[#00A6FF]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">确认新密码</label>
              <input type="password" value={confirmNewPwd} onChange={(e) => setConfirmNewPwd(e.target.value)}
                placeholder="请再次输入新密码"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00A6FF]/40 focus:border-[#00A6FF]" />
            </div>
            {changeError && <div className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{changeError}</div>}
            <button type="submit" className="w-full py-2.5 text-white text-sm font-medium rounded-lg" style={{ background: '#00A6FF' }}>确认并登录</button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="w-[400px] bg-white rounded-2xl shadow-lg p-8">
        {/* Logo area */}
        <div className="text-center mb-8">
          <div
            className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-4"
            style={{ background: '#00A6FF' }}
          >
            <ShieldCheck size={28} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-800">保险运营组工单系统</h1>
          <p className="text-sm text-gray-400 mt-1">登录以继续使用</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-600 mb-1.5">
              用户名
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00A6FF]/40 focus:border-[#00A6FF] transition"
              autoComplete="username"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-600 mb-1.5">
              密码
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00A6FF]/40 focus:border-[#00A6FF] transition"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2.5 text-white text-sm font-medium rounded-lg transition-colors hover:opacity-90"
            style={{ background: '#00A6FF' }}
          >
            登 录
          </button>
        </form>

        {/* Hint */}
        <div className="mt-6 text-center text-xs text-gray-400">
          默认账号：admin / admin123
        </div>
      </div>
    </div>
  )
}

export default Login
