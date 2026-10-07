import { motion } from 'framer-motion'
import { ReactNode } from 'react'

// One consistent scroll-reveal treatment, reused across a page rather than a different
// effect per section — keeps the motion feeling orchestrated instead of scattered.
export default function Reveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.55, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}
