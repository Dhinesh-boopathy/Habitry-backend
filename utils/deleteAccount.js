import DailyProgress from "../models/DailyProgress.js";
import RoutineTemplate from "../models/RoutineTemplate.js";
import User from "../models/User.js";

export async function deleteAccount(req, res) {
  try {
    const userId = req.userId;

    const deletedUser = await User.findByIdAndDelete(userId);
    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    await Promise.all([
      DailyProgress.deleteMany({ userId }),
      RoutineTemplate.deleteMany({ userId }),
    ]);

    res.json({
      message: "Account and associated data deleted successfully",
    });
  } catch (err) {
    console.error("Delete account failed:", err);
    res.status(500).json({ message: "Server error" });
  }
}
