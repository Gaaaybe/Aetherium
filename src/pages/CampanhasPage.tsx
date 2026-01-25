import { Card, CardHeader, CardTitle, CardContent } from '../shared/ui';
import { GitBranch, Sparkles } from 'lucide-react';

export function CampanhasPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="w-5 h-5" /> Gerenciador de Campanhas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-espirito-100 dark:bg-espirito-900/30 mb-4">
              <Sparkles className="w-8 h-8 text-espirito-600 dark:text-espirito-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Em Breve
            </h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              O gerenciador de campanhas está em desenvolvimento. 
              Em breve você poderá criar sessões, gerenciar notas, acompanhar a linha do tempo e muito mais.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
