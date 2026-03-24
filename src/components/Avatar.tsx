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
      <img
        src="/images/pfp.jpg"
        alt="avatar"
        className="rounded-full w-[clamp(8.75rem,16vw,10rem)] border-2 border-blue-400/80 shadow-[0_0_20px_rgba(59,130,246,0.45)]"
      />
    </motion.div>
  );
}