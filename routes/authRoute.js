import express from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { deleteAccount } from "../utils/deleteAccount.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "supersecret";
const RESET_TOKEN_TTL_MS = 15 * 60 * 1000;

async function sendResetEmail(email, resetUrl) {
  const { RESEND_API_KEY, EMAIL_FROM } = process.env;

  if (!RESEND_API_KEY || !EMAIL_FROM) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`Password reset link for ${email}: ${resetUrl}`);
      return;
    }
    throw new Error("Password reset email is not configured");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to: [email],
      subject: "Reset your Habitry password",
      html: `<p>We received a request to reset your Habitry password.</p><p><a href="${resetUrl}">Reset password</a></p><p>This link expires in 15 minutes. If you did not request it, you can safely ignore this email.</p>`,
    }),
  });

  if (!response.ok) {
    throw new Error(`Unable to send password reset email (${response.status})`);
  }
}

/* -------- REGISTER -------- */
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashed,
    });

    res.json({ message: "Registered successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* -------- LOGIN -------- */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { userId: user._id },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* -------- FORGOT PASSWORD -------- */
router.post("/forgot-password", async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const message = "If an account exists for that email, a reset link has been sent.";

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email }).select("+resetPasswordToken +resetPasswordExpires");
    if (!user) {
      return res.json({ message });
    }

    const token = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = crypto.createHash("sha256").update(token).digest("hex");
    user.resetPasswordExpires = new Date(Date.now() + RESET_TOKEN_TTL_MS);
    await user.save();

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const resetUrl = `${frontendUrl.replace(/\/$/, "")}/reset-password?token=${token}`;

    try {
      await sendResetEmail(user.email, resetUrl);
    } catch (emailError) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
      throw emailError;
    }

    const response = { message };
    if (process.env.NODE_ENV !== "production" && !process.env.RESEND_API_KEY) {
      response.resetUrl = resetUrl;
    }
    res.json(response);
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ message: "Unable to start password reset. Please try again." });
  }
});

/* -------- RESET PASSWORD -------- */
router.post("/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ message: "Reset token and new password are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      resetPasswordToken: tokenHash,
      resetPasswordExpires: { $gt: new Date() },
    }).select("+resetPasswordToken +resetPasswordExpires");

    if (!user) {
      return res.status(400).json({ message: "This reset link is invalid or has expired" });
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: "Password reset successfully. You can now log in." });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ message: "Unable to reset password. Please try again." });
  }
});

/* -------- DELETE ACCOUNT -------- */
router.delete("/account", requireAuth, deleteAccount);
 
export default router;
