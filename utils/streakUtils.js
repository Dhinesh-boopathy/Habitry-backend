import { getDateKey } from "./dateKey.js";

export function calculateStreaks(progressDocs) {
  const completedDays = new Set(
    progressDocs
      .filter(
        (p) => p.completed >= p.total
      )
      .map((p) => p.date)
  );

  let streak = 0;
  let bestStreak = 0;
  let currentCount = 0;

  // ✅ Count TODAY immediately
  const d = new Date();

  while (true) {
    const key = getDateKey(d);

    if (completedDays.has(key)) {
      streak++;

      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }

  // ✅ Best streak calculation
  const sorted =
      [...completedDays].sort();

  let prev = null;

  for (const day of sorted) {
    if (!prev) {
      currentCount = 1;
    } else {
      const prevDate =
          new Date(prev);

      const currentDate =
          new Date(day);

      const diff =
          (currentDate - prevDate) /
          (1000 * 60 * 60 * 24);

      currentCount =
          diff === 1
              ? currentCount + 1
              : 1;
    }

    bestStreak = Math.max(
      bestStreak,
      currentCount
    );

    prev = day;
  }

  return {
    streak,
    bestStreak,
  };
}