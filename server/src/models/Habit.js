import mongoose from 'mongoose';

const habitSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      default: '',
      maxlength: 500,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    archived: {
      type: Boolean,
      default: false,
      index: true,
    },
    archivedOn: {
      type: String,
      default: null,
    },
    startDate: {
      type: String,
      required: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

export const Habit = mongoose.model('Habit', habitSchema);
