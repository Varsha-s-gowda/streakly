import mongoose from 'mongoose';

const statusSchema = new mongoose.Schema(
  {
    activityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Activity',
      required: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      default: '',
      maxlength: 2000,
    },
  },
  { _id: false },
);

const dailyLogSchema = new mongoose.Schema(
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
    statuses: {
      type: [statusSchema],
      default: [],
    },
    totalActivities: { type: Number, default: 0 },
    completedActivities: { type: Number, default: 0 },
    requiredTotal: { type: Number, default: 0 },
    requiredCompleted: { type: Number, default: 0 },
    completionPercent: { type: Number, default: 0 },
    isComplete: { type: Boolean, default: false },
  },
  { timestamps: true },
);

dailyLogSchema.index({ user: 1, date: 1 }, { unique: true });
dailyLogSchema.index({ user: 1, isComplete: 1, date: 1 });

export const DailyLog = mongoose.model('DailyLog', dailyLogSchema);
