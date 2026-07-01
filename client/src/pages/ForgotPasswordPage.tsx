import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import { Mail, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
      toast.success('E-mail enviado!');
    } catch {
      toast.error('Erro ao enviar e-mail');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md text-center">
          <Mail className="mx-auto text-primary-600 mb-4" size={48} />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">E-mail enviado!</h2>
          <p className="text-gray-500 mb-6">
            Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha.
          </p>
          <Link to="/login" className="btn-primary inline-block">
            Voltar ao login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <Link to="/login" className="flex items-center gap-2 text-primary-600 mb-6 hover:text-primary-700">
          <ArrowLeft size={18} /> Voltar ao login
        </Link>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">Esqueceu a senha?</h2>
        <p className="text-gray-500 mb-6">
          Digite seu e-mail e enviaremos um link para redefinir sua senha.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            className="input-field"
            required
          />
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Enviando...' : 'Enviar link de recuperação'}
          </button>
        </form>
      </div>
    </div>
  );
}
