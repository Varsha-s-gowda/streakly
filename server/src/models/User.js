import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    timezone: {
      type: String,
      default: 'Asia/Kolkata',
      maxlength: 100,
    },
    trackingStart: {
      type: String,
      required: true,
    },
    lastLoginAt: Date,
  },
  { timestamps: true },
);

userSchema.methods.toPublic = function toPublic() {
  return {
    id: this._id.toString(),
    name: this.name,
    email: this.email,
    timezone: this.timezone,
    trackingStart: this.trackingStart,
    createdAt: this.createdAt,
  };
};

export const User = mongoose.model('User', userSchema);
