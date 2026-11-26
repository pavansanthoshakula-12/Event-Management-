import { Router } from "express";
import { register, login, getMe, updateMe } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import validate from "../middleware/validate.js";
import { registerRules, loginRules, updateProfileRules } from "../utils/validators.js";

const router = Router();

router.post("/register", registerRules, validate, register);
router.post("/login", loginRules, validate, login);
router.get("/me", protect, getMe);
router.put("/me", protect, updateProfileRules, validate, updateMe);

export default router;
