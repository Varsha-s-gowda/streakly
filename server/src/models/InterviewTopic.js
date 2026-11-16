import mongoose from 'mongoose';
import { INTERVIEW_SUBJECTS, TOPIC_DIFFICULTIES, TOPIC_STATUSES } from '../constants.js';

const interviewTopicSchema = new mongoose.Schema(
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
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InterviewTopic',
      default: null,
    },
    status: {
      type: String,
      enum: TOPIC_STATUSES,
      default: 'not-started',
    },
    difficulty: {
      type: String,
      enum: TOPIC_DIFFICULTIES,
      default: 'medium',
    },
    notes: {
      type: String,
      default: '',
      maxlength: 5000,
    },
    targetMinutes: {
      type: Number,
      default: 0,
      min: 0,
      max: 10000,
    },
    order: {
      type: Number,
      default: 0,
    },
    archived: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true },
);

interviewTopicSchema.index({ user: 1, subject: 1, archived: 1 });

export const InterviewTopic = mongoose.model('InterviewTopic', interviewTopicSchema);
