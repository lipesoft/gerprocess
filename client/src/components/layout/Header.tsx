import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Bell, Search, ShieldCheck } from 'lucide-react';

export default function Header() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchQuery.trim();
    navigate(query ? `/contracts?search=${encodeURIComponent(query)}` : '/contracts');
  };

  return (
    <header className="sticky top-0 z-40 flex min-h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
      <div className="flex items-center gap-3 lg:hidden">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-800 text-sm font-bold text-white">
          GP
        </div>
        <span className="text-sm font-semibold text-slate-900">Gerprocess</span>
      </div>

      <form onSubmit={handleSearch} className="hidden max-w-md flex-1 items-center gap-3 sm:flex">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Buscar contratos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </form>

      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200 md:flex">
          <ShieldCheck size={14} />
          Ambiente seguro
        </div>

        <button
          aria-label="Notificações"
          className="relative rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
        >
          <Bell size={20} />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500" />
        </button>

        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-700 text-sm font-semibold text-white">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <span className="hidden text-sm font-medium text-slate-700 md:block">{user?.name}</span>
        </div>
      </div>
    </header>
  );
}
