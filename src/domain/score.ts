export interface Score {
  streak: number;
  best: number;
}

export function emptyScore(best = 0): Score {
  return { streak: 0, best };
}

export function updateScore(score: Score, correct: boolean): Score {
  const streak = correct ? score.streak + 1 : 0;
  return { streak, best: Math.max(score.best, streak) };
}
