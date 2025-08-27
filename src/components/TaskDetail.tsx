// src/components/TaskDetail.tsx
import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { apiService } from '../services/api'
import { Task, Allegato } from '../types'
import {
  AlertCircle,
  CheckCircle,
  Clock,
  FlaskConical,
  XCircle,
  Calendar,
  User,
  ArrowLeft,
  Edit,
  Trash2,
  Paperclip,
  Upload,
  Download,
  X,
  Image,
  FileText
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import ConfirmModal from './ConfirmModal'

const TaskDetail: React.FC = () => {
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const { taskId } = useParams<{ taskId: string }>()
  const navigate = useNavigate()
  const [task, setTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)
  const [allegati, setAllegati] = useState<Allegato[]>([])
  const [showUploadForm, setShowUploadForm] = useState(false)
  const { dispatch } = useApp()
  const { canModifyTask } = useAuth()
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  })

  useEffect(() => {
    const fetchTask = async () => {
      try {
        const [taskData, allegatiData] = await Promise.all([
          apiService.getTaskById(taskId!),
          apiService.getTaskAllegati(parseInt(taskId!))
        ])
        setTask(taskData as Task)
        setAllegati(allegatiData)
      } catch (error) {
        console.error('Error fetching task:', error)
        dispatch({
          type: 'SET_ERROR',
          payload: 'Error loading task details',
        })
      } finally {
        setLoading(false)
      }
    }

    fetchTask()
  }, [taskId, dispatch])

  const getStatoColor = (stato: string) => {
    switch (stato) {
      case 'aperto':
        return 'bg-red-100 text-red-800'
      case 'in corso':
        return 'bg-blue-100 text-blue-800'
      case 'chiuso':
        return 'bg-green-100 text-green-800'
      case 'testing':
        return 'bg-purple-100 text-purple-800'
      case 'test fallito':
        return 'bg-pink-100 text-pink-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatoIcon = (stato: string) => {
    switch (stato) {
      case 'aperto':
        return <AlertCircle className="h-4 w-4" />
      case 'in corso':
        return <Clock className="h-4 w-4" />
      case 'chiuso':
        return <CheckCircle className="h-4 w-4" />
      case 'testing':
        return <FlaskConical className="h-4 w-4" />
      case 'test fallito':
        return <XCircle className="h-4 w-4" />
      default:
        return null
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'alta':
        return 'bg-red-100 text-red-800'
      case 'media':
        return 'bg-yellow-100 text-yellow-800'
      case 'bassa':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleDelete = () => {
    if (!task) return
    
    setConfirmModal({
      isOpen: true,
      title: "Conferma Eliminazione",
      message: `Sei sicuro di voler eliminare il task "${task.codiceTask}"?`,
      onConfirm: async () => {
        try {
          await apiService.deleteTask(task.id!)
          navigate('/', { replace: true })
        } catch (error) {
          console.error('Error deleting task:', error)
          dispatch({
            type: 'SET_ERROR',
            payload: 'Error deleting task',
          })
        }
      },
    })
  }

  const closeConfirmModal = () => {
    setConfirmModal((prev) => ({ ...prev, isOpen: false }))
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !task) return

    // Limite di 10MB
    if (file.size > 10 * 1024 * 1024) {
      alert('Il file è troppo grande. Massimo 10MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const base64 = event.target?.result as string
        const nuovoAllegato: Omit<Allegato, 'id'> = {
          allegato: base64,
          idTask: task.id!
        }

        const allegatoCreato = await apiService.createAllegato(nuovoAllegato)
        setAllegati(prev => [allegatoCreato, ...prev])
        setShowUploadForm(false)
      } catch (error) {
        console.error('Error uploading file:', error)
        alert('Errore durante il caricamento del file')
      }
    }
    reader.readAsDataURL(file)
  }

  const handleDeleteAllegato = async (id: number) => {
    if (confirm(`Sei sicuro di voler eliminare questo allegato?`)) {
      try {
        await apiService.deleteAllegato(id)
        setAllegati(prev => prev.filter(a => a.id !== id))
      } catch (error) {
        console.error('Error deleting attachment:', error)
        alert('Errore durante l\'eliminazione dell\'allegato')
      }
    }
  }

  const downloadAllegato = (allegato: Allegato) => {
    const link = document.createElement('a')
    link.href = allegato.allegato
    
    // Estrai il tipo di file dal data URL
    const mimeMatch = allegato.allegato.match(/data:([^;]+)/)
    let fileName = `allegato_${allegato.id}`
    
    if (mimeMatch) {
      const mimeType = mimeMatch[1]
      if (mimeType.startsWith('image/')) {
        const extension = mimeType.split('/')[1]
        fileName = `allegato_${allegato.id}.${extension}`
      } else if (mimeType === 'application/pdf') {
        fileName = `allegato_${allegato.id}.pdf`
      } else if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) {
        fileName = `allegato_${allegato.id}.xlsx`
      } else if (mimeType.includes('word') || mimeType.includes('document')) {
        fileName = `allegato_${allegato.id}.docx`
      } else if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) {
        fileName = `allegato_${allegato.id}.pptx`
      }
    }
    
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Funzione per dividere gli allegati in immagini e documenti
  const separateAllegati = () => {
    const immagini = allegati.filter(allegato => {
      // Controlla se è un'immagine dal data URL
      return allegato.allegato.startsWith('data:image/')
    })
    
    const documenti = allegati.filter(allegato => {
      // Tutto quello che non è un'immagine
      return !allegato.allegato.startsWith('data:image/')
    })
    
    return { immagini, documenti }
  }

  // Funzione per ottenere l'icona del tipo di file dal data URL
  const getFileIcon = (allegato: Allegato) => {
    const mimeMatch = allegato.allegato.match(/data:([^;]+)/)
    const mimeType = mimeMatch?.[1] || ''
    
    if (mimeType.includes('pdf')) {
      return <FileText className="h-5 w-5 text-red-600" />
    } else if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) {
      return <FileText className="h-5 w-5 text-green-600" />
    } else if (mimeType.includes('word') || mimeType.includes('document')) {
      return <FileText className="h-5 w-5 text-blue-600" />
    } else if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) {
      return <FileText className="h-5 w-5 text-orange-600" />
    } else {
      return <FileText className="h-5 w-5 text-gray-600" />
    }
  }

  // Funzione per ottenere il tipo di file leggibile dal data URL
  const getFileTypeLabel = (allegato: Allegato) => {
    const mimeMatch = allegato.allegato.match(/data:([^;]+)/)
    const mimeType = mimeMatch?.[1] || ''
    
    if (mimeType.includes('pdf')) {
      return 'PDF'
    } else if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) {
      return 'Excel'
    } else if (mimeType.includes('word') || mimeType.includes('document')) {
      return 'Word'
    } else if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) {
      return 'PowerPoint'
    } else if (mimeType.includes('text/plain')) {
      return 'Testo'
    } else {
      return 'Documento'
    }
  }

  const { immagini, documenti } = separateAllegati()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!task) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Task non trovato</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-4 lg:p-6">
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Torna indietro
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {task.codiceTask}
              </h1>
              <p className="text-gray-600 mt-1">{task.descrizione}</p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => navigate(`/task/${task.id}/edit`)}
                disabled={!canModifyTask(task)}
                className={`p-2 rounded-lg transition-colors duration-200 ${
                  canModifyTask(task) 
                    ? 'text-gray-600 hover:text-blue-600 hover:bg-blue-50' 
                    : 'text-gray-400 cursor-not-allowed'
                }`}
              >
                <Edit className="h-5 w-5" />
              </button>
              <button
                onClick={handleDelete}
                disabled={!canModifyTask(task)}
                className={`p-2 rounded-lg transition-colors duration-200 ${
                  canModifyTask(task) 
                    ? 'text-gray-600 hover:text-red-600 hover:bg-red-50' 
                    : 'text-gray-400 cursor-not-allowed'
                }`}
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Software</h3>
                <p className="mt-1 text-sm text-gray-900">{task.software}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">Tipo Task</h3>
                <p className="mt-1 text-sm text-gray-900">{task.tipoTask}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">Utente</h3>
                <div className="mt-1 flex items-center">
                  <User className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-900">{task.utente}</span>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">Cliente</h3>
                <p className="mt-1 text-sm text-gray-900">{task.clienti}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Priorità</h3>
                <span
                  className={`inline-flex mt-1 px-2 py-1 rounded-full text-xs font-semibold ${getPriorityColor(
                    task.priorità
                  )}`}
                >
                  {task.priorità}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">Stato</h3>
                <span
                  className={`inline-flex items-center mt-1 px-2 py-1 rounded-full text-xs font-semibold ${getStatoColor(
                    task.stato
                  )}`}
                >
                  {getStatoIcon(task.stato)}
                  <span className="ml-1">{task.stato}</span>
                </span>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  Data Segnalazione
                </h3>
                <div className="mt-1 flex items-center">
                  <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-900">
                    {new Date(task.dataSegnalazione).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  Data Scadenza
                </h3>
                <div className="mt-1 flex items-center">
                  <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-900">
                    {new Date(task.dataScadenza).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-500">Commenti</h3>
            <p className="mt-1 text-sm text-gray-900">
              {task.commenti || 'Nessun commento'}
            </p>
          </div>

          {/* Sezione Allegati */}
          <div className="mt-6 border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Paperclip className="h-5 w-5 mr-2" />
                Allegati ({allegati.length})
              </h3>
              <button
                onClick={() => setShowUploadForm(true)}
                className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-1 text-sm"
              >
                <Upload className="h-4 w-4" />
                <span>Carica</span>
              </button>
            </div>

            {/* Form upload allegato */}
            {showUploadForm && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">Carica nuovo allegato</h4>
                  <button
                    onClick={() => setShowUploadForm(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Immagini (JPG, PNG, GIF, WebP), PDF, Word, Excel, PowerPoint, testo (max 10MB)
                </p>
              </div>
            )}

            {/* Sezione Immagini */}
            {immagini.length > 0 && (
              <div className="immagini mb-6">
                <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                  <Image className="h-4 w-4 mr-2" />
                  Immagini ({immagini.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {immagini.map((allegato) => (
                    <div key={allegato.id} className="relative">
                      <div className="aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                        <img
                          src={allegato.allegato}
                          alt={`Allegato ${allegato.id}`}
                          className="w-full h-full object-cover cursor-pointer transition-transform hover:scale-105"
                          onClick={() => setPreviewImage(allegato.allegato)}
                        />
                      </div>
                      <div className="absolute top-2 right-2 flex space-x-1">
                        <button
                          onClick={() => downloadAllegato(allegato)}
                          className="p-1 bg-white bg-opacity-80 rounded-full shadow-md hover:bg-opacity-100 transition-all"
                        >
                          <Download className="h-3 w-3 text-blue-600" />
                        </button>
                        <button
                          onClick={() => handleDeleteAllegato(allegato.id!)}
                          className="p-1 bg-white bg-opacity-80 rounded-full shadow-md hover:bg-opacity-100 transition-all"
                        >
                          <Trash2 className="h-3 w-3 text-red-600" />
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 text-center">
                        Allegato #{allegato.id}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sezione Documenti */}
            {documenti.length > 0 && (
              <div className="documenti mb-6">
                <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  Documenti ({documenti.length})
                </h4>
                <div className="space-y-3">
                  {documenti.map((allegato) => (
                    <div key={allegato.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {getFileIcon(allegato)}
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              Allegato #{allegato.id}
                            </p>
                            <p className="text-xs text-gray-500">
                              {getFileTypeLabel(allegato)}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => downloadAllegato(allegato)}
                            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteAllegato(allegato.id!)}
                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Messaggio quando non ci sono allegati */}
            {allegati.length === 0 && (
              <p className="text-gray-500 text-sm">Nessun allegato presente</p>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={closeConfirmModal}
        type="danger"
      />
      
      {previewImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-full max-h-full p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                const link = document.createElement('a');
                link.href = previewImage;
                link.download = 'immagine.jpg';
                link.click();
              }}
              className="absolute top-4 right-16 bg-white bg-opacity-50 rounded-full p-3 shadow-md hover:bg-opacity-100 transition-transform transform hover:scale-110"
              aria-label="Scarica immagine"
            >
              <Download className="h-4 w-4 text-gray-800" />
            </button>

            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 bg-white bg-opacity-50 rounded-full p-3 shadow-md hover:bg-opacity-100 transition-transform transform hover:scale-110"
              aria-label="Chiudi anteprima"
            >
              <X className="h-4 w-4 text-gray-800" />
            </button>

            <img
              src={previewImage}
              alt="Anteprima Allegato"
              className="max-w-[90vw] max-h-[80vh] rounded-lg border-4 border-white shadow-xl"
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default TaskDetail