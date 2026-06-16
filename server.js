import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import routineRoute from "./routes/routineRoute.js";
import progressRoutes from "./routes/progressRoute.js";
import authRoutes from "./routes/authRoute.js"; 
import { requireAuth } from "./middleware/authMiddleware.js";
import { deleteAccount } from "./utils/deleteAccount.js";


dotenv.config();

const app = express();
  
// middlewares
app.use(cors());
app.use(express.json());
app.get("/auth-test", (req, res) => {
  res.json({ message: "auth routes loaded" });
});
app.delete("/auth/account", requireAuth, deleteAccount);
app.use("/auth", authRoutes);

app.use("/routine", routineRoute);
app.use("/progress", progressRoutes);
// health route
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Backend server is running ✅",
    version: "delete-account-route-2026-06-16",
    routes: {
      deleteAccount: "DELETE /auth/account",
    },
  });
});

// connect DB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("🟢 MongoDB connected");
  })
  .catch((err) => {
    console.error("🔴 MongoDB connection failed:", err.message);
  });

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
