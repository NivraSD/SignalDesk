// The six optional "About you" questions, shared by the About you page and first-time setup.

export const STORY_SECTIONS = [
  { id: 'people', title: 'People', prompt: 'Names you’d like Grounded to know, and who they are. A partner, a sponsor, a friend, a dog.' },
  { id: 'life', title: 'Life right now', prompt: 'Work or school, where you live, who you live with, what your days look like.' },
  { id: 'working_with', title: 'What you’re working with', prompt: 'A diagnosis in your own words, if you want to share one. Or just how you’d describe it.' },
  { id: 'hard', title: 'What’s hard', prompt: 'Triggers, patterns, things Grounded should be careful around.' },
  { id: 'events', title: 'Key events', prompt: 'Anything from your past you want Grounded to keep in mind. Only what you choose.' },
  { id: 'helps', title: 'What helps', prompt: 'People, practices, places, words. What brings you back.' },
] as const

export type StorySectionId = (typeof STORY_SECTIONS)[number]['id']
export type Story = Partial<Record<StorySectionId, string>>

export function StoryFields({
  story,
  onChange,
  onBlur,
  disabled,
}: {
  story: Story
  onChange: (id: StorySectionId, value: string) => void
  onBlur?: (id: StorySectionId) => void
  disabled?: boolean
}) {
  return (
    <>
      {STORY_SECTIONS.map((s) => (
        <div key={s.id} className="bg-white rounded-xl p-4 shadow-sm space-y-2">
          <label htmlFor={`story-${s.id}`} className="block text-sm font-medium text-stone-700">
            {s.title}
          </label>
          <p className="text-xs text-stone-400">{s.prompt}</p>
          <textarea
            id={`story-${s.id}`}
            value={story[s.id] ?? ''}
            onChange={(e) => onChange(s.id, e.target.value)}
            onBlur={() => onBlur?.(s.id)}
            disabled={disabled}
            rows={3}
            className="w-full p-3 border border-stone-200 rounded-lg text-sm resize-y disabled:opacity-50"
          />
        </div>
      ))}
    </>
  )
}
