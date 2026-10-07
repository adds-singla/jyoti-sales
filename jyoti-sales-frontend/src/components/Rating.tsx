import { Star } from 'lucide-react'

export default function Rating({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          style={{ width: size, height: size }}
          className={i <= Math.round(value) ? 'fill-coral text-coral' : 'text-ink/20'}
        />
      ))}
    </div>
  )
}
