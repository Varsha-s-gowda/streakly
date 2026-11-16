import mongoose from 'mongoose';
import { INTERVIEW_SUBJECTS } from '../constants.js';

const interviewSessionSchema = new mongoose.Schema(
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
      index: true,
    },
    subject: {
      type: String,
      required: true,
      enum: INTERVIEW_SUBJECTS,
      index: true,
    },
    topic: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InterviewTopic',
      default: null,
    },
    minutes: {
      type: Number,
      required: true,
      min: 1,
      max: 1440,
    },
    problemsSolved: {
      type: Number,
      default: 0,
      min: 0,
      max: 500,
    },
    difficultQuestions: {
      type: String,
      default: '',
      maxlength: 5000,
    },
    notes: {
      type: String,
      default: '',
      maxlength: 5000,
    },
  },
  { timestamps: true },
);

interviewSessionSchema.index({ user: 1, date: 1 });

export const InterviewSession = mongoose.model('InterviewSession', interviewSessionSchema);
