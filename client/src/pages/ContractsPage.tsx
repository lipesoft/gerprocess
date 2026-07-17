import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { Filter, FileText, Plus, Search } from 'lucide-react';
import { getContractStatusClass, getContractStatusLabel } from '../constants/contracts';
import { daysUntil, formatCurrency, formatDate } from '../utils/format';

interface Contract {
  id: string;
  name: string;
  contractNumber: string;
  company: string;
  status: string;
  totalValue: string;
  endDate: string;
  responsible: { id: string; name: string };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const statusOptions = [
  { value: '', label: 'Todos os status' },
  { value: 'EM_ANDAMENTO', label: 'Em andamento' },
  { value: 'PENDENTE', label: 'Pendente' },
  { value: 'CONCLUIDO', label: 'Concluído' },
  { value: 'CANCELADO', label: 'Cancelado' },
];

function getDeadlineLabel(endDate: string) {
  const remaining = daysUntil(endDate);

  if (remaining === null) return 'Sem prazo';
  if (remaining < 0) return `Vencido há ${Math.abs(remaining)} dia(s)`;
  if (remaining === 0) return 'Vence hoje';
  return `Vence em ${remaining} dia(s)`;
}

export default function ContractsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const appliedSearch = searchParams.get('search') ?? '';

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(appliedSearch);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    setSearch(appliedSearch);
    setPage(1);
  }, [appliedSearch]);

  useEffect(() => {
    fetchContracts();
  }, [page, statusFilter, appliedSearch]);

  const fetchContracts = async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 20 };
      if (appliedSearch) params.search = appliedSearch;
      if (statusFilter) params.status = statusFilter;

      const { data } = await api.get('/contracts', { params });
      setContracts(data.contracts);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Erro ao carregar contratos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextSearch = search.trim();
    setPage(1);
    setSearchParams(nextSearch ? { search: nextSearch } : {});
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="metric-label">Carteira operacional</p>
          <h1 className="page-title">Contratos</h1>
          <p className="page-subtitle">
            Consulte contratos por obra, número, empresa, responsável e situação de vigência.
          </p>
        </div>
        <Link to="/contracts/new" className="btn-primary">
          <Plus size={16} />
          Novo contrato
        </Link>
      </div>

      <div className="card">
        <div className="flex flex-col gap-3 lg:flex-row">
          <form onSubmit={handleSearch} className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nome, número ou empresa..."
              className="input-field pl-10"
            />
          </form>

          <div className="relative w-full lg:w-64">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setPage(1);
              }}
              className="input-field pl-10"
            >
              {statusOptions.map((option) => (
                <option key={option.value || 'all'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        {loading ? (
          <div className="flex h-36 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary-700" />
          </div>
        ) : contracts.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <FileText className="mx-auto mb-3 text-slate-300" size={48} />
            <p className="font-medium text-slate-700">Nenhum contrato encontrado</p>
            <p className="mt-1 text-sm text-slate-500">Revise a busca ou cadastre um novo contrato.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px]">
              <thead className="table-head">
                <tr>
                  <th className="px-5 py-3">Contrato</th>
                  <th className="px-5 py-3">Empresa</th>
                  <th className="px-5 py-3">Valor</th>
                  <th className="px-5 py-3">Vencimento</th>
                  <th className="px-5 py-3">Responsável</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {contracts.map((contract) => {
                  const deadline = daysUntil(contract.endDate);
                  const deadlineTone =
                    deadline !== null && deadline <= 30 && contract.status === 'EM_ANDAMENTO'
                      ? 'text-amber-700'
                      : 'text-slate-500';

                  return (
                    <tr key={contract.id} className="transition-colors hover:bg-slate-50">
                      <td className="px-5 py-4">
                        <Link
                          to={`/contracts/${contract.id}`}
                          className="font-semibold text-primary-700 hover:text-primary-800"
                        >
                          {contract.name}
                        </Link>
                        <p className="mt-1 text-xs text-slate-500">{contract.contractNumber}</p>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-700">{contract.company}</td>
                      <td className="px-5 py-4 text-sm font-semibold text-slate-950">
                        {formatCurrency(contract.totalValue)}
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-slate-800">{formatDate(contract.endDate)}</p>
                        <p className={`text-xs ${deadlineTone}`}>{getDeadlineLabel(contract.endDate)}</p>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-700">{contract.responsible?.name || '-'}</td>
                      <td className="px-5 py-4">
                        <span className={`status-pill ${getContractStatusClass(contract.status)}`}>
                          {getContractStatusLabel(contract.status)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {pagination && pagination.totalPages > 1 && (
          <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              Mostrando {(page - 1) * 20 + 1} a {Math.min(page * 20, pagination.total)} de {pagination.total}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="btn-secondary disabled:cursor-not-allowed disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === pagination.totalPages}
                className="btn-secondary disabled:cursor-not-allowed disabled:opacity-50"
              >
                Próximo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
