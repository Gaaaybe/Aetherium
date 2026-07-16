import { useState, useRef, useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Link, useLocation } from 'react-router-dom';
import { UserCircle, GitBranch, BookOpen, Moon, Sun, Users, LogIn, LogOut, Globe, ChevronDown, Layers, Zap, ShieldAlert } from 'lucide-react';
import { useDarkMode, useScrollToTop, useMetaTags } from './shared/hooks';
import { Button, ToastContainer } from './shared/ui';
import { CriadorPage, BibliotecaPage, SobrePage, GerenciadorPage, LandingPage, LoginPage, PersonagensPage, CharacterSheetDetailPage, CampanhasPage, ComunidadePage, AdminDashboardPage } from './pages';
import { Breadcrumbs, PrivateRoute } from './shared/components';
import { useAuth } from './context/useAuth';
import { MigracaoLocalStorage } from './features/criador-de-poder/components/MigracaoLocalStorage';

const navClass = (isActive: boolean) =>
  `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
    isActive
      ? 'bg-espirito-100 dark:bg-espirito-900/30 text-espirito-700 dark:text-espirito-300'
      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
  }`;

const COLECAO_ITEMS = [
  { to: '/biblioteca',   icon: BookOpen,    label: 'Biblioteca',  desc: 'Poderes · Acervos · Peculiaridades' },
  { to: '/personagens',  icon: UserCircle,  label: 'Personagens', desc: null },
  { to: '/gerenciador',  icon: Users,       label: 'Criaturas',   desc: null },
  { to: '/campanhas',    icon: GitBranch,   label: 'Campanhas',   desc: null },
] as const;

function MinhaColecaoDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  useEffect(() => setOpen(false), [location.pathname]);

  const isActive = COLECAO_ITEMS.some(({ to }) => location.pathname === to || location.pathname.startsWith(to + '/'));

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className={navClass(isActive)}
        aria-haspopup="true"
        aria-expanded={open}
      >
        <Layers className="w-4 h-4" />
        <span className="hidden sm:inline">Minha Coleção</span>
        <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full mt-1.5 left-0 w-56 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-1.5 z-50">
          {COLECAO_ITEMS.map(({ to, icon: Icon, label, desc }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-start gap-3 px-4 py-2.5 text-sm transition-colors ${
                  isActive
                    ? 'bg-espirito-50 dark:bg-espirito-900/20 text-espirito-700 dark:text-espirito-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`
              }
            >
              <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium leading-none">{label}</p>
                {desc && <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">{desc}</p>}
              </div>
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

function Navigation() {
  const { user } = useAuth();
  return (
    <nav className="flex items-center gap-1 sm:gap-2">
      <NavLink to="/criador" className={({ isActive }) => navClass(isActive)}>
        <Zap className="w-4 h-4" />
        <span className="hidden sm:inline">Criar</span>
      </NavLink>

      <MinhaColecaoDropdown />

      <NavLink to="/comunidade" className={({ isActive }) => navClass(isActive)}>
        <Globe className="w-4 h-4" />
        <span className="hidden sm:inline">Comunidade</span>
      </NavLink>

      <NavLink to="/sobre" className={({ isActive }) => navClass(isActive)}>
        <BookOpen className="w-4 h-4" />
        <span className="hidden sm:inline">Sobre</span>
      </NavLink>

      {user?.isAdmin && (
        <NavLink to="/admin" className={({ isActive }) => navClass(isActive)}>
          <ShieldAlert className="w-4 h-4 text-red-500 dark:text-red-400" />
          <span className="hidden sm:inline">Admin</span>
        </NavLink>
      )}
    </nav>
  );
}

function AppContent() {
  const { isDark, toggle } = useDarkMode();
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  
  // Routing enhancements
  useScrollToTop();
  useMetaTags();

  const isFicha = location.pathname.includes('/personagens/') && location.pathname.split('/').length > 2;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-100 dark:from-gray-950 dark:via-espirito-950/20 dark:to-gray-950 transition-all duration-500">
      <ToastContainer />

      {/* Migração de localStorage → API (exibe apenas se autenticado e com dados locais) */}
      {isAuthenticated && <MigracaoLocalStorage />}
      
      {/* Header com gradiente sutil */}
      <header className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl shadow-2xl border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-40 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <Link to="/" className="block">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-espirito-600 via-espirito-500 to-purple-600 dark:from-espirito-400 dark:via-espirito-300 dark:to-purple-400 bg-clip-text text-transparent animate-gradient bg-300% hover:opacity-80 transition-opacity cursor-pointer">
                Aetherium
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">
                Plataforma Digital para Spirit and Caos
              </p>
            </Link>
            
            <div className="flex items-center justify-between sm:justify-end gap-3">
              <Navigation />

              {/* Controles de autenticação */}
              {isAuthenticated ? (
                <div className="flex items-center gap-2">
                  <span className="hidden sm:block text-xs text-gray-500 dark:text-gray-400 truncate max-w-28">
                    {user?.name}
                  </span>
                  <Button
                    onClick={logout}
                    variant="ghost"
                    title="Sair"
                    aria-label="Sair da conta"
                    className="hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Link to="/entrar">
                  <Button
                    variant="ghost"
                    title="Entrar"
                    aria-label="Entrar na conta"
                    className="hover:bg-espirito-50 dark:hover:bg-espirito-900/20 text-espirito-600 dark:text-espirito-400 flex items-center gap-1.5 text-sm"
                  >
                    <LogIn className="w-4 h-4" />
                    <span className="hidden sm:inline">Entrar</span>
                  </Button>
                </Link>
              )}
              
              <Button 
                onClick={toggle} 
                variant="ghost" 
                title={isDark ? 'Modo claro' : 'Modo escuro'}
                aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
                className="hover:bg-gray-100/80 dark:hover:bg-gray-800/80"
              >
                {isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full py-4 sm:py-8">
        <div className={`mx-auto px-4 sm:px-6 lg:px-8 ${isFicha ? 'max-w-[1600px]' : 'max-w-7xl'}`}>
          <Breadcrumbs />
        </div>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/entrar" element={<LoginPage />} />
          <Route path="/personagens" element={<PersonagensPage />} />
          <Route path="/personagens/:id" element={<CharacterSheetDetailPage />} />
          <Route path="/campanhas" element={<CampanhasPage />} />
          <Route
            path="/criador"
            element={
              <PrivateRoute>
                <CriadorPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/biblioteca"
            element={
              <PrivateRoute>
                <BibliotecaPage />
              </PrivateRoute>
            }
          />
          <Route path="/gerenciador" element={<GerenciadorPage />} />
          <Route path="/comunidade" element={<ComunidadePage />} />
          <Route path="/sobre" element={<SobrePage />} />
          <Route
            path="/admin"
            element={
              <PrivateRoute adminOnly>
                <AdminDashboardPage />
              </PrivateRoute>
            }
          />
        </Routes>
      </main>

      {/* Footer com créditos */}
      <footer className="relative z-40 py-4 sm:py-6 border-t border-gray-200/50 dark:border-gray-800/50 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 text-center">
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            Criado por Gabriel Menezes para jogadores de Spirit and Caos
          </p>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter basename="/Aetherium">
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
