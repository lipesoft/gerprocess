import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import { Shield, Lock, User } from 'lucide-react';

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [show2FASetup, setShow2FASetup] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Senhas não conferem');
      return;
    }
    try {
      await api.put('/users/change-password', { currentPassword, newPassword });
      toast.success('Senha alterada com sucesso!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao alterar senha');
    }
  };

  const handleSetup2FA = async () => {
    try {
      const { data } = await api.post('/auth/2fa/setup');
      setQrCode(data.qrCodeUrl);
      setShow2FASetup(true);
    } catch {
      toast.error('Erro ao configurar 2FA');
    }
  };

  const handleVerify2FA = async () => {
    try {
      await api.post('/auth/2fa/verify', { code: totpCode });
      toast.success('2FA ativado com sucesso!');
      setShow2FASetup(false);
      setTotpCode('');
      refreshUser();
    } catch {
      toast.error('Código inválido');
    }
  };

  const handleDisable2FA = async () => {
    const password = prompt('Digite sua senha para desativar o 2FA:');
    if (!password) return;
    try {
      await api.post('/auth/2fa/disable', { password });
      toast.success('2FA desativado');
      refreshUser();
    } catch {
      toast.error('Senha incorreta');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>

      {/* Profile Info */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <User className="text-primary-600" size={20} />
          <h2 className="text-lg font-semibold">Perfil</h2>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Nome</p>
            <p className="font-medium">{user?.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">E-mail</p>
            <p className="font-medium">{user?.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Perfil</p>
            <p className="font-medium">{user?.role}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">2FA</p>
            <p className="font-medium">{user?.twoFactorEnabled ? 'Ativado' : 'Desativado'}</p>
          </div>
        </div>
      </div>

      {/* 2FA */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="text-primary-600" size={20} />
          <h2 className="text-lg font-semibold">Autenticação em Dois Fatores (2FA)</h2>
        </div>

        {user?.twoFactorEnabled ? (
          <div>
            <p className="text-green-600 font-medium mb-3">2FA está ativo</p>
            <button onClick={handleDisable2FA} className="btn-danger text-sm">
              Desativar 2FA
            </button>
          </div>
        ) : show2FASetup ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Escaneie o QR Code com o Google Authenticator:</p>
            {qrCode && <img src={qrCode} alt="QR Code 2FA" className="w-48 h-48 mx-auto" />}
            <div className="flex gap-3">
              <input
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                maxLength={6}
                placeholder="Código de 6 dígitos"
                className="input-field text-center tracking-widest"
              />
              <button onClick={handleVerify2FA} className="btn-primary" disabled={totpCode.length !== 6}>
                Verificar
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-600 mb-3">
              Adicione uma camada extra de segurança à sua conta.
            </p>
            <button onClick={handleSetup2FA} className="btn-primary text-sm">
              Ativar 2FA
            </button>
          </div>
        )}
      </div>

      {/* Change Password */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <Lock className="text-primary-600" size={20} />
          <h2 className="text-lg font-semibold">Alterar Senha</h2>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha atual</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nova senha</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="input-field"
              minLength={8}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar nova senha</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input-field"
              required
            />
          </div>
          <button type="submit" className="btn-primary">
            Alterar Senha
          </button>
        </form>
      </div>
    </div>
  );
}
