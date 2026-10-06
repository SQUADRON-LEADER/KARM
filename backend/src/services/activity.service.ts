import mongoose from "mongoose";
import { Activity, IActivity } from "../models/Activity.js";

export class ActivityService {
  public static async log(
    userId: string | mongoose.Types.ObjectId,
    type: string,
    message: string,
    metadata: Record<string, any> = {}
  ): Promise<IActivity> {
    try {
      return await Activity.create({
        userId: new mongoose.Types.ObjectId(userId),
        type,
        message,
        metadata,
      });
    } catch (error) {
      console.error("[ActivityService.log] Failed to record activity:", error);
      // Don't fail the primary transaction if activity logging has a glitch
      return null as any;
    }
  }

  public static async listByUser(
    userId: string,
    page = 1,
    limit = 20
  ): Promise<{ data: any[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
    const skip = (page - 1) * limit;
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const [activities, total] = await Promise.all([
      Activity.find({ userId: userObjectId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Activity.countDocuments({ userId: userObjectId }),
    ]);

    const data = activities.map((a: any) => ({
      id: a._id.toString(),
      userId: a.userId.toString(),
      type: a.type,
      message: a.message,
      metadata: a.metadata,
      createdAt: a.createdAt ? new Date(a.createdAt).toISOString() : new Date().toISOString(),
    }));

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }
}
