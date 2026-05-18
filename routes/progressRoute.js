import express from "express";
import mongoose from "mongoose";

import DailyProgress from "../models/DailyProgress.js";

import { calculateStreaks }
  from "../utils/streakUtils.js";

import { getDateKey }
  from "../utils/dateKey.js";

import { requireAuth }
  from "../middleware/authMiddleware.js";

const router = express.Router();

/* ---------------------------------------------------------
   GET /progress/today
--------------------------------------------------------- */
router.get(
  "/today",
  requireAuth,
  async (req, res) => {
    try {
      const userId = req.userId;

      const date = getDateKey();

      const progress =
          await DailyProgress.findOne({
        userId,
        date,
      });

      res.json(
        progress || {
          date,
          completedTaskIds: [],
          completed: 0,
          total: 0,
        }
      );
    } catch (err) {
      console.error(
        "Fetch today progress error:",
        err
      );

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);

/* ---------------------------------------------------------
   POST /progress/today
--------------------------------------------------------- */
router.post(
  "/today",
  requireAuth,
  async (req, res) => {
    try {
      const userId = req.userId;

      const {
        date,
        completedTaskIds = [],
        total,
      } = req.body;

      if (
        !date ||
        !Array.isArray(completedTaskIds)
      ) {
        return res.status(400).json({
          message: "Invalid payload",
        });
      }

      // ✅ TODAY ONLY
      const today = getDateKey();

      if (date !== today) {
        return res.status(403).json({
          message:
              "Only today's progress can be modified",
        });
      }

      const progress =
          await DailyProgress.findOneAndUpdate(
        { userId, date },

        {
          completedTaskIds,
          completed:
              completedTaskIds.length,
          total,
        },

        {
          upsert: true,
          new: true,
        }
      );

      res.json(progress);
    } catch (err) {
      console.error(
        "Save today progress error:",
        err
      );

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);

/* ---------------------------------------------------------
   POST /progress
--------------------------------------------------------- */
router.post(
  "/",
  requireAuth,
  async (req, res) => {
    try {
      const userId = req.userId;

      const {
        date,
        completed,
        total,
        completedTaskIds = [],
      } = req.body;

      if (
        !date ||
        completed == null ||
        total == null
      ) {
        return res.status(400).json({
          message:
              "Missing required fields",
        });
      }

      const progress =
          await DailyProgress.findOneAndUpdate(
        { userId, date },

        {
          completed,
          total,
          completedTaskIds,
        },

        {
          upsert: true,
          new: true,
        }
      );

      res.json(progress);
    } catch (err) {
      console.error(
        "Save progress error:",
        err
      );

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);

/* ---------------------------------------------------------
   GET /progress/month
--------------------------------------------------------- */
router.get(
  "/month",
  requireAuth,
  async (req, res) => {
    try {
      const userId = req.userId;

      const { year, month } =
          req.query;

      if (!year || !month) {
        return res.status(400).json({
          message:
              "Year and month required",
        });
      }

      const monthStr = month
          .toString()
          .padStart(2, "0");

      const startDate =
          `${year}-${monthStr}-01`;

      const endDate =
          `${year}-${monthStr}-31`;

      const records =
          await DailyProgress.find({
        userId,

        date: {
          $gte: startDate,
          $lte: endDate,
        },
      });

      const result = {};

      records.forEach((r) => {
        result[r.date] = {
          completed: r.completed,
          total: r.total,

          completedTaskIds:
              r.completedTaskIds || [],
        };
      });

      res.json(result);
    } catch (err) {
      console.error(
        "Fetch month progress error:",
        err
      );

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);

/* ---------------------------------------------------------
   GET /progress/streaks
--------------------------------------------------------- */
router.get(
  "/streaks",
  requireAuth,
  async (req, res) => {
    try {
      const userId = req.userId;

      const progress =
          await DailyProgress.find(
        { userId },

        {
          date: 1,
          completed: 1,
          total: 1,
        }
      );

      const {
        streak,
        bestStreak,
      } = calculateStreaks(progress);

      res.json({
        streak,
        bestStreak,
      });
    } catch (err) {
      console.error(
        "Streak fetch error:",
        err
      );

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);

export default router;