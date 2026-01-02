import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const routineTemplateSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // null = system default
    },

    title: {
      type: String,
      default: "Daily Routine",
    },

    tasks: {
      type: [taskSchema],
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const RoutineTemplate = mongoose.model(
  "RoutineTemplate",
  routineTemplateSchema
);

export default RoutineTemplate;
