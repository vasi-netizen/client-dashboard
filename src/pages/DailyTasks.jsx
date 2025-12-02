import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { CheckCircle2, Circle, Plus, Trash2, RefreshCw, Filter, StickyNote, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import TaskNotesModal from '../components/TaskNotesModal'

const PRIORITIES = {
  urgent: { label: 'Urgent', color: 'bg-red-100 text-red-800 border-red-200', icon: '🔴' },
  high: { label: 'High', color: 'bg-orange-100 text-orange-800 border-orange-200', icon: '🟡' },
  medium: { label: 'Medium', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: '🔵' },
  low: { label: 'Low', color: 'bg-gray-100 text-gray-800 border-gray-200', icon: '⚪' }
}

const CATEGORIES = {
  seo: { label: 'SEO', color: 'bg-purple-100 text-purple-800', icon: '📊' },
  content: { label: 'Content', color: 'bg-green-100 text-green-800', icon: '✍️' },
  social_media: { label: 'Social Media', color: 'bg-pink-100 text-pink-800', icon: '📱' },
  technical: { label: 'Technical', color: 'bg-indigo-100 text-indigo-800', icon: '🔧' },
  admin: { label: 'Admin', color: 'bg-gray-100 text-gray-800', icon: '📋' }
}

export default function DailyTasks({ user }) {
  const [clients, setClients] = useState([])
  const [tasks, setTasks] = useState([])
  const [specialTasks, setSpecialTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [newSpecialTask, setNewSpecialTask] = useState('')
  const [selectedPriority, setSelectedPriority] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedTask, setSelectedTask] = useState(null)
  const [showNotesModal, setShowNotesModal] = useState(false)

  useEffect(() => {
    fetchData()
  }, [user])

  const fetchData = async () => {
    setLoading(true)
    try {
      const { data: clientsData } = await supabase
        .from('clients')
        .select('*')
        .order('name')

      const { data: templatesData } = await supabase
        .from('task_templates')
        .select('*')
        .order('priority', { ascending: false })

      const today = format(new Date(), 'yyyy-MM-dd')
      const { data: completionsData } = await supabase
        .from('task_completions')
        .select('*')
        .eq('completion_date', today)

      const { data: specialTasksData } = await supabase
        .from('special_tasks')
        .select('*')
        .eq('completed', false)
        .order('created_at', { ascending: false })

      setClients(clientsData || [])
      setSpecialTasks(specialTasksData || [])

      if (templatesData && completionsData) {
        const completedTaskIds = completionsData.map(c => c.task_template_id)
        setTasks(templatesData.map(task => ({
          ...task,
          completed: completedTaskIds.includes(task.id)
        })))
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleTaskCompletion = async (taskId, currentStatus, clientId) => {
    const today = format(new Date(), 'yyyy-MM-dd')

    if (!currentStatus) {
      const { error } = await supabase
        .from('task_completions')
        .insert({
          task_template_id: taskId,
          client_id: clientId,
          completion_date: today,
          user_id: user.id
        })

      if (!error) {
        setTasks(tasks.map(task =>
          task.id === taskId ? { ...task, completed: true } : task
        ))
      }
    } else {
      const { error } = await supabase
        .from('task_completions')
        .delete()
        .eq('task_template_id', taskId)
        .eq('completion_date', today)

      if (!error) {
        setTasks(tasks.map(task =>
          task.id === taskId ? { ...task, completed: false } : task
        ))
      }
    }
  }

  const addSpecialTask = async () => {
    if (!newSpecialTask.trim()) return

    const { data, error } = await supabase
      .from('special_tasks')
      .insert({
        description: newSpecialTask,
        user_id: user.id,
        completed: false
      })
      .select()

    if (!error && data) {
      setSpecialTasks([data[0], ...specialTasks])
      setNewSpecialTask('')
    }
  }

  const completeSpecialTask = async (taskId) => {
    const { error } = await supabase
      .from('special_tasks')
      .update({ completed: true })
      .eq('id', taskId)

    if (!error) {
      setSpecialTasks(specialTasks.filter(task => task.id !== taskId))
    }
  }

  const deleteSpecialTask = async (taskId) => {
    const { error } = await supabase
      .from('special_tasks')
      .delete()
      .eq('id', taskId)

    if (!error) {
      setSpecialTasks(specialTasks.filter(task => task.id !== taskId))
    }
  }

  const openNotesModal = (task) => {
    setSelectedTask(task)
    setShowNotesModal(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    )
  }

  // Filter tasks
  let filteredTasks = tasks
  if (selectedPriority !== 'all') {
    filteredTasks = filteredTasks.filter(task => task.priority === selectedPriority)
  }
  if (selectedCategory !== 'all') {
    filteredTasks = filteredTasks.filter(task => task.category === selectedCategory)
  }

  // Group tasks by client
  const tasksByClient = clients.map(client => ({
    ...client,
    tasks: filteredTasks.filter(task => task.client_id === client.id)
  })).filter(client => client.tasks.length > 0)

  const pendingTasks = tasksByClient.filter(client => 
    client.tasks.some(task => !task.completed)
  )

  // Calculate stats
  const totalTasks = filteredTasks.length
  const completedTasks = filteredTasks.filter(t => t.completed).length
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Daily Tasks</h1>
          <p className="text-gray-600 mt-1">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
          <div className="flex items-center space-x-4 mt-2 text-sm">
            <span className="text-gray-600">
              {completedTasks}/{totalTasks} completed ({completionRate}%)
            </span>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn ${showFilters ? 'btn-primary' : 'btn-secondary'} flex items-center space-x-2`}
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
          </button>
          <button
            onClick={fetchData}
            className="btn btn-secondary flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="card">
          <h3 className="font-semibold mb-3">Filter Tasks</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Priority</label>
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="input"
              >
                <option value="all">All Priorities</option>
                {Object.entries(PRIORITIES).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value.icon} {value.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="input"
              >
                <option value="all">All Categories</option>
                {Object.entries(CATEGORIES).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value.icon} {value.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Special Tasks */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4 text-purple-600 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          Special Tasks
        </h2>
        <div className="space-y-3">
          <div className="flex space-x-2">
            <input
              type="text"
              value={newSpecialTask}
              onChange={(e) => setNewSpecialTask(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addSpecialTask()}
              placeholder="Add a special task..."
              className="input flex-1"
            />
            <button onClick={addSpecialTask} className="btn btn-primary">
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {specialTasks.map(task => (
            <div key={task.id} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center space-x-3 flex-1">
                <button
                  onClick={() => completeSpecialTask(task.id)}
                  className="text-purple-500 hover:text-purple-700"
                >
                  <Circle className="w-5 h-5" />
                </button>
                <span className="text-gray-800">{task.description}</span>
              </div>
              <button
                onClick={() => deleteSpecialTask(task.id)}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}

          {specialTasks.length === 0 && (
            <p className="text-gray-500 text-center py-4">No special tasks yet</p>
          )}
        </div>
      </div>

      {/* Pending Tasks by Client */}
      {pendingTasks.length > 0 ? (
        <div className="space-y-4">
          {pendingTasks.map(client => (
            <div key={client.id} className="card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{client.name}</h2>
                  <a
                    href={client.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary-600 hover:underline"
                  >
                    {client.website}
                  </a>
                </div>
                <div className="text-sm text-gray-600">
                  {client.tasks.filter(t => t.completed).length} / {client.tasks.length} completed
                </div>
              </div>

              <div className="space-y-2">
                {client.tasks.filter(task => !task.completed).map(task => {
                  const priority = PRIORITIES[task.priority] || PRIORITIES.medium
                  const category = CATEGORIES[task.category] || CATEGORIES.admin
                  
                  return (
                    <div
                      key={task.id}
                      className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                    >
                      <button
                        onClick={() => toggleTaskCompletion(task.id, task.completed, client.id)}
                        className="text-gray-400 hover:text-green-600 transition-colors flex-shrink-0"
                      >
                        <Circle className="w-5 h-5" />
                      </button>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className={`text-xs px-2 py-1 rounded font-medium border ${priority.color}`}>
                            {priority.icon} {priority.label}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded font-medium ${category.color}`}>
                            {category.icon} {category.label}
                          </span>
                        </div>
                        <span className="text-gray-800">{task.description}</span>
                        {task.notes && (
                          <p className="text-xs text-gray-500 mt-1">{task.notes}</p>
                        )}
                      </div>

                      <button
                        onClick={() => openNotesModal(task)}
                        className="text-gray-500 hover:text-primary-600 flex-shrink-0"
                      >
                        <StickyNote className="w-4 h-4" />
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-900 mb-2">All Done! 🎉</h3>
          <p className="text-gray-600">You've completed all your tasks for today.</p>
          {(selectedPriority !== 'all' || selectedCategory !== 'all') && (
            <button
              onClick={() => {
                setSelectedPriority('all')
                setSelectedCategory('all')
              }}
              className="btn btn-secondary mt-4"
            >
              Clear Filters
            </button>
          )}
        </div>
      )}

      {/* Task Notes Modal */}
      {showNotesModal && selectedTask && (
        <TaskNotesModal
          task={selectedTask}
          onClose={() => {
            setShowNotesModal(false)
            setSelectedTask(null)
            fetchData()
          }}
          userId={user.id}
        />
      )}
    </div>
  )
}
