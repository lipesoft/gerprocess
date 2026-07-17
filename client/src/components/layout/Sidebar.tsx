import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  Users,
  Settings,
  BarChart3,
  LogOut,
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', label: 'Painel', icon: LayoutDashboard },
  { to: '/contracts', label: 'Contratos', icon: FileText },
  { to: '/contracts/new', label: 'Novo contrato', icon: PlusCircle },
  { to: '/reports', label: 'Relatórios', icon: BarChart3 },
  { to: '/users', label: 'Usuários', icon: Users, roles: ['ADMIN'] },
  { to: '/settings', label: 'Configurações', icon: Settings },
];

export default function Sidebar() {
  const { user, logout } = useAuth();

  const filteredItems = navItems.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role))
  );

  return (
    <aside className="fixed left-0 top-0 z-50 hidden h-screen w-64 flex-col border-r border-primary-800 bg-primary-900 text-white lg:flex">
      <div className="border-b border-white/10 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white font-bold text-primary-800">
            GP
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Gerprocess</h1>
            <p className="text-xs text-primary-100">Contratos de obras</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {filteredItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors duration-200 ${
                    isActive
                      ? 'bg-white text-primary-900 font-semibold shadow-sm'
                      : 'text-primary-100 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                <item.icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-400 font-bold text-primary-950">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user?.name}</p>
            <p className="truncate text-xs text-primary-100">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-primary-100 transition-colors hover:bg-white/10 hover:text-white"
        >
          <LogOut size={16} />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
}
