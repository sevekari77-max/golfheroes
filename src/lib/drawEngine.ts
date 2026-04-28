import { DrawSimulationData, PrizeBreakdown, Score } from './types';

function getRandomNumbers(count: number, min: number, max: number): number[] {
  const numbers = new Set<number>();
  while (numbers.size < count) {
    numbers.add(Math.floor(Math.random() * (max - min + 1)) + min);
  }
  return Array.from(numbers).sort((a, b) => a - b);
}

function getWeightedNumbers(
  userScores: Score[],
  count: number,
  min: number,
  max: number,
  bias: 'frequent' | 'infrequent' = 'frequent'
): number[] {
  // Build frequency map from all user scores
  const freq = new Map<number, number>();
  for (let i = min; i <= max; i++) freq.set(i, 0);
  for (const s of userScores) {
    freq.set(s.score, (freq.get(s.score) ?? 0) + 1);
  }

  // Build weighted pool
  const pool: number[] = [];
  for (const [num, count] of freq.entries()) {
    const weight = bias === 'frequent'
      ? Math.max(1, count * 3 + 1)
      : Math.max(1, (userScores.length - count) * 3 + 1);
    for (let i = 0; i < weight; i++) pool.push(num);
  }

  // Sample without replacement
  const selected = new Set<number>();
  let attempts = 0;
  while (selected.size < count && attempts < 10000) {
    const idx = Math.floor(Math.random() * pool.length);
    selected.add(pool[idx]);
    attempts++;
  }

  // Fill remaining randomly if needed
  while (selected.size < count) {
    selected.add(Math.floor(Math.random() * (max - min + 1)) + min);
  }

  return Array.from(selected).sort((a, b) => a - b);
}

function countMatches(userNumbers: number[], winningNumbers: number[]): number {
  return userNumbers.filter(n => winningNumbers.includes(n)).length;
}

export function calculatePrizePool(
  activeSubscriberCount: number,
  monthlyPricePence: number,
  poolPercentage: number,
  jackpotRollover: number
): number {
  const basePool = Math.floor(activeSubscriberCount * monthlyPricePence * poolPercentage / 100);
  return basePool + jackpotRollover;
}

export function calculatePrizeBreakdown(
  totalPool: number,
  fiveMatchWinners: number,
  fourMatchWinners: number,
  threeMatchWinners: number,
  hasJackpotRollover: boolean
): PrizeBreakdown {
  const fivePool = Math.floor(totalPool * 0.40);
  const fourPool = Math.floor(totalPool * 0.35);
  const threePool = Math.floor(totalPool * 0.25);

  return {
    five_match_pool: fivePool,
    four_match_pool: fourPool,
    three_match_pool: threePool,
    five_match_per_winner: fiveMatchWinners > 0 ? Math.floor(fivePool / fiveMatchWinners) : 0,
    four_match_per_winner: fourMatchWinners > 0 ? Math.floor(fourPool / fourMatchWinners) : 0,
    three_match_per_winner: threeMatchWinners > 0 ? Math.floor(threePool / threeMatchWinners) : 0,
  };
}

interface UserScoreSet {
  userId: string;
  scores: number[];
}

export function runDraw(
  drawType: 'random' | 'algorithmic',
  allUserScores: Score[],
  totalPool: number,
  jackpotAmount: number
): DrawSimulationData {
  const winningNumbers = drawType === 'random'
    ? getRandomNumbers(5, 1, 45)
    : getWeightedNumbers(allUserScores, 5, 1, 45, 'frequent');

  // Group scores by user (last 5 each)
  const userMap = new Map<string, number[]>();
  for (const score of allUserScores) {
    const existing = userMap.get(score.user_id) ?? [];
    if (existing.length < 5) {
      userMap.set(score.user_id, [...existing, score.score]);
    }
  }

  let fiveMatchWinners = 0;
  let fourMatchWinners = 0;
  let threeMatchWinners = 0;

  for (const [, scores] of userMap.entries()) {
    const matches = countMatches(scores, winningNumbers);
    if (matches >= 5) fiveMatchWinners++;
    else if (matches >= 4) fourMatchWinners++;
    else if (matches >= 3) threeMatchWinners++;
  }

  const prizeBreakdown = calculatePrizeBreakdown(
    totalPool + jackpotAmount,
    fiveMatchWinners,
    fourMatchWinners,
    threeMatchWinners,
    jackpotAmount > 0
  );

  return {
    numbers: winningNumbers,
    five_match_winners: fiveMatchWinners,
    four_match_winners: fourMatchWinners,
    three_match_winners: threeMatchWinners,
    prize_breakdown: prizeBreakdown,
  };
}

export function getUserMatchTier(userScores: number[], winningNumbers: number[]): 0 | 3 | 4 | 5 {
  const matches = countMatches(userScores, winningNumbers);
  if (matches >= 5) return 5;
  if (matches >= 4) return 4;
  if (matches >= 3) return 3;
  return 0;
}
