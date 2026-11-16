export const SECTION_META = {
  morning: {
    title: 'Morning routine',
    time: '8:00 – 9:00 AM',
    note: 'Start slowly, start deliberately.',
  },
  'interview-1': {
    title: 'Interview preparation · Block 1',
    time: '9:00 AM – 1:00 PM',
    note: 'Deep work on the hardest material.',
  },
  'break-1': {
    title: 'Lunch break',
    time: '1:00 – 2:00 PM',
    note: 'Step away from the desk.',
  },
  'interview-2': {
    title: 'Interview preparation · Block 2',
    time: '2:00 – 5:00 PM',
    note: 'Practice, build, and learn.',
  },
  'break-2': {
    title: 'Evening break',
    time: '5:00 – 6:00 PM',
    note: 'Reset before the final block.',
  },
  'interview-3': {
    title: 'Interview preparation · Block 3',
    time: '6:00 – 8:00 PM',
    note: 'Speak, answer, and simulate.',
  },
  dinner: {
    title: 'Dinner & break',
    time: '8:00 – 9:00 PM',
    note: 'Recharge before revision.',
  },
  revision: {
    title: 'Revision',
    time: '9:00 – 11:00 PM',
    note: 'Recall, review, and repair gaps.',
  },
  night: {
    title: 'Night routine',
    time: '11:00 PM – 12:00 AM',
    note: 'Close the day with gratitude.',
  },
  custom: {
    title: 'Custom tasks',
    time: 'Your own additions',
    note: 'Optional focus tasks for today.',
  },
};

export const SECTION_ORDER = [
  'morning',
  'interview-1',
  'break-1',
  'interview-2',
  'break-2',
  'interview-3',
  'dinner',
  'revision',
  'night',
  'custom',
];

export const INTERVIEW_SUBJECTS = [
  'Java Programming',
  'Object-Oriented Programming',
  'Data Structures and Algorithms',
  'DBMS',
  'Operating Systems',
  'Computer Networks',
  'SQL',
  'HTML, CSS and JavaScript',
  'React',
  'Node.js and Express',
  'Full Stack Development',
  'HR Interview Preparation',
  'Technical Mock Interviews',
  'English Communication',
];

export const PRIORITIES = [
  { value: 'low', label: 'Low', dot: 'bg-sage-300' },
  { value: 'medium', label: 'Medium', dot: 'bg-gold' },
  { value: 'high', label: 'High', dot: 'bg-clay' },
];

export const RECURRENCES = [
  { value: 'daily', label: 'Every day' },
  { value: 'weekdays', label: 'Weekdays only' },
  { value: 'once', label: 'One time' },
];

export const TOPIC_STATUSES = [
  { value: 'not-started', label: 'Not started' },
  { value: 'in-progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
];

export const DIFFICULTIES = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
];

export const GRATITUDE_FIELDS = [
  {
    key: 'gratefulFor',
    label: 'What are 3 things I am grateful for today?',
    placeholder: 'Three small or big things that felt like gifts today…',
    rows: 3,
  },
  {
    key: 'madeDayBetter',
    label: 'Who or what made my day better?',
    placeholder: 'A person, a message, a moment, a small kindness…',
    rows: 3,
  },
  {
    key: 'smallAppreciation',
    label: 'What is one small thing I appreciated today?',
    placeholder: 'A cup of tea, sunlight, a deep breath, progress…',
    rows: 2,
  },
  {
    key: 'positiveExperience',
    label: 'What positive experience happened today?',
    placeholder: 'Describe a moment that felt good…',
    rows: 3,
  },
];

export const REFLECTION_FIELDS = [
  {
    key: 'accomplished',
    label: 'What did I accomplish today?',
    placeholder: 'Even the quiet wins count. List them honestly.',
    rows: 3,
  },
  {
    key: 'learned',
    label: 'What did I learn today?',
    placeholder: 'A concept, a lesson, something about myself…',
    rows: 3,
  },
  {
    key: 'challenges',
    label: 'What challenges did I face?',
    placeholder: 'Where did I get stuck or resist?',
    rows: 3,
  },
  {
    key: 'improveTomorrow',
    label: 'What could I improve tomorrow?',
    placeholder: 'One specific adjustment for a better tomorrow.',
    rows: 2,
  },
  {
    key: 'proudOf',
    label: 'What am I proud of today?',
    placeholder: 'Give yourself credit for something real.',
    rows: 2,
  },
];

export const MANIFESTATION_FIELDS = [
  {
    key: 'manifesting',
    label: 'What am I manifesting?',
    placeholder: 'The opportunity, feeling, or life you are calling in…',
    rows: 3,
  },
  {
    key: 'becomingPerson',
    label: 'What kind of person do I want to become?',
    placeholder: 'Describe your future self with warmth and specificity.',
    rows: 3,
  },
  {
    key: 'affirmations',
    label: 'Write my daily affirmations.',
    placeholder: 'I am… I choose… I am becoming…',
    rows: 3,
  },
  {
    key: 'visualization',
    label: 'Visualize my career, success, and personal goals.',
    placeholder: 'Where are you, what does it feel like, who is around you?',
    rows: 3,
  },
  {
    key: 'tomorrowIntentions',
    label: "Write tomorrow's intentions.",
    placeholder: 'The energy and actions you are choosing for tomorrow.',
    rows: 3,
  },
];

export function emptyJournal() {
  const group = (fields) => Object.fromEntries(fields.map((field) => [field.key, '']));
  return {
    achievements: '',
    gratitude: group(GRATITUDE_FIELDS),
    reflection: group(REFLECTION_FIELDS),
    manifestation: group(MANIFESTATION_FIELDS),
  };
}

export function mergeJournal(entry) {
  const empty = emptyJournal();
  if (!entry) return empty;
  return {
    achievements: entry.achievements || '',
    gratitude: { ...empty.gratitude, ...(entry.gratitude || {}) },
    reflection: { ...empty.reflection, ...(entry.reflection || {}) },
    manifestation: { ...empty.manifestation, ...(entry.manifestation || {}) },
  };
}

export const STATUS_STYLES = {
  complete: {
    cell: 'bg-sage-500 text-white',
    soft: 'bg-sage-100 text-sage-700',
    label: 'Completed',
    dot: 'bg-sage-500',
  },
  partial: {
    cell: 'bg-gold/80 text-forest-800',
    soft: 'bg-[#F5EBD2] text-[#7A6432]',
    label: 'Partial',
    dot: 'bg-gold',
  },
  missed: {
    cell: 'bg-clay/75 text-white',
    soft: 'bg-[#F4E1D9] text-[#8A4F38]',
    label: 'Missed',
    dot: 'bg-clay',
  },
  future: {
    cell: 'bg-cream-200/60 text-ink-muted/50',
    soft: 'bg-cream-200 text-ink-muted',
    label: 'Future',
    dot: 'bg-sand',
  },
  untracked: {
    cell: 'bg-cream-200/80 text-ink-muted',
    soft: 'bg-cream-200 text-ink-muted',
    label: 'Untracked',
    dot: 'bg-sand',
  },
};
