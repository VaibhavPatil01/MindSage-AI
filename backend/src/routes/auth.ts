import { Router } from "express";
import { register, login, logout } from "../controllers/authController";
import { auth } from "../middleware/auth";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", auth, logout);
router.get("/me", auth, (req, res) => {
  res.json({ user: req.user });
});

export default router;