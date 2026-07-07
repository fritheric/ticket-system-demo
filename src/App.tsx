import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import TicketList from './pages/TicketList'
import TicketDetail from './pages/TicketDetail'
import InterceptionList from './pages/InterceptionList'
import IncidentList from './pages/IncidentList'
import MajorCaseList from './pages/MajorCaseList'
import Statistics from './pages/Statistics'
import Ledger from './pages/Ledger'
import KnowledgeList from './pages/KnowledgeList'
import NotificationCenter from './pages/NotificationCenter'
import Settings from './pages/Settings'
import Account from './pages/Account'

function App(): React.ReactElement {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="tickets" element={<TicketList />} />
          <Route path="tickets/:id" element={<TicketDetail />} />
          <Route path="interceptions" element={<InterceptionList />} />
          <Route path="incidents" element={<IncidentList />} />
          <Route path="major-cases" element={<MajorCaseList />} />
          <Route path="statistics" element={<Statistics />} />
          <Route path="ledger" element={<Ledger />} />
          <Route path="knowledge" element={<KnowledgeList />} />
          <Route path="notifications" element={<NotificationCenter />} />
          <Route path="settings" element={<Settings />} />
          <Route path="account" element={<Account />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
