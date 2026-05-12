import { Router } from "express";
import { SIMULATION_LIBRARY } from "../data/simulationLibrary";

const router = Router();

// GET /api/simulations/library
// Returns full library (all subjects, all chapters, with sim count)
router.get("/library", (_req, res) => {
  const summary = SIMULATION_LIBRARY.map((subject) => ({
    subject: subject.subject,
    label: subject.label,
    labelHindi: subject.labelHindi,
    classNum: subject.classNum,
    totalSimulations: subject.chapters.reduce((acc, ch) => acc + ch.simulations.length, 0),
    chapters: subject.chapters.map((ch) => ({
      id: ch.id,
      number: ch.number,
      title: ch.title,
      titleHindi: ch.titleHindi,
      simulationCount: ch.simulations.length,
    })),
  }));
  res.json({ library: summary });
});

// GET /api/simulations/library/:subject
// Returns all chapters + simulations for a subject
router.get("/library/:subject", (req, res) => {
  const { subject } = req.params;
  const found = SIMULATION_LIBRARY.find((s) => s.subject === subject.toLowerCase());
  if (!found) {
    return res.status(404).json({ error: `Subject '${subject}' not found` });
  }
  res.json({ subject: found });
});

// GET /api/simulations/library/:subject/:chapterId
// Returns simulations for a specific chapter
router.get("/library/:subject/:chapterId", (req, res) => {
  const { subject, chapterId } = req.params;
  const found = SIMULATION_LIBRARY.find((s) => s.subject === subject.toLowerCase());
  if (!found) {
    return res.status(404).json({ error: `Subject '${subject}' not found` });
  }
  const chapter = found.chapters.find((ch) => ch.id === chapterId);
  if (!chapter) {
    return res.status(404).json({ error: `Chapter '${chapterId}' not found` });
  }
  res.json({ chapter });
});

export default router;
