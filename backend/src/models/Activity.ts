import mongoose, { Document, Schema } from "mongoose";

export interface IActivity extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type: string;
  message: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

const activitySchema = new Schema<IActivity>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Activity user is required"],
      index: true,
    },
    type: {
      type: String,
      required: [true, "Activity type is required"],
      trim: true,
    },
    message: {
      type: String,
      required: [true, "Activity message is required"],
      trim: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: {
      transform: (_doc, ret: Record<string, any>) => {
        ret.id = ret._id.toString();
        ret.userId = ret.userId.toString();
        ret.createdAt = ret.createdAt ? new Date(ret.createdAt).toISOString() : new Date().toISOString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

activitySchema.index({ userId: 1, createdAt: -1 });

export const Activity = mongoose.model<IActivity>("Activity", activitySchema);
