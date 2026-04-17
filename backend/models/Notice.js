import mongoose from "mongoose";

const noticeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
    },
    emoji: {
      type: String,
      default: "",
    },
    imageUrl: {
      type: String,
      default: null,
    },
    fileUrl: {
      type: String,
      default: null,
    },
    audioUrl: {
      type: String,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reactions: [
      {
        userId: {
          type: String,
          required: true,
          trim: true,
        },
        branchId: {
          type: String,
          default: null,
          trim: true,
        },
        branchName: {
          type: String,
          default: "",
          trim: true,
        },
        emoji: {
          type: String,
          required: true,
          trim: true,
        },
        reactedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

const Notice = mongoose.model("Notice", noticeSchema);
export default Notice;
