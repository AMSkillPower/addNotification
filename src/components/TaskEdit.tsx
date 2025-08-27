// src/components/TaskEdit.tsx
import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { apiService } from '../services/api'
import { Task } from '../types'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { ArrowLeft, Save, X } from 'lucide-react'
import Select from 'react-select'

const TaskEdit: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>()
  const navigate = useNavigate()
  const [task, setTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { dispatch } = useApp()
  const { canModifyTask } = useAuth()
  const [usersList, setUsersList] = useState<string[]>([])

  // Caricamento utenti
  const fetchUsers = async () => {
    try {
      const data = await apiService.getUsers()
      setUsersList(data.map((u: { username: string }) => u.username))
    } catch (err) {
      console.error('Errore nel caricamento utenti:', err)
      dispatch({ type: 'SET_ERROR', payload: 'Errore nel caricamento utenti' })
    }
  }

  // Caricamento task + utenti
  useEffect(() => {
    const fetchTask = async () => {
      try {
        const taskData = await apiService.getTaskById(taskId!)
        setTask(taskData as Task)
      } catch (error) {
        console.error('Errore caricamento task:', error)
        dispatch({ type: 'SET_ERROR', payload: 'Errore nel caricamento del task' })
        navigate(-1)
      } finally {
        setLoading(false)
      }
    }

    fetchTask()
    fetchUsers()
  }, [taskId, dispatch, navigate])

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!task) return

    if (!canModifyTask(task)) {
      dispatch({
        type: 'SET_ERROR',
        payload: 'Non hai i permessi per modificare questo task',
      })
      return
    }

    setSaving(true)
    try {
      await apiService.updateTask(task.id!, task)
      navigate(`/task/${task.id}`)
    } catch (error) {
      console.error('Errore aggiornamento task:', error)
      dispatch({ type: 'SET_ERROR', payload: 'Errore durante il salvataggio' })
    } finally {
      setSaving(false)
    }
  }

  // Cambio valori
  const handleChange = (field: keyof Task, value: string) => {
    if (!task) return
    setTask({ ...task, [field]: value })
  }

  // Loader
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Task non trovato
  if (!task) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Task non trovato</p>
      </div>
    )
  }

  const stati = ['aperto', 'in corso', 'testing', 'test fallito', 'chiuso']
  const priorita = ['alta', 'media', 'bassa']

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Torna indietro */}
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Torna indietro
        </button>
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-200">
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-8">
            Modifica Task:{' '}
            <span className="text-blue-600">{task.codiceTask}</span>
          </h1>

          <form onSubmit={handleSubmit} className="space-y-10">
            {/* Dati principali */}
            <section>
              <h2 className="text-lg font-semibold text-gray-700 mb-4">
                Dati principali
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Colonna sinistra */}
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Codice Task *
                    </label>
                    <input
                      type="text"
                      value={task.codiceTask || ''}
                      onChange={(e) => handleChange('codiceTask', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descrizione
                    </label>
                    <textarea
                      value={task.descrizione || ''}
                      onChange={(e) => handleChange('descrizione', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Colonna destra */}
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priorità
                    </label>
                    <select
                      value={task.priorità || ''}
                      onChange={(e) => handleChange('priorità', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Seleziona priorità</option>
                      {priorita.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Stato
                    </label>
                    <select
                      value={task.stato || ''}
                      onChange={(e) => handleChange('stato', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Seleziona stato</option>
                      {stati.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </section>

            {/* Assegnazioni e Date */}
            <section>
              <h2 className="text-lg font-semibold text-gray-700 mb-4">
                Assegnazioni & Date
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Utente
                  </label>
                  <Select
                    options={usersList.map((u) => ({ value: u, label: u }))}
                    value={
                      usersList.includes(task.utente || '')
                        ? { value: task.utente, label: task.utente }
                        : null
                    }
                    onChange={(selected) =>
                      handleChange('utente', selected ? selected.value : '')
                    }
                    placeholder="Seleziona un utente..."
                    isClearable
                    styles={{
                      control: (base) => ({
                        ...base,
                        borderRadius: '0.75rem',
                        minHeight: '42px',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                      }),
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data Segnalazione
                  </label>
                  <input
                    type="date"
                    value={
                      task.dataSegnalazione
                        ? new Date(task.dataSegnalazione).toISOString().split('T')[0]
                        : ''
                    }
                    onChange={(e) => handleChange('dataSegnalazione', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data Scadenza
                  </label>
                  <input
                    type="date"
                    value={
                      task.dataScadenza
                        ? new Date(task.dataScadenza).toISOString().split('T')[0]
                        : ''
                    }
                    onChange={(e) => handleChange('dataScadenza', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </section>

            {/* Commenti */}
            <section>
              <h2 className="text-lg font-semibold text-gray-700 mb-4">
                Commenti
              </h2>
              <textarea
                value={task.commenti || ''}
                onChange={(e) => handleChange('commenti', e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </section>

            {/* Pulsanti */}
            <div className="flex justify-end space-x-4 pt-4">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-300 flex items-center shadow-sm"
              >
                <X className="h-4 w-4 mr-2" />
                Annulla
              </button>
              <button
                type="submit"
                disabled={saving || !canModifyTask(task)}
                className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center shadow-sm"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Salvataggio...' : 'Salva Modifiche'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default TaskEdit
