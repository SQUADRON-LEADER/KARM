import { User, IUser } from "../models/User.js";
import { hashPassword, comparePassword } from "../utils/password.js";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../utils/jwt.js";
import { AppError } from "../utils/apiResponse.js";
import { ActivityService } from "./activity.service.js";
import { ensureDemoWorkspace, seedDemoWorkspace } from "./demoSeed.service.js";

export interface AuthResult {
  user: {
    id: string;
    fullName: string;
    email: string;
    avatar?: string;
  };
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  public static async register(fullName: string, email: string, password: string): Promise<AuthResult> {
    const normalizedEmail = email.trim().toLowerCase();

    // Check duplicate
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      throw new AppError("An account with this email already exists.", 409);
    }

    const passwordHash = await hashPassword(password);
    const user = await User.create({
      fullName: fullName.trim(),
      email: normalizedEmail,
      passwordHash,
    });

    // Log account creation activity
    await ActivityService.log(user._id, "ACCOUNT_CREATED", "Created KRAM workspace");
    await seedDemoWorkspace(user._id);

    const tokenPayload = { userId: user._id.toString(), email: user.email };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    return {
      user: {
        id: user._id.toString(),
        fullName: user.fullName,
        email: user.email,
        avatar: user.avatar,
      },
      accessToken,
      refreshToken,
    };
  }

  public static async login(email: string, password: string): Promise<AuthResult> {
    const normalizedEmail = email.trim().toLowerCase();

    // Find user with password hash explicitly selected
    const user = await User.findOne({ email: normalizedEmail }).select("+passwordHash");
    if (!user) {
      throw new AppError("Invalid email or password.", 401);
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      throw new AppError("Invalid email or password.", 401);
    }

    await ensureDemoWorkspace(user._id);

    const tokenPayload = { userId: user._id.toString(), email: user.email };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    return {
      user: {
        id: user._id.toString(),
        fullName: user.fullName,
        email: user.email,
        avatar: user.avatar,
      },
      accessToken,
      refreshToken,
    };
  }

  public static async refreshToken(token: string): Promise<AuthResult> {
    try {
      const payload = verifyRefreshToken(token);
      const user = await User.findById(payload.userId);
      if (!user) {
        throw new AppError("User account no longer exists.", 401);
      }

      await ensureDemoWorkspace(user._id);

      const tokenPayload = { userId: user._id.toString(), email: user.email };
      const newAccessToken = generateAccessToken(tokenPayload);
      const newRefreshToken = generateRefreshToken(tokenPayload);

      return {
        user: {
          id: user._id.toString(),
          fullName: user.fullName,
          email: user.email,
          avatar: user.avatar,
        },
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new AppError("Invalid or expired refresh token. Please sign in again.", 401);
    }
  }

  public static async getMe(userId: string): Promise<{ id: string; fullName: string; email: string; avatar?: string }> {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError("User not found.", 404);
    }

    return {
      id: user._id.toString(),
      fullName: user.fullName,
      email: user.email,
      avatar: user.avatar,
    };
  }
}
