import mongoose from 'mongoose';

const reminderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },
    message: {
      type: String,
      default: '',
      maxlength: 500,
    },
    time: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):[0-5]\d$/,
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    days: {
      type: [Number],
      default: [0, 1, 2, 3, 4, 5, 6],
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

export const Reminder = mongoose.model('Reminder', reminderSchema);
