export interface Task {
  id?: number;
  codiceTask: string;
  descrizione: string;
  priorità: 'bassa' | 'media' | 'alta';
  clienti: string;
  utente: string;
  software: string;
  stato: 'aperto' | 'in corso' | 'chiuso' | 'testing' | 'test fallito';
  dataSegnalazione: Date;
  dataScadenza: Date;
  tipoTask: 'Bug' | 'Improvement';
  commenti?: string;
  createdBy?: number;
}


export interface Software {
  id: number;
  nomeSoftware: string;
  logo: string;
}

export interface TaskLog {
  id: number;
  utente: string;
  codiceTask: string;
  eventLog: string;
  data: string;
}


export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

export interface Cliente {
  id: number;
  ragioneSociale: string;
}

export interface Allegato {
  id?: number;
  allegato: string; // Base64 encoded file
  idTask: number;
}

export interface User {
  id: number;
  username: string;
  role: 'Admin' | 'User';
  fullName: string;
  email?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthContextType {
  user: User | null;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  canModifyTask: (task: Task) => boolean;
}