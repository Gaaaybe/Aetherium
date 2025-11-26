import { Card, CardHeader, CardTitle, CardContent, Badge } from '../shared/ui';

export function SobrePage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>📖 Sobre o Sistema</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
              Sistema de Criação de Poderes
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Ferramenta para criar e gerenciar poderes personalizados seguindo as regras do sistema 
              <strong> Spirit and Caos</strong>, inspirado em Mutants & Masterminds.
            </p>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">
              🎮 Como Funciona
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-600 dark:text-gray-400">
              <li>Adicione um ou mais <strong>Efeitos</strong> (ex: Dano, Voo, Afligir)</li>
              <li>Configure o <strong>grau</strong> de cada efeito</li>
              <li>Adicione <strong>modificações</strong> para customizar (alcance, área, duração)</li>
              <li>Os parâmetros do poder são <strong>auto-calculados</strong></li>
              <li>Salve na <strong>biblioteca</strong> para usar depois</li>
            </ol>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">
              🏗️ Arquitetura de Parâmetros
            </h3>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Regra do "Pior Parâmetro"
              </h4>
              <p className="text-blue-800 dark:text-blue-200 text-sm">
                Os parâmetros do Poder (Ação, Alcance, Duração) são automaticamente calculados como 
                o <strong>pior</strong> (mais restritivo) parâmetro entre todos os efeitos. 
                Você pode modificá-los manualmente para aplicar a todos os efeitos.
              </p>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">
              🧮 Sistema de Cálculo
            </h3>
            <div className="space-y-3">
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                <code className="text-sm text-gray-700 dark:text-gray-300">
                  CustoPorGrau = CustoBase + Modificações + ModificadorGlobal
                </code>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                <code className="text-sm text-gray-700 dark:text-gray-300">
                  CustoEfeito = (CustoPorGrau × Grau) + CustoFixo
                </code>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                <code className="text-sm text-gray-700 dark:text-gray-300">
                  CustoPoder = Σ(CustoEfeito)
                </code>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                * O custo NUNCA pode ser menor que 1 PdA
              </p>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">
              🚀 Tecnologias
            </h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant="espirito">React 19</Badge>
              <Badge variant="secondary">TypeScript</Badge>
              <Badge variant="secondary">Vite 7</Badge>
              <Badge variant="secondary">Tailwind CSS</Badge>
              <Badge variant="secondary">Zod</Badge>
              <Badge variant="secondary">React Router</Badge>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">
              ⌨️ Atalhos de Teclado
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-sm">Ctrl+S</kbd>
                <span className="text-gray-600 dark:text-gray-400">Salvar poder</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-sm">Ctrl+N</kbd>
                <span className="text-gray-600 dark:text-gray-400">Novo poder</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-sm">Ctrl+B</kbd>
                <span className="text-gray-600 dark:text-gray-400">Biblioteca</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-sm">Ctrl+E</kbd>
                <span className="text-gray-600 dark:text-gray-400">Adicionar efeito</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-sm">Ctrl+M</kbd>
                <span className="text-gray-600 dark:text-gray-400">Adicionar modificação</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-sm">Ctrl+R</kbd>
                <span className="text-gray-600 dark:text-gray-400">Ver resumo</span>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
              👨‍💻 Desenvolvedor
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Criado por <strong>Gabriel Menezes</strong> para jogadores de Espírito & Caos
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              Versão 1.0.0 • Novembro 2025
            </p>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>💡 Dica:</strong> Todos os dados são salvos localmente no seu navegador. 
              Use a função de exportar/importar para fazer backup dos seus poderes!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
