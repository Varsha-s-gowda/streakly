import { DailyLog } from '../models/DailyLog.js';
import { Habit } from '../models/Habit.js';
import { HabitEntry } from '../models/HabitEntry.js';
import { Journal } from '../models/Journal.js';
import { InterviewSession } from '../models/InterviewSession.js';
import { InterviewTopic } from '../models/InterviewTopic.js';
import { getDayPayload } from './activityService.js';
import { getHabitsData } from './habitService.js';
import { getInterviewRangeStats } from './interviewService.js';
import {
  addDays,
  diffDays,
  eachDate,
  endOfMonth,
  endOfWeek,
  startOfMonth,
  startOfWeek,
  todayInTimezone,
} from '../utils/dates.js';
import { computeStreaks } from '../utils/streaks.js';
import {
  gratitudeHasContent,
  journalHasContent,
  manifestationHasContent,
} from '../utils/journalUtils.js';

export function statusForDate(date, { today, trackingStart, log }) {
  if (date > today) return 'future';
  if (date < trackingStart) return 'untracked';
  if (log?.isComplete) return 'complete';
  if (log && log.completedActivities > 0) return 'partial';
  if (date === today) return 'untracked';
  return 'missed';
}

function trackedDays(from, to, trackingStart, today) {
  const start = from > trackingStart ? from : trackingStart;
  const end = to < today ? to : today;
  if (start > end) return [];
  return eachDate(start, end);
}

function percentOf(log) {
  return log?.completionPercent || 0;
}

function average(numbers) {
  if (!numbers.length) return 0;
  return Math.round(numbers.reduce((sum, number) => sum + number, 0) / numbers.length);
}

export async function getStreakSummary(user, today) {
  const [completeLogs, activeDays, totals] = await Promise.all([
    DailyLog.find({ user: user._id, isComplete: true, date: { $lte: today } })
      .select('date')
      .sort({ date: 1 })
      .lean(),
    DailyLog.countDocuments({
      user: user._id,
      completedActivities: { $gt: 0 },
      date: { $lte: today },
    }),
    DailyLog.aggregate([
      { $match: { user: user._id, date: { $lte: today } } },
      {
        $group: {
          _id: null,
          completedTasks: { $sum: '$completedActivities' },
          loggedDays: { $sum: 1 },
        },
      },
    ]),
  ]);

  const completeDates = completeLogs.map((log) => log.date);
  const { current, longest } = computeStreaks(completeDates, today);
  const totalTrackedDays =
    user.trackingStart <= today ? diffDays(user.trackingStart, today) + 1 : 0;

  return {
    current,
    longest,
    completedDays: completeDates.length,
    activeDays,
    totalCompletedTasks: totals[0]?.completedTasks || 0,
    totalTrackedDays,
    trackingStart: user.trackingStart,
  };
}

function buildPeriod(dates, logMap, trackingStart, today) {
  const tracked = dates.filter((date) => date >= trackingStart && date <= today);
  const logs = tracked.map((date) => logMap.get(date)).filter(Boolean);
  const completedDays = logs.filter((log) => log.isComplete).length;
  const consistency = tracked.length ? Math.round((completedDays / tracked.length) * 100) : 0;
  const percent = average(tracked.map((date) => percentOf(logMap.get(date))));
  const tasksCompleted = logs.reduce((sum, log) => sum + log.completedActivities, 0);
  return {
    elapsedDays: tracked.length,
    completedDays,
    consistency,
    percent,
    tasksCompleted,
    averagePercent: percent,
  };
}

export async function getOverview(user) {
  const today = todayInTimezone(user.timezone);
  const day = await getDayPayload(user, today, today);
  const weekStart = startOfWeek(today);
  const weekEnd = endOfWeek(today);
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const queryStart = weekStart < monthStart ? weekStart : monthStart;

  const [logs, streak, weekSessions, activeHabits, habitEntriesToday, topicTotal, topicCompleted] =
    await Promise.all([
      DailyLog.find({
        user: user._id,
        date: { $gte: queryStart, $lte: today },
      }).lean(),
      getStreakSummary(user, today),
      InterviewSession.find({
        user: user._id,
        date: { $gte: weekStart, $lte: today },
      })
        .select('date minutes')
        .lean(),
      Habit.countDocuments({ user: user._id, archived: false, startDate: { $lte: today } }),
      HabitEntry.countDocuments({ user: user._id, date: today, completed: true }),
      InterviewTopic.countDocuments({ user: user._id, archived: false }),
      InterviewTopic.countDocuments({ user: user._id, archived: false, status: 'completed' }),
    ]);

  const logMap = new Map(logs.map((log) => [log.date, log]));
  const weekDates = eachDate(weekStart, weekEnd);
  const monthDates = eachDate(monthStart, monthEnd);

  const week = buildPeriod(weekDates, logMap, user.trackingStart, today);
  const month = buildPeriod(monthDates, logMap, user.trackingStart, today);

  week.days = weekDates.map((date) => {
    const log = logMap.get(date);
    return {
      date,
      status: statusForDate(date, { today, trackingStart: user.trackingStart, log }),
      completionPercent: percentOf(log),
      isComplete: Boolean(log?.isComplete),
      isToday: date === today,
    };
  });
  week.start = weekStart;
  week.end = weekEnd;
  week.studyMinutes = weekSessions
    .filter((session) => session.date >= weekStart)
    .reduce((sum, session) => sum + session.minutes, 0);
  week.tasksCompleted = week.tasksCompleted || 0;
  month.tasksCompleted = month.tasksCompleted || 0;
  month.start = monthStart;
  month.end = monthEnd;

  return {
    date: today,
    timezone: user.timezone,
    trackingStart: user.trackingStart,
    today: {
      ...day.stats,
      studyMinutes: day.studyMinutes,
      problemsSolved: day.problemsSolved,
      hasJournal: Boolean(day.journal && journalHasContent(day.journal)),
      journalUpdatedAt: day.journal?.updatedAt || null,
    },
    streaks: streak,
    week,
    month,
    habits: {
      total: activeHabits,
      completedToday: habitEntriesToday,
    },
    interview: {
      topicsTotal: topicTotal,
      topicsCompleted: topicCompleted,
      progress: topicTotal ? Math.round((topicCompleted / topicTotal) * 100) : 0,
      weekMinutes: week.studyMinutes,
    },
    schedule: day.activities,
    journal: day.journal,
  };
}

export async function getCalendar(user, month) {
  const today = todayInTimezone(user.timezone);
  const from = `${month}-01`;
  const to = endOfMonth(from);
  const dates = eachDate(from, to);

  const [logs, sessionAgg, journals] = await Promise.all([
    DailyLog.find({
      user: user._id,
      date: { $gte: from, $lte: to },
    }).lean(),
    InterviewSession.aggregate([
      { $match: { user: user._id, date: { $gte: from, $lte: to } } },
      { $group: { _id: '$date', minutes: { $sum: '$minutes' }, problems: { $sum: '$problemsSolved' } } },
    ]),
    Journal.find({ user: user._id, date: { $gte: from, $lte: to } })
      .select('date gratitude reflection manifestation achievements')
      .lean(),
  ]);

  const logMap = new Map(logs.map((log) => [log.date, log]));
  const sessionMap = new Map(sessionAgg.map((row) => [row._id, row]));
  const journalMap = new Map(journals.map((journal) => [journal.date, journal]));

  const days = dates.map((date) => {
    const log = logMap.get(date);
    const session = sessionMap.get(date);
    return {
      date,
      status: statusForDate(date, { today, trackingStart: user.trackingStart, log }),
      completionPercent: percentOf(log),
      completedActivities: log?.completedActivities || 0,
      totalActivities: log?.totalActivities || 0,
      requiredCompleted: log?.requiredCompleted || 0,
      requiredTotal: log?.requiredTotal || 0,
      isComplete: Boolean(log?.isComplete),
      studyMinutes: session?.minutes || 0,
      problemsSolved: session?.problems || 0,
      hasJournal: journalMap.has(date) && journalHasContent(journalMap.get(date)),
      gratitude: gratitudeHasContent(journalMap.get(date)),
      manifestation: manifestationHasContent(journalMap.get(date)),
    };
  });

  const tracked = days.filter((day) => day.status !== 'future' && day.status !== 'untracked');
  const summary = {
    completedDays: days.filter((day) => day.status === 'complete').length,
    partialDays: days.filter((day) => day.status === 'partial').length,
    missedDays: days.filter((day) => day.status === 'missed').length,
    futureDays: days.filter((day) => day.status === 'future').length,
    untrackedDays: days.filter((day) => day.status === 'untracked').length,
    elapsedDays: tracked.length,
    averagePercent: average(tracked.map((day) => day.completionPercent)),
    studyMinutes: days.reduce((sum, day) => sum + day.studyMinutes, 0),
    problemsSolved: days.reduce((sum, day) => sum + day.problemsSolved, 0),
    journalDays: days.filter((day) => day.hasJournal).length,
    consistency: tracked.length
      ? Math.round(
          (days.filter((day) => day.status === 'complete').length / tracked.length) * 100,
        )
      : 0,
  };

  return {
    month,
    from,
    to,
    today,
    trackingStart: user.trackingStart,
    timezone: user.timezone,
    days,
    summary,
  };
}

function buildBuckets(days, mode) {
  const map = new Map();
  for (const day of days) {
    const key = mode === 'week' ? startOfWeek(day.date) : day.date.slice(0, 7);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(day);
  }

  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, bucketDays]) => ({
      key,
      start: bucketDays[0].date,
      end: bucketDays[bucketDays.length - 1].date,
      days: bucketDays.length,
      trackedDays: bucketDays.filter((day) => day.tracked).length,
      completedDays: bucketDays.filter((day) => day.isComplete).length,
      averagePercent: average(bucketDays.filter((day) => day.tracked).map((day) => day.completionPercent)),
      tasksCompleted: bucketDays.reduce((sum, day) => sum + day.completedActivities, 0),
      studyMinutes: bucketDays.reduce((sum, day) => sum + day.studyMinutes, 0),
      journalCount: bucketDays.filter((day) => day.journalSaved).length,
      gratitudeCount: bucketDays.filter((day) => day.gratitudeSaved).length,
      manifestationCount: bucketDays.filter((day) => day.manifestationSaved).length,
    }));
}

export async function getTrends(user, requestedFrom, requestedTo) {
  const today = todayInTimezone(user.timezone);
  const to = requestedTo > today ? today : requestedTo;
  const from = requestedFrom < user.trackingStart ? user.trackingStart : requestedFrom;
  if (from > to) {
    return {
      from,
      to,
      requestedFrom,
      requestedTo,
      today,
      trackingStart: user.trackingStart,
      days: [],
      weeks: [],
      months: [],
      habits: [],
      interview: null,
      totals: null,
    };
  }

  const dates = eachDate(from, to);
  const [logs, sessions, journals, habits, habitEntries, allHabitEntries, interview, streak] =
    await Promise.all([
      DailyLog.find({ user: user._id, date: { $gte: from, $lte: to } }).lean(),
      InterviewSession.find({ user: user._id, date: { $gte: from, $lte: to } })
        .select('date minutes problemsSolved')
        .lean(),
      Journal.find({ user: user._id, date: { $gte: from, $lte: to } }).lean(),
      Habit.find({ user: user._id, archived: false, startDate: { $lte: today } })
        .sort({ order: 1 })
        .lean(),
      HabitEntry.find({
        user: user._id,
        date: { $gte: from, $lte: to },
        completed: true,
      })
        .select('habit date')
        .lean(),
      HabitEntry.find({ user: user._id, completed: true }).select('habit date').lean(),
      getInterviewRangeStats(user._id, from, to),
      getStreakSummary(user, today),
    ]);

  const logMap = new Map(logs.map((log) => [log.date, log]));
  const journalMap = new Map(journals.map((journal) => [journal.date, journal]));
  const sessionMap = new Map();
  for (const session of sessions) {
    const current = sessionMap.get(session.date) || { minutes: 0, problems: 0 };
    current.minutes += session.minutes;
    current.problems += session.problemsSolved;
    sessionMap.set(session.date, current);
  }

  const habitCountByDate = new Map();
  for (const entry of habitEntries) {
    habitCountByDate.set(entry.date, (habitCountByDate.get(entry.date) || 0) + 1);
  }

  const days = dates.map((date) => {
    const log = logMap.get(date);
    const journal = journalMap.get(date);
    const session = sessionMap.get(date) || { minutes: 0, problems: 0 };
    const tracked = date >= user.trackingStart && date <= today;
    return {
      date,
      tracked,
      status: statusForDate(date, { today, trackingStart: user.trackingStart, log }),
      completionPercent: percentOf(log),
      completedActivities: log?.completedActivities || 0,
      totalActivities: log?.totalActivities || 0,
      requiredCompleted: log?.requiredCompleted || 0,
      requiredTotal: log?.requiredTotal || 0,
      isComplete: Boolean(log?.isComplete),
      studyMinutes: session.minutes,
      problemsSolved: session.problems,
      habitsCompleted: habitCountByDate.get(date) || 0,
      journalSaved: journalHasContent(journal),
      gratitudeSaved: gratitudeHasContent(journal),
      manifestationSaved: manifestationHasContent(journal),
    };
  });

  const rangeEntriesByHabit = new Map();
  for (const entry of habitEntries) {
    const key = String(entry.habit);
    if (!rangeEntriesByHabit.has(key)) rangeEntriesByHabit.set(key, new Set());
    rangeEntriesByHabit.get(key).add(entry.date);
  }
  const allEntriesByHabit = new Map();
  for (const entry of allHabitEntries) {
    const key = String(entry.habit);
    if (!allEntriesByHabit.has(key)) allEntriesByHabit.set(key, new Set());
    allEntriesByHabit.get(key).add(entry.date);
  }

  const habitSummaries = habits.map((habit) => {
    const id = String(habit._id);
    const allDates = allEntriesByHabit.get(id) || new Set();
    const rangeDates = rangeEntriesByHabit.get(id) || new Set();
    const { current, longest } = computeStreaks(allDates, today);
    const start = habit.startDate > from ? habit.startDate : from;
    const daysCount = start <= to ? diffDays(start, to) + 1 : 0;
    return {
      id,
      name: habit.name,
      isDefault: Boolean(habit.isDefault),
      completedDays: rangeDates.size,
      rangeDays: daysCount,
      completionRate: daysCount ? Math.round((rangeDates.size / daysCount) * 100) : 0,
      currentStreak: current,
      longestStreak: longest,
      totalCompleted: allDates.size,
    };
  });

  const weeks = buildBuckets(days, 'week');
  const months = buildBuckets(days, 'month');
  const trackedDays = days.filter((day) => day.tracked);
  const completeDays = days.filter((day) => day.isComplete).length;
  const journalEntries = days.filter((day) => day.journalSaved).length;
  const gratitudeEntries = days.filter((day) => day.gratitudeSaved).length;
  const manifestationEntries = days.filter((day) => day.manifestationSaved).length;

  return {
    from,
    to,
    requestedFrom,
    requestedTo,
    today,
    trackingStart: user.trackingStart,
    days,
    weeks,
    months,
    habits: habitSummaries,
    interview,
    totals: {
      days: trackedDays.length,
      completeDays,
      activeDays: days.filter((day) => day.completedActivities > 0).length,
      totalCompletedTasks: days.reduce((sum, day) => sum + day.completedActivities, 0),
      averageCompletion: average(trackedDays.map((day) => day.completionPercent)),
      consistency: trackedDays.length ? Math.round((completeDays / trackedDays.length) * 100) : 0,
      studyMinutes: days.reduce((sum, day) => sum + day.studyMinutes, 0),
      problemsSolved: days.reduce((sum, day) => sum + day.problemsSolved, 0),
      journalEntries,
      gratitudeEntries,
      manifestationEntries,
      habitsCompleted: days.reduce((sum, day) => sum + day.habitsCompleted, 0),
    },
    streak,
  };
}
