import { InterviewTopic } from '../models/InterviewTopic.js';
import { InterviewSession } from '../models/InterviewSession.js';
import { InterviewTarget } from '../models/InterviewTarget.js';
import { INTERVIEW_SUBJECTS } from '../constants.js';
import { startOfWeek } from '../utils/dates.js';
import { getTargetDefaults } from '../seed/defaults.js';

function serializeTopic(topic) {
  return {
    id: String(topic._id),
    subject: topic.subject,
    title: topic.title,
    parent: topic.parent ? String(topic.parent) : null,
    status: topic.status,
    difficulty: topic.difficulty,
    notes: topic.notes || '',
    targetMinutes: topic.targetMinutes || 0,
    createdAt: topic.createdAt,
    updatedAt: topic.updatedAt,
  };
}

function serializeSession(session, topicTitle) {
  return {
    id: String(session._id),
    date: session.date,
    subject: session.subject,
    topic: session.topic ? String(session.topic) : null,
    topicTitle: topicTitle || null,
    minutes: session.minutes,
    problemsSolved: session.problemsSolved,
    difficultQuestions: session.difficultQuestions || '',
    notes: session.notes || '',
    createdAt: session.createdAt,
  };
}

export async function getInterviewOverview(user, today) {
  const weekStart = startOfWeek(today);

  const [topics, targets, recentSessions, weekSessions, allTimeAgg, weekAgg, todayAgg] = await Promise.all([
    InterviewTopic.find({ user: user._id, archived: false }).sort({ subject: 1, order: 1, createdAt: 1 }).lean(),
    InterviewTarget.find({ user: user._id }).lean(),
    InterviewSession.find({ user: user._id }).sort({ date: -1, createdAt: -1 }).limit(20).lean(),
    InterviewSession.find({ user: user._id, date: { $gte: weekStart, $lte: today } }).lean(),
    InterviewSession.aggregate([
      { $match: { user: user._id } },
      {
        $group: {
          _id: '$subject',
          minutes: { $sum: '$minutes' },
          problems: { $sum: '$problemsSolved' },
          sessions: { $sum: 1 },
        },
      },
    ]),
    InterviewSession.aggregate([
      { $match: { user: user._id, date: { $gte: weekStart, $lte: today } } },
      {
        $group: {
          _id: '$subject',
          minutes: { $sum: '$minutes' },
          problems: { $sum: '$problemsSolved' },
          sessions: { $sum: 1 },
        },
      },
    ]),
    InterviewSession.aggregate([
      { $match: { user: user._id, date: today } },
      {
        $group: {
          _id: '$subject',
          minutes: { $sum: '$minutes' },
          problems: { $sum: '$problemsSolved' },
          sessions: { $sum: 1 },
        },
      },
    ]),
  ]);

  const targetMap = new Map(targets.map((target) => [target.subject, target]));
  const allTimeMap = new Map(allTimeAgg.map((row) => [row._id, row]));
  const weekMap = new Map(weekAgg.map((row) => [row._id, row]));
  const todayMap = new Map(todayAgg.map((row) => [row._id, row]));

  const subjects = INTERVIEW_SUBJECTS.map((subject) => {
    const subjectTopics = topics.filter((topic) => topic.subject === subject);
    const completed = subjectTopics.filter((topic) => topic.status === 'completed').length;
    const inProgress = subjectTopics.filter((topic) => topic.status === 'in-progress').length;
    const target = targetMap.get(subject) || { ...getTargetDefaults(subject) };
    const allTime = allTimeMap.get(subject) || { minutes: 0, problems: 0, sessions: 0 };
    const week = weekMap.get(subject) || { minutes: 0, problems: 0, sessions: 0 };
    const day = todayMap.get(subject) || { minutes: 0, problems: 0, sessions: 0 };

    return {
      subject,
      topicsTotal: subjectTopics.length,
      topicsCompleted: completed,
      topicsInProgress: inProgress,
      progress: subjectTopics.length ? Math.round((completed / subjectTopics.length) * 100) : 0,
      studyMinutesAll: allTime.minutes,
      problemsSolvedAll: allTime.problems,
      sessionsAll: allTime.sessions,
      studyMinutesWeek: week.minutes,
      problemsSolvedWeek: week.problems,
      sessionsWeek: week.sessions,
      studyMinutesToday: day.minutes,
      sessionsToday: day.sessions,
      targetDailyMinutes: target.dailyMinutes,
      targetWeeklyMinutes: target.weeklyMinutes,
      dailyProgress: target.dailyMinutes ? Math.min(100, Math.round((day.minutes / target.dailyMinutes) * 100)) : 0,
      weeklyProgress: target.weeklyMinutes ? Math.min(100, Math.round((week.minutes / target.weeklyMinutes) * 100)) : 0,
    };
  });

  const topicById = new Map(topics.map((topic) => [String(topic._id), topic]));
  const topicsCompleted = topics.filter((topic) => topic.status === 'completed').length;
  const totalMinutes = subjects.reduce((sum, subject) => sum + subject.studyMinutesAll, 0);
  const totalProblems = subjects.reduce((sum, subject) => sum + subject.problemsSolvedAll, 0);
  const weekMinutes = subjects.reduce((sum, subject) => sum + subject.studyMinutesWeek, 0);
  const todayMinutes = subjects.reduce((sum, subject) => sum + subject.studyMinutesToday, 0);

  return {
    today,
    weekStart,
    subjects,
    topics: topics.map(serializeTopic),
    recentSessions: recentSessions.map((session) =>
      serializeSession(session, topicById.get(String(session.topic))?.title),
    ),
    summary: {
      topicsTotal: topics.length,
      topicsCompleted,
      topicsInProgress: topics.filter((topic) => topic.status === 'in-progress').length,
      progress: topics.length ? Math.round((topicsCompleted / topics.length) * 100) : 0,
      totalMinutes,
      weekMinutes,
      todayMinutes,
      totalProblems,
      weekProblems: weekSessions.reduce((sum, session) => sum + session.problemsSolved, 0),
      totalSessions: subjects.reduce((sum, subject) => sum + subject.sessionsAll, 0),
      activeSubjects: subjects.filter((subject) => subject.studyMinutesAll > 0 || subject.topicsTotal > 0).length,
    },
  };
}

export async function getInterviewRangeStats(userId, from, to) {
  const [topics, targets, rangeAgg, allTimeAgg] = await Promise.all([
    InterviewTopic.find({ user: userId, archived: false }).select('subject status').lean(),
    InterviewTarget.find({ user: userId }).lean(),
    InterviewSession.aggregate([
      { $match: { user: userId, date: { $gte: from, $lte: to } } },
      {
        $group: {
          _id: '$subject',
          minutes: { $sum: '$minutes' },
          problems: { $sum: '$problemsSolved' },
          sessions: { $sum: 1 },
        },
      },
    ]),
    InterviewSession.aggregate([
      { $match: { user: userId } },
      { $group: { _id: '$subject', minutes: { $sum: '$minutes' } } },
    ]),
  ]);

  const targetMap = new Map(targets.map((target) => [target.subject, target]));
  const rangeMap = new Map(rangeAgg.map((row) => [row._id, row]));
  const allTimeMap = new Map(allTimeAgg.map((row) => [row._id, row]));

  const subjects = INTERVIEW_SUBJECTS.map((subject) => {
    const subjectTopics = topics.filter((topic) => topic.subject === subject);
    const completed = subjectTopics.filter((topic) => topic.status === 'completed').length;
    const target = targetMap.get(subject) || getTargetDefaults(subject);
    const range = rangeMap.get(subject) || { minutes: 0, problems: 0, sessions: 0 };
    return {
      subject,
      topicsTotal: subjectTopics.length,
      topicsCompleted: completed,
      progress: subjectTopics.length ? Math.round((completed / subjectTopics.length) * 100) : 0,
      rangeMinutes: range.minutes,
      rangeProblems: range.problems,
      rangeSessions: range.sessions,
      totalMinutes: allTimeMap.get(subject)?.minutes || 0,
      targetDailyMinutes: target.dailyMinutes,
      targetWeeklyMinutes: target.weeklyMinutes,
    };
  });

  return {
    subjects,
    totalMinutes: subjects.reduce((sum, subject) => sum + subject.rangeMinutes, 0),
    totalProblems: subjects.reduce((sum, subject) => sum + subject.rangeProblems, 0),
    totalSessions: subjects.reduce((sum, subject) => sum + subject.rangeSessions, 0),
    topicsTotal: topics.length,
    topicsCompleted: topics.filter((topic) => topic.status === 'completed').length,
    progress: topics.length
      ? Math.round((topics.filter((topic) => topic.status === 'completed').length / topics.length) * 100)
      : 0,
  };
}
