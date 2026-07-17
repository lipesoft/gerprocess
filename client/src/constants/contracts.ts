import type { ContractStatus, PaymentStatus } from '../types';

export const contractStatusLabels: Record<ContractStatus | string, string> = {
  EM_ANDAMENTO: 'Em andamento',
  CONCLUIDO: 'Concluído',
  PENDENTE: 'Pendente',
  CANCELADO: 'Cancelado',
};

export const contractStatusClasses: Record<ContractStatus | string, string> = {
  EM_ANDAMENTO: 'bg-sky-50 text-sky-700 ring-sky-200',
  CONCLUIDO: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  PENDENTE: 'bg-amber-50 text-amber-700 ring-amber-200',
  CANCELADO: 'bg-rose-50 text-rose-700 ring-rose-200',
};

export const paymentStatusLabels: Record<PaymentStatus | string, string> = {
  PENDENTE: 'Pendente',
  PAGO: 'Pago',
  ATRASADO: 'Atrasado',
  CANCELADO: 'Cancelado',
};

export const paymentStatusClasses: Record<PaymentStatus | string, string> = {
  PENDENTE: 'bg-amber-50 text-amber-700 ring-amber-200',
  PAGO: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  ATRASADO: 'bg-rose-50 text-rose-700 ring-rose-200',
  CANCELADO: 'bg-slate-100 text-slate-600 ring-slate-200',
};

export function getContractStatusLabel(status: string) {
  return contractStatusLabels[status] ?? status;
}

export function getContractStatusClass(status: string) {
  return contractStatusClasses[status] ?? 'bg-slate-100 text-slate-600 ring-slate-200';
}

export function getPaymentStatusLabel(status: string) {
  return paymentStatusLabels[status] ?? status;
}

export function getPaymentStatusClass(status: string) {
  return paymentStatusClasses[status] ?? 'bg-slate-100 text-slate-600 ring-slate-200';
}
