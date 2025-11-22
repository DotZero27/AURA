/**
 * Utility functions for parsing and mapping tournament rounds from metadata
 */

export interface RoundConfig {
  _rounds?: number;
  best_of?: number;
  [key: string]: any;
}

export interface SetRules {
  [roundType: string]: RoundConfig;
}

/**
 * Maps round type names to their string identifiers
 */
const ROUND_TYPE_MAPPING: Record<string, string> = {
  round_of_32: "R32",
  round_of_16: "R16",
  quarter_final: "QF",
  semi_final: "SF",
  final: "F",
};

/**
 * Order for processing rounds (league first, then knockout stages)
 */
const ROUND_PROCESSING_ORDER = [
  "league",
  "round_of_32",
  "round_of_16",
  "quarter_final",
  "semi_final",
  "final",
];

/**
 * Order for sorting special rounds
 */
const SPECIAL_ROUND_ORDER = ["R32", "R16", "QF", "SF", "F"];

/**
 * Parses tournament metadata to extract round identifiers
 * @param metadata - Tournament match_format metadata
 * @returns Array of round identifiers (numbers for league, strings for knockout stages)
 */
export function parseRoundsFromMetadata(metadata: any): string[] {
  const rounds: string[] = [];

  if (!metadata?.set_rules || typeof metadata.set_rules !== "object") {
    return rounds;
  }

  const setRules = metadata.set_rules as SetRules;

  // Process rounds in defined order
  for (const roundType of ROUND_PROCESSING_ORDER) {
    const roundConfig = setRules[roundType];
    if (!roundConfig || typeof roundConfig !== "object") continue;

    // If round has _rounds property, generate numbered rounds (for league)
    if (roundConfig._rounds && typeof roundConfig._rounds === "number") {
      const numRounds = roundConfig._rounds;
      for (let i = 1; i <= numRounds; i++) {
        const roundId = String(i);
        if (!rounds.includes(roundId)) {
          rounds.push(roundId);
        }
      }
    } else {
      // Map round types to string identifiers for knockout stages
      const mappedRound = ROUND_TYPE_MAPPING[roundType];
      if (mappedRound && !rounds.includes(mappedRound)) {
        rounds.push(mappedRound);
      } else if (!mappedRound) {
        // If no mapping, use the round type name
        if (!rounds.includes(roundType)) {
          rounds.push(roundType);
        }
      }
    }
  }

  // Process any other round types not in the standard order
  for (const [roundType, roundConfig] of Object.entries(setRules)) {
    if (ROUND_PROCESSING_ORDER.includes(roundType)) continue; // Already processed

    if (roundConfig && typeof roundConfig === "object") {
      if (roundConfig._rounds && typeof roundConfig._rounds === "number") {
        // Generate numbered rounds for any round type with _rounds
        const numRounds = roundConfig._rounds;
        for (let i = 1; i <= numRounds; i++) {
          const roundId = String(i);
          if (!rounds.includes(roundId)) {
            rounds.push(roundId);
          }
        }
      } else {
        // Use round type name for unmapped rounds
        if (!rounds.includes(roundType)) {
          rounds.push(roundType);
        }
      }
    }
  }

  return rounds;
}

/**
 * Sorts rounds: numbered rounds first (ascending), then special rounds in defined order
 * @param rounds - Array of round identifiers
 * @returns Sorted array of rounds
 */
export function sortRounds(rounds: string[]): string[] {
  // Separate numbered and special rounds
  const numberedRounds = rounds
    .filter((r) => /^\d+$/.test(r))
    .sort((a, b) => parseInt(a) - parseInt(b));

  const specialRounds = rounds.filter((r) => !/^\d+$/.test(r));

  // Sort special rounds according to defined order
  const orderedSpecialRounds = specialRounds.sort((a, b) => {
    const indexA = SPECIAL_ROUND_ORDER.indexOf(a);
    const indexB = SPECIAL_ROUND_ORDER.indexOf(b);
    if (indexA === -1 && indexB === -1) return a.localeCompare(b);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  return [...numberedRounds, ...orderedSpecialRounds];
}

/**
 * Gets all rounds for a tournament from metadata
 * @param metadata - Tournament match_format metadata
 * @returns Sorted array of round identifiers
 */
export function getTournamentRounds(metadata: any): string[] {
  const rounds = parseRoundsFromMetadata(metadata);
  return sortRounds(rounds);
}
