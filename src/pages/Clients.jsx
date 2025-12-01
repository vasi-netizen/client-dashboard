import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, Edit2, Trash2, Globe, Mail, Phone, Save, X, CheckCircle } from 'lucide-react'

export default function Clients({ user }) {
  const [clients, setClients] = useState([])
  const [taskTemplates, setTaskTemplates] = useState([])
  const [showAddClient, setShowAddClient] = useState(false)
  const [editingClient, setEditingClient] = useState(null)
  const [showTaskModal, setShowTaskModal] = useState(null)
  const [loading, setLoading] = useState(true)

  const [formData, setFormData] = useState({
    name: '',
    website: '',
    email: '',
    phone: '',
    contact_person: '',
    status: 'active',
    notes: ''
  })

  const [newTask, setNewTask] = useState('')

  useEffect(() => {
    fetchClients()
  }, [user])

  const fetchClients = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('name')

    if (!error) {
      setClients(data || [])
    }
    setLoading(false)
  }

  const fetchTasksForClient = async (clientId) => {
    const { data } = await supabase
      .from('task_templates')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at')

    setTaskTemplates(data || [])
    setShowTaskModal(clientId)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (editingClient) {
      const { error } = await supabase
        .from('clients')
        .update(formData)
        .eq('id', editingClient)

      if (!error) {
        fetchClients()
        resetForm()
      }
    } else {
      const { error } = await supabase
        .from('clients')
        .insert({ ...formData, user_id: user.id })

      if (!error) {
        fetchClients()
        resetForm()
      }
    }
  }

  const deleteClient = async (id) => {
    if (confirm('Are you sure you want to delete this client? All associated tasks will be deleted.')) {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id)

      if (!error) {
        fetchClients()
      }
    }
  }

  const addTask = async () => {
    if (!newTask.trim() || !showTaskModal) return

    const { error } = await supabase
      .from('task_templates')
      .insert({
        client_id: showTaskModal,
        description: newTask,
        user_id: user.id
      })

    if (!error) {
      setNewTask('')
      fetchTasksForClient(showTaskModal)
    }
  }

  const deleteTask = async (taskId) => {
    const { error } = await supabase
      .from('task_templates')
      .delete()
      .eq('id', taskId)

    if (!error) {
      fetchTasksForClient(showTaskModal)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      website: '',
      email: '',
      phone: '',
      contact_person: '',
      status: 'active',
      notes: ''
    })
    setShowAddClient(false)
    setEditingClient(null)
  }

  const startEdit = (client) => {
    setFormData(client)
    setEditingClient(client.id)
    setShowAddClient(true)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'paused': return 'bg-yellow-100 text-yellow-800'
      case 'churned': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
        <button
          onClick={() => setShowAddClient(true)}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add Client</span>
        </button>
      </div>

      {/* Add/Edit Client Form */}
      {showAddClient && (
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">
              {editingClient ? 'Edit Client' : 'Add New Client'}
            </h2>
            <button onClick={resetForm} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Client Name *</label>
              <input
                type="text"
                required
                className="input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <label className="label">Website *</label>
              <input
                type="url"
                required
                className="input"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://example.com"
              />
            </div>

            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div>
              <label className="label">Phone</label>
              <input
                type="tel"
                className="input"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div>
              <label className="label">Contact Person</label>
              <input
                type="text"
                className="input"
                value={formData.contact_person}
                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
              />
            </div>

            <div>
              <label className="label">Status</label>
              <select
                className="input"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="churned">Churned</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="label">Notes</label>
              <textarea
                className="input"
                rows="3"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any special instructions or notes..."
              />
            </div>

            <div className="md:col-span-2 flex justify-end space-x-2">
              <button type="button" onClick={resetForm} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary flex items-center space-x-2">
                <Save className="w-4 h-4" />
                <span>{editingClient ? 'Update' : 'Add'} Client</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clients.map(client => (
          <div key={client.id} className="card hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900">{client.name}</h3>
                <span className={`inline-block px-2 py-1 rounded text-xs font-medium mt-1 ${getStatusColor(client.status)}`}>
                  {client.status}
                </span>
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={() => startEdit(client)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteClient(client.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              {client.website && (
                <a
                  href={client.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-primary-600 hover:underline"
                >
                  <Globe className="w-4 h-4" />
                  <span className="truncate">{client.website}</span>
                </a>
              )}
              {client.email && (
                <div className="flex items-center space-x-2 text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span className="truncate">{client.email}</span>
                </div>
              )}
              {client.phone && (
                <div className="flex items-center space-x-2 text-gray-600">
                  <Phone className="w-4 h-4" />
                  <span>{client.phone}</span>
                </div>
              )}
              {client.contact_person && (
                <div className="text-gray-600">
                  <strong>Contact:</strong> {client.contact_person}
                </div>
              )}
            </div>

            {client.notes && (
              <p className="mt-3 text-sm text-gray-600 border-t pt-3">
                {client.notes}
              </p>
            )}

            <button
              onClick={() => fetchTasksForClient(client.id)}
              className="mt-4 w-full btn btn-secondary text-sm"
            >
              Manage Tasks
            </button>
          </div>
        ))}
      </div>

      {clients.length === 0 && !showAddClient && (
        <div className="card text-center py-12">
          <p className="text-gray-600 mb-4">No clients yet. Add your first client to get started!</p>
          <button onClick={() => setShowAddClient(true)} className="btn btn-primary">
            Add Your First Client
          </button>
        </div>
      )}

      {/* Task Management Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
              <h2 className="text-xl font-bold">
                Manage Tasks - {clients.find(c => c.id === showTaskModal)?.name}
              </h2>
              <button
                onClick={() => setShowTaskModal(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="flex space-x-2 mb-4">
                <input
                  type="text"
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTask()}
                  placeholder="Add a daily task..."
                  className="input flex-1"
                />
                <button onClick={addTask} className="btn btn-primary">
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2">
                {taskTemplates.map(task => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-gray-800">{task.description}</span>
                    </div>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                {taskTemplates.length === 0 && (
                  <p className="text-gray-500 text-center py-8">
                    No tasks yet. Add tasks that need to be done daily for this client.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
