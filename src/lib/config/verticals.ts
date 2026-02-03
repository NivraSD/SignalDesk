export interface Vertical {
  slug: string
  label: string
  description: string
}

export const VERTICALS: Vertical[] = [
  {
    slug: 'energy',
    label: 'Energy',
    description: 'Strategic communications and thought leadership in energy, utilities, and sustainability.',
  },
  {
    slug: 'fintech',
    label: 'Fintech',
    description: 'Insights and press coverage across financial technology, banking, and digital payments.',
  },
  {
    slug: 'defense',
    label: 'Defense',
    description: 'Analysis and thought leadership in defense, aerospace, and national security.',
  },
]

export const VERTICAL_SLUGS = VERTICALS.map(v => v.slug)

export function getVertical(slug: string): Vertical | undefined {
  return VERTICALS.find(v => v.slug === slug)
}

export function isValidVertical(slug: string): boolean {
  return VERTICAL_SLUGS.includes(slug)
}
