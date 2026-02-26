import { PYRAMID_LEVELS } from '@/lib/constants'

export default function PyramidSection() {
  return (
    <div className="py-2">
      <div className="flex flex-col items-center space-y-0">
        {PYRAMID_LEVELS.map((level, idx) => (
          <div
            key={idx}
            style={{ width: level.width }}
            className={`bg-gradient-to-r ${level.bg} text-white text-center py-2 text-xs font-medium tracking-wide`}
          >
            {level.text}
          </div>
        ))}
      </div>
    </div>
  )
}
