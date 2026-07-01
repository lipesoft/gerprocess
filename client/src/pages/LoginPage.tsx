import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Shield } from 'lucide-react';

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-600 to-primary-900 px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-6">
            <Shield className="mx-auto text-primary-600 mb-3" size={48} />
            <h2 className="text-2xl font-bold text-gray-900">Verificação 2FA</h2>
            <p className="text-gray-500 mt-2">Digite o código do seu autenticador</p>
          </div>

          <input
            type="text"
            maxLength={6}
            value={totpCode}
            onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
            placeholder="000000"
            className="input-field text-center text-2xl tracking-widest mb-4"
            autoFocus
          />

          <button onClick={handleTwoFactor} className="btn-primary w-full" disabled={totpCode.length !== 6}>
            Verificar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 to-primary-900 items-center justify-center p-12">
        <div className="text-white max-w-md">
          <h1 className="text-4xl font-bold mb-4">Gerprocess</h1>
          <p className="text-xl text-primary-100 mb-8">
            Sistema de Gerenciamento de Contratos de Obras
          </p>
          <div className="space-y-4 text-primary-200">
            <p>✓ Gestão completa de contratos</p>
            <p>✓ Controle financeiro e pagamentos</p>
            <p>✓ Notificações automáticas</p>
            <p>✓ Relatórios e dashboards</p>
          </div>
        </div>
      </div>

      {/* Right side - form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">LOGIN</h2>
            <p className="text-gray-500 mt-2">Acesse sua conta</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CPF/E-mail
              </label>
              <input
                {...register('login')}
                type="text"
                placeholder="Digite seu CPF ou e-mail"
                className="input-field"
              />
              {errors.login && (
                <p className="text-red-500 text-sm mt-1">{errors.login.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Digite sua senha"
                  className="input-field pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                <span className="text-sm text-gray-600">Lembrar login</span>
              </label>
              <Link to="/forgot-password" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                Esqueceu a senha?
              </Link>
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-3 text-lg">
              {isSubmitting ? 'Entrando...' : 'ENTRAR'}
            </button>
          </form>

          <p className="text-center mt-6 text-gray-500">
            Não tem conta?{' '}
            <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium">
              Cadastre-se
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
