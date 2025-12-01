import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { CheckCircle2, Circle, Plus, Trash2, RefreshCw } from 'lucide-react'
import { format } from 'date-fns'

export default function DailyTasks({ user }) {
  const [clients, setClients] = useState([])
  const [tasks, setTasks] = useState([])
  const [specialTasks, setSpecialTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [newSpecialTask, setNewSpecialTask] = useState('')

  useEffect(() => {
    fetchData()
  }, [user])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch clients
      const { data: clientsData } = await supabase
        .from('clients')
        .select('*')
        .order('name')

      // Fetch task templates
      const { data: templatesData } = await supabase
        .from('task_templates')
        .select('*')
        .order('created_at')

      // Fetch today's task completions
      const today = format(new Date(), 'yyyy-MM-dd')
      const { data: completionsData } = await supabase
        .from('task_completions')
        .select('*')
        .eq('completion_date', today)

      // Fetch special tasks
      const { data: specialTasksData } = await supabase
        .from('special_tasks')
        .select('*')
        .eq('completed', false)
        .order('created_at', { ascending: false })

      setClients(clientsData || [])
      setTasks(templatesData || [])
      setSpecialTasks(specialTasksData || [])

      // Mark tasks as completed if they exist in today's completions
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
      // Mark as complete
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
      // Mark as incomplete
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    )
  }

  // Group tasks by client
  const tasksByClient = clients.map(client => ({
    ...client,
    tasks: tasks.filter(task => task.client_id === client.id)
  })).filter(client => client.tasks.length > 0)

  const pendingTasks = tasksByClient.filter(client => 
    client.tasks.some(task => !task.completed)
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Daily Tasks</h1>
          <p className="text-gray-600 mt-1">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
        </div>
        <button
          onClick={fetchData}
          className="btn btn-secondary flex items-center space-x-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Special Tasks */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4 text-purple-600">Special Tasks</h2>
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
            <div key={task.id} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
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
                {client.tasks.filter(task => !task.completed).map(task => (
                  <div
                    key={task.id}
                    className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <button
                      onClick={() => toggleTaskCompletion(task.id, task.completed, client.id)}
                      className="text-gray-400 hover:text-green-600 transition-colors"
                    >
                      <Circle className="w-5 h-5" />
                    </button>
                    <span className="text-gray-800 flex-1">{task.description}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-900 mb-2">All Done! 🎉</h3>
          <p className="text-gray-600">You've completed all your tasks for today.</p>
        </div>
      )}
    </div>
  )
}
