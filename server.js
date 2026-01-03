import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import routineRoute from "./routes/routineRoute.js";
import progressRoutes from "./routes/progressRoute.js";
import authRoutes from "./routes/authRoute.js"; 


dotenv.config();

const app = express();
  
// middlewares
app.use(cors());
app.use(express.json());
  
app.use("/auth", authRoutes);

app.use("/routine", routineRoute);
app.use("/progress", progressRoutes);
// health route
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Backend server is running ✅",
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
