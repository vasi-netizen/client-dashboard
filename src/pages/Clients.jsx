import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, Edit2, Trash2, Globe, Mail, Phone, Save, X, CheckCircle, DollarSign, Calendar, RefreshCw } from 'lucide-react'

const PRIORITIES = {
  urgent: { label: 'Urgent', icon: '🔴' },
  high: { label: 'High', icon: '🟡' },
  medium: { label: 'Medium', icon: '🔵' },
  low: { label: 'Low', icon: '⚪' }
}

const CATEGORIES = {
  seo: { label: 'SEO', icon: '📊' },
  content: { label: 'Content', icon: '✍️' },
  social_media: { label: 'Social Media', icon: '📱' },
  technical: { label: 'Technical', icon: '🔧' },
  admin: { label: 'Admin', icon: '📋' }
}

export default function Clients({ user }) {
  const [clients, setClients] = useState([])
  const [taskTemplates, setTaskTemplates] = useState([])
  const [showAddClient, setShowAddClient] = useState(false)
  const [editingClient, setEditingClient] = useState(null)
  const [showTaskModal, setShowTaskModal] = useState(null)
  const [showRecurringModal, setShowRecurringModal] = useState(null)
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

  const [recurringData, setRecurringData] = useState({
    recurring_billing: false,
    billing_amount: '',
    billing_frequency: 'monthly',
    billing_day: 15,
    billing_start_date: new Date().toISOString().split('T')[0],
    billing_active: true
  })

  const [newTask, setNewTask] = useState({
    description: '',
    priority: 'medium',
    category: 'admin',
    notes: ''
  })

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
      .order('priority', { ascending: false })

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
    if (confirm('Are you sure you want to delete this client? All associated tasks and payments will be deleted.')) {
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
    if (!newTask.description.trim() || !showTaskModal) return

    const { error } = await supabase
      .from('task_templates')
      .insert({
        client_id: showTaskModal,
        description: newTask.description,
        priority: newTask.priority,
        category: newTask.category,
        notes: newTask.notes,
        user_id: user.id
      })

    if (!error) {
      setNewTask({ description: '', priority: 'medium', category: 'admin', notes: '' })
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

  const openRecurringModal = async (client) => {
    setRecurringData({
      recurring_billing: client.recurring_billing || false,
      billing_amount: client.billing_amount || '',
      billing_frequency: client.billing_frequency || 'monthly',
      billing_day: client.billing_day || 15,
      billing_start_date: client.billing_start_date || new Date().toISOString().split('T')[0],
      billing_active: client.billing_active !== false
    })
    setShowRecurringModal(client.id)
  }

  const saveRecurringBilling = async () => {
    const { error } = await supabase
      .from('clients')
      .update(recurringData)
      .eq('id', showRecurringModal)

    if (!error) {
      // Generate initial recurring payments
      await supabase.rpc('generate_recurring_payments')
      
      fetchClients()
      setShowRecurringModal(null)
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
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusColor(client.status)}`}>
                    {client.status}
                  </span>
                  {client.recurring_billing && (
                    <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      💳 Recurring
                    </span>
                  )}
                </div>
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

            {client.recurring_billing && (
              <div className="mt-3 pt-3 border-t border-gray-200 text-sm">
                <div className="flex items-center justify-between text-gray-700">
                  <span className="font-medium">Billing:</span>
                  <span>₹{parseFloat(client.billing_amount || 0).toLocaleString()}/{client.billing_frequency}</span>
                </div>
                <div className="flex items-center justify-between text-gray-600 text-xs mt-1">
                  <span>Next: Day {client.billing_day}</span>
                  <span className={client.billing_active ? 'text-green-600' : 'text-red-600'}>
                    {client.billing_active ? 'Active' : 'Paused'}
                  </span>
                </div>
              </div>
            )}

            {client.notes && (
              <p className="mt-3 text-sm text-gray-600 border-t pt-3">
                {client.notes}
              </p>
            )}

            <div className="mt-4 flex space-x-2">
              <button
                onClick={() => fetchTasksForClient(client.id)}
                className="flex-1 btn btn-secondary text-sm"
              >
                Manage Tasks
              </button>
              <button
                onClick={() => openRecurringModal(client)}
                className="flex-1 btn btn-secondary text-sm flex items-center justify-center space-x-1"
              >
                <DollarSign className="w-4 h-4" />
                <span>Billing</span>
              </button>
            </div>
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
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[80vh] overflow-y-auto">
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
              <div className="mb-4 space-y-3">
                <input
                  type="text"
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  onKeyPress={(e) => e.key === 'Enter' && addTask()}
                  placeholder="Task description..."
                  className="input"
                />
                
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="label text-xs">Priority</label>
                    <select
                      value={newTask.priority}
                      onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                      className="input text-sm"
                    >
                      {Object.entries(PRIORITIES).map(([key, value]) => (
                        <option key={key} value={key}>
                          {value.icon} {value.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="label text-xs">Category</label>
                    <select
                      value={newTask.category}
                      onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
                      className="input text-sm"
                    >
                      {Object.entries(CATEGORIES).map(([key, value]) => (
                        <option key={key} value={key}>
                          {value.icon} {value.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button onClick={addTask} className="btn btn-primary w-full">
                      <Plus className="w-5 h-5 mx-auto" />
                    </button>
                  </div>
                </div>

                <input
                  type="text"
                  value={newTask.notes}
                  onChange={(e) => setNewTask({ ...newTask, notes: e.target.value })}
                  placeholder="Quick notes (optional)..."
                  className="input text-sm"
                />
              </div>

              <div className="space-y-2">
                {taskTemplates.map(task => {
                  const priority = PRIORITIES[task.priority] || PRIORITIES.medium
                  const category = CATEGORIES[task.category] || CATEGORIES.admin
                  
                  return (
                    <div
                      key={task.id}
                      className="flex items-start justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-800">
                            {priority.icon} {priority.label}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                            {category.icon} {category.label}
                          </span>
                        </div>
                        <span className="text-gray-800">{task.description}</span>
                        {task.notes && (
                          <p className="text-xs text-gray-500 mt-1">{task.notes}</p>
                        )}
                      </div>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="text-red-500 hover:text-red-700 ml-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )
                })}

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

      {/* Recurring Billing Modal */}
      {showRecurringModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full">
            <div className="border-b p-6 flex justify-between items-center">
              <h2 className="text-xl font-bold">Recurring Billing Setup</h2>
              <button
                onClick={() => setShowRecurringModal(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="recurring"
                  checked={recurringData.recurring_billing}
                  onChange={(e) => setRecurringData({ ...recurringData, recurring_billing: e.target.checked })}
                  className="w-5 h-5 text-primary-600"
                />
                <label htmlFor="recurring" className="font-medium text-gray-900">
                  Enable Recurring Billing
                </label>
              </div>

              {recurringData.recurring_billing && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Billing Amount (₹) *</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        className="input"
                        value={recurringData.billing_amount}
                        onChange={(e) => setRecurringData({ ...recurringData, billing_amount: e.target.value })}
                        placeholder="10000.00"
                      />
                    </div>

                    <div>
                      <label className="label">Frequency</label>
                      <select
                        className="input"
                        value={recurringData.billing_frequency}
                        onChange={(e) => setRecurringData({ ...recurringData, billing_frequency: e.target.value })}
                      >
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                    </div>

                    <div>
                      <label className="label">Billing Day (1-31)</label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        className="input"
                        value={recurringData.billing_day}
                        onChange={(e) => setRecurringData({ ...recurringData, billing_day: parseInt(e.target.value) })}
                      />
                      <p className="text-xs text-gray-500 mt-1">Day of month for payment</p>
                    </div>

                    <div>
                      <label className="label">Start Date</label>
                      <input
                        type="date"
                        className="input"
                        value={recurringData.billing_start_date}
                        onChange={(e) => setRecurringData({ ...recurringData, billing_start_date: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 pt-3 border-t">
                    <input
                      type="checkbox"
                      id="active"
                      checked={recurringData.billing_active}
                      onChange={(e) => setRecurringData({ ...recurringData, billing_active: e.target.checked })}
                      className="w-5 h-5 text-primary-600"
                    />
                    <label htmlFor="active" className="text-sm text-gray-700">
                      Billing is active (uncheck to pause)
                    </label>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                    <h4 className="font-medium text-blue-900 mb-2 flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      How It Works
                    </h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Payments will be auto-generated 3 months ahead</li>
                      <li>• They will appear in your Payments tab as "Pending"</li>
                      <li>• Just update status to "Paid" when you receive payment</li>
                      <li>• System checks daily and creates new payments automatically</li>
                    </ul>
                  </div>
                </>
              )}

              <div className="flex justify-end space-x-2 pt-4 border-t">
                <button
                  onClick={() => setShowRecurringModal(null)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={saveRecurringBilling}
                  className="btn btn-primary flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Billing Setup</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
