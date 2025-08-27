import React, { useEffect, useState } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  FileText,
  Calendar,
  User,
  AlertCircle,
  CheckCircle,
  Clock,
  Grid,
  List,
  FlaskConical,
  XCircle,
  Check,
  X
} from "lucide-react";
import Select from 'react-select';
import { apiService } from "../services/api";
import { Task, Software } from "../types";
import ConfirmModal from "./ConfirmModal";
import { useApp } from "../context/AppContext";
import { useAuth } from '../context/AuthContext';
import { Cliente } from '../types';
import { useNavigate, useSearchParams } from 'react-router-dom';


interface TaskManagerProps {
   searchTerm?: string;
}


const TaskManager: React.FC<TaskManagerProps> = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchTerm = searchParams.get('search') || '';
  const navigate = useNavigate()
  const { user, canModifyTask } = useAuth();
  const [task, setTasks] = useState<Task[]>([]);
  const { state, dispatch } = useApp(); // Ottieni dispatch dal contesto
  const [softwareList, setSoftwareList] = useState<Software[]>([]);
  const [usersList, setUsersList] = useState<string[]>([]);
  const loading = state.loading;
  const [viewMode, setViewMode] = useState<"grid" | "cards">("grid");
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [clientiList, setClientiList] = useState<Cliente[]>([]);
  const [editingCell, setEditingCell] = useState<{
    taskId: number;
    field: 'stato' | 'priorità' | 'commenti';
  } | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });
  const [filterScadenza, setFilterScadenza] = useState<
    "all" | "scaduti" | "non-scaduti"
  >("all");
  const [filterStato, setFilterStato] = useState<
          "all" | "aperto" | "in corso" | "chiuso" | "testing" | "test fallito"
        >(() => {
          if (searchTerm.startsWith("stato:")) {
            const filter = searchTerm.split(":")[1];
            return filter as "all" | "aperto" | "in corso" | "chiuso" | "testing" | "test fallito";
          }
          return "all";
        });

  const [filterUtente, setFilterUtente] = useState("all");
  const allUsers = Array.from(new Set(task.map((task) => task.utente)));

  const fetchUsers = async () => {
  try {
    const data = await apiService.getUsers(); // ritorna array { username }
    setUsersList(data.map((u: { username: string }) => u.username));
  } catch (err) {
    console.error('Errore nel caricamento utenti', err);
    dispatch({ type: 'SET_ERROR', payload: 'Errore nel caricamento utenti' });
  }
};


  useEffect(() => {
    if (searchTerm.startsWith("stato:")) {
      const filter = searchTerm.split(":")[1];
      setFilterStato(filter as "all" | "aperto" | "in corso" | "chiuso" | "testing" | "test fallito");
    }
  }, [searchTerm]);

  const filteredTasks = task.filter((task) => {
    // Filtro per stato: se searchTerm contiene "stato:xyz"
    if (searchTerm.startsWith("stato:")) {
      const statoFiltro = searchTerm.split(":")[1];
      if (statoFiltro !== "all" && task.stato !== statoFiltro) {
        return false;
      }
    } else if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      const descrizione = task.descrizione?.toLowerCase() || "";
      const codiceTask = task.codiceTask?.toLowerCase() || "";
      const software = task.software?.toLowerCase() || ""; 

      if (!descrizione.includes(lowerSearch) && 
        !codiceTask.includes(lowerSearch) && 
        !software.includes(lowerSearch)) { // Aggiungi questa condizione
      return false;
    }
    }

    // Altri filtri
    const matchesStato = filterStato === "all" || task.stato === filterStato;
    const isScaduto = task.dataScadenza < new Date();
    const matchesScadenza = filterScadenza === "all" ||
      (filterScadenza === "scaduti" && isScaduto) ||
      (filterScadenza === "non-scaduti" && !isScaduto);
    const matchesUtente = filterUtente === "all" || task.utente === filterUtente;

    return matchesStato && matchesScadenza && matchesUtente;
  });
  
  // Funzioni per l'editing inline
const startInlineEdit = (taskId: number, field: 'stato' | 'priorità' | 'commenti', currentValue: string) => {
  setEditingCell({ taskId, field });
  setEditingValue(currentValue);
};

const cancelInlineEdit = () => {
  setEditingCell(null);
  setEditingValue('');
};

const saveInlineEdit = async () => {
  // Add null check at the beginning
  if (!editingCell || !editingCell.taskId) return;
  
  const taskToUpdate = task.find(t => t.id === editingCell.taskId);
  if (!taskToUpdate || !taskToUpdate.id) return;

  try {
    const updatedTask = {
      ...taskToUpdate,
      [editingCell.field]: editingValue
    };

    await apiService.updateTask(taskToUpdate.id, updatedTask);
    
    setTasks(prevTasks => 
      prevTasks.map(t => 
        t.id === editingCell.taskId 
          ? { ...t, [editingCell.field]: editingValue }
          : t
      )
    );

    dispatch({ type: "UPDATE_TASK", payload: updatedTask });
    
    // Log dell'azione di modifica inline
    //console.log(`Modifica inline: ${editingCell.field} di ${taskToUpdate.codiceTask} aggiornato a "${editingValue}"`);
    
    setEditingCell(null);
    setEditingValue('');
  } catch (error) {
    console.error("Errore durante l'aggiornamento del task", error);
    dispatch({ type: "SET_ERROR", payload: "Errore durante l'aggiornamento" });
  }
};

  const [formData, setFormData] = useState({
    descrizione: "",
    priorità: "media" as "media" | "bassa" | "alta",
    clienti: "SkillPower Srl",
    utente: "",
    software: "",
    tipoTask: "Bug" as "Bug" | "Improvement",
    stato: "aperto" as "aperto" | "in corso" | "chiuso" | "testing" | "test fallito",
    dataScadenza: "",
    commenti: "",
  });

  
const clientiOptions = clientiList.map((cliente) => ({
  value: cliente.ragioneSociale,
  label: cliente.ragioneSociale,
}));

  const safeToLocaleDateString = (date: Date): string => {
    try {
      const d = date instanceof Date ? date : new Date(date);
      return isNaN(d.getTime()) ? "Data non valida" : d.toLocaleDateString();
    } catch {
      return "Data non valida";
    }
  };


  const fetchTasks = async () => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const res = (await apiService.getTasks()) as Task[];
      const formatted = res.map((task: Task) => ({
        ...task,
        dataSegnalazione: task.dataSegnalazione
          ? new Date(task.dataSegnalazione)
          : new Date(),
        dataScadenza: task.dataScadenza
          ? new Date(task.dataScadenza)
          : new Date(),
      }));
      setTasks(formatted);
      dispatch({ type: "SET_TASK", payload: formatted });
    } catch (error) {
      console.error("Errore nel caricamento dei task", error);
      dispatch({
        type: "SET_ERROR",
        payload: "Errore nel caricamento dei task",
      });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const fetchSoftwareData = async () => {
    try {
      const data = await apiService.getAllSoftware(); // Assicurati che questa API restituisca Software[]
      setSoftwareList(data);
    } catch (error) {
      console.error("Errore nel caricamento dei software", error);
    }
  };

  const getSoftwareLogo = (softwareName: string) => {
    const software = softwareList.find((s) => s.nomeSoftware === softwareName);
    return software?.logo || "";
  };

  const handleDelete = (id: number, codiceTask: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Conferma Eliminazione",
      message: `Sei sicuro di voler eliminare il task "${codiceTask}"?`,
      onConfirm: async () => {
        dispatch({ type: "SET_LOADING", payload: true });
        try {
          await apiService.deleteTask(id);
          dispatch({ type: "DELETE_TASK", payload: id });
          await fetchTasks();
        } catch (error) {
          console.error("Errore durante eliminazione task", error);
          dispatch({
            type: "SET_ERROR",
            payload: "Errore durante eliminazione",
          });
        } finally {
          dispatch({ type: "SET_LOADING", payload: false });
          closeConfirmModal();
        }
      },
    });
  };

  const closeConfirmModal = () => {
    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
  };

  const handleEdit = (task: Task) => {
    setFormData({
      descrizione: task.descrizione,
      priorità: task.priorità,
      clienti: task.clienti,
      utente: task.utente,
      software: task.software,
      tipoTask: task.tipoTask,
      stato: task.stato,
      dataScadenza:
        task.dataScadenza instanceof Date
          ? task.dataScadenza.toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
      commenti: task.commenti || "",
    });
    setEditingTask(task);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      if (!formData.descrizione || !formData.software || !formData.utente) {
        dispatch({
          type: "SET_ERROR",
          payload: "Completa tutti i campi obbligatori",
        });
        return;
      }

      // Creiamo una data di scadenza sicura con fallback
      const dataScadenza = formData.dataScadenza
        ? new Date(formData.dataScadenza)
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Default: 7 giorni da oggi

      if (editingTask) {
        const updatedTask: Task = {
          ...editingTask,
          ...formData,
          dataScadenza: dataScadenza, // Usiamo la data sicura
        };
        await apiService.updateTask(editingTask.id!, updatedTask);
        dispatch({ type: "UPDATE_TASK", payload: updatedTask });
      } else {
        const tipoCode = formData.tipoTask === "Bug" ? "BUG" : "IMP";
        const prefix = formData.software.substring(0, 3).toUpperCase();
        const codiceBase = `${prefix}_${tipoCode}`;

        const existing = task.filter((t) =>
          t.codiceTask.startsWith(codiceBase)
        );
        const numbers = existing.map((t) => {
          const parts = t.codiceTask.split("_");
          return parseInt(parts[2], 10) || 0;
        });
        const maxNumber = numbers.length ? Math.max(...numbers) : 0;
        const progressive = String(maxNumber + 1).padStart(4, "0");
        const finalCodice = `${codiceBase}_${progressive}`;

        const newTask: Task = {
          codiceTask: finalCodice,
          ...formData,
          dataSegnalazione: new Date(),
          dataScadenza: dataScadenza, // Usiamo la data sicura
          createdBy: user?.id, // Aggiungi l'ID dell'utente che crea il task
        };

        await apiService.createTask(newTask);
        dispatch({ type: "ADD_TASK", payload: newTask });
      }

      await fetchTasks();
      resetForm();
    } catch (error) {
      console.error("Errore durante il salvataggio del task", error);
      dispatch({ type: "SET_ERROR", payload: "Errore durante il salvataggio" });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const resetForm = () => {
    setFormData({
      descrizione: "",
      priorità: "media",
      clienti: "SkillPower Srl",
      utente: "",
      software: "",
      tipoTask: "Bug",
      stato: "aperto",
      dataScadenza: "",
      commenti: "",
    });
    setEditingTask(null);
    setShowForm(false);
  };

  const getPriorityColor = (priority: "alta" | "media" | "bassa") => {
    switch (priority) {
      case "alta":
        return "bg-red-100 text-red-800";
      case "media":
        return "bg-yellow-100 text-yellow-800";
      case "bassa":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatoColor = (
  stato: "aperto" | "in corso" | "chiuso" | "testing" | "test fallito"
) => {
  switch (stato) {
    case "aperto":
      return "bg-red-100 text-red-800";
    case "in corso":
      return "bg-blue-100 text-blue-800";
    case "chiuso":
      return "bg-green-100 text-green-800";
    case "testing":
      return "bg-purple-100 text-purple-800";
    case "test fallito":
      return "bg-pink-100 text-pink-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getStatoIcon = (
  stato: "aperto" | "in corso" | "chiuso" | "testing" | "test fallito"
) => {
  switch (stato) {
    case "aperto":
      return <AlertCircle className="h-4 w-4" />;
    case "in corso":
      return <Clock className="h-4 w-4" />;
    case "chiuso":
      return <CheckCircle className="h-4 w-4" />;
    case "testing":
      return <FlaskConical className="h-4 w-4" />; // Usa icona "flask" da Lucide
    case "test fallito":
      return <XCircle className="h-4 w-4" />; // Usa icona "X" per indicare errore
    default:
      return null;
  }
};

  // const handleView = (task: Task) => {
  //   handleEdit(task); // Questo aprirà direttamente il form di modifica
  // };

  const handleView = (task: Task, e?: React.MouseEvent) => {
    // Se c'è un evento e proviene da un elemento di editing, non navigare
    if (e && (e.target as HTMLElement).closest('.inline-edit-action')) {
      return;
    }
    
    if (!task.id) {
      console.error('Task ID is undefined');
      return;
    }
    navigate(`/task/${task.id}`);
  };

  const fetchClienti = async () => {
    try {
      const data = await apiService.getClienti();
      setClientiList(data);
    } catch (error) {
      console.error('Errore nel caricamento dei clienti', error);
      dispatch({ type: 'SET_ERROR', payload: 'Errore nel caricamento dei clienti' });
    }
  };

// Modifica il useEffect per includere il fetch dei clienti
  useEffect(() => {
    fetchTasks();
    fetchSoftwareData();
    fetchClienti(); // Aggiungi questa linea
    fetchUsers();
  }, []);


/*   useEffect(() => {
    if (searchTerm.startsWith("stato:")) {
      const filter = searchTerm.split(":")[1];
      setFilterStato(filter as "all" | "aperto" | "in corso" | "chiuso" | "testing" | "test fallito");
    }
  }, [searchTerm]); */

  
  if (loading && task.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }



  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
            Gestione Task
          </h1>
          <p className="text-gray-600 mt-1 text-sm lg:text-base">
            Traccia e gestisci le segnalazioni
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode("cards")}
              className={`p-2 rounded-md ${
                viewMode === "cards"
                  ? "bg-white shadow-sm text-blue-600"
                  : "text-gray-600"
              }`}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-md ${
                viewMode === "grid"
                  ? "bg-white shadow-sm text-blue-600"
                  : "text-gray-600"
              }`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
          <button
            onClick={() => setShowForm(true)}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2 text-sm lg:text-base disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            <span>Nuovo Task</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
        {/* Search input */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cerca task per codice, software o descrizione..."
            value={searchTerm}
            onChange={(e) => {
              const term = e.target.value;
              const newSearchParams = new URLSearchParams(searchParams);
              
              if (term) {
                newSearchParams.set('search', term);
              } else {
                newSearchParams.delete('search');
              }
              setSearchParams(newSearchParams);
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm lg:text-base"
          />
        </div>

        {/* Filtro stato */}
        <div className="relative">
          <Filter className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <select
            value={filterStato}
            onChange={(e) => setFilterStato(e.target.value as 'all' | 'aperto' | 'in corso' | 'chiuso' | 'testing' | 'test fallito')}
            className="w-full sm:w-auto pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm lg:text-base"
          >
            <option value="all">Tutti gli stati</option>
            <option value="aperto">Aperto</option>
            <option value="in corso">In Corso</option>
            <option value="chiuso">Chiuso</option>
            <option value="testing">Testing</option>
            <option value="test fallito">Test Fallito</option>
          </select>
        </div>

        {/* Filtro scadenza */}
        <div className="relative">
          <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <select
            value={filterScadenza}
            onChange={(e) => setFilterScadenza(e.target.value as 'all' | 'scaduti' | 'non-scaduti')}
            className="w-full sm:w-auto pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm lg:text-base"
          >
            <option value="all">Tutte le scadenze</option>
            <option value="scaduti">Scaduti</option>
            <option value="non-scaduti">Non scaduti</option>
          </select>
        </div>

        {/* Nuovo filtro utente */}
        <div className="relative">
          <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <select
            value={filterUtente}
            onChange={(e) => setFilterUtente(e.target.value)}
            className="w-full sm:w-auto pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm lg:text-base"
          >
            <option value="all">Tutti gli utenti</option>
            {allUsers.map((user) => (
              <option key={user} value={user}>
                {user}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Mobile Cards View */}
      {viewMode === "grid" ? (
        // Tabella desktop - visibile solo su desktop quando viewMode è 'grid'
        <div className="hidden lg:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                    Codice / Descrizione
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                    Software
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                    Dettagli
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">
                    Priorità
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">
                    Stato
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">
                    Commenti
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">
                    Azioni
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTasks.map((task) => {
                  const softwareLogo = getSoftwareLogo(task.software);
                  return (
                    <tr 
                      key={task.id} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={(e) => handleView(task, e)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {softwareLogo ? (
                              <img
                                src={softwareLogo}
                                alt={task.software}
                                className="h-10 w-10 rounded-lg object-contain"
                              />
                            ) : (
                              <div className="bg-blue-100 rounded-lg p-2">
                                <FileText className="h-5 w-5 text-blue-600" />
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {task.codiceTask}
                            </div>
                            <div
                              className="text-sm text-gray-500 max-w-xs break-words"
                              title={task.descrizione}
                            >
                              {task.descrizione}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {task.software}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div className="flex items-center space-x-1">
                            <User className="h-4 w-4 text-gray-400" />
                            <span>{task.utente}</span>
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            {task.clienti}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span>
                              Segnalato:{" "}
                              {safeToLocaleDateString(task.dataSegnalazione)}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1 mt-1">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span>
                              Scadenza:{" "}
                              {safeToLocaleDateString(task.dataScadenza)}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingCell?.taskId === task.id && editingCell?.field === 'priorità' ? (
                          <div className="flex items-center space-x-2 inline-edit-action">
                            <select
                              value={editingValue}
                              onChange={(e) => setEditingValue(e.target.value)}
                              className="text-xs px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                              disabled={!canModifyTask(task)}
                            >
                              <option value="bassa">Bassa</option>
                              <option value="media">Media</option>
                              <option value="alta">Alta</option>
                            </select>
                            <button
                              onClick={saveInlineEdit}
                              className="text-green-600 hover:text-green-800 inline-edit-action"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={cancelInlineEdit}
                              className="text-red-600 hover:text-red-800 inline-edit-action"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <span
                            className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold cursor-pointer ${getPriorityColor(
                              task.priorità
                            )} ${canModifyTask(task) ? 'hover:opacity-80 inline-edit-action' : 'cursor-not-allowed'}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (canModifyTask(task) && task.id) {
                                startInlineEdit(task.id, 'priorità', task.priorità);
                              }
                            }}
                          >
                            {task.priorità}
                          </span>
                        )}
                      </td>
                      {/* Cella Stato con editing inline */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingCell?.taskId === task.id && editingCell?.field === 'stato' ? (
                          <div className="flex items-center space-x-2 inline-edit-action">
                            <select
                              value={editingValue}
                              onChange={(e) => setEditingValue(e.target.value)}
                              className="text-xs px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                              disabled={!canModifyTask(task)}
                            >
                              <option value="aperto">Aperto</option>
                              <option value="in corso">In Corso</option>
                              <option value="chiuso">Chiuso</option>
                              <option value="testing">Testing</option>
                              <option value="test fallito">Test Fallito</option>
                            </select>
                            <button
                              onClick={saveInlineEdit}
                              className="text-green-600 hover:text-green-800 inline-edit-action"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={cancelInlineEdit}
                              className="text-red-600 hover:text-red-800 inline-edit-action"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold cursor-pointer ${getStatoColor(
                              task.stato
                            )} ${canModifyTask(task) ? 'hover:opacity-80 inline-edit-action' : 'cursor-not-allowed'}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (canModifyTask(task) && task.id) {
                                startInlineEdit(task.id, 'stato', task.stato);
                              }
                            }}
                          >
                            {getStatoIcon(task.stato)}
                            <span className="ml-1">{task.stato}</span>
                          </span>
                        )}
                      </td>

                      {/* Cella Commenti con editing inline */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingCell?.taskId === task.id && editingCell?.field === 'commenti' ? (
                          <div className="flex items-center space-x-2 inline-edit-action">
                            <input
                              type="text"
                              value={editingValue}
                              onChange={(e) => setEditingValue(e.target.value)}
                              className="text-xs px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 min-w-32"
                              disabled={!canModifyTask(task)}
                              placeholder="Inserisci commento..."
                            />
                            <button
                              onClick={saveInlineEdit}
                              className="text-green-600 hover:text-green-800 inline-edit-action"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={cancelInlineEdit}
                              className="text-red-600 hover:text-red-800 inline-edit-action"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <div 
                            className={`text-sm text-gray-900 cursor-pointer ${canModifyTask(task) ? 'hover:bg-gray-100 inline-edit-action' : 'cursor-not-allowed'} px-2 py-1 rounded`}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (canModifyTask(task) && task.id) {
                                // Precompila con username se il commento è vuoto
                                const initialValue = !task.commenti || task.commenti.trim() === '' 
                                  ? `${user?.username || ''} - ` 
                                  : task.commenti;
                                startInlineEdit(task.id, 'commenti', initialValue);
                              }
                            }}
                          >
                            {task.commenti || "Nessun commento"}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(task);
                            }}
                            disabled={loading || !canModifyTask(task)}
                            className={`${
                              canModifyTask(task) 
                                ? 'text-blue-600 hover:text-blue-900' 
                                : 'text-gray-400 cursor-not-allowed'
                            } disabled:opacity-50`}
                            >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(task.id as number, task.codiceTask);
                            }}
                              disabled={loading || !canModifyTask(task)}
                              className={`${
                                canModifyTask(task) 
                                  ? 'text-red-600 hover:text-red-900' 
                                  : 'text-gray-400 cursor-not-allowed'
                              } disabled:opacity-50`}
                            >
                              <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        // Vista a card - visibile su mobile e desktop quando viewMode è 'cards'
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTasks.map((task) => {
            const softwareLogo = getSoftwareLogo(task.software);
            return (
              <div
                key={task.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-pointer"
                onClick={() => handleView(task)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center min-w-0 flex-1">
                    {softwareLogo ? (
                      <img
                        src={softwareLogo}
                        alt={task.software}
                        className="h-10 w-10 rounded-md object-contain mr-3"
                      />
                    ) : (
                      <div className="bg-gray-100 rounded-md p-2 mr-3">
                        <FileText className="h-5 w-5 text-gray-400" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-gray-900 text-sm truncate">
                        {task.codiceTask}
                      </h3>
                      <p className="text-xs text-gray-500 truncate">
                        {task.software}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-1 flex-shrink-0">
                    <button
                      onClick={() => handleEdit(task)}
                      disabled={loading || !canModifyTask(task)}
                      className={`p-2 rounded-lg transition-colors duration-200 disabled:opacity-50 ${
                        canModifyTask(task) 
                          ? 'text-gray-600 hover:text-blue-600 hover:bg-blue-50' 
                          : 'text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() =>
                        handleDelete(task.id as number, task.codiceTask)
                      }
                      disabled={loading || !canModifyTask(task)}
                      className={`p-2 rounded-lg transition-colors duration-200 disabled:opacity-50 ${
                        canModifyTask(task) 
                          ? 'text-gray-600 hover:text-red-600 hover:bg-red-50' 
                          : 'text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Descrizione:</span>
                    <span className="text-gray-900">{task.descrizione}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Utente:</span>
                    <span className="text-gray-900">{task.utente}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Cliente:</span>
                    <span className="text-gray-900">{task.clienti}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Tipo:</span>
                    <span className="text-gray-900">{task.tipoTask}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Priorità:</span>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${getPriorityColor(
                        task.priorità
                      )}`}
                    >
                      {task.priorità}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Scadenza:</span>
                    <span className="text-gray-900">
                      {safeToLocaleDateString(task.dataScadenza)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Stato:</span>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${getStatoColor(
                        task.stato
                      )}`}
                    >
                      {getStatoIcon(task.stato)}
                      <span className="ml-1">{task.stato}</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Commenti:</span>
                    <span className="text-gray-900">{task.commenti}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {filteredTasks.length === 0 && (
        <div className="text-center py-8">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Nessun task trovato</p>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 lg:p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg lg:text-xl font-bold mb-4">
              {editingTask ? "Modifica Task" : "Nuovo Task"}
            </h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrizione *
                </label>
                <textarea
                  required
                  value={formData.descrizione}
                  onChange={(e) =>
                    setFormData({ ...formData, descrizione: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm lg:text-base"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Software *
                </label>
                
                <Select
                  options={softwareList.map((software) => ({
                    value: software.nomeSoftware,
                    label: software.nomeSoftware,
                  }))}
                  value={softwareList.find((s) => s.nomeSoftware === formData.software) ? 
                    { 
                      value: formData.software, 
                      label: formData.software 
                    } 
                    : null
                  }
                  onChange={(selected) =>
                    setFormData({ 
                      ...formData, 
                      software: selected ? selected.value : '' 
                    })
                  }
                  placeholder="Seleziona un software..."
                  className="text-sm lg:text-base"
                  classNamePrefix="react-select"
                  isClearable
                  isDisabled={!!editingTask} // Disabilita in modalità modifica
                  required
                />
                {editingTask && (
                  <p className="mt-1 text-xs text-gray-500">
                    Il software non può essere modificato per task esistenti.
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Utente *
                </label>
                <Select
                  options={usersList.map((u) => ({ value: u, label: u }))}
                  value={
                    usersList.includes(formData.utente)
                      ? { value: formData.utente, label: formData.utente }
                      : null
                  }
                  onChange={(selected) =>
                    setFormData({ ...formData, utente: selected ? selected.value : '' })
                  }
                  placeholder="Seleziona un utente..."
                  className="text-sm lg:text-base"
                  classNamePrefix="react-select"
                  isClearable
                  required
                />
              </div>
              <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cliente
              </label>
              <Select
                options={clientiOptions}
                value={clientiOptions.find((opt) => opt.value === formData.clienti)}
                onChange={(selected) =>
                  setFormData({ ...formData, clienti: selected ? selected.value : '' })
                }
                placeholder="Seleziona un cliente..."
                className="text-sm lg:text-base"
                classNamePrefix="react-select"
                isClearable
              />
            </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo Task *
                </label>
                {editingTask ? (
                  // In modalità modifica, mostra un campo disabilitato
                  <input
                    type="text"
                    value={formData.tipoTask === "Bug" ? "Bug" : "Improvement"}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-sm lg:text-base"
                  />
                ) : (
                  // In modalità creazione, mostra il select normale
                  <select
                    value={formData.tipoTask}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tipoTask: e.target.value as "Bug" | "Improvement",
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm lg:text-base"
                  >
                    <option value="Bug">Bug</option>
                    <option value="Improvement">Improvement</option>
                  </select>
                )}
              </div>


              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priorità *
                </label>
                <select
                  value={formData.priorità}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      priorità: e.target.value as "alta" | "media" | "bassa",
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm lg:text-base"
                >
                  <option value="bassa">Bassa</option>
                  <option value="media">Media</option>
                  <option value="alta">Alta</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stato *
                </label>
                <select
                  value={formData.stato}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      stato: e.target.value as "aperto" | "in corso" | "chiuso" | "testing" | "test fallito",
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm lg:text-base"
                >
                  <option value="aperto">Aperto</option>
                  <option value="in corso">In Corso</option>
                  <option value="chiuso">Chiuso</option>
                  <option value="testing">Testing</option>
                  <option value="test fallito">Test Fallito</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Commenti
                </label>
                <textarea
                  value={formData.commenti}
                  onChange={(e) =>
                    setFormData({ ...formData, commenti: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm lg:text-base"
                  rows={4}
                  placeholder="Inserisci i commenti..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data Scadenza *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="date"
                    value={formData.dataScadenza}
                    onChange={(e) =>
                      setFormData({ ...formData, dataScadenza: e.target.value })
                    }
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm lg:text-base"
                    required
                  />
                </div>
              </div>
              <div className="md:col-span-2 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors duration-200 text-sm lg:text-base disabled:opacity-50"
                >
                  {loading
                    ? "Salvando..."
                    : editingTask
                    ? "Aggiorna"
                    : "Crea Task"}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={loading}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors duration-200 text-sm lg:text-base disabled:opacity-50"
                >
                  Annulla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={closeConfirmModal}
        type="danger"
      />
    </div>
  );
};

export default TaskManager;