export type Role = 'ADMIN' | 'GESTOR' | 'ENGENHEIRO' | 'AUDITOR' | 'FINANCEIRO';

export type ContractStatus = 'EM_ANDAMENTO' | 'CONCLUIDO' | 'PENDENTE' | 'CANCELADO';

export type PaymentStatus = 'PENDENTE' | 'PAGO' | 'ATRASADO' | 'CANCELADO';

export interface User {
  id: string;
  name: string;
  cpf: string;
  email: string;
  role: Role;
  isActive: boolean;
  twoFactorEnabled: boolean;
  lastLogin: string | null;
  createdAt: string;
}

export interface Contract {
  id: string;
  name: string;
  contractNumber: string;
  company: string;
  workType: string;
  objective: string;
  totalValue: number;
  currentBalance: number;
  startDate: string;
  endDate: string;
  status: ContractStatus;
  responsibleId: string;
  responsible: Pick<User, 'id' | 'name' | 'email'>;
  createdBy: Pick<User, 'id' | 'name'>;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  contractId: string;
  description: string;
  value: number;
  dueDate: string;
  paidDate: string | null;
  status: PaymentStatus;
  invoiceNumber: string | null;
  notes: string | null;
}

export interface Document {
  id: string;
  contractId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  uploadedBy: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  contractId: string;
  userId: string;
  content: string;
  user: Pick<User, 'id' | 'name'>;
  createdAt: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
