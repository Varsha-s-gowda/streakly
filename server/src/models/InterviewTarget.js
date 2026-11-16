import mongoose from 'mongoose';
import { INTERVIEW_SUBJECTS } from '../constants.js';

const interviewTargetSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    subject: {
      type: String,
      required: true,
      enum: INTERVIEW_SUBJECTS,
    },
    dailyMinutes: {
      type: Number,
      default: 60,
      min: 0,
      max: 1440,
    },
    weeklyMinutes: {
      type: Number,
      default: 300,
      min: 0,
      max: 10080,
    },
  },
  { timestamps: true },
);

interviewTargetSchema.index({ user: 1, subject: 1 }, { unique: true });

export const InterviewTarget = mongoose.model('InterviewTarget', interviewTargetSchema);
