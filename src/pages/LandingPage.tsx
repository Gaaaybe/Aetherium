import { Link } from 'react-router-dom';
import { Wand2, Library, Users, Sparkles, Zap, Shield, GitBranch, MessageSquare, Dices, ArrowRight, Check, UserCircle, BookOpen, Star, TrendingUp } from 'lucide-react';
import { Button } from '../shared/ui';

export function LandingPage() {
  return (
    <div className="bg-gradient-to-br from-espirito-50 via-white to-caos-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 overflow-hidden">
      {/* Hero Section - Redesigned */}
      <section className="relative min-h-[85vh] flex items-center overflow-hidden">
        {/* Animated Background Patterns */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-0 w-96 h-96 bg-espirito-500/20 dark:bg-espirito-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-caos-500/20 dark:bg-caos-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-espirito-400/10 to-caos-400/10 dark:from-espirito-400/5 dark:to-caos-400/5 rounded-full blur-3xl"></div>
          
          {/* Grid Pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8882_1px,transparent_1px),linear-gradient(to_bottom,#8882_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_110%)] opacity-20 dark:opacity-10"></div>
        </div>

        <div className="relative w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-12 grid lg:grid-cols-2 gap-12 items-center max-w-[1920px] mx-auto">
          {/* Left Content */}
          <div className="text-center lg:text-left space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-full text-espirito-700 dark:text-espirito-300 text-sm font-medium border border-espirito-200/50 dark:border-espirito-800/50 shadow-lg">
              <Sparkles className="w-4 h-4" />
              Plataforma Digital para Spirit and Caos
            </div>
            
            <div>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black text-gray-900 dark:text-white mb-6 leading-tight">
                Bem-vindo ao{' '}
                <span className="relative inline-block">
                  <span className="absolute inset-0 bg-gradient-to-r from-espirito-600 to-caos-600 blur-2xl opacity-40"></span>
                  <span className="relative bg-gradient-to-r from-espirito-600 via-purple-600 to-caos-600 bg-clip-text text-transparent animate-gradient bg-300%">
                    Aetherium
                  </span>
                </span>
              </h1>
              
              <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                A plataforma completa para mestres e jogadores de Spirit and Caos. 
                Crie poderes épicos, gerencie criaturas e conduza campanhas inesquecíveis.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link to="/personagens">
                <Button size="lg" className="flex items-center gap-2 text-lg px-8 py-6 shadow-xl hover:shadow-2xl transition-all group">
                  <UserCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  Criar Personagem
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/criador">
                <Button variant="secondary" size="lg" className="text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-all">
                  <Wand2 className="w-5 h-5" />
                  Criar Poderes
                </Button>
              </Link>
            </div>

            {/* Stats Row */}
            <div className="flex flex-wrap gap-8 justify-center lg:justify-start pt-8">
              <div className="text-center lg:text-left">
                <div className="text-3xl font-bold text-espirito-600 dark:text-espirito-400">41</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Efeitos Base</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">123</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Modificações</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-3xl font-bold text-caos-600 dark:text-caos-400">∞</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Possibilidades</div>
              </div>
            </div>
          </div>

          {/* Right Content - Floating Cards */}
          <div className="relative hidden lg:block">
            <div className="relative w-full h-[500px]">
              {/* Card 1 - Criador de Poderes */}
              <div className="absolute top-0 right-0 w-72 p-6 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 transform hover:scale-105 transition-all hover:shadow-espirito-500/20 hover:shadow-3xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-espirito-500 to-purple-500 rounded-xl flex items-center justify-center">
                    <Wand2 className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-gray-900 dark:text-white">Criador de Poderes</div>
                    <div className="text-xs text-espirito-600 dark:text-espirito-400 flex items-center gap-1">
                      <Star className="w-3 h-3 fill-current" />
                      Popular
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Sistema completo de criação com validação automática e cálculo de custos
                </p>
              </div>

              {/* Card 2 - Gerenciador */}
              <div className="absolute bottom-24 left-0 w-64 p-5 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 transform hover:scale-105 transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  <div className="font-bold text-gray-900 dark:text-white text-sm">Criaturas</div>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 h-2 bg-green-200 dark:bg-green-900/30 rounded-full overflow-hidden">
                    <div className="h-full w-3/4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"></div>
                  </div>
                  <span className="text-xs text-gray-500">Board ativo</span>
                </div>
              </div>

              {/* Card 3 - Biblioteca */}
              <div className="absolute bottom-0 right-12 w-56 p-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 transform hover:scale-105 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Library className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-bold text-gray-900 dark:text-white">Biblioteca</span>
                  </div>
                  <TrendingUp className="w-4 h-4 text-green-500" />
                </div>
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">Seus Poderes</div>
                <div className="text-xs text-gray-500">Salve e reutilize</div>
              </div>

              {/* Decorative Elements */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-gradient-to-br from-espirito-400/20 to-caos-400/20 rounded-full blur-2xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid - Redesigned with Bento Box Layout */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-white via-gray-50 to-white dark:from-gray-800 dark:via-gray-900 dark:to-gray-800"></div>
        
        <div className="relative w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 max-w-[1920px] mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white mb-4">
              Ferramentas{' '}
              <span className="bg-gradient-to-r from-espirito-600 to-caos-600 bg-clip-text text-transparent">
                Poderosas
              </span>
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Tudo que você precisa para criar e gerenciar suas aventuras em Spirit and Caos
            </p>
          </div>
          
          {/* Bento Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
            {/* Large Feature 1 - Criador de Poderes */}
            <Link to="/criador" className="group md:col-span-2 lg:row-span-2">
              <div className="h-full p-8 bg-gradient-to-br from-espirito-500 to-purple-600 rounded-3xl border-2 border-espirito-400 hover:border-espirito-300 transition-all hover:shadow-2xl hover:shadow-espirito-500/50 relative overflow-hidden">
                {/* Decorative circles */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>
                
                <div className="relative">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs font-bold mb-4">
                    <Star className="w-3 h-3 fill-current" />
                    MAIS POPULAR
                  </div>
                  
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Wand2 className="w-8 h-8 text-white" />
                  </div>
                  
                  <h3 className="text-3xl font-black text-white mb-4">
                    Criador de Poderes
                  </h3>
                  
                  <p className="text-white/90 text-lg mb-6 leading-relaxed">
                    Sistema completo para criar poderes personalizados com efeitos, modificações e cálculo automático de custos
                  </p>
                  
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
                      <div className="text-2xl font-bold text-white">41</div>
                      <div className="text-white/80 text-sm">Efeitos Base</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
                      <div className="text-2xl font-bold text-white">123</div>
                      <div className="text-white/80 text-sm">Modificações</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-white font-medium group-hover:gap-3 transition-all">
                    Começar agora
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </Link>

            {/* Feature 2 - Personagens */}
            <Link to="/personagens" className="group lg:row-span-2">
              <div className="h-full p-6 bg-white dark:bg-gray-800 rounded-3xl border-2 border-gray-200 dark:border-gray-700 hover:border-espirito-400 dark:hover:border-espirito-600 transition-all hover:shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-400/20 to-orange-400/20 rounded-full blur-2xl"></div>
                
                <div className="relative">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 rounded-full text-yellow-700 dark:text-yellow-400 text-xs font-bold mb-4">
                    <Sparkles className="w-3 h-3" />
                    EM BREVE
                  </div>
                  
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900/50 dark:to-orange-900/50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <UserCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                    Fichas de Personagem
                  </h3>
                  
                  <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
                    Crie fichas completas com atributos, perícias e poderes integrados
                  </p>
                  
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Check className="w-4 h-4 text-yellow-500" />
                      Calculadora automática
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Check className="w-4 h-4 text-yellow-500" />
                      Poderes integrados
                    </li>
                  </ul>
                </div>
              </div>
            </Link>

            {/* Feature 3 - Gerenciador de Criaturas */}
            <Link to="/gerenciador" className="group md:col-span-2">
              <div className="h-full p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-700 rounded-3xl border-2 border-green-200 dark:border-green-800 hover:border-green-400 dark:hover:border-green-600 transition-all hover:shadow-xl relative overflow-hidden">
                <div className="absolute bottom-0 right-0 w-48 h-48 bg-green-400/20 rounded-full blur-3xl"></div>
                
                <div className="relative flex flex-col md:flex-row gap-6">
                  <div className="flex-1">
                    <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                      <Users className="w-7 h-7 text-white" />
                    </div>
                    
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                      Gerenciador de Criaturas
                    </h3>
                    
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      Crie fichas completas de NPCs e monstros com board interativo e gerenciamento de combate
                    </p>
                    
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-medium group-hover:gap-3 transition-all">
                      Explorar
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                  
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-green-200 dark:border-green-800">
                      <Library className="w-5 h-5 text-green-600 mb-2" />
                      <div className="text-sm font-medium text-gray-900 dark:text-white">Biblioteca</div>
                      <div className="text-xs text-gray-500">Criaturas salvas</div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-green-200 dark:border-green-800">
                      <Zap className="w-5 h-5 text-green-600 mb-2" />
                      <div className="text-sm font-medium text-gray-900 dark:text-white">Board</div>
                      <div className="text-xs text-gray-500">Visual interativo</div>
                    </div>
                  </div>
                </div>
              </div>
            </Link>

            {/* Feature 4 - Campanhas */}
            <Link to="/campanhas" className="group">
              <div className="h-full p-6 bg-white dark:bg-gray-800 rounded-3xl border-2 border-gray-200 dark:border-gray-700 hover:border-orange-400 dark:hover:border-orange-600 transition-all hover:shadow-xl relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-orange-400/10 rounded-full blur-2xl"></div>
                
                <div className="relative">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-100 dark:bg-orange-900/30 rounded-full text-orange-700 dark:text-orange-400 text-xs font-bold mb-3">
                    EM BREVE
                  </div>
                  
                  <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/50 rounded-xl flex items-center justify-center mb-4">
                    <GitBranch className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    Campanhas
                  </h3>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Organize sessões e acompanhe o progresso
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section - Redesigned */}
      <section className="relative py-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background with overlays */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-espirito-600 via-purple-600 to-caos-600"></div>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-40"></div>
        </div>
        
        {/* Floating orbs */}
        <div className="absolute top-10 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        
        <div className="relative max-w-5xl mx-auto">
          {/* Icon container */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-white/30 rounded-full blur-xl"></div>
              <div className="relative w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                <Shield className="w-10 h-10 text-white" />
              </div>
            </div>
          </div>
          
          {/* Content */}
          <div className="text-center mb-12">
            <h2 className="text-5xl sm:text-6xl font-black text-white mb-6 leading-tight">
              Pronto para começar<br />
              <span className="bg-white/20 backdrop-blur-sm px-6 py-2 rounded-2xl inline-block mt-2">
                sua jornada?
              </span>
            </h2>
            <p className="text-xl sm:text-2xl text-white/90 max-w-2xl mx-auto leading-relaxed font-light">
              Crie poderes épicos, personagens memoráveis e aventuras inesquecíveis
            </p>
          </div>
          
          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Link to="/criador">
              <Button 
                size="lg" 
                className="bg-white text-espirito-600 hover:bg-gray-100 hover:scale-105 text-lg px-10 py-6 font-bold shadow-2xl shadow-black/20 transition-all"
              >
                <Wand2 className="w-5 h-5" />
                Criar Poder Agora
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link to="/gerenciador">
              <Button 
                size="lg" 
                variant="secondary"
                className="bg-white/10 hover:bg-white/20 hover:scale-105 text-white text-lg px-10 py-6 font-bold border-2 border-white/30 backdrop-blur-sm transition-all"
              >
                <Users className="w-5 h-5" />
                Gerenciar Criaturas
              </Button>
            </Link>
          </div>
          
          {/* Stats bar */}
          <div className="max-w-3xl mx-auto">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 text-center">
                <div className="text-4xl font-black text-white mb-2">41</div>
                <div className="text-white/80 text-sm font-medium">Efeitos Únicos</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 text-center">
                <div className="text-4xl font-black text-white mb-2">123</div>
                <div className="text-white/80 text-sm font-medium">Modificações</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 text-center">
                <div className="text-4xl font-black text-white mb-2">∞</div>
                <div className="text-white/80 text-sm font-medium">Possibilidades</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
