import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface MetaTagsConfig {
  title: string;
  description: string;
  keywords?: string;
}

const routeMetaTags: Record<string, MetaTagsConfig> = {
  '/': {
    title: 'Aetherium - Plataforma Digital para Spirit and Caos',
    description: 'A plataforma completa para mestres e jogadores de Spirit and Caos. Crie poderes, gerencie criaturas e muito mais.',
    keywords: 'aetherium, spirit and caos, rpg, plataforma digital, criador de poderes, gerenciador',
  },
  '/personagens': {
    title: 'Fichas de Personagem - Aetherium',
    description: 'Crie e gerencie fichas de personagem completas para Spirit and Caos.',
    keywords: 'fichas, personagens, character sheet, rpg, atributos',
  },
  '/campanhas': {
    title: 'Gerenciador de Campanhas - Aetherium',
    description: 'Organize suas campanhas de Spirit and Caos com gerenciamento de sessões, notas e linha do tempo.',
    keywords: 'campanhas, sessões, mestre, adventure, jogo',
  },
  '/criador': {
    title: 'Criador de Poderes - Aetherium',
    description: 'Crie e gerencie poderes personalizados para o sistema Spirit and Caos. Ferramenta completa com cálculo automático de custos, parâmetros e modificações.',
    keywords: 'criador de poderes, rpg, mutants and masterminds, sistema, jogo',
  },
  '/criador/biblioteca': {
    title: 'Biblioteca de Poderes - Aetherium',
    description: 'Acesse, edite e gerencie todos os seus poderes salvos. Exporte, importe e organize sua coleção de poderes.',
    keywords: 'biblioteca, poderes salvos, gerenciar poderes, exportar, importar',
  },
  '/gerenciador': {
    title: 'Gerenciador de Criaturas - Aetherium',
    description: 'Crie e gerencie NPCs, monstros e criaturas para suas sessões de Spirit and Caos.',
    keywords: 'gerenciador, criaturas, npcs, monstros, combate',
  },
  '/sobre': {
    title: 'Sobre - Aetherium',
    description: 'Conheça o Aetherium, a plataforma digital completa para Spirit and Caos. Documentação e informações sobre as ferramentas disponíveis.',
    keywords: 'documentação, regras, sistema, como usar, tutorial',
  },
};

const defaultMetaTags: MetaTagsConfig = {
  title: 'Aetherium - Plataforma Digital para Spirit and Caos',
  description: 'Ferramentas completas para mestres e jogadores de Spirit and Caos',
  keywords: 'aetherium, spirit and caos, rpg, plataforma digital',
};

/**
 * Hook que atualiza as meta tags baseado na rota atual
 */
export function useMetaTags() {
  const location = useLocation();

  useEffect(() => {
    const meta = routeMetaTags[location.pathname] || defaultMetaTags;

    // Atualiza título
    document.title = meta.title;

    // Atualiza ou cria meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', meta.description);

    // Atualiza ou cria meta keywords
    if (meta.keywords) {
      let metaKeywords = document.querySelector('meta[name="keywords"]');
      if (!metaKeywords) {
        metaKeywords = document.createElement('meta');
        metaKeywords.setAttribute('name', 'keywords');
        document.head.appendChild(metaKeywords);
      }
      metaKeywords.setAttribute('content', meta.keywords);
    }

    // Open Graph tags para compartilhamento
    updateOrCreateMetaTag('og:title', meta.title);
    updateOrCreateMetaTag('og:description', meta.description);
    updateOrCreateMetaTag('og:type', 'website');

    // Twitter Card
    updateOrCreateMetaTag('twitter:card', 'summary');
    updateOrCreateMetaTag('twitter:title', meta.title);
    updateOrCreateMetaTag('twitter:description', meta.description);
  }, [location.pathname]);
}

function updateOrCreateMetaTag(property: string, content: string) {
  const isOg = property.startsWith('og:');
  const isTwitter = property.startsWith('twitter:');
  
  const selector = isOg || isTwitter 
    ? `meta[property="${property}"]` 
    : `meta[name="${property}"]`;
  
  let tag = document.querySelector(selector);
  
  if (!tag) {
    tag = document.createElement('meta');
    if (isOg || isTwitter) {
      tag.setAttribute('property', property);
    } else {
      tag.setAttribute('name', property);
    }
    document.head.appendChild(tag);
  }
  
  tag.setAttribute('content', content);
}
