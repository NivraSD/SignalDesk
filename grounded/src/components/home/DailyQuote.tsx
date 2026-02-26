import { getDailyQuote } from '@/lib/utils'

export default function DailyQuote() {
  const quote = getDailyQuote()
  return (
    <div className="bg-gradient-to-br from-stone-50 to-stone-100 rounded-xl p-4 border border-stone-200">
      <p className="text-stone-700 text-sm italic text-center">&ldquo;{quote.text}&rdquo;</p>
      <p className="text-stone-400 text-xs text-center mt-2">&mdash; {quote.source}</p>
    </div>
  )
}
