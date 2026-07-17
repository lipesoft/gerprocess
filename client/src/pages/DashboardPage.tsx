import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CircleDollarSign,
  FileText,
  PlusCircle,
  RefreshCw,
} from 'lucide-react';
import {
  contractStatusLabels,
  getContractStatusClass,
  getContractStatusLabel,
  getPaymentStatusClass,
  getPaymentStatusLabel,
} from '../constants/contracts';
import { daysUntil, formatCurrency, formatDate, formatPercent } from '../utils/format';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

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

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [calendar, setCalendar] = useState<CalendarData>({ contracts: [], payments: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const [{ data: result }, { data: calendarResult }] = await Promise.all([
        api.get('/contracts/dashboard'),
        api.get('/contracts/calendar', {
          params: { month: now.getMonth() + 1, year: now.getFullYear() },
        }),
      ]);
      setData(result);
      setCalendar(calendarResult);
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary-700" />
      </div>
    );
  }

  const totalValue = Number(data?.totalValue ?? 0);
  const totalBalance = Number(data?.totalBalance ?? 0);
  const executedValue = Math.max(0, totalValue - totalBalance);
  const executionRate = totalValue > 0 ? executedValue / totalValue : 0;

  const chartData = {
    labels: statusOrder.map((status) => contractStatusLabels[status]),
    datasets: [
      {
        label: 'Contratos',
        data: statusOrder.map((status) => data?.statusCounts?.[status] || 0),
        backgroundColor: ['#2f6f5e', '#f59e0b', '#10b981', '#e11d48'],
        borderRadius: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true, ticks: { precision: 0 } },
    },
  };

  const agendaItems = [
    ...calendar.contracts.map((contract) => ({
      id: contract.id,
      title: contract.name,
      label: 'Vencimento contratual',
      date: contract.endDate,
      status: contract.status,
      to: `/contracts/${contract.id}`,
      kind: 'contract' as const,
    })),
    ...calendar.payments.map((payment) => ({
      id: payment.id,
      title: payment.description,
      label: 'Pagamento previsto',
      date: payment.dueDate,
      status: payment.status,
      to: `/contracts/${payment.contractId}`,
      kind: 'payment' as const,
    })),
  ]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 6);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="metric-label">Visão operacional</p>
          <h1 className="page-title">Painel de contratos de obras</h1>
          <p className="page-subtitle">
            Acompanhe vigência, saldo, pagamentos e alertas que precisam de decisão da equipe técnica.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={fetchDashboard} className="btn-secondary">
            <RefreshCw size={16} />
            Atualizar
          </button>
          <Link to="/contracts/new" className="btn-primary">
            <PlusCircle size={16} />
            Novo contrato
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="card">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="metric-label">Contratos ativos</p>
              <p className="mt-2 text-3xl font-semibold text-slate-950">{data?.totalActive || 0}</p>
              <p className="mt-1 text-sm text-slate-500">{formatCurrency(totalValue)} em carteira</p>
            </div>
            <div className="rounded-lg bg-primary-50 p-3 text-primary-700">
              <FileText size={22} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="metric-label">Risco de prazo</p>
              <p className="mt-2 text-3xl font-semibold text-amber-600">{data?.nearExpiry || 0}</p>
              <p className="mt-1 text-sm text-slate-500">Vencem nos próximos 30 dias</p>
            </div>
            <div className="rounded-lg bg-amber-50 p-3 text-amber-600">
              <AlertTriangle size={22} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="metric-label">Saldo atual</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{formatCurrency(totalBalance)}</p>
              <p className="mt-1 text-sm text-slate-500">{formatCurrency(executedValue)} já executado</p>
            </div>
            <div className="rounded-lg bg-sky-50 p-3 text-sky-700">
              <CircleDollarSign size={22} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="metric-label">Execução financeira</p>
              <p className="mt-2 text-3xl font-semibold text-slate-950">{formatPercent(executionRate)}</p>
              <div className="mt-3 h-2 rounded-full bg-slate-100">
                <div
                  className="h-2 rounded-full bg-primary-600"
                  style={{ width: `${Math.min(100, Math.round(executionRate * 100))}%` }}
                />
              </div>
            </div>
            <div className="rounded-lg bg-emerald-50 p-3 text-emerald-700">
              <CalendarClock size={22} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <div className="card xl:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-950">Distribuição por status</h2>
              <p className="text-sm text-slate-500">Carteira agrupada pela situação atual do contrato.</p>
            </div>
            <Link to="/reports" className="text-sm font-semibold text-primary-700 hover:text-primary-800">
              Ver relatórios
            </Link>
          </div>
          <div className="h-72">
            <Bar data={chartData} options={chartOptions} />
          </div>
        </div>

        <div className="card xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-950">Agenda crítica</h2>
              <p className="text-sm text-slate-500">Vencimentos e pagamentos do mês corrente.</p>
            </div>
            <CalendarClock className="text-slate-400" size={20} />
          </div>

          {agendaItems.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
              Nenhum evento previsto para este mês.
            </div>
          ) : (
            <div className="space-y-3">
              {agendaItems.map((item) => {
                const remaining = daysUntil(item.date);
                const statusClass =
                  item.kind === 'contract'
                    ? getContractStatusClass(item.status)
                    : getPaymentStatusClass(item.status);
                const statusLabel =
                  item.kind === 'contract'
                    ? getContractStatusLabel(item.status)
                    : getPaymentStatusLabel(item.status);

                return (
                  <Link
                    key={`${item.kind}-${item.id}`}
                    to={item.to}
                    className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-3 transition-colors hover:border-primary-200 hover:bg-primary-50/40"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{item.title}</p>
                      <p className="text-xs text-slate-500">
                        {item.label} em {formatDate(item.date)}
                        {remaining !== null && remaining >= 0 ? ` · ${remaining} dia(s)` : ''}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className={`status-pill ${statusClass}`}>{statusLabel}</span>
                      <ArrowRight size={16} className="text-slate-400" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
