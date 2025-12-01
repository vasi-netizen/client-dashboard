import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, Edit2, Trash2, DollarSign, Calendar, TrendingUp, X, Save } from 'lucide-react'
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns'

export default function Payments({ user }) {
  const [clients, setClients] = useState([])
  const [payments, setPayments] = useState([])
  const [showAddPayment, setShowAddPayment] = useState(false)
  const [editingPayment, setEditingPayment] = useState(null)
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'))
  const [loading, setLoading] = useState(true)

  const [formData, setFormData] = useState({
    client_id: '',
    amount: '',
    due_date: format(new Date(), 'yyyy-MM-dd'),
    status: 'pending',
    payment_method: '',
    notes: ''
  })

  useEffect(() => {
    fetchData()
  }, [user])

  const fetchData = async () => {
    setLoading(true)

    // Fetch clients
    const { data: clientsData } = await supabase
      .from('clients')
      .select('*')
      .order('name')

    // Fetch payments
    const { data: paymentsData } = await supabase
      .from('payments')
      .select('*, clients(name)')
      .order('due_date', { ascending: false })

    setClients(clientsData || [])
    setPayments(paymentsData || [])
    setLoading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const paymentData = {
      ...formData,
      amount: parseFloat(formData.amount),
      user_id: user.id
    }

    if (editingPayment) {
      const { error } = await supabase
        .from('payments')
        .update(paymentData)
        .eq('id', editingPayment)

      if (!error) {
        fetchData()
        resetForm()
      }
    } else {
      const { error } = await supabase
        .from('payments')
        .insert(paymentData)

      if (!error) {
        fetchData()
        resetForm()
      }
    }
  }

  const deletePayment = async (id) => {
    if (confirm('Are you sure you want to delete this payment record?')) {
      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', id)

      if (!error) {
        fetchData()
      }
    }
  }

  const resetForm = () => {
    setFormData({
      client_id: '',
      amount: '',
      due_date: format(new Date(), 'yyyy-MM-dd'),
      status: 'pending',
      payment_method: '',
      notes: ''
    })
    setShowAddPayment(false)
    setEditingPayment(null)
  }

  const startEdit = (payment) => {
    setFormData({
      client_id: payment.client_id,
      amount: payment.amount,
      due_date: payment.due_date,
      status: payment.status,
      payment_method: payment.payment_method || '',
      notes: payment.notes || ''
    })
    setEditingPayment(payment.id)
    setShowAddPayment(true)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'overdue': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Calculate statistics for selected month
  const monthStart = startOfMonth(new Date(selectedMonth + '-01'))
  const monthEnd = endOfMonth(new Date(selectedMonth + '-01'))

  const monthlyPayments = payments.filter(p => {
    const dueDate = new Date(p.due_date)
    return isWithinInterval(dueDate, { start: monthStart, end: monthEnd })
  })

  const totalReceived = monthlyPayments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + parseFloat(p.amount), 0)

  const totalPending = monthlyPayments
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + parseFloat(p.amount), 0)

  const totalOverdue = monthlyPayments
    .filter(p => p.status === 'overdue')
    .reduce((sum, p) => sum + parseFloat(p.amount), 0)

  const totalExpected = totalReceived + totalPending

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
        <div className="flex space-x-2">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="input"
          />
          <button
            onClick={() => setShowAddPayment(true)}
            className="btn btn-primary flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Add Payment</span>
          </button>
        </div>
      </div>

      {/* Monthly Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700">Received</p>
              <p className="text-2xl font-bold text-green-900">₹{totalReceived.toFixed(2)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-700">Pending</p>
              <p className="text-2xl font-bold text-yellow-900">₹{totalPending.toFixed(2)}</p>
            </div>
            <Calendar className="w-8 h-8 text-yellow-600" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-700">Overdue</p>
              <p className="text-2xl font-bold text-red-900">₹{totalOverdue.toFixed(2)}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-red-600" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">Expected Total</p>
              <p className="text-2xl font-bold text-blue-900">₹{totalExpected.toFixed(2)}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Add/Edit Payment Form */}
      {showAddPayment && (
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">
              {editingPayment ? 'Edit Payment' : 'Add New Payment'}
            </h2>
            <button onClick={resetForm} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Client *</label>
              <select
                required
                className="input"
                value={formData.client_id}
                onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
              >
                <option value="">Select a client</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Amount (₹) *</label>
              <input
                type="number"
                step="0.01"
                required
                className="input"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="10000.00"
              />
            </div>

            <div>
              <label className="label">Due Date *</label>
              <input
                type="date"
                required
                className="input"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>

            <div>
              <label className="label">Status</label>
              <select
                className="input"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>

            <div>
              <label className="label">Payment Method</label>
              <input
                type="text"
                className="input"
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                placeholder="Bank Transfer, UPI, etc."
              />
            </div>

            <div className="md:col-span-2">
              <label className="label">Notes</label>
              <textarea
                className="input"
                rows="2"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any additional notes..."
              />
            </div>

            <div className="md:col-span-2 flex justify-end space-x-2">
              <button type="button" onClick={resetForm} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary flex items-center space-x-2">
                <Save className="w-4 h-4" />
                <span>{editingPayment ? 'Update' : 'Add'} Payment</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Payments List */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4">
          Payment Records - {format(monthStart, 'MMMM yyyy')}
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Client</th>
                <th className="text-left py-3 px-4">Amount</th>
                <th className="text-left py-3 px-4">Due Date</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-left py-3 px-4">Method</th>
                <th className="text-right py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {monthlyPayments.map(payment => (
                <tr key={payment.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{payment.clients.name}</td>
                  <td className="py-3 px-4">₹{parseFloat(payment.amount).toFixed(2)}</td>
                  <td className="py-3 px-4">{format(new Date(payment.due_date), 'MMM dd, yyyy')}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusColor(payment.status)}`}>
                      {payment.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">{payment.payment_method || '-'}</td>
                  <td className="py-3 px-4">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => startEdit(payment)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deletePayment(payment.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {monthlyPayments.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No payments recorded for this month
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
