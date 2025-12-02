import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { X, Plus, Trash2, Save } from 'lucide-react'
import { format } from 'date-fns'

export default function TaskNotesModal({ task, onClose, userId }) {
  const [notes, setNotes] = useState([])
  const [newNote, setNewNote] = useState('')
  const [taskNotes, setTaskNotes] = useState(task.notes || '')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchNotes()
  }, [task.id])

  const fetchNotes = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('task_notes')
      .select('*')
      .eq('task_template_id', task.id)
      .order('created_at', { ascending: false })

    setNotes(data || [])
    setLoading(false)
  }

  const addNote = async () => {
    if (!newNote.trim()) return

    const { data, error } = await supabase
      .from('task_notes')
      .insert({
        task_template_id: task.id,
        user_id: userId,
        note: newNote
      })
      .select()

    if (!error && data) {
      setNotes([data[0], ...notes])
      setNewNote('')
    }
  }

  const deleteNote = async (noteId) => {
    const { error } = await supabase
      .from('task_notes')
      .delete()
      .eq('id', noteId)

    if (!error) {
      setNotes(notes.filter(n => n.id !== noteId))
    }
  }

  const saveTaskNotes = async () => {
    setSaving(true)
    const { error } = await supabase
      .from('task_templates')
      .update({ notes: taskNotes })
      .eq('id', task.id)

    if (!error) {
      setTimeout(() => {
        setSaving(false)
        onClose()
      }, 500)
    } else {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">Task Notes</h2>
            <p className="text-sm text-gray-600 mt-1">{task.description}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Quick Notes (saved with task) */}
          <div>
            <label className="label">Quick Notes</label>
            <textarea
              value={taskNotes}
              onChange={(e) => setTaskNotes(e.target.value)}
              placeholder="Add quick notes about this task..."
              className="input"
              rows="3"
            />
            <button
              onClick={saveTaskNotes}
              disabled={saving}
              className="btn btn-primary mt-2 flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Notes'}</span>
            </button>
          </div>

          {/* Detailed Notes/Comments */}
          <div>
            <label className="label">Detailed Comments</label>
            <div className="flex space-x-2 mb-4">
              <input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addNote()}
                placeholder="Add a detailed comment..."
                className="input flex-1"
              />
              <button onClick={addNote} className="btn btn-primary">
                <Plus className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              {loading ? (
                <p className="text-gray-500 text-center py-4">Loading notes...</p>
              ) : notes.length > 0 ? (
                notes.map(note => (
                  <div key={note.id} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-gray-800">{note.note}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {format(new Date(note.created_at), 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>
                      <button
                        onClick={() => deleteNote(note.id)}
                        className="text-red-500 hover:text-red-700 ml-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">
                  No detailed comments yet. Add one above!
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
