import { Habit } from '../models/Habit.js';
import { HabitEntry } from '../models/HabitEntry.js';
import { addDays, diffDays } from '../utils/dates.js';
import { computeStreaks } from '../utils/streaks.js';

function rangeLength(from, to) {
  if (!from || !to || from > to) return 0;
  return diffDays(from, to) + 1;
}

export async function getHabitsData(user, { from, to, today }) {
  const [habits, rangeEntries, allEntries] = await Promise.all([
    Habit.find({ user: user._id, archived: false, startDate: { $lte: today } })
      .sort({ order: 1, createdAt: 1 })
      .lean(),
    HabitEntry.find({
      user: user._id,
      date: { $gte: from, $lte: to },
      completed: true,
    })
      .select('habit date')
      .lean(),
    HabitEntry.find({ user: user._id, completed: true }).select('habit date').lean(),
  ]);

  const rangeByHabit = new Map();
  for (const entry of rangeEntries) {
    const key = String(entry.habit);
    if (!rangeByHabit.has(key)) rangeByHabit.set(key, new Set());
    rangeByHabit.get(key).add(entry.date);
  }

  const allByHabit = new Map();
  for (const entry of allEntries) {
    const key = String(entry.habit);
    if (!allByHabit.has(key)) allByHabit.set(key, new Set());
    allByHabit.get(key).add(entry.date);
  }

  const serialized = habits.map((habit) => {
    const id = String(habit._id);
    const datesInRange = [...(rangeByHabit.get(id) || new Set())].sort();
    const allDates = allByHabit.get(id) || new Set();
    const { current, longest } = computeStreaks(allDates, today);
    const rangeStart = habit.startDate > from ? habit.startDate : from;
    const days = rangeLength(rangeStart, to);
    const consistency = days ? Math.round((datesInRange.length / days) * 100) : 0;

    return {
      id,
      name: habit.name,
      description: habit.description || '',
      isDefault: Boolean(habit.isDefault),
      startDate: habit.startDate,
      order: habit.order,
      datesInRange,
      completedToday: allDates.has(today),
      completedDays: allDates.size,
      currentStreak: current,
      longestStreak: longest,
      consistency,
      rangeDays: days,
    };
  });

  return {
    today,
    from,
    to,
    habits: serialized,
    summary: {
      total: serialized.length,
      completedToday: serialized.filter((habit) => habit.completedToday).length,
      bestStreak: serialized.reduce((best, habit) => Math.max(best, habit.currentStreak), 0),
      averageConsistency: serialized.length
        ? Math.round(serialized.reduce((sum, habit) => sum + habit.consistency, 0) / serialized.length)
        : 0,
    },
  };
}

export function habitDateRange(range = 'week', today) {
  if (range === 'month') {
    return { from: addDays(today, -29), to: today };
  }
  return { from: addDays(today, -6), to: today };
}
