// components/SimuladoLoading.tsx
import { motion } from "framer-motion";

export const SimuladoLoading = () => (
  <div className="flex flex-col items-center justify-center space-y-4 py-12">
    <motion.div
      animate={{
        scale: [1, 1.2, 1],
        opacity: [0.5, 1, 0.5],
        filter: ["hue-rotate(0deg)", "hue-rotate(90deg)", "hue-rotate(0deg)"],
      }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      className="w-16 h-16 rounded-full bg-cyan-500/20 border-2 border-cyan-400 blur-sm"
    />
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="text-cyan-100 font-mono text-sm tracking-widest"
    >
      SINCRONIZANDO SINAPSES...
    </motion.p>
  </div>
);
