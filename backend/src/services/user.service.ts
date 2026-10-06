import { User } from "../models/User.js";
import { AppError } from "../utils/apiResponse.js";
import { UpdateProfileInput } from "../validators/user.validator.js";
import { ActivityService } from "./activity.service.js";

export class UserService {
  public static async updateProfile(
    userId: string,
    data: UpdateProfileInput
  ): Promise<{ id: string; fullName: string; email: string; avatar?: string }> {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError("User not found.", 404);
    }

    if (data.email && data.email !== user.email) {
      const existing = await User.findOne({ email: data.email, _id: { $ne: user._id } });
      if (existing) {
        throw new AppError("An account with this email already exists.", 409);
      }
      user.email = data.email;
    }

    if (data.fullName !== undefined) {
      user.fullName = data.fullName.trim();
    }

    if (data.avatar !== undefined) {
      user.avatar = data.avatar;
    }

    await user.save();
    await ActivityService.log(user._id, "PROFILE_UPDATED", "Updated profile details");

    return {
      id: user._id.toString(),
      fullName: user.fullName,
      email: user.email,
      avatar: user.avatar,
    };
  }
}
