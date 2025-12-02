import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { TrendingUp, DollarSign, CheckCircle, Clock, Download, Calendar, BarChart3 } from 'lucide-react'
import { format, startOfMonth, endOfMonth, subMonths, eachMonthOfInterval } from 'date-fns'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const COLORS = ['#0ea5e9', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444']

const CATEGORIES = {
  seo: { label: 'SEO', color: '#8b5cf6' },
  content: { label: 'Content', color: '#10b981' },
  social_media: { label: 'Social Media', color: '#ec4899' },
  technical: { label: 'Technical', color: '#0ea5e9' },
  admin: { label: 'Admin', color: '#6b7280' }
}

export default function Analytics({ user }) {
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'))
  const [stats, setStats] = useState({
    tasks: {
      total: 0,
      completed: 0,
      completionRate: 0,
      byCategory: []
    },
    revenue: {
      thisMonth: 0,
      lastMonth: 0,
      growth: 0,
      trend: []
    },
    clients: {
      active: 0,
      recurring: 0,
      topClients: []
    },
    payments: {
      received: 0,
      pending: 0,
      overdue: 0
    }
  })

  useEffect(() => {
    fetchAnalytics()
  }, [user, selectedMonth])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchTaskStats(),
        fetchRevenueStats(),
        fetchClientStats(),
        fetchPaymentStats()
      ])
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTaskStats = async () => {
    const monthStart = startOfMonth(new Date(selectedMonth + '-01'))
    const monthEnd = endOfMonth(new Date(selectedMonth + '-01'))

    // Get all task templates
    const { data: templates } = await supabase
      .from('task_templates')
      .select('id, category')
      .eq('user_id', user.id)

    // Get completions for selected month
    const { data: completions } = await supabase
      .from('task_completions')
      .select('task_template_id, completion_date')
      .eq('user_id', user.id)
      .gte('completion_date', format(monthStart, 'yyyy-MM-dd'))
      .lte('completion_date', format(monthEnd, 'yyyy-MM-dd'))

    const totalTasks = templates?.length || 0
    const daysInMonth = monthEnd.getDate()
    const totalPossibleCompletions = totalTasks * daysInMonth
    const actualCompletions = completions?.length || 0
    const completionRate = totalPossibleCompletions > 0 
      ? Math.round((actualCompletions / totalPossibleCompletions) * 100)
      : 0

    // Group by category
    const categoryStats = Object.keys(CATEGORIES).map(category => {
      const categoryTasks = templates?.filter(t => t.category === category) || []
      const categoryCompletions = completions?.filter(c => 
        categoryTasks.some(t => t.id === c.task_template_id)
      ) || []

      return {
        name: CATEGORIES[category].label,
        value: categoryCompletions.length,
        color: CATEGORIES[category].color
      }
    }).filter(cat => cat.value > 0)

    setStats(prev => ({
      ...prev,
      tasks: {
        total: totalTasks,
        completed: actualCompletions,
        completionRate,
        byCategory: categoryStats
      }
    }))
  }

  const fetchRevenueStats = async () => {
    // Get last 6 months of revenue data
    const months = eachMonthOfInterval({
      start: subMonths(new Date(), 5),
      end: new Date()
    })

    const revenueByMonth = await Promise.all(
      months.map(async (month) => {
        const monthStart = startOfMonth(month)
        const monthEnd = endOfMonth(month)

        const { data } = await supabase
          .from('payments')
          .select('amount, status')
          .eq('user_id', user.id)
          .gte('due_date', format(monthStart, 'yyyy-MM-dd'))
          .lte('due_date', format(monthEnd, 'yyyy-MM-dd'))

        const received = data
          ?.filter(p => p.status === 'paid')
          .reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0

        return {
          month: format(month, 'MMM yyyy'),
          revenue: received
        }
      })
    )

    const thisMonthRevenue = revenueByMonth[revenueByMonth.length - 1]?.revenue || 0
    const lastMonthRevenue = revenueByMonth[revenueByMonth.length - 2]?.revenue || 0
    const growth = lastMonthRevenue > 0
      ? Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
      : 0

    setStats(prev => ({
      ...prev,
      revenue: {
        thisMonth: thisMonthRevenue,
        lastMonth: lastMonthRevenue,
        growth,
        trend: revenueByMonth
      }
    }))
  }

  const fetchClientStats = async () => {
    const { data: clients } = await supabase
      .from('clients')
      .select('id, name, status, recurring_billing')
      .eq('user_id', user.id)

    const active = clients?.filter(c => c.status === 'active').length || 0
    const recurring = clients?.filter(c => c.recurring_billing).length || 0

    // Get revenue per client
    const clientRevenue = await Promise.all(
      (clients || []).map(async (client) => {
        const { data: payments } = await supabase
          .from('payments')
          .select('amount')
          .eq('client_id', client.id)
          .eq('status', 'paid')

        const total = payments?.reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0
        return {
          name: client.name,
          revenue: total
        }
      })
    )

    const topClients = clientRevenue
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)

    setStats(prev => ({
      ...prev,
      clients: {
        active,
        recurring,
        topClients
      }
    }))
  }

  const fetchPaymentStats = async () => {
    const monthStart = startOfMonth(new Date(selectedMonth + '-01'))
    const monthEnd = endOfMonth(new Date(selectedMonth + '-01'))

    const { data: payments } = await supabase
      .from('payments')
      .select('amount, status, due_date')
      .eq('user_id', user.id)
      .gte('due_date', format(monthStart, 'yyyy-MM-dd'))
      .lte('due_date', format(monthEnd, 'yyyy-MM-dd'))

    const received = payments
      ?.filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0

    const pending = payments
      ?.filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0

    const overdue = payments
      ?.filter(p => p.status === 'overdue')
      .reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0

    setStats(prev => ({
      ...prev,
      payments: {
        received,
        pending,
        overdue
      }
    }))
  }

  const exportToCSV = () => {
    const csvData = [
      ['Analytics Report', format(new Date(), 'yyyy-MM-dd')],
      [''],
      ['Task Statistics'],
      ['Total Tasks', stats.tasks.total],
      ['Completed', stats.tasks.completed],
      ['Completion Rate', `${stats.tasks.completionRate}%`],
      [''],
      ['Revenue Statistics'],
      ['This Month', `₹${stats.revenue.thisMonth.toLocaleString()}`],
      ['Last Month', `₹${stats.revenue.lastMonth.toLocaleString()}`],
      ['Growth', `${stats.revenue.growth}%`],
      [''],
      ['Payment Statistics'],
      ['Received', `₹${stats.payments.received.toLocaleString()}`],
      ['Pending', `₹${stats.payments.pending.toLocaleString()}`],
      ['Overdue', `₹${stats.payments.overdue.toLocaleString()}`],
    ]

    const csv = csvData.map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">Insights and performance metrics</p>
        </div>
        <div className="flex space-x-2">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="input"
          />
          <button
            onClick={exportToCSV}
            className="btn btn-secondary flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">Task Completion</p>
              <p className="text-3xl font-bold text-blue-900">{stats.tasks.completionRate}%</p>
              <p className="text-xs text-blue-600 mt-1">
                {stats.tasks.completed} / {stats.tasks.total * new Date(selectedMonth + '-01').getDate()} tasks
              </p>
            </div>
            <CheckCircle className="w-12 h-12 text-blue-600 opacity-50" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700">Revenue This Month</p>
              <p className="text-3xl font-bold text-green-900">
                ₹{stats.revenue.thisMonth.toLocaleString()}
              </p>
              <p className={`text-xs mt-1 flex items-center ${stats.revenue.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                <TrendingUp className="w-3 h-3 mr-1" />
                {stats.revenue.growth >= 0 ? '+' : ''}{stats.revenue.growth}% vs last month
              </p>
            </div>
            <DollarSign className="w-12 h-12 text-green-600 opacity-50" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-700">Active Clients</p>
              <p className="text-3xl font-bold text-purple-900">{stats.clients.active}</p>
              <p className="text-xs text-purple-600 mt-1">
                {stats.clients.recurring} with recurring billing
              </p>
            </div>
            <Calendar className="w-12 h-12 text-purple-600 opacity-50" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-700">Pending Payments</p>
              <p className="text-3xl font-bold text-orange-900">
                ₹{stats.payments.pending.toLocaleString()}
              </p>
              {stats.payments.overdue > 0 && (
                <p className="text-xs text-red-600 mt-1">
                  ₹{stats.payments.overdue.toLocaleString()} overdue
                </p>
              )}
            </div>
            <Clock className="w-12 h-12 text-orange-600 opacity-50" />
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <div className="card">
          <h3 className="text-lg font-bold mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-green-600" />
            Revenue Trend (Last 6 Months)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.revenue.trend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
              <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Task Category Distribution */}
        <div className="card">
          <h3 className="text-lg font-bold mb-4">Task Distribution by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={stats.tasks.byCategory}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${entry.value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {stats.tasks.byCategory.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Clients */}
      <div className="card">
        <h3 className="text-lg font-bold mb-4">Top Clients by Revenue</h3>
        <div className="space-y-3">
          {stats.clients.topClients.map((client, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                  index === 0 ? 'bg-yellow-500' :
                  index === 1 ? 'bg-gray-400' :
                  index === 2 ? 'bg-orange-500' :
                  'bg-gray-300'
                }`}>
                  {index + 1}
                </div>
                <span className="font-medium text-gray-900">{client.name}</span>
              </div>
              <span className="text-lg font-bold text-green-600">
                ₹{client.revenue.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
        {stats.clients.topClients.length === 0 && (
          <p className="text-gray-500 text-center py-8">No revenue data available</p>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <h4 className="font-semibold text-gray-700 mb-2">Payment Summary</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Received:</span>
              <span className="font-bold text-green-600">₹{stats.payments.received.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Pending:</span>
              <span className="font-bold text-orange-600">₹{stats.payments.pending.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Overdue:</span>
              <span className="font-bold text-red-600">₹{stats.payments.overdue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between pt-2 border-t">
              <span className="text-gray-900 font-semibold">Total Expected:</span>
              <span className="font-bold text-primary-600">
                ₹{(stats.payments.received + stats.payments.pending).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <div className="card">
          <h4 className="font-semibold text-gray-700 mb-2">Task Performance</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Tasks:</span>
              <span className="font-bold">{stats.tasks.total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Completed:</span>
              <span className="font-bold text-green-600">{stats.tasks.completed}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Success Rate:</span>
              <span className="font-bold text-blue-600">{stats.tasks.completionRate}%</span>
            </div>
            <div className="pt-2 border-t">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${stats.tasks.completionRate}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h4 className="font-semibold text-gray-700 mb-2">Client Overview</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Active Clients:</span>
              <span className="font-bold text-green-600">{stats.clients.active}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Recurring Billing:</span>
              <span className="font-bold text-blue-600">{stats.clients.recurring}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Avg Revenue/Client:</span>
              <span className="font-bold text-purple-600">
                ₹{stats.clients.active > 0 
                  ? Math.round(stats.revenue.thisMonth / stats.clients.active).toLocaleString()
                  : 0
                }
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
