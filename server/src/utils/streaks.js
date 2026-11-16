import { addDays } from './dates.js';

/**
 * Computes current and longest streaks from a collection of fully completed days.
 *
 * The current streak stays alive during the present day even before it is completed.
 * If yesterday was missed, the streak is broken (today being complete starts a new one).
 */
export function computeStreaks(days, today) {
  const set = days instanceof Set ? days : new Set(days);
  const valid = [...set].filter((date) => date <= today).sort();

  let longest = 0;
  let run = 0;
  let previous = null;
  for (const date of valid) {
    if (previous && date === addDays(previous, 1)) {
      run += 1;
    } else {
      run = 1;
    }
    if (run > longest) longest = run;
    previous = date;
  }

  let cursor = set.has(today) ? today : addDays(today, -1);
  let current = 0;
  while (set.has(cursor)) {
    current += 1;
    cursor = addDays(cursor, -1);
  }

  return { current, longest };
}

export function sumConsecutive(days) {
  const sorted = [...new Set(days)].sort();
  let longest = 0;
  let run = 0;
  let previous = null;
  for (const date of sorted) {
    run = previous && date === addDays(previous, 1) ? run + 1 : 1;
    longest = Math.max(longest, run);
    previous = date;
  }
  return longest;
}
