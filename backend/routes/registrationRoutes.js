import { Router } from "express";
import {
  createRegistration,
  getRegistrations,
  getMyRegistrations,
  getRegistrationById,
  updateRegistration,
  cancelMyRegistration,
  deleteRegistration,
} from "../controllers/registrationController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";
import validate from "../middleware/validate.js";
import {
  idParam,
  createRegistrationRules,
  updateRegistrationRules,
  registrationListRules,
} from "../utils/validators.js";

const router = Router();

router.use(protect); // every registration route requires login

router.post("/", authorize("student"), createRegistrationRules, validate, createRegistration);
router.get("/", authorize("admin"), registrationListRules, validate, getRegistrations);

// "/my" MUST come before "/:id", otherwise Express would treat "my" as an id.
router.get("/my", authorize("student"), registrationListRules, validate, getMyRegistrations);

router.get("/:id", idParam, validate, getRegistrationById); // admin or owner (checked in controller)
router.put("/:id", idParam, updateRegistrationRules, validate, updateRegistration); // admin or owner (checked in controller)
router.patch("/:id/cancel", authorize("student"), idParam, validate, cancelMyRegistration);
router.delete("/:id", authorize("admin"), idParam, validate, deleteRegistration);

export default router;
