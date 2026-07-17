import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { Building2, Eye, EyeOff, FileCheck2, LockKeyhole, Shield } from 'lucide-react';

const loginSchema = z.object({
  login: z.string().min(1, 'E-mail ou CPF é obrigatório'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [totpCode, setTotpCode] = useState('');
  const [loginData, setLoginData] = useState<LoginForm | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      const result = await login(data.login, data.password);
      if (result.requiresTwoFactor) {
        setRequiresTwoFactor(true);
        setLoginData(data);
        return;
      }
      toast.success('Login realizado com sucesso!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao fazer login');
    }
  };

  const handleTwoFactor = async () => {
    if (!loginData || totpCode.length !== 6) return;
    try {
      await login(loginData.login, loginData.password, totpCode);
      toast.success('Login realizado com sucesso!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Código 2FA inválido');
    }
  };

  if (requiresTwoFactor) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="card w-full max-w-md p-8">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-primary-50 text-primary-700">
              <Shield size={30} />
            </div>
            <h2 className="text-2xl font-semibold text-slate-950">Verificação em dois fatores</h2>
            <p className="mt-2 text-sm text-slate-500">Digite o código do aplicativo autenticador.</p>
          </div>

          <input
            type="text"
            maxLength={6}
            value={totpCode}
            onChange={(event) => setTotpCode(event.target.value.replace(/\D/g, ''))}
            placeholder="000000"
            className="input-field mb-4 text-center text-2xl tracking-widest"
            autoFocus
          />

          <button onClick={handleTwoFactor} className="btn-primary w-full" disabled={totpCode.length !== 6}>
            Verificar acesso
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-[minmax(420px,0.9fr)_1.1fr]">
      <aside className="hidden border-r border-primary-800 bg-primary-900 p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white font-bold text-primary-800">
              GP
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">Gerprocess</h1>
              <p className="text-sm text-primary-100">Engenharia e contratos de obras</p>
            </div>
          </div>

          <div className="mt-16 max-w-md">
            <p className="metric-label text-primary-100">Operação pública</p>
            <h2 className="mt-3 text-4xl font-semibold leading-tight">
              Controle técnico, financeiro e documental em um só lugar.
            </h2>
            <p className="mt-5 text-base leading-7 text-primary-100">
              Acompanhe vigência, saldos, documentos, responsáveis e histórico de decisões sem depender de planilhas
              paralelas.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-accent-300">
              <Building2 size={20} />
            </div>
            <p className="font-semibold">Carteira de obras</p>
            <p className="mt-1 text-sm text-primary-100">Vigência, empresa, objeto, responsável e status.</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-accent-300">
              <FileCheck2 size={20} />
            </div>
            <p className="font-semibold">Rastreabilidade</p>
            <p className="mt-1 text-sm text-primary-100">Comentários, histórico, auditoria e anexos por contrato.</p>
          </div>
        </div>
      </aside>

      <main className="flex min-h-screen items-center justify-center px-5 py-10">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-800 font-bold text-white">
                GP
              </div>
              <div>
                <h1 className="text-lg font-semibold text-slate-950">Gerprocess</h1>
                <p className="text-sm text-slate-500">Contratos de obras</p>
              </div>
            </div>
          </div>

          <div className="card p-7">
            <div className="mb-7">
              <p className="metric-label">Acesso restrito</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">Entrar no sistema</h2>
              <p className="mt-2 text-sm text-slate-500">Use CPF ou e-mail institucional.</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">CPF ou e-mail</label>
                <input
                  {...register('login')}
                  type="text"
                  placeholder="Digite seu CPF ou e-mail"
                  className="input-field"
                />
                {errors.login && <p className="mt-1 text-sm text-rose-600">{errors.login.message}</p>}
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Senha</label>
                <div className="relative">
                  <LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Digite sua senha"
                    className="input-field pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-sm text-rose-600">{errors.password.message}</p>}
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input type="checkbox" className="rounded border-slate-300 text-primary-700 focus:ring-primary-500" />
                  Lembrar login
                </label>
                <Link to="/forgot-password" className="text-sm font-semibold text-primary-700 hover:text-primary-800">
                  Esqueci a senha
                </Link>
              </div>

              <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-3">
                {isSubmitting ? 'Entrando...' : 'Entrar'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              Não tem conta?{' '}
              <Link to="/register" className="font-semibold text-primary-700 hover:text-primary-800">
                Solicitar cadastro
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
