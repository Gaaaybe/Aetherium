import { Link, useLocation } from 'react-router-dom';

interface BreadcrumbItem {
  label: string;
  path: string;
}

const routeLabels: Record<string, string> = {
  '/': 'Início',
  '/personagens': 'Personagens',
  '/campanhas': 'Campanhas',
  '/criador': 'Criador de Poderes',
  '/criador/biblioteca': 'Biblioteca',
  '/gerenciador': 'Criaturas',
  '/sobre': 'Sobre',
};

export function Breadcrumbs() {
  const location = useLocation();
  
  // Não mostra breadcrumbs na home
  if (location.pathname === '/') {
    return null;
  }

  const pathnames = location.pathname.split('/').filter(x => x);
  
  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Início', path: '/' },
  ];

  let currentPath = '';
  pathnames.forEach((segment) => {
    currentPath += `/${segment}`;
    const label = routeLabels[currentPath] || segment;
    breadcrumbs.push({ label, path: currentPath });
  });

  return (
    <nav className="flex items-center gap-2 text-sm mb-4" aria-label="Breadcrumb">
      <ol className="flex items-center gap-2">
        {breadcrumbs.map((breadcrumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          
          return (
            <li key={breadcrumb.path} className="flex items-center gap-2">
              {index > 0 && (
                <span className="text-gray-400 dark:text-gray-600">/</span>
              )}
              {isLast ? (
                <span className="text-espirito-600 dark:text-espirito-400 font-medium">
                  {breadcrumb.label}
                </span>
              ) : (
                <Link
                  to={breadcrumb.path}
                  className="text-gray-600 dark:text-gray-400 hover:text-espirito-600 dark:hover:text-espirito-400 transition-colors"
                >
                  {breadcrumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
