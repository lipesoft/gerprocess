import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Building2, CalendarDays, FileText, Save } from 'lucide-react';

const contractSchema = z
  .object({
    name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
    contractNumber: z.string().min(1, 'Número do contrato é obrigatório'),
    company: z.string().min(2, 'Empresa é obrigatória'),
    workType: z.string().min(2, 'Tipo de obra é obrigatório'),
    objective: z.string().optional(),
    totalValue: z.coerce.number().positive('Valor deve ser positivo'),
    startDate: z.string().min(1, 'Data de início é obrigatória'),
    endDate: z.string().min(1, 'Data de término é obrigatória'),
    responsibleId: z.string().uuid('Selecione um responsável'),
  })
  .refine((data) => new Date(data.endDate) >= new Date(data.startDate), {
    message: 'A data de término deve ser posterior ou igual ao início',
    path: ['endDate'],
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
    api
      .get('/users?limit=100')
      .then(({ data }) => setUsers(data.users || []))
      .catch(() => {});
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
    <div className="mx-auto max-w-4xl space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950"
      >
        <ArrowLeft size={18} />
        Voltar
      </button>

      <div>
        <p className="metric-label">Novo registro</p>
        <h1 className="page-title">Cadastrar contrato de obra</h1>
        <p className="page-subtitle">
          Registre os dados mínimos para acompanhamento de vigência, saldo, responsável e fiscalização.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <section className="card">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-lg bg-primary-50 p-2 text-primary-700">
              <FileText size={18} />
            </div>
            <div>
              <h2 className="font-semibold text-slate-950">Identificação</h2>
              <p className="text-sm text-slate-500">Dados administrativos do contrato.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Nome do contrato</label>
              <input {...register('name')} className="input-field" placeholder="Ex: Reforma do Fórum Central" />
              {errors.name && <p className="mt-1 text-sm text-rose-600">{errors.name.message}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Número do contrato</label>
              <input {...register('contractNumber')} className="input-field" placeholder="Ex: CT-2026/001" />
              {errors.contractNumber && <p className="mt-1 text-sm text-rose-600">{errors.contractNumber.message}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Empresa contratada</label>
              <input {...register('company')} className="input-field" placeholder="Razão social da contratada" />
              {errors.company && <p className="mt-1 text-sm text-rose-600">{errors.company.message}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Responsável técnico</label>
              <select {...register('responsibleId')} className="input-field">
                <option value="">Selecione...</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
              {errors.responsibleId && <p className="mt-1 text-sm text-rose-600">{errors.responsibleId.message}</p>}
            </div>
          </div>
        </section>

        <section className="card">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-lg bg-amber-50 p-2 text-amber-700">
              <Building2 size={18} />
            </div>
            <div>
              <h2 className="font-semibold text-slate-950">Escopo da obra</h2>
              <p className="text-sm text-slate-500">Classifique o serviço e detalhe o objetivo contratado.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Tipo de obra</label>
              <input {...register('workType')} className="input-field" placeholder="Ex: Reforma, construção, adequação" />
              {errors.workType && <p className="mt-1 text-sm text-rose-600">{errors.workType.message}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Valor total (R$)</label>
              <input {...register('totalValue')} type="number" step="0.01" className="input-field" placeholder="0,00" />
              {errors.totalValue && <p className="mt-1 text-sm text-rose-600">{errors.totalValue.message}</p>}
            </div>
          </div>

          <div className="mt-5">
            <label className="mb-1 block text-sm font-semibold text-slate-700">Objetivo</label>
            <textarea
              {...register('objective')}
              className="input-field min-h-28 resize-none"
              placeholder="Descreva o objeto contratado, unidade atendida e entregas esperadas."
            />
          </div>
        </section>

        <section className="card">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-lg bg-sky-50 p-2 text-sky-700">
              <CalendarDays size={18} />
            </div>
            <div>
              <h2 className="font-semibold text-slate-950">Vigência</h2>
              <p className="text-sm text-slate-500">Defina o período de acompanhamento do contrato.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Início</label>
              <input {...register('startDate')} type="date" className="input-field" />
              {errors.startDate && <p className="mt-1 text-sm text-rose-600">{errors.startDate.message}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Término</label>
              <input {...register('endDate')} type="date" className="input-field" />
              {errors.endDate && <p className="mt-1 text-sm text-rose-600">{errors.endDate.message}</p>}
            </div>
          </div>
        </section>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">
            Cancelar
          </button>
          <button type="submit" disabled={isSubmitting} className="btn-primary">
            <Save size={16} />
            {isSubmitting ? 'Salvando...' : 'Salvar contrato'}
          </button>
        </div>
      </form>
    </div>
  );
}
