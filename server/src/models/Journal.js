import mongoose from 'mongoose';

const gratitudeSchema = new mongoose.Schema(
  {
    gratefulFor: { type: String, default: '', maxlength: 5000 },
    madeDayBetter: { type: String, default: '', maxlength: 5000 },
    smallAppreciation: { type: String, default: '', maxlength: 5000 },
    positiveExperience: { type: String, default: '', maxlength: 5000 },
  },
  { _id: false },
);

const reflectionSchema = new mongoose.Schema(
  {
    accomplished: { type: String, default: '', maxlength: 5000 },
    learned: { type: String, default: '', maxlength: 5000 },
    challenges: { type: String, default: '', maxlength: 5000 },
    improveTomorrow: { type: String, default: '', maxlength: 5000 },
    proudOf: { type: String, default: '', maxlength: 5000 },
  },
  { _id: false },
);

const manifestationSchema = new mongoose.Schema(
  {
    manifesting: { type: String, default: '', maxlength: 5000 },
    becomingPerson: { type: String, default: '', maxlength: 5000 },
    affirmations: { type: String, default: '', maxlength: 5000 },
    visualization: { type: String, default: '', maxlength: 5000 },
    tomorrowIntentions: { type: String, default: '', maxlength: 5000 },
  },
  { _id: false },
);

const journalSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    date: {
      type: String,
      required: true,
    },
    achievements: { type: String, default: '', maxlength: 5000 },
    gratitude: { type: gratitudeSchema, default: () => ({}) },
    reflection: { type: reflectionSchema, default: () => ({}) },
    manifestation: { type: manifestationSchema, default: () => ({}) },
  },
  { timestamps: true },
);

journalSchema.index({ user: 1, date: 1 }, { unique: true });

export const Journal = mongoose.model('Journal', journalSchema);
