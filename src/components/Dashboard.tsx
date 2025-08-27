import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  XCircle,
  Package,
  Calendar,
  Download,
  Filter,
  BarChart3,
  PieChart,
  AlertTriangle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Cell, Pie } from 'recharts';

const Dashboard: React.FC = () => {
  const { state } = useApp();
  const navigate = useNavigate();
  const [filterScadenza, setFilterScadenza] = useState('7days');

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const getFilteredTaskInScadenza = () => {
    const oggi = new Date();
    let dataLimite = new Date();
    
    switch (filterScadenza) {
      case '7days':
        dataLimite.setDate(oggi.getDate() + 7);
        break;
      case '15days':
        dataLimite.setDate(oggi.getDate() + 15);
        break;
      case '30days':
        dataLimite.setDate(oggi.getDate() + 30);
        break;
      case '60days':
        dataLimite.setDate(oggi.getDate() + 60);
        break;
      default:
        dataLimite.setDate(oggi.getDate() + 7);
    }
    
    return state.task.filter(t => {
      const scadenza = new Date(t.dataScadenza);
      return scadenza >= oggi && scadenza <= dataLimite && t.stato !== 'chiuso';
    });
  };

  // Statistiche dei task
  const taskStats = {
    total: state.task.length,
    aperti: state.task.filter(t => t.stato === 'aperto').length,
    inCorso: state.task.filter(t => t.stato === 'in corso').length,
    chiusi: state.task.filter(t => t.stato === 'chiuso').length,
    testing: state.task.filter(t => t.stato === 'testing').length,
    falliti: state.task.filter(t => t.stato === 'test fallito').length,
    inScadenza: getFilteredTaskInScadenza().length,
    scaduti: state.task.filter(t => 
      t.stato !== 'chiuso' && 
      new Date(t.dataScadenza) < new Date()
    ).length,
  };

  const taskInScadenzaFiltrati = getFilteredTaskInScadenza();
  const taskScadutiRecenti = state.task.filter(t => 
    t.stato !== 'chiuso' && 
    new Date(t.dataScadenza) < new Date()
  ).slice(0, 5);
  const taskAttivi = state.task.filter(t => t.stato === 'in corso').slice(0, 10);

  // Dati per grafici
  const softwareTaskStats = state.software.map(software => {
    const taskSoftware = state.task.filter(t => t.software === software.nomeSoftware);
    return {
      nome: software.nomeSoftware,
      taskTotali: taskSoftware.length,
      taskAperti: taskSoftware.filter(t => t.stato === 'aperto').length,
      taskInCorso: taskSoftware.filter(t => t.stato === 'in corso').length,
      testing: state.task.filter(t => t.stato === 'testing').length,
      falliti: state.task.filter(t => t.stato === 'test fallito').length,
    };
  }).filter(s => s.taskTotali > 0).sort((a, b) => b.taskTotali - a.taskTotali).slice(0, 5);

  const statoDistribution = [
    { name: 'Aperti', value: taskStats.aperti, color: '#EF4444' },
    { name: 'In Corso', value: taskStats.inCorso, color: '#3B82F6' },
    { name: 'Chiusi', value: taskStats.chiusi, color: '#10B981' }
  ];

  const statCards = [
    {
      title: 'Task Totali',
      value: taskStats.total,
      icon: FileText,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      filter: 'all'
    },
    {
      title: 'Task Aperti',
      value: taskStats.aperti,
      icon: AlertCircle,
      color: 'bg-red-500',
      textColor: 'text-red-600',
      filter: 'aperto'
    },
    {
      title: 'In Corso',
      value: taskStats.inCorso,
      icon: Clock,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      filter: 'in corso'
    },
    {
      title: 'Chiusi',
      value: taskStats.chiusi,
      icon: CheckCircle,
      color: 'bg-green-500',
      textColor: 'text-green-600',
      filter: 'chiuso'
    }
  ];

const handleCardClick = (filter: string) => {
  switch (filter) {
    case 'all':
      navigate('/task');
      break;
    case 'scaduti':
      navigate('/task?search=scaduti');
      break;
    case 'inScadenza':
      navigate('/task?search=prossimi');
      break;
    default:
      navigate(`/task?search=stato:${filter}`);
  }
};


  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Dashboard Task</h1>
          <p className="text-gray-600 mt-1 text-sm lg:text-base">Panoramica dei task e attività</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-xs lg:text-sm text-gray-500">
            <Calendar className="h-4 w-4" />
            <span>Ultimo aggiornamento: {formatDate(new Date())} {new Date().toLocaleTimeString('it-IT')}</span>
          </div>
        </div>
      </div>

      {/* Statistics Cards - Clickable */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
        {statCards.map((card, index) => (
          <div 
            key={index} 
            onClick={() => handleCardClick(card.filter)}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6 hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="mb-2 lg:mb-0">
                <p className="text-xs lg:text-sm font-medium text-gray-600">{card.title}</p>
                <p className="text-xl lg:text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
              </div>
              <div className={`${card.color} p-2 lg:p-3 rounded-lg self-end lg:self-auto`}>
                <card.icon className="h-4 w-4 lg:h-6 lg:w-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>


      {/* Quick Stats */}

        {/* 
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
              <div 
                onClick={() => navigate('/software')}
                className="cursor-pointer bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base lg:text-lg font-semibold text-gray-900">Software Attivi</h3>
                  <Package className="h-5 w-5 text-gray-400" />
                </div>
                <div className="text-2xl lg:text-3xl font-bold text-blue-600">{state.software.length}</div>
                <p className="text-xs lg:text-sm text-gray-500 mt-1">Software con task</p>
              </div>
              <div 
                onClick={() => handleCardClick('scaduti')}
                className="cursor-pointer bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base lg:text-lg font-semibold text-gray-900">Task Scaduti</h3>
                  <AlertTriangle className="h-5 w-5 text-gray-400" />
                </div>
                <div className="text-2xl lg:text-3xl font-bold text-red-600">{taskStats.scaduti}</div>
                <p className="text-xs lg:text-sm text-gray-500 mt-1">Richiedono attenzione</p>
              </div>
              <div 
                onClick={() => handleCardClick('inScadenza')}
                className="cursor-pointer bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base lg:text-lg font-semibold text-gray-900">Task in Scadenza</h3>
                  <Clock className="h-5 w-5 text-gray-400" />
                </div>
                <div className="text-2xl lg:text-3xl font-bold text-yellow-600">{taskStats.inScadenza}</div>
                <p className="text-xs lg:text-sm text-gray-500 mt-1">Prossimi 7 giorni</p>
              </div>
            </div>
        */}

         {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Task in corso */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base lg:text-lg font-semibold text-gray-900">
              Task in Corso
            </h3>
            <div className="flex space-x-2">
            </div>
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {taskAttivi.length > 0 ? (
              taskAttivi.map((task) => (
                <div key={task.id} className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                  <Clock className="h-4 w-4 lg:h-5 lg:w-5 text-blue-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm lg:text-base truncate">{task.codiceTask}</p>
                    <p className="text-xs lg:text-sm text-gray-600 truncate">{task.descrizione}</p>
                    <p className="text-xs lg:text-sm text-blue-600">Software: {task.software}</p>
                    <p className="text-xs lg:text-sm text-blue-600">Scade il {formatDate(new Date(task.dataScadenza))}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">Nessun task in corso</p>
            )}
          </div>
        </div>

        {/* Task in scadenza */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base lg:text-lg font-semibold text-gray-900">
              Task in Scadenza
            </h3>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={filterScadenza}
                onChange={(e) => setFilterScadenza(e.target.value)}
                className="text-xs border border-gray-300 rounded px-2 py-1"
              >
                <option value="7days">7 giorni</option>
                <option value="15days">15 giorni</option>
                <option value="30days">30 giorni</option>
                <option value="60days">60 giorni</option>
              </select>
            </div>
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {taskInScadenzaFiltrati.length > 0 ? (
              taskInScadenzaFiltrati.map((task) => (
                <div key={task.id} className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                  <AlertTriangle className="h-4 w-4 lg:h-5 lg:w-5 text-yellow-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm lg:text-base truncate">{task.codiceTask}</p>
                    <p className="text-xs lg:text-sm text-gray-600 truncate">{task.descrizione}</p>
                    <p className="text-xs lg:text-sm text-yellow-600">Software: {task.software}</p>
                    <p className="text-xs lg:text-sm text-yellow-600">Scade il {formatDate(new Date(task.dataScadenza))}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">Nessun task in scadenza</p>
            )}
          </div>
        </div>

        {/* Task scaduti */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base lg:text-lg font-semibold text-gray-900">
              Task Scaduti
            </h3>
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {taskScadutiRecenti.length > 0 ? (
              taskScadutiRecenti.map((task) => (
                <div key={task.id} className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg">
                  <XCircle className="h-4 w-4 lg:h-5 lg:w-5 text-red-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm lg:text-base truncate">{task.codiceTask}</p>
                    <p className="text-xs lg:text-sm text-gray-600 truncate">{task.descrizione}</p>
                    <p className="text-xs lg:text-sm text-red-600">Software: {task.software}</p>
                    <p className="text-xs lg:text-sm text-red-600">Scaduto il {formatDate(new Date(task.dataScadenza))}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">Nessun task scaduto</p>
            )}
          </div>
        </div>
      </div>


      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task per Software */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Task per Software</h3>
            <BarChart3 className="h-5 w-5 text-gray-400" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={softwareTaskStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nome" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="taskTotali" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribuzione stati task */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Distribuzione Stati Task</h3>
            <PieChart className="h-5 w-5 text-gray-400" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={statoDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {statoDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
    </div>
  );
};

export default Dashboard;