import mongoose from 'mongoose';

const habitEntrySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    habit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Habit',
      required: true,
      index: true,
    },
    date: {
      type: String,
      required: true,
    },
    completed: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

habitEntrySchema.index({ user: 1, habit: 1, date: 1 }, { unique: true });
habitEntrySchema.index({ user: 1, date: 1 });

export const HabitEntry = mongoose.model('HabitEntry', habitEntrySchema);
