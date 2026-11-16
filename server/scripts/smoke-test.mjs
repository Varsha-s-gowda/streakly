import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(__dirname, '..');
const PORT = Number(process.env.SMOKE_PORT || 4100);
const BASE = `http://127.0.0.1:${PORT}/api`;
const MONGODB_URI =
  process.env.SMOKE_MONGODB_URI || 'mongodb://127.0.0.1:27017/streakly_smoke_test';

let cookie = '';
const failures = [];
const passes = [];

function check(condition, label, detail) {
  if (condition) {
    passes.push(label);
    console.log(`  ok  ${label}`);
  } else {
    failures.push({ label, detail });
    console.error(`FAIL  ${label}${detail ? ` — ${detail}` : ''}`);
  }
}

async function request(method, endpoint, body) {
  const response = await fetch(`${BASE}${endpoint}`, {
    method,
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const setCookie = response.headers.getSetCookie?.() || [];
  for (const raw of setCookie) {
    const pair = raw.split(';')[0];
    if (pair.startsWith('streakly_session=')) {
      cookie = pair.endsWith('=') ? '' : pair;
    }
  }

  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  return { status: response.status, data };
}

function addDays(date, amount) {
  const parsed = new Date(`${date}T00:00:00.000Z`);
  parsed.setUTCDate(parsed.getUTCDate() + amount);
  return parsed.toISOString().slice(0, 10);
}

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function waitForServer() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(`${BASE}/health`);
      if (response.ok) return;
    } catch {
      /* server still booting */
    }
    await wait(400);
  }
  throw new Error('Smoke-test server did not become healthy in time.');
}

async function dropDatabase() {
  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 4000 });
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  } catch (error) {
    console.warn(`Could not drop smoke database: ${error.message}`);
  }
}

async function run() {
  await dropDatabase();

  const child = spawn(process.execPath, ['src/index.js'], {
    cwd: serverRoot,
    env: {
      ...process.env,
      PORT: String(PORT),
      MONGODB_URI,
      NODE_ENV: 'test',
      JWT_SECRET: 'smoke-test-secret-key-with-enough-length-1234567890',
      JWT_EXPIRES_IN: '1d',
      ALLOW_SIGNUP: 'true',
      CLIENT_URL: `http://127.0.0.1:${PORT}`,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  child.stdout.on('data', (chunk) => {
    const line = chunk.toString().trim();
    if (line) console.log(`[server] ${line}`);
  });
  child.stderr.on('data', (chunk) => {
    const line = chunk.toString().trim();
    if (line) console.error(`[server:err] ${line}`);
  });

  let exitCode = 0;
  try {
    await waitForServer();
    console.log('\nAPI smoke test\n');

    const health = await request('GET', '/health');
    check(health.status === 200 && health.data.status === 'ok', 'health endpoint responds');

    const email = `smoke-${Date.now()}@streakly.test`;
    const register = await request('POST', '/auth/register', {
      name: 'Smoke Tester',
      email,
      password: 'password123',
      timezone: 'Asia/Kolkata',
    });
    check(register.status === 201 && register.data.user.email === email, 'register creates account');
    check(Boolean(cookie), 'register sets session cookie');

    const sessionProbe = await request('GET', '/auth/session');
    check(
      sessionProbe.status === 200 && sessionProbe.data.user?.email === email,
      'session endpoint returns the signed-in user',
    );

    const today = register.data.today;
    check(/^\d{4}-\d{2}-\d{2}$/.test(today || ''), 'register returns local today date');

    const duplicate = await request('POST', '/auth/register', {
      name: 'Another Person',
      email,
      password: 'password123',
      timezone: 'Asia/Kolkata',
    });
    check(duplicate.status === 409, 'duplicate email registration is rejected');

    const me = await request('GET', '/auth/me');
    check(me.status === 200 && me.data.user.name === 'Smoke Tester', 'auth/me returns the session user');

    const day = await request('GET', `/day?date=${today}`);
    check(day.status === 200, 'day payload loads');
    check(day.data.activities?.length === 37, '37 default routine activities are seeded', `got ${day.data.activities?.length}`);
    check(day.data.stats?.totalActivities === 37, 'day stats report 37 activities');
    const firstActivity = day.data.activities[0];

    const toggle = await request('PATCH', `/day/${today}/activities/${firstActivity.id}`, {
      completed: true,
    });
    check(toggle.status === 200, 'activity toggle succeeds');
    check(toggle.data.day.stats.completedActivities === 1, 'toggle updates completed count');

    const notes = await request('PATCH', `/day/${today}/activities/${firstActivity.id}`, {
      notes: 'Smoke test note',
    });
    check(
      notes.status === 200 && notes.data.day.activities[0].notes === 'Smoke test note',
      'activity notes are saved',
    );

    const completeAll = await request('POST', `/day/${today}/complete-all`, { completed: true });
    check(completeAll.status === 200 && completeAll.data.day.stats.isComplete === true, 'complete-all completes the day');
    check(completeAll.data.streaks.current >= 1, 'streak starts after a complete day', `got ${completeAll.data.streaks.current}`);

    const overview = await request('GET', '/stats/overview');
    check(overview.status === 200 && overview.data.today.isComplete === true, 'overview reflects the complete day');
    check(overview.data.schedule?.length === 37, 'overview returns the full schedule');

    const habits = await request('GET', `/habits?from=${addDays(today, -6)}&to=${today}`);
    check(habits.status === 200 && habits.data.habits.length === 13, '13 default habits are seeded', `got ${habits.data.habits?.length}`);
    const habit = habits.data.habits[0];
    const habitToggle = await request('PATCH', `/habits/${habit.id}/entries/${today}`, {
      completed: true,
    });
    check(habitToggle.status === 200 && habitToggle.data.completed === true, 'habit check-in succeeds');
    const habitsAfter = await request('GET', `/habits?from=${addDays(today, -6)}&to=${today}`);
    check(habitsAfter.data.summary.completedToday === 1, 'habit summary counts today\'s check-in');

    const newHabit = await request('POST', '/habits', {
      name: 'Smoke habit',
      description: 'Created by the smoke test',
    });
    check(newHabit.status === 201, 'custom habit can be created');
    const habitDelete = await request('DELETE', `/habits/${newHabit.data.habit.id}`);
    check(habitDelete.status === 200, 'custom habit can be archived');

    const journal = await request('PUT', `/journal/${today}`, {
      achievements: 'Finished the smoke test.',
      gratitude: { gratefulFor: 'Real database persistence.' },
      reflection: { learned: 'APIs behave end to end.' },
      manifestation: { affirmations: 'I build calm, reliable systems.' },
    });
    check(journal.status === 200 && journal.data.entry.achievements.includes('smoke test'), 'journal entry saves');
    check(journal.data.hasContent === true, 'journal reports content');

    const journalRead = await request('GET', `/journal?date=${today}`);
    check(
      journalRead.status === 200 &&
        journalRead.data.entry.gratitude.gratefulFor === 'Real database persistence.',
      'journal entry reads back by date',
    );
    const entries = await request('GET', '/journal/entries?limit=10');
    check(entries.status === 200 && entries.data.entries.length === 1, 'journal archive lists entries');
    check(entries.data.entries[0].hasManifestation === true, 'manifestation flag is detected');

    const interview = await request('GET', '/interview');
    check(interview.status === 200 && interview.data.subjects.length === 14, '14 interview subjects are seeded', `got ${interview.data.subjects?.length}`);

    const topic = await request('POST', '/interview/topics', {
      subject: 'React',
      title: 'Smoke topic',
      difficulty: 'hard',
      status: 'in-progress',
      targetMinutes: 30,
    });
    check(topic.status === 201, 'interview topic can be added');

    const topicDone = await request('PATCH', `/interview/topics/${topic.data.topic.id}`, {
      status: 'completed',
    });
    check(topicDone.status === 200 && topicDone.data.topic.status === 'completed', 'interview topic status updates');

    const subtopic = await request('POST', '/interview/topics', {
      subject: 'React',
      title: 'Smoke subtopic',
      parent: topic.data.topic.id,
    });
    check(subtopic.status === 201 && subtopic.data.topic.parent === topic.data.topic.id, 'subtopic nests under its parent');

    const session = await request('POST', '/interview/sessions', {
      date: today,
      subject: 'React',
      topic: topic.data.topic.id,
      minutes: 50,
      problemsSolved: 3,
      difficultQuestions: 'Hydration edge cases',
      notes: 'Smoke session',
    });
    check(session.status === 201 && session.data.session.minutes === 50, 'study session logs');

    const targets = await request('PUT', '/interview/targets', {
      subject: 'React',
      dailyMinutes: 90,
      weeklyMinutes: 420,
    });
    check(targets.status === 200 && targets.data.target.dailyMinutes === 90, 'study targets save');

    const interviewAfter = await request('GET', '/interview');
    const react = interviewAfter.data.subjects.find((subject) => subject.subject === 'React');
    check(react.topicsCompleted >= 1, 'interview overview counts completed topics');
    check(interviewAfter.data.summary.weekMinutes >= 50, 'interview summary includes study minutes');

    const sessions = await request('GET', '/interview/sessions?limit=5');
    check(sessions.status === 200 && sessions.data.sessions.length === 1, 'study session lists');

    const task = await request('POST', '/tasks', {
      title: 'Smoke custom task',
      description: 'Temporary',
      scheduledTime: '10:15',
      priority: 'high',
      recurrence: 'daily',
      required: true,
    });
    check(task.status === 201 && task.data.task.required === true, 'custom task creates');

    const taskPatch = await request('PATCH', `/tasks/${task.data.task.id}`, {
      title: 'Smoke custom task edited',
      recurrence: 'weekdays',
    });
    check(taskPatch.status === 200 && taskPatch.data.task.title.endsWith('edited'), 'custom task updates');

    const tasks = await request('GET', '/tasks');
    check(tasks.data.tasks.length === 1, 'custom task appears in task list');

    const rescheduled = await request('POST', `/tasks/${task.data.task.id}/reschedule`, {});
    check(rescheduled.status === 200 && rescheduled.data.created === true, 'recurring task reschedules as a one-time copy');

    const taskDelete = await request('DELETE', `/tasks/${task.data.task.id}`);
    check(taskDelete.status === 200, 'custom task archives');
    const tasksAfterDelete = await request('GET', '/tasks');
    check(tasksAfterDelete.data.tasks.length === 1, 'archived task stays out of the task list', `got ${tasksAfterDelete.data.tasks.length}`);
    check(
      tasksAfterDelete.data.tasks.every((entry) => entry.id !== task.data.task.id),
      'archived task id is absent from the task list',
    );

    const reminders = await request('GET', '/reminders');
    check(reminders.status === 200 && reminders.data.reminders.length === 7, '7 default reminders are seeded', `got ${reminders.data.reminders?.length}`);
    const reminder = await request('POST', '/reminders', {
      title: 'Smoke reminder',
      message: 'Temporary nudge',
      time: '21:15',
      days: [1, 3, 5],
    });
    check(reminder.status === 201, 'custom reminder creates');
    const reminderToggle = await request('PATCH', `/reminders/${reminder.data.reminder.id}`, {
      enabled: false,
    });
    check(reminderToggle.status === 200 && reminderToggle.data.reminder.enabled === false, 'reminder can be disabled');
    const reminderDelete = await request('DELETE', `/reminders/${reminder.data.reminder.id}`);
    check(reminderDelete.status === 200, 'custom reminder deletes');

    const trends = await request('GET', `/stats/trends?from=${addDays(today, -6)}&to=${today}`);
    check(
      trends.status === 200 && trends.data.days.length >= 1 && trends.data.days.length <= 7,
      'trends return the requested range within tracking history',
      `got ${trends.data.days?.length}`,
    );
    check(trends.data.totals.studyMinutes >= 50, 'trends include study minutes');
    check(trends.data.interview?.totalMinutes >= 50, 'trends include interview range stats');

    const month = today.slice(0, 7);
    const calendar = await request('GET', `/stats/calendar?month=${month}`);
    check(calendar.status === 200 && calendar.data.days.length >= 28, 'calendar returns a full month');
    check(calendar.data.days.find((date) => date.date === today)?.isComplete === true, 'calendar marks today complete');
    check(calendar.data.days.find((date) => date.date === today)?.gratitude === true, 'calendar flags gratitude content');

    const past = addDays(today, -1);
    const pastDay = await request('GET', `/day?date=${past}`);
    check(pastDay.status === 200, 'past day can be reviewed');
    check(Array.isArray(pastDay.data.activities), 'past day returns an activity list');
    check(pastDay.data.activities.length === 0, 'days before tracking start have no scheduled activities');

    const future = addDays(today, 1);
    const futureDay = await request('GET', `/day?date=${future}`);
    check(futureDay.status === 400, 'future days are rejected');

    const futureJournal = await request('PUT', `/journal/${future}`, { achievements: 'Nope' });
    check(futureJournal.status === 400, 'future journal entries are rejected');

    const profile = await request('PATCH', '/auth/profile', {
      name: 'Smoke Tester Updated',
      timezone: 'Pacific/Kiritimati',
    });
    check(
      profile.status === 200 && profile.data.user.timezone === 'Pacific/Kiritimati',
      'profile and timezone update',
    );

    const shiftedToday = profile.data.today;
    if (shiftedToday > today) {
      const historical = await request('GET', `/day?date=${today}`);
      check(historical.status === 200, 'previous local day opens as a historical record');
      check(historical.data.activities.length === 37, 'historical day keeps its activities');
      const historicalActivity = historical.data.activities[0];
      const uncomplete = await request(
        'PATCH',
        `/day/${today}/activities/${historicalActivity.id}`,
        { completed: false },
      );
      check(uncomplete.status === 200, 'historical activity can be edited');
      check(
        uncomplete.data.day.stats.isComplete === false && uncomplete.data.streaks.current === 0,
        'editing history recalculates completion and breaks the streak',
        `isComplete=${uncomplete.data.day.stats.isComplete} current=${uncomplete.data.streaks.current}`,
      );
      const recomplete = await request(
        'PATCH',
        `/day/${today}/activities/${historicalActivity.id}`,
        { completed: true },
      );
      check(
        recomplete.data.day.stats.isComplete === true && recomplete.data.streaks.current >= 1,
        'restoring the historical activity recalculates the streak',
      );
    } else {
      console.log('  --  timezone shift did not cross midnight; historical recalculation check skipped');
    }

    const password = await request('POST', '/auth/password', {
      currentPassword: 'password123',
      newPassword: 'newpassword123',
    });
    check(password.status === 200, 'password change succeeds');

    const exportData = await request('GET', '/account/export');
    check(exportData.status === 200 && exportData.data.user?.email === email, 'account export includes user');
    check(Array.isArray(exportData.data.activities) && exportData.data.activities.length >= 37, 'account export includes routine history');
    check(exportData.data.journals?.length >= 1, 'account export includes journals');

    const logout = await request('POST', '/auth/logout');
    check(logout.status === 200, 'logout succeeds');
    const meAfterLogout = await request('GET', '/auth/me');
    check(meAfterLogout.status === 401, 'signed-out session is rejected');
    const sessionAfterLogout = await request('GET', '/auth/session');
    check(
      sessionAfterLogout.status === 200 && sessionAfterLogout.data.user === null,
      'session endpoint reports a signed-out visitor without an error',
    );

    const relogin = await request('POST', '/auth/login', {
      email,
      password: 'newpassword123',
    });
    check(relogin.status === 200, 'login works with the changed password');
  } catch (error) {
    failures.push({ label: 'unexpected exception', detail: error.stack || error.message });
    console.error(error);
  } finally {
    child.kill();
    await wait(400);
  }

  await dropDatabase();

  console.log(`\n${passes.length} checks passed, ${failures.length} failed.`);
  if (failures.length) {
    exitCode = 1;
    for (const failure of failures) {
      console.error(`- ${failure.label}${failure.detail ? `: ${failure.detail}` : ''}`);
    }
  } else {
    console.log('Full API smoke test passed against a disposable MongoDB database.');
  }
  process.exit(exitCode);
}

run();
