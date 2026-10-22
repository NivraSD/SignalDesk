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
  { id: 'wright-existential-map', line: 'I have an existential map. It has “You are here” written all over it.', comedian: 'Steven Wright' },
  { id: 'wright-skydiving', line: 'If at first you don’t succeed, then skydiving definitely isn’t for you.', comedian: 'Steven Wright' },
  { id: 'wright-amnesia', line: 'Right now I’m having amnesia and déjà vu at the same time. I think I’ve forgotten this before.', comedian: 'Steven Wright' },
  { id: 'wright-psychic', line: 'I almost had a psychic girlfriend, but she left me before we met.', comedian: 'Steven Wright' },
  { id: 'wright-curiosity', line: 'Curiosity killed the cat, but for a while I was a suspect.', comedian: 'Steven Wright' },
  { id: 'wright-breakfast', line: 'I went to a restaurant that serves “breakfast at any time.” So I ordered French toast during the Renaissance.', comedian: 'Steven Wright' },
  { id: 'wright-thesaurus', line: 'What’s another word for thesaurus?', comedian: 'Steven Wright' },
  { id: 'wright-widths', line: 'A lot of people are afraid of heights. Not me, I’m afraid of widths.', comedian: 'Steven Wright' },
  { id: 'wright-instant-coffee', line: 'I put instant coffee in a microwave and almost went back in time.', comedian: 'Steven Wright' },
  { id: 'wright-shin', line: 'Shin: a device for finding furniture in the dark.', comedian: 'Steven Wright' },
  { id: 'wright-speed-of-dark', line: 'What’s the speed of dark?', comedian: 'Steven Wright' },
  { id: 'wright-wooden-leg', line: 'I saw a man with a wooden leg, and a real foot.', comedian: 'Steven Wright' },
  { id: 'hedberg-picketing', line: 'I’m against picketing, but I don’t know how to show it.', comedian: 'Mitch Hedberg' },
  { id: 'hedberg-bumper-stickers', line: 'I don’t mind bumper stickers. A bumper sticker is a shortcut. It’s like a little sign that says, “Hey, let’s never hang out.”', comedian: 'Mitch Hedberg' },
  { id: 'hedberg-candle-holder', line: 'I wanted to buy a candle holder, but the store didn’t have one. So I got a cake.', comedian: 'Mitch Hedberg' },
  { id: 'hedberg-bigfoot', line: 'I think Bigfoot is blurry, that’s the problem. It’s not the photographer’s fault.', comedian: 'Mitch Hedberg' },
  { id: 'hedberg-childrens-book', line: 'Every book is a children’s book if the kid can read.', comedian: 'Mitch Hedberg' },
  { id: 'hedberg-refried-beans', line: 'I like refried beans. That’s why I want to try fried beans, because maybe they’re just as good and we’re just wasting time.', comedian: 'Mitch Hedberg' },
  { id: 'hedberg-dry-clean', line: 'This shirt is dry clean only. Which means it’s dirty.', comedian: 'Mitch Hedberg' },
  { id: 'hedberg-girlfriend', line: 'I don’t have a girlfriend. But I do know a woman who’d be mad at me for saying that.', comedian: 'Mitch Hedberg' },
  { id: 'dangerfield-twenty-years', line: 'My wife and I were happy for twenty years. Then we met.', comedian: 'Rodney Dangerfield' },
  { id: 'dangerfield-yoyo', line: 'When I was a kid, all I knew was rejection. My yo-yo, it never came back.', comedian: 'Rodney Dangerfield' },
  { id: 'dangerfield-lazy-dog', line: 'My dog is lazy. He doesn’t chase cars. He sits on the curb and takes down license plate numbers.', comedian: 'Rodney Dangerfield' },
  { id: 'philips-chess', line: 'A computer once beat me at chess, but it was no match for me at kickboxing.', comedian: 'Emo Philips' },
  { id: 'marx-dog-book', line: 'Outside of a dog, a book is man’s best friend. Inside of a dog, it’s too dark to read.', comedian: 'Groucho Marx' },
  { id: 'marx-evening', line: 'I’ve had a perfectly wonderful evening, but this wasn’t it.', comedian: 'Groucho Marx' },
  { id: 'martin-vending', line: 'I like vending machines because snacks are better when they fall. If I buy a candy bar at a store, I will drop it so it achieves its maximum flavor potential.', comedian: 'Demetri Martin' },
  { id: 'martin-trophies', line: 'I used to play sports. Then I realized you can buy trophies. Now I’m good at everything.', comedian: 'Demetri Martin' },
  { id: 'carlin-drivers', line: 'Have you ever noticed that anybody driving slower than you is an idiot, and anyone going faster than you is a maniac?', comedian: 'George Carlin' },
  { id: 'rudner-annoy', line: 'I love being married. It’s so great to find that one special person you want to annoy for the rest of your life.', comedian: 'Rita Rudner' },
  { id: 'rudner-dog-or-child', line: 'My husband and I are either going to buy a dog or have a child. We can’t decide whether to ruin our carpets or ruin our lives.', comedian: 'Rita Rudner' },
  { id: 'diller-bed-mad', line: 'Never go to bed mad. Stay up and fight.', comedian: 'Phyllis Diller' },
  { id: 'diller-housework', line: 'Housework can’t kill you, but why take a chance?', comedian: 'Phyllis Diller' },
  { id: 'rivers-housework', line: 'I hate housework. You make the beds, you do the dishes, and six months later you have to start all over again.', comedian: 'Joan Rivers' },
  { id: 'handey-lava', line: 'If you ever drop your keys into a river of molten lava, let ’em go, because, man, they’re gone.', comedian: 'Jack Handey', source: 'Deep Thoughts' },
  { id: 'handey-chihuahuas', line: 'I hope if dogs ever take over the world, and they choose a king, they don’t just go by size, because I bet there are some Chihuahuas with some good ideas.', comedian: 'Jack Handey', source: 'Deep Thoughts' },
]
