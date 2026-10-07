import { AnimatePresence, motion } from 'framer-motion'
import { useFlyStore } from '../lib/flyToCart'

// Renders the "fly to cart" clone images triggered from anywhere in the app (see lib/flyToCart.ts).
export default function FlyToCartLayer() {
  const items = useFlyStore((s) => s.items)
  const remove = useFlyStore((s) => s.remove)

  return (
    <div className="pointer-events-none fixed inset-0 z-[100]" aria-hidden="true">
      <AnimatePresence>
        {items.map((item) => (
          <motion.img
            key={item.id}
            src={item.imageUrl}
            initial={{
              position: 'fixed',
              top: item.from.top,
              left: item.from.left,
              width: item.from.width,
              height: item.from.height,
              opacity: 1,
              borderRadius: 16,
            }}
            animate={{
              top: item.to.top,
              left: item.to.left,
              width: item.to.width,
              height: item.to.height,
              opacity: 0.3,
              borderRadius: 999,
            }}
            transition={{ duration: 0.65, ease: [0.32, 0.72, 0, 1] }}
            onAnimationComplete={() => remove(item.id)}
            style={{ position: 'fixed', objectFit: 'cover' }}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}
