export function calculateStreaks(progressDocs) {
  // progressDocs = array of { date, completed, total }
  const completedDays = new Set(
    progressDocs
      .filter(p => p.completed >= p.total)
      .map(p => p.date)
  );

  let streak = 0;
  let bestStreak = 0;
  let currentCount = 0;

  const today = new Date();
  const d = new Date();
  d.setDate(today.getDate() - 1); // start from yesterday

  // current streak
  while (true) {
    const key = d.toISOString().split("T")[0];
    if (completedDays.has(key)) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else break;
  }

  // best streak (scan sorted days)
  const sorted = [...completedDays].sort();
  let prev = null;

  for (const day of sorted) {
    if (!prev) {
      currentCount = 1;
    } else {
      const diff =
        (new Date(day) - new Date(prev)) / (1000 * 60 * 60 * 24);
      currentCount = diff === 1 ? currentCount + 1 : 1;
    }
    bestStreak = Math.max(bestStreak, currentCount);
    prev = day;
  }

  return { streak, bestStreak };
}
