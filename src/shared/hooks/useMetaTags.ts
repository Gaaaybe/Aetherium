import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface MetaTagsConfig {
  title: string;
  description: string;
  keywords?: string;
}

const routeMetaTags: Record<string, MetaTagsConfig> = {
  '/': {
    title: 'Criador de Poderes - Espírito & Caos',
    description: 'Crie e gerencie poderes personalizados para o sistema Espírito & Caos. Ferramenta completa com cálculo automático de custos, parâmetros e modificações.',
    keywords: 'espírito e caos, rpg, poder, criador, mutants and masterminds, sistema, jogo',
  },
  '/biblioteca': {
    title: 'Biblioteca de Poderes - Espírito & Caos',
    description: 'Acesse, edite e gerencie todos os seus poderes salvos. Exporte, importe e organize sua coleção de poderes.',
    keywords: 'biblioteca, poderes salvos, gerenciar poderes, exportar, importar',
  },
  '/sobre': {
    title: 'Sobre o Sistema - Espírito & Caos',
    description: 'Conheça o sistema de criação de poderes do Espírito & Caos. Documentação completa, regras de cálculo e informações técnicas.',
    keywords: 'documentação, regras, sistema, como usar, tutorial',
  },
};

const defaultMetaTags: MetaTagsConfig = {
  title: 'Espírito & Caos - Sistema de Criação de Poderes',
  description: 'Ferramenta completa para criar poderes personalizados para RPG',
  keywords: 'rpg, espírito e caos, criador de poderes',
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
