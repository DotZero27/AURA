"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export function RoundNavigation({ rounds, selectedRound, onRoundChange }) {
  return (
    <div className="px-4 py-3 overflow-x-auto bg-transparent mask-fade-right scrollbar-none">
      <div className="flex gap-2">
        {rounds.map((round, index) => (
          <motion.div
            key={`round-${round}-${index}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05, duration: 0.2 }}
          >
            <Button
              variant={selectedRound === round ? "default" : "outline"}
              size="sm"
              onClick={() => onRoundChange(round)}
              className={
                selectedRound === round
                  ? "bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-md shadow-primary/20 rounded-lg font-bold"
                  : "bg-background/50 backdrop-blur-sm text-muted-foreground border-border/50 hover:bg-background hover:text-foreground transition-all rounded-lg font-medium"
              }
            >
              {round}
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

