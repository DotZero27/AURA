"use client";

import { Zap, Medal } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

// Skeleton loader for leaderboard
function LeaderboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Top 3 Skeleton */}
      <div className="flex items-end justify-center gap-3 mb-6 px-4">
        {[2, 1, 3].map((position) => (
          <div key={position} className={`flex flex-col items-center flex-1 ${position === 1 ? '-mb-2' : ''}`}>
            <Skeleton
              className={`rounded-full border-4 border-background ${
                position === 1 ? "size-28" : "size-20"
              }`}
            />
            <Skeleton className="h-4 w-16 mt-2" />
            <Skeleton className="h-3 w-10 mt-1" />
          </div>
        ))}
      </div>
      {/* Remaining players skeleton */}
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((index) => (
          <div key={index} className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-background/50">
            <Skeleton className="size-6 rounded-full" />
            <Skeleton className="size-10 rounded-full" />
            <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-6 w-12 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function LeaderboardTab({ topThree, remaining, isLoading }) {
  if (isLoading) {
    return <LeaderboardSkeleton />;
  }

  if (topThree.length === 0 && remaining.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-12 text-center space-y-4 border-2 border-dashed border-border/50 rounded-2xl bg-muted/5 mx-4"
      >
        <div className="bg-muted/30 p-4 rounded-full">
           <Medal className="size-8 text-muted-foreground/30" />
        </div>
        <p className="text-muted-foreground text-sm font-medium">No stats available yet.</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6 pb-20"
    >
      {/* Top 3 Display */}
      {topThree.length > 0 && (
        <div className="flex items-end justify-center gap-2 mb-8 pt-4 px-2">
          {/* 2nd Place - Left */}
          <div className="flex flex-col items-center w-1/3 z-10">
            {topThree[1] ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                  className="flex flex-col items-center w-full"
                >
                  <div className="relative mb-2">
                    <div className="size-20 rounded-full p-1 bg-linear-to-br from-gray-300 to-gray-100 shadow-lg">
                        {topThree[1].photo_url ? (
                            <img src={topThree[1].photo_url} alt="2nd" className="size-full rounded-full object-cover border-2 border-background" />
                        ) : (
                            <div className="size-full rounded-full bg-muted flex items-center justify-center text-muted-foreground font-black text-xl border-2 border-background">
                                {topThree[1].name?.[0]}
                            </div>
                        )}
                    </div>
                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-gray-400 text-white size-6 flex items-center justify-center rounded-full text-xs font-black shadow-sm ring-2 ring-background">
                      2
                    </div>
                  </div>
                  <p className="text-xs font-bold text-center truncate w-full px-1">
                    {topThree[1].name || topThree[1].username}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                     <span className="text-[10px] font-black text-primary">{topThree[1].wins || 0} PTS</span>
                  </div>
                </motion.div>
            ) : <div className="w-full h-24" />}
          </div>

          {/* 1st Place - Center (tallest) */}
          <div className="flex flex-col items-center w-1/3 -mb-4 z-20">
             {topThree[0] && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                  className="flex flex-col items-center w-full"
                >
                  <div className="relative mb-2">
                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                        <Medal className="size-6 text-yellow-500 fill-yellow-500 animate-bounce" />
                    </div>
                    <div className="size-28 rounded-full p-1 bg-linear-to-br from-yellow-300 via-yellow-500 to-yellow-600 shadow-xl shadow-yellow-500/20">
                        {topThree[0].photo_url ? (
                            <img src={topThree[0].photo_url} alt="1st" className="size-full rounded-full object-cover border-4 border-background" />
                        ) : (
                            <div className="size-full rounded-full bg-muted flex items-center justify-center text-muted-foreground font-black text-3xl border-4 border-background">
                                {topThree[0].name?.[0]}
                            </div>
                        )}
                    </div>
                    <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-white size-8 flex items-center justify-center rounded-full text-sm font-black shadow-md ring-4 ring-background">
                      1
                    </div>
                  </div>
                  <p className="text-sm font-black text-center truncate w-full px-1 mt-2">
                    {topThree[0].name || topThree[0].username}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5 bg-yellow-500/10 px-2 py-0.5 rounded-full border border-yellow-500/20">
                     <Zap className="size-3 text-yellow-600 fill-yellow-600" />
                     <span className="text-xs font-black text-yellow-700">{topThree[0].wins || 0} PTS</span>
                  </div>
                </motion.div>
             )}
          </div>

          {/* 3rd Place - Right */}
          <div className="flex flex-col items-center w-1/3 z-10">
            {topThree[2] ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.3 }}
                  className="flex flex-col items-center w-full"
                >
                  <div className="relative mb-2">
                    <div className="size-20 rounded-full p-1 bg-linear-to-br from-orange-300 to-orange-100 shadow-lg">
                        {topThree[2].photo_url ? (
                            <img src={topThree[2].photo_url} alt="3rd" className="size-full rounded-full object-cover border-2 border-background" />
                        ) : (
                            <div className="size-full rounded-full bg-muted flex items-center justify-center text-muted-foreground font-black text-xl border-2 border-background">
                                {topThree[2].name?.[0]}
                            </div>
                        )}
                    </div>
                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-orange-400 text-white size-6 flex items-center justify-center rounded-full text-xs font-black shadow-sm ring-2 ring-background">
                      3
                    </div>
                  </div>
                  <p className="text-xs font-bold text-center truncate w-full px-1">
                    {topThree[2].name || topThree[2].username}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                     <span className="text-[10px] font-black text-primary">{topThree[2].wins || 0} PTS</span>
                  </div>
                </motion.div>
            ) : <div className="w-full h-24" />}
          </div>
        </div>
      )}

      {/* Remaining Players List */}
      <div className="space-y-3 px-1">
        {remaining.map((player, index) => (
          <motion.div
            key={player.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + index * 0.05, duration: 0.2 }}
          >
            <div className="flex items-center gap-4 p-3 bg-card rounded-xl border border-border/50 shadow-sm">
              <span className="font-black text-muted-foreground/50 w-6 text-center text-lg italic">
                #{index + 4}
              </span>
              
              <div className="relative">
                 {player.photo_url ? (
                    <img src={player.photo_url} alt={player.name} className="size-10 rounded-full object-cover ring-2 ring-border" />
                 ) : (
                    <div className="size-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-bold ring-2 ring-border">
                        {player.name?.[0] || "P"}
                    </div>
                 )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">
                  {player.name || player.username}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                        <Zap className="size-3" /> {player.aura ? player.aura.toFixed(1) : "N/A"} Aura
                    </span>
                </div>
              </div>
              
              <div className="text-right">
                <span className="block font-black text-lg text-primary leading-none">{player.wins || 0}</span>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Points</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
