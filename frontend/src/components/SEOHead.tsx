/**
 * SEOHead Component
 *
 * Manages SEO meta tags for improved search engine visibility
 * Uses react-helmet-async for dynamic meta tag updates
 */

import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

interface SEOHeadProps {
  title?: string
  description?: string
  keywords?: string
  ogImage?: string
  canonicalUrl?: string
}

const DEFAULT_TITLE = 'DevSecOps Hacking Lab - Interactive Security Testing Environment'
const DEFAULT_DESCRIPTION = 'Educational cybersecurity lab for learning offensive and defensive techniques. Features vulnerable microservices, real-time monitoring, and automated incident response.'
const DEFAULT_KEYWORDS = 'devsecops, security testing, hacking lab, OWASP, cybersecurity, penetration testing, docker, microservices, jwt, mfa, idor, rate limiting, waf'
const SITE_URL = 'https://yourusername.github.io/DevSecOps-Hacking-Lab'
const OG_IMAGE = `${SITE_URL}/og-image.png`

export function SEOHead({
  title,
  description,
  keywords,
  ogImage,
  canonicalUrl
}: SEOHeadProps) {
  const location = useLocation()

  const pageTitle = title ? `${title} | DevSecOps Hacking Lab` : DEFAULT_TITLE
  const pageDescription = description || DEFAULT_DESCRIPTION
  const pageKeywords = keywords || DEFAULT_KEYWORDS
  const pageImage = ogImage || OG_IMAGE
  const pageUrl = canonicalUrl || `${SITE_URL}${location.pathname}`

  useEffect(() => {
    // Update document title
    document.title = pageTitle

    // Update meta tags
    updateMetaTag('name', 'description', pageDescription)
    updateMetaTag('name', 'keywords', pageKeywords)

    // Open Graph tags
    updateMetaTag('property', 'og:title', pageTitle)
    updateMetaTag('property', 'og:description', pageDescription)
    updateMetaTag('property', 'og:url', pageUrl)
    updateMetaTag('property', 'og:image', pageImage)
    updateMetaTag('property', 'og:type', 'website')

    // Twitter Card tags
    updateMetaTag('name', 'twitter:card', 'summary_large_image')
    updateMetaTag('name', 'twitter:title', pageTitle)
    updateMetaTag('name', 'twitter:description', pageDescription)
    updateMetaTag('name', 'twitter:image', pageImage)

    // Canonical URL
    updateLinkTag('canonical', pageUrl)
  }, [pageTitle, pageDescription, pageKeywords, pageImage, pageUrl])

  return null // This component doesn't render anything
}

function updateMetaTag(attribute: string, key: string, content: string) {
  let element = document.querySelector(`meta[${attribute}="${key}"]`)

  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, key)
    document.head.appendChild(element)
  }

  element.setAttribute('content', content)
}

function updateLinkTag(rel: string, href: string) {
  let element = document.querySelector(`link[rel="${rel}"]`)

  if (!element) {
    element = document.createElement('link')
    element.setAttribute('rel', rel)
    document.head.appendChild(element)
  }

  element.setAttribute('href', href)
}
