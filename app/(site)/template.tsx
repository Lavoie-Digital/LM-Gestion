"use client";

import type { ReactNode } from "react";
import { motion } from "motion/react";
import { easeLux } from "@/lib/motion";

/** Re-mounts on every route change → a soft fade-in between pages. */
export default function SiteTemplate({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: easeLux }}
    >
      {children}
    </motion.div>
  );
}
