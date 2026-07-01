import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { FileText, Clock, PlusCircle, RefreshCw } from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface DashboardData {
  totalActive: number;
  nearExpiry: number;
  newContracts: number;
  pendingRenewals: number;
  statusCounts: Record<string, number>;
  totalValue: number;
  totalBalance: number;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const { data: result } = await api.get('/contracts/dashboard');
      setData(result);
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const chartData = {
    labels: ['Concluídos', 'Em Andamento', 'Pendentes', 'Cancelados'],
    datasets: [
      {
        label: 'Contratos',
        data: [
          data?.statusCounts?.CONCLUIDO || 0,
          data?.statusCounts?.EM_ANDAMENTO || 0,
          data?.statusCounts?.PENDENTE || 0,
          data?.statusCounts?.CANCELADO || 0,
        ],
        backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'],
        borderRadius: 8,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: true, text: 'Status dos Contratos', font: { size: 16 } },
    },
    scales: {
      y: { beginAtZero: true, ticks: { stepSize: 1 } },
    },
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Contratos Ativos</p>
              <p className="text-2xl font-bold text-gray-900">{data?.totalActive || 0}</p>
              <p className="text-xs text-gray-400 mt-1">{formatCurrency(Number(data?.totalValue) || 0)}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Próximos do Vencimento</p>
              <p className="text-2xl font-bold text-orange-600">{data?.nearExpiry || 0}</p>
              <p className="text-xs text-gray-400 mt-1">Nos próximos 30 dias</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clock className="text-orange-600" size={24} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Novos Contratos</p>
              <p className="text-2xl font-bold text-green-600">{data?.newContracts || 0}</p>
              <p className="text-xs text-gray-400 mt-1">Este mês</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <PlusCircle className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Renovações Pendentes</p>
              <p className="text-2xl font-bold text-purple-600">{data?.pendingRenewals || 0}</p>
              <p className="text-xs text-gray-400 mt-1">Aguardando ação</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <RefreshCw className="text-purple-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <Bar data={chartData} options={chartOptions} />
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Calendário de Vencimento</h3>
          <p className="text-gray-500 text-sm">
            Visualize os contratos e pagamentos próximos do vencimento.
          </p>
          {/* Calendar component placeholder */}
          <div className="mt-4 p-8 bg-gray-50 rounded-lg text-center text-gray-400">
            Calendário interativo
          </div>
        </div>
      </div>
    </div>
  );
}
