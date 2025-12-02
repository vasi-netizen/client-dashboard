import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, Edit2, Trash2, Copy, Save, X, Package } from 'lucide-react'

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

export default function Templates({ user }) {
  const [templates, setTemplates] = useState([])
  const [clients, setClients] = useState([])
  const [showAddTemplate, setShowAddTemplate] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [loading, setLoading] = useState(true)

  const [formData, setFormData] = useState({
    template_name: '',
    description: '',
    tasks: [{ description: '', priority: 'medium', category: 'admin', notes: '' }]
  })

  useEffect(() => {
    fetchData()
  }, [user])

  const fetchData = async () => {
    setLoading(true)

    const { data: templatesData } = await supabase
      .from('task_templates_library')
      .select('*')
      .order('created_at', { ascending: false })

    const { data: clientsData } = await supabase
      .from('clients')
      .select('*')
      .order('name')

    setTemplates(templatesData || [])
    setClients(clientsData || [])
    setLoading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const templateData = {
      template_name: formData.template_name,
      description: formData.description,
      tasks: formData.tasks,
      user_id: user.id
    }

    if (editingTemplate) {
      const { error } = await supabase
        .from('task_templates_library')
        .update(templateData)
        .eq('id', editingTemplate)

      if (!error) {
        fetchData()
        resetForm()
      }
    } else {
      const { error } = await supabase
        .from('task_templates_library')
        .insert(templateData)

      if (!error) {
        fetchData()
        resetForm()
      }
    }
  }

  const deleteTemplate = async (id) => {
    if (confirm('Are you sure you want to delete this template?')) {
      const { error} = await supabase
        .from('task_templates_library')
        .delete()
        .eq('id', id)

      if (!error) {
        fetchData()
      }
    }
  }

  const applyToClient = async (template, clientId) => {
    const tasks = template.tasks

    const taskPromises = tasks.map(task =>
      supabase.from('task_templates').insert({
        client_id: clientId,
        description: task.description,
        priority: task.priority,
        category: task.category,
        notes: task.notes,
        user_id: user.id
      })
    )

    await Promise.all(taskPromises)
    alert(`Template "${template.template_name}" applied successfully!`)
  }

  const addTaskToForm = () => {
    setFormData({
      ...formData,
      tasks: [...formData.tasks, { description: '', priority: 'medium', category: 'admin', notes: '' }]
    })
  }

  const removeTaskFromForm = (index) => {
    setFormData({
      ...formData,
      tasks: formData.tasks.filter((_, i) => i !== index)
    })
  }

  const updateTaskInForm = (index, field, value) => {
    const newTasks = [...formData.tasks]
    newTasks[index][field] = value
    setFormData({ ...formData, tasks: newTasks })
  }

  const resetForm = () => {
    setFormData({
      template_name: '',
      description: '',
      tasks: [{ description: '', priority: 'medium', category: 'admin', notes: '' }]
    })
    setShowAddTemplate(false)
    setEditingTemplate(null)
  }

  const startEdit = (template) => {
    setFormData({
      template_name: template.template_name,
      description: template.description || '',
      tasks: template.tasks
    })
    setEditingTemplate(template.id)
    setShowAddTemplate(true)
  }

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Task Templates</h1>
          <p className="text-gray-600 mt-1">Create reusable task bundles</p>
        </div>
        <button
          onClick={() => setShowAddTemplate(true)}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Create Template</span>
        </button>
      </div>

      {showAddTemplate && (
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">
              {editingTemplate ? 'Edit Template' : 'Create New Template'}
            </h2>
            <button onClick={resetForm} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Template Name *</label>
              <input
                type="text"
                required
                className="input"
                value={formData.template_name}
                onChange={(e) => setFormData({ ...formData, template_name: e.target.value })}
                placeholder="e.g., SEO Package, Social Media Bundle"
              />
            </div>

            <div>
              <label className="label">Description</label>
              <textarea
                className="input"
                rows="2"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of this template..."
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="label mb-0">Tasks *</label>
                <button
                  type="button"
                  onClick={addTaskToForm}
                  className="text-sm btn btn-secondary"
                >
                  <Plus className="w-4 h-4 inline mr-1" />
                  Add Task
                </button>
              </div>

              <div className="space-y-3">
                {formData.tasks.map((task, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="md:col-span-2">
                        <input
                          type="text"
                          required
                          className="input"
                          value={task.description}
                          onChange={(e) => updateTaskInForm(index, 'description', e.target.value)}
                          placeholder="Task description"
                        />
                      </div>

                      <div>
                        <select
                          className="input text-sm"
                          value={task.priority}
                          onChange={(e) => updateTaskInForm(index, 'priority', e.target.value)}
                        >
                          {Object.entries(PRIORITIES).map(([key, value]) => (
                            <option key={key} value={key}>
                              {value.icon} {value.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <select
                          className="input text-sm"
                          value={task.category}
                          onChange={(e) => updateTaskInForm(index, 'category', e.target.value)}
                        >
                          {Object.entries(CATEGORIES).map(([key, value]) => (
                            <option key={key} value={key}>
                              {value.icon} {value.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <input
                          type="text"
                          className="input text-sm"
                          value={task.notes}
                          onChange={(e) => updateTaskInForm(index, 'notes', e.target.value)}
                          placeholder="Notes (optional)"
                        />
                      </div>
                    </div>

                    {formData.tasks.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTaskFromForm(index)}
                        className="text-red-600 hover:text-red-700 text-sm mt-2"
                      >
                        <Trash2 className="w-4 h-4 inline mr-1" />
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t">
              <button type="button" onClick={resetForm} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary flex items-center space-x-2">
                <Save className="w-4 h-4" />
                <span>{editingTemplate ? 'Update' : 'Create'} Template</span>
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map(template => {
          const tasks = template.tasks

          return (
            <div key={template.id} className="card hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <Package className="w-5 h-5 text-primary-600" />
                    <h3 className="text-lg font-bold text-gray-900">{template.template_name}</h3>
                  </div>
                  {template.description && (
                    <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                  )}
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => startEdit(template)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteTemplate(template.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <p className="text-sm font-medium text-gray-700">{tasks.length} Tasks:</p>
                {tasks.slice(0, 3).map((task, index) => {
                  const priority = PRIORITIES[task.priority]
                  const category = CATEGORIES[task.category]
                  return (
                    <div key={index} className="text-sm text-gray-600 pl-3">
                      • {task.description}
                      <div className="flex space-x-2 mt-1">
                        <span className="text-xs">{priority.icon} {priority.label}</span>
                        <span className="text-xs">{category.icon} {category.label}</span>
                      </div>
                    </div>
                  )
                })}
                {tasks.length > 3 && (
                  <p className="text-sm text-gray-500 pl-3">+ {tasks.length - 3} more tasks</p>
                )}
              </div>

              <div className="relative group">
                <button className="w-full btn btn-primary flex items-center justify-center space-x-2">
                  <Copy className="w-4 h-4" />
                  <span>Apply to Client</span>
                </button>
                
                <div className="hidden group-hover:block absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                  {clients.map(client => (
                    <button
                      key={client.id}
                      onClick={() => applyToClient(template, client.id)}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm"
                    >
                      {client.name}
                    </button>
                  ))}
                  {clients.length === 0 && (
                    <div className="px-4 py-2 text-sm text-gray-500">
                      No clients available
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {templates.length === 0 && !showAddTemplate && (
        <div className="card text-center py-12">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Templates Yet</h3>
          <p className="text-gray-600 mb-4">
            Create reusable task bundles to quickly set up new clients
          </p>
          <button onClick={() => setShowAddTemplate(true)} className="btn btn-primary">
            Create Your First Template
          </button>
        </div>
      )}
    </div>
  )
}
