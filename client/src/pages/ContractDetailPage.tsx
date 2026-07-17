import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { API_ORIGIN, api } from '../services/api';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  CalendarDays,
  CircleDollarSign,
  FileUp,
  History,
  MessageSquare,
  Send,
  WalletCards,
} from 'lucide-react';
import {
  getContractStatusClass,
  getContractStatusLabel,
  getPaymentStatusClass,
  getPaymentStatusLabel,
} from '../constants/contracts';
import { daysUntil, formatCurrency, formatDate, formatDateTime, formatPercent } from '../utils/format';

interface Contract {
  id: string;
  name: string;
  contractNumber: string;
  company: string;
  workType: string;
  objective: string;
  totalValue: string;
  currentBalance: string;
  startDate: string;
  endDate: string;
  status: string;
  responsible: { id: string; name: string; email: string };
  createdBy: { id: string; name: string };
  documents: Array<{ id: string; originalName: string; path: string }>;
  payments: Array<{
    id: string;
    description: string;
    value: string;
    dueDate: string;
    status: string;
  }>;
  comments: Array<{
    id: string;
    content: string;
    createdAt: string;
    user?: { id: string; name: string };
  }>;
  history: Array<{
    id: string;
    field: string;
    oldValue: string | null;
    newValue: string | null;
    changedAt: string;
  }>;
}

type TabKey = 'details' | 'payments' | 'documents' | 'comments' | 'history';

const tabs: Array<{ key: TabKey; label: string; icon: typeof WalletCards }> = [
  { key: 'details', label: 'Resumo', icon: WalletCards },
  { key: 'payments', label: 'Pagamentos', icon: CircleDollarSign },
  { key: 'documents', label: 'Documentos', icon: FileUp },
  { key: 'comments', label: 'Comentários', icon: MessageSquare },
  { key: 'history', label: 'Histórico', icon: History },
];

function getDocumentUrl(path: string) {
  if (!path) return '#';
  if (path.startsWith('http')) return path;
  if (path.startsWith('/uploads')) return `${API_ORIGIN}${path}`;
  return `${API_ORIGIN}/uploads/${path}`;
}

export default function ContractDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('details');
  const [newComment, setNewComment] = useState('');
  const [sendingComment, setSendingComment] = useState(false);

  useEffect(() => {
    fetchContract();
  }, [id]);

  const fetchContract = async () => {
    try {
      const { data } = await api.get(`/contracts/${id}`);
      setContract(data);
    } catch {
      toast.error('Contrato não encontrado');
      navigate('/contracts');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    setSendingComment(true);
    try {
      await api.post(`/contracts/${id}/comments`, { content: newComment.trim() });
      setNewComment('');
      await fetchContract();
      toast.success('Comentário adicionado');
    } catch {
      toast.error('Erro ao adicionar comentário');
    } finally {
      setSendingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary-700" />
      </div>
    );
  }

  if (!contract) return null;

  const totalValue = Number(contract.totalValue ?? 0);
  const currentBalance = Number(contract.currentBalance ?? 0);
  const executedValue = Math.max(0, totalValue - currentBalance);
  const executionRate = totalValue > 0 ? executedValue / totalValue : 0;
  const remainingDays = daysUntil(contract.endDate);

  const countByTab: Record<TabKey, number | null> = {
    details: null,
    payments: contract.payments.length,
    documents: contract.documents.length,
    comments: contract.comments.length,
    history: contract.history.length,
  };

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/contracts')}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950"
      >
        <ArrowLeft size={18} />
        Voltar para contratos
      </button>

      <div className="card">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="metric-label">{contract.contractNumber}</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">{contract.name}</h1>
            <p className="mt-2 text-sm text-slate-500">
              {contract.company} · {contract.workType}
            </p>
          </div>
          <span className={`status-pill ${getContractStatusClass(contract.status)}`}>
            {getContractStatusLabel(contract.status)}
          </span>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-lg border border-slate-200 p-4">
            <p className="metric-label">Valor total</p>
            <p className="mt-2 text-xl font-semibold text-slate-950">{formatCurrency(totalValue)}</p>
          </div>
          <div className="rounded-lg border border-slate-200 p-4">
            <p className="metric-label">Saldo atual</p>
            <p className="mt-2 text-xl font-semibold text-primary-700">{formatCurrency(currentBalance)}</p>
          </div>
          <div className="rounded-lg border border-slate-200 p-4">
            <p className="metric-label">Execução financeira</p>
            <p className="mt-2 text-xl font-semibold text-slate-950">{formatPercent(executionRate)}</p>
            <div className="mt-3 h-2 rounded-full bg-slate-100">
              <div
                className="h-2 rounded-full bg-primary-600"
                style={{ width: `${Math.min(100, Math.round(executionRate * 100))}%` }}
              />
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 p-4">
            <p className="metric-label">Prazo</p>
            <p className="mt-2 text-xl font-semibold text-slate-950">{formatDate(contract.endDate)}</p>
            <p className="mt-1 text-sm text-slate-500">
              {remainingDays === null
                ? 'Sem data final'
                : remainingDays < 0
                  ? `Vencido há ${Math.abs(remainingDays)} dia(s)`
                  : `${remainingDays} dia(s) restantes`}
            </p>
          </div>
        </div>
      </div>

      <div className="border-b border-slate-200">
        <nav className="-mb-px flex gap-5 overflow-x-auto" aria-label="Seções do contrato">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;

            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-1 pb-3 text-sm font-semibold transition-colors ${
                  isActive
                    ? 'border-primary-700 text-primary-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon size={16} />
                {tab.label}
                {countByTab[tab.key] !== null && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                    {countByTab[tab.key]}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="card">
        {activeTab === 'details' && (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div>
              <p className="metric-label">Objetivo</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">{contract.objective || 'Não informado'}</p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="metric-label">Responsável</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">{contract.responsible?.name}</p>
                <p className="text-sm text-slate-500">{contract.responsible?.email}</p>
              </div>
              <div>
                <p className="metric-label">Criado por</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">{contract.createdBy?.name}</p>
              </div>
              <div>
                <p className="metric-label">Início</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">{formatDate(contract.startDate)}</p>
              </div>
              <div>
                <p className="metric-label">Término</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">{formatDate(contract.endDate)}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'payments' && (
          <div>
            {contract.payments.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">Nenhum pagamento registrado.</p>
            ) : (
              <div className="space-y-3">
                {contract.payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex flex-col gap-3 rounded-lg border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">{payment.description}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        Vencimento em {formatDate(payment.dueDate)}
                      </p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="font-semibold text-slate-950">{formatCurrency(payment.value)}</p>
                      <span className={`status-pill mt-2 ${getPaymentStatusClass(payment.status)}`}>
                        {getPaymentStatusLabel(payment.status)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'documents' && (
          <div>
            {contract.documents.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">Nenhum documento anexado.</p>
            ) : (
              <div className="space-y-2">
                {contract.documents.map((document) => (
                  <div
                    key={document.id}
                    className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 p-3"
                  >
                    <span className="truncate text-sm font-semibold text-slate-800">{document.originalName}</span>
                    <a
                      href={getDocumentUrl(document.path)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-semibold text-primary-700 hover:text-primary-800"
                    >
                      Baixar
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'comments' && (
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <textarea
                value={newComment}
                onChange={(event) => setNewComment(event.target.value)}
                placeholder="Registrar andamento, pendência ou decisão técnica..."
                className="input-field min-h-24 resize-none sm:flex-1"
              />
              <button
                onClick={handleAddComment}
                disabled={sendingComment || !newComment.trim()}
                className="btn-primary self-start"
              >
                <Send size={16} />
                Enviar
              </button>
            </div>
            {contract.comments.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">Nenhum comentário registrado.</p>
            ) : (
              contract.comments.map((comment) => (
                <div key={comment.id} className="rounded-lg border border-slate-200 p-4">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900">{comment.user?.name}</span>
                    <span className="text-xs text-slate-400">{formatDateTime(comment.createdAt)}</span>
                  </div>
                  <p className="text-sm leading-6 text-slate-700">{comment.content}</p>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div>
            {contract.history.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">Nenhuma alteração registrada.</p>
            ) : (
              <div className="space-y-3">
                {contract.history.map((entry) => (
                  <div key={entry.id} className="flex gap-3 rounded-lg border border-slate-200 p-3">
                    <CalendarDays className="mt-0.5 text-slate-400" size={18} />
                    <div>
                      <p className="text-sm text-slate-700">
                        Campo <strong>{entry.field}</strong> alterado de "{entry.oldValue || '-'}" para "
                        {entry.newValue || '-'}"
                      </p>
                      <p className="mt-1 text-xs text-slate-400">{formatDateTime(entry.changedAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
