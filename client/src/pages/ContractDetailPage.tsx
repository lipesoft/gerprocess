import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowLeft, FileUp, MessageSquare, History, DollarSign } from 'lucide-react';

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
  documents: any[];
  payments: any[];
  comments: any[];
  history: any[];
}

export default function ContractDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'payments' | 'documents' | 'comments' | 'history'>('details');
  const [newComment, setNewComment] = useState('');

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
    try {
      await api.post(`/contracts/${id}/comments`, { content: newComment });
      setNewComment('');
      fetchContract();
      toast.success('Comentário adicionado');
    } catch {
      toast.error('Erro ao adicionar comentário');
    }
  };

  const formatCurrency = (value: string | number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!contract) return null;

  const statusColors: Record<string, string> = {
    EM_ANDAMENTO: 'bg-blue-100 text-blue-700',
    CONCLUIDO: 'bg-green-100 text-green-700',
    PENDENTE: 'bg-yellow-100 text-yellow-700',
    CANCELADO: 'bg-red-100 text-red-700',
  };

  const statusLabels: Record<string, string> = {
    EM_ANDAMENTO: 'Em Andamento',
    CONCLUIDO: 'Concluído',
    PENDENTE: 'Pendente',
    CANCELADO: 'Cancelado',
  };

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/contracts')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
        <ArrowLeft size={18} /> Voltar
      </button>

      {/* Header */}
      <div className="card">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{contract.name}</h1>
            <p className="text-gray-500 mt-1">{contract.contractNumber} • {contract.company}</p>
          </div>
          <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${statusColors[contract.status]}`}>
            {statusLabels[contract.status]}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div>
            <p className="text-xs text-gray-500 uppercase">Valor Total</p>
            <p className="text-lg font-bold text-gray-900">{formatCurrency(contract.totalValue)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Saldo Atual</p>
            <p className="text-lg font-bold text-green-600">{formatCurrency(contract.currentBalance)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Início</p>
            <p className="text-lg font-medium">{format(new Date(contract.startDate), 'dd/MM/yyyy')}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Término</p>
            <p className="text-lg font-medium">{format(new Date(contract.endDate), 'dd/MM/yyyy')}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          {[
            { key: 'details', label: 'Detalhes', icon: null },
            { key: 'payments', label: 'Pagamentos', icon: DollarSign },
            { key: 'documents', label: 'Documentos', icon: FileUp },
            { key: 'comments', label: 'Comentários', icon: MessageSquare },
            { key: 'history', label: 'Histórico', icon: History },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="card">
        {activeTab === 'details' && (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Tipo de Obra</p>
              <p className="font-medium">{contract.workType}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Objetivo</p>
              <p className="font-medium">{contract.objective || 'Não informado'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Responsável</p>
              <p className="font-medium">{contract.responsible?.name} ({contract.responsible?.email})</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Criado por</p>
              <p className="font-medium">{contract.createdBy?.name}</p>
            </div>
          </div>
        )}

        {activeTab === 'payments' && (
          <div>
            {contract.payments.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Nenhum pagamento registrado</p>
            ) : (
              <div className="space-y-3">
                {contract.payments.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{p.description}</p>
                      <p className="text-sm text-gray-500">Vence em {format(new Date(p.dueDate), 'dd/MM/yyyy')}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(p.value)}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        p.status === 'PAGO' ? 'bg-green-100 text-green-700' :
                        p.status === 'ATRASADO' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {p.status}
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
              <p className="text-gray-500 text-center py-8">Nenhum documento anexado</p>
            ) : (
              <div className="space-y-2">
                {contract.documents.map((doc: any) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">{doc.originalName}</span>
                    <a href={`/uploads/${doc.path}`} target="_blank" className="text-primary-600 text-sm hover:underline">
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
            <div className="flex gap-3">
              <input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Adicionar comentário..."
                className="input-field flex-1"
              />
              <button onClick={handleAddComment} className="btn-primary">
                Enviar
              </button>
            </div>
            {contract.comments.map((c: any) => (
              <div key={c.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">{c.user?.name}</span>
                  <span className="text-xs text-gray-400">{format(new Date(c.createdAt), "dd/MM/yyyy 'às' HH:mm")}</span>
                </div>
                <p className="text-gray-700">{c.content}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'history' && (
          <div>
            {contract.history.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Nenhuma alteração registrada</p>
            ) : (
              <div className="space-y-3">
                {contract.history.map((h: any) => (
                  <div key={h.id} className="flex items-start gap-3 p-3 border-l-2 border-primary-200">
                    <div>
                      <p className="text-sm">
                        Campo <strong>{h.field}</strong> alterado de "{h.oldValue}" para "{h.newValue}"
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {format(new Date(h.changedAt), "dd/MM/yyyy 'às' HH:mm")}
                      </p>
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
