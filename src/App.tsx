import { useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { Wand2, Library, BookOpen, Moon, Sun, Users } from 'lucide-react';
import { useDarkMode, useFirstVisit, useScrollToTop, useMetaTags } from './shared/hooks';
import { Button, ToastContainer } from './shared/ui';
import { CriadorPage, BibliotecaPage, SobrePage, GerenciadorPage } from './pages';
import { ModalAtalhos } from './features/criador-de-poder/components/ModalAtalhos';
import { PageTransition, Breadcrumbs } from './shared/components';

function Navigation() {
  return (
    <nav className="flex items-center gap-1 sm:gap-2">
      <NavLink
        to="/"
        className={({ isActive }) =>
          `flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            isActive
              ? 'bg-espirito-100 dark:bg-espirito-900/30 text-espirito-700 dark:text-espirito-300'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`
        }
      >
        <Wand2 className="w-4 h-4" />
        Criador
      </NavLink>
      <NavLink
        to="/biblioteca"
        className={({ isActive }) =>
          `flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            isActive
              ? 'bg-espirito-100 dark:bg-espirito-900/30 text-espirito-700 dark:text-espirito-300'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`
        }
      >
        <Library className="w-4 h-4" />
        Biblioteca
      </NavLink>
      <NavLink
        to="/gerenciador"
        className={({ isActive }) =>
          `flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            isActive
              ? 'bg-espirito-100 dark:bg-espirito-900/30 text-espirito-700 dark:text-espirito-300'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`
        }
      >
        <Users className="w-4 h-4" />
        Criaturas
      </NavLink>
      <NavLink
        to="/sobre"
        className={({ isActive }) =>
          `flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            isActive
              ? 'bg-espirito-100 dark:bg-espirito-900/30 text-espirito-700 dark:text-espirito-300'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`
        }
      >
        <BookOpen className="w-4 h-4" />
        Sobre
      </NavLink>
    </nav>
  );
}

function AppContent() {
  const { isDark, toggle } = useDarkMode();
  const [mostrarAtalhos, setMostrarAtalhos] = useState(false);
  const [isFirstVisit, markAsVisited] = useFirstVisit('atalhos-visto');
  
  // Routing enhancements
  useScrollToTop();
  useMetaTags();

  const abrirAtalhos = () => {
    setMostrarAtalhos(true);
    if (isFirstVisit) {
      markAsVisited();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-100 dark:from-gray-950 dark:via-espirito-950/20 dark:to-gray-950 transition-all duration-500">
      <ToastContainer />
      
      {/* Header com gradiente sutil */}
      <header className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl shadow-2xl border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-40 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-espirito-600 via-espirito-500 to-purple-600 dark:from-espirito-400 dark:via-espirito-300 dark:to-purple-400 bg-clip-text text-transparent animate-gradient bg-300%">
                Espírito & Caos
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">
                Sistema de Criação de Poderes
              </p>
            </div>
            
            <div className="flex items-center justify-between sm:justify-end gap-3">
              <Navigation />
              
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Button onClick={abrirAtalhos} variant="ghost" title="Atalhos de teclado (?)" aria-label="Atalhos de teclado" className="hover:bg-gray-100/80 dark:hover:bg-gray-800/80">
                    ⌨️
                  </Button>
                  {isFirstVisit && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-espirito-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-espirito-500"></span>
                    </span>
                  )}
                </div>
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
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <Breadcrumbs />
        <PageTransition>
          <Routes>
            <Route path="/" element={<CriadorPage />} />
            <Route path="/biblioteca" element={<BibliotecaPage />} />
            <Route path="/gerenciador" element={<GerenciadorPage />} />
            <Route path="/sobre" element={<SobrePage />} />
          </Routes>
        </PageTransition>
      </main>

      {/* Footer com créditos */}
      <footer className="mt-0 sm:mt-16 py-4 sm:py-6 border-t border-gray-200/50 dark:border-gray-800/50 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 text-center">
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            Criado por Gabriel Menezes para jogadores de Espírito & Caos
          </p>
        </div>
      </footer>

      <ModalAtalhos
        isOpen={mostrarAtalhos}
        onClose={() => setMostrarAtalhos(false)}
      />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter basename="/Spirit-and-Caos-system">
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
