export const DEFAULT_ACTIVITIES = [
  // Morning routine — 8 AM to 9 AM
  { section: 'morning', scheduledTime: '08:00', title: 'Wake up at 8 AM', description: 'Get out of bed on time — no snoozing.', priority: 'high', required: true },
  { section: 'morning', scheduledTime: '08:10', title: 'Go to the terrace', description: 'Fresh air and a calm start to the day.', priority: 'medium', required: true },
  { section: 'morning', scheduledTime: '08:20', title: 'Take a morning walk', description: 'Move your body and wake up fully.', priority: 'medium', required: true },
  { section: 'morning', scheduledTime: '08:35', title: 'Drink water', description: 'Hydrate before breakfast.', priority: 'medium', required: true },
  { section: 'morning', scheduledTime: '08:40', title: 'Wash and freshen up', description: 'Brush, wash, and get ready for the day.', priority: 'low', required: true },
  { section: 'morning', scheduledTime: '08:45', title: 'Eat breakfast', description: 'Fuel up for a focused study day.', priority: 'medium', required: true },
  { section: 'morning', scheduledTime: '08:50', title: 'Write down the daily task list', description: 'Decide the three most important outcomes for today.', priority: 'high', required: true },
  { section: 'morning', scheduledTime: '08:55', title: 'Chant daily mantras', description: 'Center yourself before the first study block.', priority: 'low', required: true },

  // Interview preparation — Block 1 (9 AM – 1 PM)
  { section: 'interview-1', scheduledTime: '09:00', title: 'Technical interview preparation', description: 'Start with the highest-priority interview topic.', priority: 'high', required: true },
  { section: 'interview-1', scheduledTime: '09:45', title: 'Java and Full Stack Development', description: 'Study Java, backend, and full-stack concepts.', priority: 'high', required: true },
  { section: 'interview-1', scheduledTime: '10:45', title: 'Core Computer Science subjects', description: 'DBMS, Operating Systems, Computer Networks.', priority: 'high', required: true },
  { section: 'interview-1', scheduledTime: '11:30', title: 'DSA practice', description: 'Solve focused data structures and algorithms problems.', priority: 'high', required: true },
  { section: 'interview-1', scheduledTime: '12:15', title: 'Coding exercises', description: 'Implement solutions by hand and on the machine.', priority: 'medium', required: true },

  // Break — 1 PM to 2 PM
  { section: 'break-1', scheduledTime: '13:00', title: 'Lunch', description: 'Step away from the desk and eat properly.', priority: 'medium', required: true },
  { section: 'break-1', scheduledTime: '13:30', title: 'Relax and recharge', description: 'A real break — no screens if possible.', priority: 'low', required: true },

  // Interview preparation — Block 2 (2 PM – 5 PM)
  { section: 'interview-2', scheduledTime: '14:00', title: 'Continue technical preparation', description: 'Pick up where the morning block ended.', priority: 'high', required: true },
  { section: 'interview-2', scheduledTime: '14:45', title: 'DSA problem solving', description: 'Practice patterns and timed problems.', priority: 'high', required: true },
  { section: 'interview-2', scheduledTime: '15:45', title: 'Programming practice', description: 'Write code, debug, and explain your approach.', priority: 'high', required: true },
  { section: 'interview-2', scheduledTime: '16:30', title: 'Learn new concepts', description: 'Add one new idea to your interview toolkit.', priority: 'medium', required: true },

  // Break — 5 PM to 6 PM
  { section: 'break-2', scheduledTime: '17:00', title: 'Relax', description: 'Stretch, walk, or rest your eyes.', priority: 'low', required: true },
  { section: 'break-2', scheduledTime: '17:30', title: 'Refresh and take a break from studying', description: 'Reset so the evening block is productive.', priority: 'low', required: true },

  // Interview preparation — Block 3 (6 PM – 8 PM)
  { section: 'interview-3', scheduledTime: '18:00', title: 'Technical interview questions', description: 'Rapid-fire questions and model answers.', priority: 'high', required: true },
  { section: 'interview-3', scheduledTime: '18:30', title: 'HR interview preparation', description: 'Stories, strengths, salary, and behavioural questions.', priority: 'medium', required: true },
  { section: 'interview-3', scheduledTime: '19:00', title: 'English speaking practice', description: 'Speak clearly and confidently for 15 minutes.', priority: 'medium', required: true },
  { section: 'interview-3', scheduledTime: '19:20', title: 'Mock interview practice', description: 'Simulate a real interview under time pressure.', priority: 'high', required: true },
  { section: 'interview-3', scheduledTime: '19:40', title: 'Explain technical concepts aloud', description: 'Teach the concept out loud as if to an interviewer.', priority: 'medium', required: true },

  // Dinner and break — 8 PM to 9 PM
  { section: 'dinner', scheduledTime: '20:00', title: 'Have dinner', description: 'Finish eating before the revision block.', priority: 'medium', required: true },
  { section: 'dinner', scheduledTime: '20:45', title: 'Relax and recharge', description: 'Short downtime before revision.', priority: 'low', required: true },

  // Revision — 9 PM to 11 PM
  { section: 'revision', scheduledTime: '21:00', title: 'Revise everything studied during the day', description: 'Active recall beats re-reading.', priority: 'high', required: true },
  { section: 'revision', scheduledTime: '21:30', title: 'Review Java and core CS concepts', description: 'Spend time on the foundations.', priority: 'high', required: true },
  { section: 'revision', scheduledTime: '22:00', title: 'Revisit difficult topics', description: 'Attack the topics you avoided today.', priority: 'high', required: true },
  { section: 'revision', scheduledTime: '22:20', title: 'Review coding mistakes', description: 'Write down what went wrong and why.', priority: 'medium', required: true },
  { section: 'revision', scheduledTime: '22:40', title: 'Prepare for upcoming interviews', description: 'Check applications, schedules, and tomorrow’s focus.', priority: 'medium', required: true },

  // Night routine — 11 PM to 12 AM
  { section: 'night', scheduledTime: '23:00', title: 'Daily completion review', description: 'Look honestly at what you completed and what you missed.', priority: 'high', required: true },
  { section: 'night', scheduledTime: '23:15', title: 'Gratitude journal', description: 'Write what you are grateful for today.', priority: 'high', required: true },
  { section: 'night', scheduledTime: '23:30', title: 'Daily journaling', description: 'Reflect on lessons, challenges, and tomorrow.', priority: 'high', required: true },
  { section: 'night', scheduledTime: '23:55', title: 'Manifestation and affirmations', description: 'Visualize your goals and set tomorrow’s intentions.', priority: 'high', required: true },
];

export const DEFAULT_HABITS = [
  'Wake up at 8 AM',
  'Morning terrace walk',
  'Drink water',
  'Eat breakfast',
  'Write daily task list',
  'Chant mantras',
  'Interview preparation',
  'DSA practice',
  'Revision',
  'English speaking practice',
  'Journaling',
  'Gratitude',
  'Manifestation',
];

export const DEFAULT_REMINDERS = [
  { title: 'Morning routine', message: 'Start your morning routine — wake up, walk, water, breakfast.', time: '08:00' },
  { title: 'Start interview preparation', message: 'Begin interview preparation block 1. Focus on the hardest topic first.', time: '09:00' },
  { title: 'Lunch break', message: 'Step away, eat lunch, and recharge.', time: '13:00' },
  { title: 'Resume preparation', message: 'Interview preparation block 2 starts now.', time: '14:00' },
  { title: 'Third preparation session', message: 'Technical questions, HR prep, and mock interview practice.', time: '18:00' },
  { title: 'Revision', message: 'Revise today’s work, review mistakes, and revisit difficult topics.', time: '21:00' },
  { title: 'Journal, gratitude & manifestation', message: 'Close the day with reflection, gratitude, and tomorrow’s intentions.', time: '23:00' },
];

export const INTERVIEW_TARGET_DEFAULTS = {
  'Java Programming': { dailyMinutes: 90, weeklyMinutes: 540 },
  'Object-Oriented Programming': { dailyMinutes: 60, weeklyMinutes: 360 },
  'Data Structures and Algorithms': { dailyMinutes: 90, weeklyMinutes: 540 },
  DBMS: { dailyMinutes: 60, weeklyMinutes: 300 },
  'Operating Systems': { dailyMinutes: 60, weeklyMinutes: 300 },
  'Computer Networks': { dailyMinutes: 45, weeklyMinutes: 240 },
  SQL: { dailyMinutes: 45, weeklyMinutes: 240 },
  'HTML, CSS and JavaScript': { dailyMinutes: 45, weeklyMinutes: 240 },
  React: { dailyMinutes: 60, weeklyMinutes: 300 },
  'Node.js and Express': { dailyMinutes: 60, weeklyMinutes: 300 },
  'Full Stack Development': { dailyMinutes: 60, weeklyMinutes: 300 },
  'HR Interview Preparation': { dailyMinutes: 30, weeklyMinutes: 180 },
  'Technical Mock Interviews': { dailyMinutes: 45, weeklyMinutes: 180 },
  'English Communication': { dailyMinutes: 30, weeklyMinutes: 150 },
};

export function getTargetDefaults(subject) {
  return INTERVIEW_TARGET_DEFAULTS[subject] || { dailyMinutes: 60, weeklyMinutes: 300 };
}
