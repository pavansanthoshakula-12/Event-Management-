import { Router } from "express";
import {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  getDashboardStats,
} from "../controllers/eventController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";
import validate from "../middleware/validate.js";
import { eventRules, eventListRules, idParam } from "../utils/validators.js";

const router = Router();

router.use(protect); // every event route requires login

router.get("/stats", authorize("admin"), getDashboardStats); // must be before "/:id"
router.get("/", eventListRules, validate, getEvents);
router.get("/:id", idParam, validate, getEventById);

router.post("/", authorize("admin"), eventRules, validate, createEvent);
router.put("/:id", authorize("admin"), idParam, eventRules, validate, updateEvent);
router.delete("/:id", authorize("admin"), idParam, validate, deleteEvent);

export default router;
