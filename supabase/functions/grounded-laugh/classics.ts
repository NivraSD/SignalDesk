// Credited one-liners for "I got jokes". One line at a time, always with the comedian's name.
// Edit freely: remove any line on request; add `source` (special/album) only when certain.
// Kept away from drugs, drinking, self-harm and death on purpose.

export interface Classic {
  id: string
  line: string
  comedian: string
  source?: string
}

export const CLASSICS: Classic[] = [
  { id: 'wright-forever', line: 'I intend to live forever. So far, so good.', comedian: 'Steven Wright' },
  { id: 'wright-small-world', line: 'It’s a small world, but I wouldn’t want to paint it.', comedian: 'Steven Wright' },
  { id: 'wright-everything', line: 'You can’t have everything. Where would you put it?', comedian: 'Steven Wright' },
  { id: 'wright-walking', line: 'Everywhere is within walking distance if you have the time.', comedian: 'Steven Wright' },
  { id: 'wright-seashells', line: 'I have a large seashell collection, which I keep scattered on beaches all over the world.', comedian: 'Steven Wright' },
  { id: 'wright-batteries', line: 'I bought some batteries, but they weren’t included.', comedian: 'Steven Wright' },
  { id: 'hedberg-escalator', line: 'An escalator can never break: it can only become stairs. You would never see an “Escalator Temporarily Out of Order” sign, just “Escalator Temporarily Stairs. Sorry for the convenience.”', comedian: 'Mitch Hedberg' },
  { id: 'hedberg-dreams', line: 'I’m sick of following my dreams. I’m just going to ask them where they’re going and hook up with them later.', comedian: 'Mitch Hedberg' },
  { id: 'hedberg-fake-plants', line: 'My fake plants died because I did not pretend to water them.', comedian: 'Mitch Hedberg' },
  { id: 'hedberg-rice', line: 'Rice is great if you’re really hungry and want to eat two thousand of something.', comedian: 'Mitch Hedberg' },
  { id: 'hedberg-sleep', line: 'I haven’t slept for ten days, because that would be too long.', comedian: 'Mitch Hedberg' },
  { id: 'dangerfield-hide-seek', line: 'When I was a kid, I played hide-and-seek. They wouldn’t even look for me.', comedian: 'Rodney Dangerfield' },
  { id: 'dangerfield-born-ugly', line: 'I was so ugly when I was born, the doctor slapped my mother.', comedian: 'Rodney Dangerfield' },
  { id: 'dangerfield-psychiatrist', line: 'I told my psychiatrist that everyone hates me. He said I was being ridiculous — everyone hasn’t met me yet.', comedian: 'Rodney Dangerfield' },
  { id: 'dangerfield-no-respect', line: 'I don’t get no respect.', comedian: 'Rodney Dangerfield' },
  { id: 'dangerfield-dog', line: 'I worked in a pet store and people kept asking how big I’d get.', comedian: 'Rodney Dangerfield' },
  { id: 'philips-brain', line: 'I used to think that the brain was the most wonderful organ in my body. Then I realized who was telling me this.', comedian: 'Emo Philips' },
  { id: 'marx-club', line: 'I refuse to join any club that would have me as a member.', comedian: 'Groucho Marx' },
  { id: 'youngman-wife', line: 'Take my wife — please.', comedian: 'Henny Youngman' },
]
