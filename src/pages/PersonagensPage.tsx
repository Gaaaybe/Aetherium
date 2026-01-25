import { Card, CardHeader, CardTitle, CardContent } from '../shared/ui';
import { UserCircle, Sparkles } from 'lucide-react';

export function PersonagensPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCircle className="w-5 h-5" /> Fichas de Personagem
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
              O sistema de fichas de personagem está em desenvolvimento. 
              Em breve você poderá criar, gerenciar e compartilhar fichas completas para Spirit and Caos.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
