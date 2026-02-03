export interface Vertical {
  slug: string
  label: string
  description: string
}

export const VERTICALS: Vertical[] = [
  {
    slug: 'commodities',
    label: 'Commodities',
    description: 'Strategic communications and thought leadership in energy, metals, agriculture, and global commodity markets.',
  },
  {
    slug: 'tech',
    label: 'Tech',
    description: 'Insights and press coverage across technology, AI, SaaS, and digital innovation.',
  },
  {
    slug: 'consulting',
    label: 'Consulting',
    description: 'Thought leadership in management consulting, advisory, and professional services.',
  },
  {
    slug: 'finance',
    label: 'Finance',
    description: 'Analysis and thought leadership in banking, fintech, capital markets, and financial services.',
  },
]

export const VERTICAL_SLUGS = VERTICALS.map(v => v.slug)

export function getVertical(slug: string): Vertical | undefined {
  return VERTICALS.find(v => v.slug === slug)
}

export function isValidVertical(slug: string): boolean {
  return VERTICAL_SLUGS.includes(slug)
}
