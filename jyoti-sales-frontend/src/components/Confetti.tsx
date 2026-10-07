import { motion } from 'framer-motion'

const COLORS = ['#E8734A', '#D98C4A', '#3B2E5A', '#A899D6', '#2A2620']

interface Piece {
  id: number
  x: number
  y: number
  rotate: number
  color: string
  width: number
  height: number
  delay: number
}

// Small self-contained confetti burst — used once, on a successful order, per the
// "single orchestrated moment" motion principle rather than scattered effects.
export default function Confetti({ count = 44 }: { count?: number }) {
  const pieces: Piece[] = Array.from({ length: count }).map((_, i) => {
    const angle = Math.random() * Math.PI * 2
    const distance = 90 + Math.random() * 170
    return {
      id: i,
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance - 40,
      rotate: Math.random() * 360,
      color: COLORS[i % COLORS.length],
      width: 5 + Math.random() * 5,
      height: 9 + Math.random() * 7,
      delay: Math.random() * 0.12,
    }
  })

  return (
    <div className="pointer-events-none absolute inset-0 flex items-start justify-center overflow-visible" aria-hidden="true">
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
          animate={{ x: p.x, y: p.y, opacity: 0, rotate: p.rotate }}
          transition={{ duration: 1.15, delay: p.delay, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            top: '15%',
            width: p.width,
            height: p.height,
            backgroundColor: p.color,
            borderRadius: 2,
          }}
        />
      ))}
    </div>
  )
}
