import mongoose from "mongoose";

const DailyProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // auth later
    },
    date: {
      type: String, // YYYY-MM-DD
      required: true,
    },
    completed: {
      type: Number,
      required: true,
    },
    total: {
      type: Number,
      required: true,
    },
    completedTaskIds: {
      type: [Number],
      default: [],
    },
  },
  { timestamps: true }
);

// Prevent duplicate entries for same user + date
DailyProgressSchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.model("DailyProgress", DailyProgressSchema);
