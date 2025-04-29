// Example enhanced Avatar.tsx with animations
import { motion } from "framer-motion";

export default function Avatar() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      whileHover={{ scale: 1.05 }}
    >
      <img src="/images/pfp.jpg" alt="avatar" className="rounded-full w-32" />
    </motion.div>
  );
}