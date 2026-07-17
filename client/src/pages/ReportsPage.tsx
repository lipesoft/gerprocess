import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { Download, FileSpreadsheet, FileText, Gauge, TrendingUp } from 'lucide-react';
import {
  contractStatusLabels,
  getContractStatusClass,
  getContractStatusLabel,
  getPaymentStatusClass,
  getPaymentStatusLabel,
} from '../constants/contracts';
import { formatCurrency, formatDate, formatPercent } from '../utils/format';

interface DashboardData {
  totalActive: number;
  nearExpiry: number;
  newContracts: number;
  pendingRenewals: number;
  statusCounts: Record<string, number>;
  totalValue: number;
  totalBalance: number;
}

interface CalendarData {
  contracts: Array<{ id: string; name: string; endDate: string; status: string }>;
  payments: Array<{ id: string; description: string; dueDate: string; status: string; contractId: string }>;
}

const statusOrder = ['EM_ANDAMENTO', 'PENDENTE', 'CONCLUIDO', 'CANCELADO'];

export default function ReportsPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [calendar, setCalendar] = useState<CalendarData>({ contracts: [], payments: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const [{ data: dashboardData }, { data: calendarData }] = await Promise.all([
        api.get('/contracts/dashboard'),
        api.get('/contracts/calendar', {
          params: { month: now.getMonth() + 1, year: now.getFullYear() },
        }),
      ]);
      setDashboard(dashboardData);
      setCalendar(calendarData);
    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportSnapshot = () => {
    if (!dashboard) return;

    const rows = [
      ['Indicador', 'Valor'],
      ['Contratos ativos', String(dashboard.totalActive)],
      ['Vencem em 30 dias', String(dashboard.nearExpiry)],
      ['Novos contratos no mês', String(dashboard.newContracts)],
      ['Pendentes', String(dashboard.pendingRenewals)],
      ['Valor total', String(dashboard.totalValue)],
      ['Saldo atual', String(dashboard.totalBalance)],
      ...statusOrder.map((status) => [contractStatusLabels[status], String(dashboard.statusCounts?.[status] || 0)]),
    ];

    const csv = rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gerprocess-resumo-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary-700" />
      </div>
    );
  }

  const totalValue = Number(dashboard?.totalValue ?? 0);
  const totalBalance = Number(dashboard?.totalBalance ?? 0);
  const executedValue = Math.max(0, totalValue - totalBalance);
  const executionRate = totalValue > 0 ? executedValue / totalValue : 0;

  const agenda = [
    ...calendar.contracts.map((contract) => ({
      id: contract.id,
      title: contract.name,
      type: 'Contrato',
      date: contract.endDate,
      status: contract.status,
      to: `/contracts/${contract.id}`,
    })),
    ...calendar.payments.map((payment) => ({
      id: payment.id,
      title: payment.description,
      type: 'Pagamento',
      date: payment.dueDate,
      status: payment.status,
      to: `/contracts/${payment.contractId}`,
    })),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="metric-label">Governança</p>
          <h1 className="page-title">Relatórios</h1>
          <p className="page-subtitle">
            Resumos gerenciais para fiscalização, acompanhamento financeiro e prestação de contas interna.
          </p>
        </div>
        <button onClick={exportSnapshot} className="btn-primary">
          <Download size={16} />
          Exportar resumo CSV
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary-50 p-2 text-primary-700">
              <Gauge size={20} />
            </div>
            <div>
              <p className="metric-label">Execução</p>
              <p className="text-2xl font-semibold text-slate-950">{formatPercent(executionRate)}</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-slate-500">
            {formatCurrency(executedValue)} executados de {formatCurrency(totalValue)}.
          </p>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-50 p-2 text-amber-700">
              <TrendingUp size={20} />
            </div>
            <div>
              <p className="metric-label">Atenção</p>
              <p className="text-2xl font-semibold text-slate-950">{dashboard?.nearExpiry || 0}</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-slate-500">Contratos com vencimento nos próximos 30 dias.</p>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-sky-50 p-2 text-sky-700">
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <p className="metric-label">Saldo</p>
              <p className="text-2xl font-semibold text-slate-950">{formatCurrency(totalBalance)}</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-slate-500">Saldo financeiro atual da carteira monitorada.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <div className="card xl:col-span-2">
          <h2 className="text-base font-semibold text-slate-950">Contratos por status</h2>
          <p className="mt-1 text-sm text-slate-500">Leitura rápida da distribuição da carteira.</p>

          <div className="mt-5 space-y-4">
            {statusOrder.map((status) => {
              const count = dashboard?.statusCounts?.[status] || 0;
              const total = statusOrder.reduce((sum, key) => sum + (dashboard?.statusCounts?.[key] || 0), 0);
              const ratio = total > 0 ? count / total : 0;

              return (
                <div key={status}>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className={`status-pill ${getContractStatusClass(status)}`}>
                      {getContractStatusLabel(status)}
                    </span>
                    <span className="text-sm font-semibold text-slate-800">{count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-primary-600"
                      style={{ width: `${Math.min(100, Math.round(ratio * 100))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card xl:col-span-3">
          <div className="mb-4 flex items-center gap-3">
            <FileText className="text-slate-400" size={20} />
            <div>
              <h2 className="text-base font-semibold text-slate-950">Agenda do mês</h2>
              <p className="text-sm text-slate-500">Eventos que precisam de conferência da equipe.</p>
            </div>
          </div>

          {agenda.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
              Nenhum vencimento ou pagamento previsto para o mês atual.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px]">
                <thead className="table-head">
                  <tr>
                    <th className="px-4 py-3">Evento</th>
                    <th className="px-4 py-3">Tipo</th>
                    <th className="px-4 py-3">Data</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {agenda.map((item) => {
                    const statusClass =
                      item.type === 'Contrato'
                        ? getContractStatusClass(item.status)
                        : getPaymentStatusClass(item.status);
                    const statusLabel =
                      item.type === 'Contrato'
                        ? getContractStatusLabel(item.status)
                        : getPaymentStatusLabel(item.status);

                    return (
                      <tr key={`${item.type}-${item.id}`} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <Link to={item.to} className="font-semibold text-primary-700 hover:text-primary-800">
                            {item.title}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">{item.type}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{formatDate(item.date)}</td>
                        <td className="px-4 py-3">
                          <span className={`status-pill ${statusClass}`}>{statusLabel}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
