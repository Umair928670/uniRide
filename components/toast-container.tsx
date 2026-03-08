'use client';

import { useApp } from "./app-context";
import { CheckCircle, Info, AlertTriangle, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function ToastContainer() {
  const { notifications, dismissNotification } = useApp();

  const iconMap = {
    success: <CheckCircle className="w-5 h-5 text-[#00C9B1]" />,
    info: <Info className="w-5 h-5 text-[#1A3C6E] dark:text-blue-400" />,
    warning: <AlertTriangle className="w-5 h-5 text-orange-500" />,
  };

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-full max-w-sm px-4 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {notifications.map((n) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, y: -30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="pointer-events-auto bg-card rounded-2xl shadow-lg border border-border p-3.5 flex items-center gap-3"
          >
            {iconMap[n.type]}
            <p className="flex-1 text-[13px]">{n.message}</p>
            <button
              onClick={() => dismissNotification(n.id)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
