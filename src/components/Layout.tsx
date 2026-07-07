import { Outlet } from 'react-router-dom'
import { useStore } from '../store/useStore'
import Sidebar from './Sidebar'
import Header from './Header'
import Login from '../pages/Login'

function Layout(): React.ReactElement {
  const currentUser = useStore((state) => state.currentUser)

  if (!currentUser) {
    return <Login />
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default Layout
