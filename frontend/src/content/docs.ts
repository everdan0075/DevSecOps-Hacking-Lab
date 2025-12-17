/**
 * Documentation Content - Lazy Loading Implementation
 *
 * Guide content is split into separate files and loaded on demand
 * to reduce initial bundle size (~81KB savings)
 */

// Type definitions
export interface DocSection {
  id: string
  title: string
  description: string
  icon: string
  guides: DocGuide[]
}

export interface DocGuide {
  slug: string
  title: string
  description: string
  category: string
  content: DocContent[]
  lastUpdated: string
}

export interface DocContent {
  type: 'heading' | 'paragraph' | 'code' | 'list' | 'warning' | 'info' | 'danger' | 'table'
  content: string | string[] | TableContent
  language?: string
  level?: number // for headings (1-3)
}

export interface TableContent {
  headers: string[]
  rows: string[][]
}

// Guide metadata (lightweight, always in bundle)
interface GuideMetadata {
  slug: string
  title: string
  description: string
  category: string
  lastUpdated: string
  loader: () => Promise<{ default?: DocGuide } | DocGuide>
}

// Guide metadata registry
const GUIDE_METADATA: GuideMetadata[] = [
  // Getting Started
  {
    slug: 'quick-start',
    title: 'Quick Start Guide',
    description: 'Get the DevSecOps Hacking Lab up and running in 5 minutes',
    category: 'getting-started',
    lastUpdated: '2025-11-14',
    loader: () => import('./docs/quick-start').then(m => m.quickStartGuide),
  },
  {
    slug: 'architecture',
    title: 'Architecture Overview',
    description: 'Understand the service mesh, technology stack, and data flow',
    category: 'getting-started',
    lastUpdated: '2025-11-14',
    loader: () => import('./docs/architecture').then(m => m.architectureGuide),
  },
  // Attack Guides
  {
    slug: 'brute-force',
    title: 'Brute Force Attack',
    description: 'Password enumeration against authentication endpoint',
    category: 'attack-guides',
    lastUpdated: '2025-11-14',
    loader: () => import('./docs/brute-force').then(m => m.bruteForceGuide),
  },
  {
    slug: 'idor',
    title: 'IDOR Exploitation',
    description: 'Insecure Direct Object Reference vulnerability exploitation',
    category: 'attack-guides',
    lastUpdated: '2025-11-14',
    loader: () => import('./docs/idor').then(m => m.idorGuide),
  },
  {
    slug: 'mfa-bypass',
    title: 'MFA Bypass (Bruteforce)',
    description: 'Time-based TOTP enumeration attack',
    category: 'attack-guides',
    lastUpdated: '2025-11-14',
    loader: () => import('./docs/mfa-bypass').then(m => m.mfaBypassGuide),
  },
  {
    slug: 'gateway-bypass',
    title: 'Gateway Bypass (Direct Access)',
    description: 'Bypass API gateway security controls by accessing services directly',
    category: 'attack-guides',
    lastUpdated: '2025-11-14',
    loader: () => import('./docs/gateway-bypass').then(m => m.gatewayBypassGuide),
  },
  // Defense & Mitigation
  {
    slug: 'security-controls',
    title: 'Security Controls Overview',
    description: 'Understanding implemented security mechanisms',
    category: 'defense',
    lastUpdated: '2025-11-14',
    loader: () => import('./docs/security-controls').then(m => m.securityControlsGuide),
  },
  {
    slug: 'incident-response',
    title: 'Incident Response System',
    description: 'Automated detection and response to security incidents',
    category: 'defense',
    lastUpdated: '2025-11-14',
    loader: () => import('./docs/incident-response').then(m => m.incidentResponseGuide),
  },
  // API Reference
  {
    slug: 'authentication-api',
    title: 'Authentication API',
    description: 'JWT authentication, MFA, and token management endpoints',
    category: 'api-reference',
    lastUpdated: '2025-11-14',
    loader: () => import('./docs/authentication-api').then(m => m.authenticationApiGuide),
  },
  // Troubleshooting
  {
    slug: 'common-issues',
    title: 'Common Issues',
    description: 'Solutions to frequently encountered problems',
    category: 'troubleshooting',
    lastUpdated: '2025-11-14',
    loader: () => import('./docs/common-issues').then(m => m.commonIssuesGuide),
  },
]

// Section structure (lightweight metadata)
export const DOC_SECTIONS: DocSection[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    description: 'Installation, setup, and first steps',
    icon: 'Rocket',
    guides: GUIDE_METADATA.filter(g => g.category === 'getting-started').map(metadataToGuideStub),
  },
  {
    id: 'attack-guides',
    title: 'Attack Guides',
    description: 'Step-by-step exploitation techniques',
    icon: 'Target',
    guides: GUIDE_METADATA.filter(g => g.category === 'attack-guides').map(metadataToGuideStub),
  },
  {
    id: 'defense',
    title: 'Defense & Mitigation',
    description: 'Security controls and incident response',
    icon: 'Shield',
    guides: GUIDE_METADATA.filter(g => g.category === 'defense').map(metadataToGuideStub),
  },
  {
    id: 'api-reference',
    title: 'API Reference',
    description: 'Complete API documentation with examples',
    icon: 'Code',
    guides: GUIDE_METADATA.filter(g => g.category === 'api-reference').map(metadataToGuideStub),
  },
  {
    id: 'troubleshooting',
    title: 'Troubleshooting',
    description: 'Common issues and solutions',
    icon: 'AlertCircle',
    guides: GUIDE_METADATA.filter(g => g.category === 'troubleshooting').map(metadataToGuideStub),
  },
]

// Helper: Convert metadata to guide stub (for sidebar/search)
function metadataToGuideStub(metadata: GuideMetadata): DocGuide {
  return {
    slug: metadata.slug,
    title: metadata.title,
    description: metadata.description,
    category: metadata.category,
    lastUpdated: metadata.lastUpdated,
    content: [], // Empty until loaded
  }
}

// Guide cache to avoid re-loading
const guideCache = new Map<string, DocGuide>()

/**
 * Get guide by slug (with lazy loading)
 */
export async function getGuideBySlug(slug: string): Promise<DocGuide | undefined> {
  // Check cache first
  if (guideCache.has(slug)) {
    return guideCache.get(slug)
  }

  // Find metadata
  const metadata = GUIDE_METADATA.find(m => m.slug === slug)
  if (!metadata) {
    return undefined
  }

  // Load guide dynamically
  try {
    const guide = await metadata.loader()
    // Handle both default export and named export
    const loadedGuide = ('default' in guide && guide.default) ? guide.default : guide

    // Validate loaded guide
    if (!loadedGuide || typeof loadedGuide !== 'object' || !('slug' in loadedGuide)) {
      console.error(`Invalid guide loaded: ${slug}`)
      return undefined
    }

    guideCache.set(slug, loadedGuide as DocGuide)
    return loadedGuide as DocGuide
  } catch (error) {
    console.error(`Failed to load guide: ${slug}`, error)
    return undefined
  }
}

/**
 * Get all guides flattened (metadata only, no content)
 */
export function getAllGuides(): DocGuide[] {
  return DOC_SECTIONS.flatMap((section) => section.guides)
}

/**
 * Search guides (searches metadata only for performance)
 * For deep content search, guides need to be loaded individually
 */
export function searchGuides(query: string): DocGuide[] {
  const lowerQuery = query.toLowerCase()
  return getAllGuides().filter(
    (guide) =>
      guide.title.toLowerCase().includes(lowerQuery) ||
      guide.description.toLowerCase().includes(lowerQuery) ||
      guide.category.toLowerCase().includes(lowerQuery)
  )
}

/**
 * Preload a guide (for prefetching on hover, etc.)
 */
export function preloadGuide(slug: string): void {
  const metadata = GUIDE_METADATA.find(m => m.slug === slug)
  if (metadata && !guideCache.has(slug)) {
    metadata.loader().then(guide => {
      const loadedGuide = ('default' in guide && guide.default) ? guide.default : guide

      // Validate and cache
      if (loadedGuide && typeof loadedGuide === 'object' && 'slug' in loadedGuide) {
        guideCache.set(slug, loadedGuide as DocGuide)
      }
    }).catch(err => {
      console.error(`Failed to preload guide: ${slug}`, err)
    })
  }
}
