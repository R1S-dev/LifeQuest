import { AnimatePresence, motion } from 'framer-motion'

export default function LoadingBar({ show }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="loading-bar"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <span />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
