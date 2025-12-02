import { useState } from 'react'
import { useAuth } from './hooks/useAuth'
import Login from './components/Login'
import DashboardLayout from './components/DashboardLayout'
import DailyTasks from './pages/DailyTasks'
import Clients from './pages/Clients'
import Payments from './pages/Payments'
import Analytics from './pages/Analytics'
import Templates from './pages/Templates'

function App() {
  const { user, loading } = useAuth()
  const [currentTab, setCurrentTab] = useState('tasks')

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Login />
  }

  return (
    <DashboardLayout currentTab={currentTab} setCurrentTab={setCurrentTab} user={user}>
      {currentTab === 'tasks' && <DailyTasks user={user} />}
      {currentTab === 'clients' && <Clients user={user} />}
      {currentTab === 'payments' && <Payments user={user} />}
      {currentTab === 'analytics' && <Analytics user={user} />}
      {currentTab === 'templates' && <Templates user={user} />}
    </DashboardLayout>
  )
}

export default App
