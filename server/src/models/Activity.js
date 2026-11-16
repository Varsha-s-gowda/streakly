import mongoose from 'mongoose';
import { PRIORITIES, RECURRENCES } from '../constants.js';

const activitySchema = new mongoose.Schema(
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
      maxlength: 200,
    },
    description: {
      type: String,
      default: '',
      maxlength: 2000,
    },
    section: {
      type: String,
      default: 'custom',
      required: true,
      index: true,
    },
    scheduledTime: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):[0-5]\d$/,
    },
    priority: {
      type: String,
      enum: PRIORITIES,
      default: 'medium',
    },
    required: {
      type: Boolean,
      default: false,
    },
    recurrence: {
      type: String,
      enum: RECURRENCES,
      default: 'daily',
    },
    date: {
      type: String,
      default: null,
    },
    startDate: {
      type: String,
      required: true,
      index: true,
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
    isDefault: {
      type: Boolean,
      default: false,
    },
    isCustom: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

activitySchema.index({ user: 1, startDate: 1, archived: 1 });

export const Activity = mongoose.model('Activity', activitySchema);
