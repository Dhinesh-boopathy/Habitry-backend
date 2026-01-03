import { Router } from "express";
import mongoose from "mongoose";

import RoutineTemplate from "../models/RoutineTemplate.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();
console.log("✅ routineRoute loaded");

/**
 * ---------------------------------------------------------
 * GET SAVED TEMPLATES (PER USER)
 * ---------------------------------------------------------
 */
router.get("/templates", requireAuth, async (req, res) => {
  try {
    const templates = await RoutineTemplate.find({
      userId: req.userId,
    })
      .sort({ createdAt: -1 })
      .select("_id title tasks isActive createdAt");

    res.json(templates);
  } catch (err) {
    console.error("Fetch templates failed:", err);
    res.status(500).json({ message: "Failed to fetch templates" });
  }
});

/**
 * ---------------------------------------------------------
 * SEED SYSTEM DEFAULT (ONE TIME)
 * ---------------------------------------------------------
 */
router.post("/seed-default", async (req, res) => {
  try {
    const exists = await RoutineTemplate.findOne({
      userId: null,
      isActive: true,
    });

    if (exists) {
      return res.json({
        message: "System default routine already exists",
      });
    }

    const routine = await RoutineTemplate.create({
      userId: null,
      title: "System Default Routine",
      isActive: true,
      tasks: [
  { title: "Wake up on time", description: "Before 7:00 AM" },
  { title: "Plan the day", description: "Top 3 priorities" },
  { title: "Deep focus session", description: "30–60 mins distraction-free" },
  { title: "Learn something", description: "Skill, book, or course" },
  { title: "Move your body", description: "Walk, stretch, or workout" },
  { title: "Control spending", description: "No impulse buys" },
  { title: "Reflect & shutdown", description: "Review the day, plan tomorrow" }
],
    });

    res.status(201).json({
      message: "System default routine seeded",
      routine,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// 🌍 PUBLIC: Get system default routine (no auth)
router.get("/public/default", async (req, res) => {
  try {
    const routine = await RoutineTemplate.findOne({
      userId: null,
      isActive: true,
    });

    if (!routine) {
      return res.status(404).json({
        message: "Default routine not found",
      });
    }

    res.json(routine);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * ---------------------------------------------------------
 * GET ACTIVE ROUTINE
 * ---------------------------------------------------------
 */
router.get("/active", requireAuth, async (req, res) => {
  try {
    let routine = await RoutineTemplate.findOne({
      userId: req.userId,
      isActive: true,
    });

    if (!routine) {
      routine = await RoutineTemplate.findOne({
        userId: null,
        isActive: true,
      });
    }

    if (!routine) {
      return res.status(404).json({ message: "No routine found" });
    }

    res.json(routine);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * ---------------------------------------------------------
 * CREATE TEMPLATE (OPTIONAL ACTIVATE)
 * ---------------------------------------------------------
 */
router.post("/custom", requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const { tasks, setAsDefault = false } = req.body;

    if (!tasks || tasks.length === 0) {
      return res.status(400).json({ message: "Tasks are required" });
    }

    if (tasks.length > 15) {
      return res.status(400).json({
        message: "Maximum 15 tasks allowed",
      });
    }

    const count = await RoutineTemplate.countDocuments({ userId });
    if (count >= 3) {
      return res.status(409).json({
        message: "Template limit reached (max 3)",
      });
    }

    if (setAsDefault) {
      await RoutineTemplate.updateMany(
        { userId },
        { isActive: false }
      );
    }

    const routine = await RoutineTemplate.create({
      userId,
      title: "Custom Routine",
      tasks,
      isActive: setAsDefault,
    });

    res.status(201).json({
      message: setAsDefault
        ? "Template saved & activated"
        : "Template saved",
      routine,
    });
  } catch (err) {
    console.error("Create template failed:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * ---------------------------------------------------------
 * UPDATE TEMPLATE (EDIT TASKS)
 * ---------------------------------------------------------
 */
router.put("/template/:id", requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const templateId = req.params.id;
    const { tasks, setAsDefault = false } = req.body;

    if (!mongoose.Types.ObjectId.isValid(templateId)) {
      return res.status(400).json({ message: "Invalid template ID" });
    }

    if (!tasks || tasks.length === 0) {
      return res.status(400).json({ message: "Tasks required" });
    }

    if (tasks.length > 15) {
      return res.status(400).json({
        message: "Maximum 15 tasks allowed",
      });
    }

    const template = await RoutineTemplate.findOne({
      _id: templateId,
      userId,
    });

    if (!template) {
      return res.status(404).json({
        message: "Template not found",
      });
    }

    if (setAsDefault) {
      await RoutineTemplate.updateMany(
        { userId },
        { isActive: false }
      );
      template.isActive = true;
    }

    template.tasks = tasks;
    await template.save();

    res.json({
      message: setAsDefault
        ? "Template updated & activated"
        : "Template updated",
      template,
    });
  } catch (err) {
    console.error("Update template failed:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * ---------------------------------------------------------
 * ACTIVATE TEMPLATE
 * ---------------------------------------------------------
 */
router.post("/activate/:id", requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const templateId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(templateId)) {
      return res.status(400).json({ message: "Invalid template ID" });
    }

    const template = await RoutineTemplate.findOne({
      _id: templateId,
      userId,
    });

    if (!template) {
      return res.status(404).json({
        message: "Template not found",
      });
    }

    await RoutineTemplate.updateMany(
      { userId },
      { isActive: false }
    );

    template.isActive = true;
    await template.save();

    res.json({ message: "Template activated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * ---------------------------------------------------------
 * DELETE TEMPLATE
 * ---------------------------------------------------------
 */
router.delete("/template/:id", requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const templateId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(templateId)) {
      return res.status(400).json({ message: "Invalid template ID" });
    }

    const template = await RoutineTemplate.findOne({
      _id: templateId,
      userId,
    });

    if (!template) {
      return res.status(404).json({
        message: "Template not found",
      });
    }

    const wasActive = template.isActive;
    await template.deleteOne();

    if (wasActive) {
      const another = await RoutineTemplate.findOne({
        userId,
      }).sort({ createdAt: -1 });

      if (another) {
        another.isActive = true;
        await another.save();
      }
    }

    res.json({ message: "Template deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
