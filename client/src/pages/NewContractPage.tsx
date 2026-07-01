import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';

const contractSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  contractNumber: z.string().min(1, 'Número do contrato é obrigatório'),
  company: z.string().min(2, 'Empresa é obrigatória'),
  workType: z.string().min(2, 'Tipo de obra é obrigatório'),
  objective: z.string().optional(),
  totalValue: z.coerce.number().positive('Valor deve ser positivo'),
  startDate: z.string().min(1, 'Data de início é obrigatória'),
  endDate: z.string().min(1, 'Data de término é obrigatória'),
  responsibleId: z.string().uuid('Selecione um responsável'),
});

type ContractForm = z.infer<typeof contractSchema>;

interface User {
  id: string;
  name: string;
}

export default function NewContractPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ContractForm>({
    resolver: zodResolver(contractSchema),
  });

  useEffect(() => {
    api.get('/users?limit=100').then(({ data }) => setUsers(data.users || [])).catch(() => {});
  }, []);

  const onSubmit = async (data: ContractForm) => {
    try {
      await api.post('/contracts', data);
      toast.success('Contrato criado com sucesso!');
      navigate('/contracts');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao criar contrato');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
        <ArrowLeft size={18} /> Voltar
      </button>

      <h1 className="text-2xl font-bold text-gray-900">Novo Fluxo</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="card space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Contrato</label>
            <input {...register('name')} className="input-field" placeholder="Ex: Reforma Fórum Central" />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Número do Contrato</label>
            <input {...register('contractNumber')} className="input-field" placeholder="Ex: CT-2025/001" />
            {errors.contractNumber && <p className="text-red-500 text-sm mt-1">{errors.contractNumber.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Empresa Contratada</label>
            <input {...register('company')} className="input-field" placeholder="Nome da empresa" />
            {errors.company && <p className="text-red-500 text-sm mt-1">{errors.company.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Obra</label>
            <input {...register('workType')} className="input-field" placeholder="Ex: Reforma, Construção" />
            {errors.workType && <p className="text-red-500 text-sm mt-1">{errors.workType.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prazo Início</label>
            <input {...register('startDate')} type="date" className="input-field" />
            {errors.startDate && <p className="text-red-500 text-sm mt-1">{errors.startDate.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prazo Término</label>
            <input {...register('endDate')} type="date" className="input-field" />
            {errors.endDate && <p className="text-red-500 text-sm mt-1">{errors.endDate.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor Total (R$)</label>
            <input {...register('totalValue')} type="number" step="0.01" className="input-field" placeholder="0,00" />
            {errors.totalValue && <p className="text-red-500 text-sm mt-1">{errors.totalValue.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Responsável do Contrato</label>
            <select {...register('responsibleId')} className="input-field">
              <option value="">Selecione...</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
            {errors.responsibleId && <p className="text-red-500 text-sm mt-1">{errors.responsibleId.message}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Objetivo</label>
          <textarea {...register('objective')} className="input-field h-24 resize-none" placeholder="Descreva o objetivo do contrato..." />
        </div>

        <div className="flex gap-3 pt-4">
          <button type="submit" disabled={isSubmitting} className="btn-primary">
            {isSubmitting ? 'Criando...' : 'CRIAR'}
          </button>
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
