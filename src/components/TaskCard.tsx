import React, { useState } from 'react';
import { Task } from '../types';

interface TaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: number) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onEdit, onDelete }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white border rounded-lg p-4 shadow-sm transition duration-300 hover:shadow-md">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-blue-700">{task.codiceTask}</h3>
        <button
          className="text-xs text-gray-500 hover:text-blue-600"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? 'Nascondi dettagli' : 'Mostra dettagli'}
        </button>
      </div>

      <p className="text-sm text-gray-800 mt-2">{task.descrizione}</p>

      {expanded && (
        <div className="mt-3 space-y-1 text-sm text-gray-600">
          <div><strong>Software:</strong> {task.software}</div>
          <div><strong>Utente:</strong> {task.utente}</div>
          <div><strong>Cliente:</strong> {task.clienti}</div>
          <div><strong>Stato:</strong> {task.stato}</div>
          <div><strong>Priorità:</strong> {task.priorità}</div>
          <div><strong>Segnalazione:</strong> {task.dataSegnalazione.toLocaleDateString()}</div>
          <div><strong>Scadenza:</strong> {task.dataScadenza.toLocaleDateString()}</div>
          <div><strong>Commenti:</strong> {task.commenti}</div>
        </div>
      )}

      <div className="mt-4 flex justify-end space-x-3 text-sm">
        <button
          className="text-blue-600 hover:underline"
          onClick={() => onEdit?.(task)}
        >
          Modifica
        </button>
        <button
          className="text-red-600 hover:underline"
          onClick={() => onDelete?.(task.id || 0)}
        >
          Elimina
        </button>
      </div>
    </div>
  );
};

export { TaskCard };