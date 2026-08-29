import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import { AdminUserRepo } from "../repositories/adminUsers.repo.js";
import { ok, fail } from "../utils/response.js";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many login attempts. Try again later.", errors: [] },
});

router.post("/login", loginLimiter, async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return fail(res, "Username and password are required", 422);

    const admin = AdminUserRepo.findByLogin(username);
    if (!admin) return fail(res, "Invalid credentials", 401);

    const validPassword = await bcrypt.compare(password, admin.passwordHash);
    if (!validPassword) return fail(res, "Invalid credentials", 401);

    AdminUserRepo.updateLastLogin(admin.id);

    const token = jwt.sign(
      { sub: admin.id, username: admin.username },
      process.env.ADMIN_JWT_SECRET,
      { expiresIn: process.env.ADMIN_JWT_EXPIRES_IN || "8h" }
    );

    ok(res, {
      token,
      admin: { id: admin.id, username: admin.username, email: admin.email, fullName: admin.fullName },
    }, "Login successful");
  } catch (e) {
    next(e);
  }
});

router.post("/logout", requireAdmin, (req, res) => {
  ok(res, null, "Logged out");
});

router.get("/me", requireAdmin, (req, res, next) => {
  try {
    const admin = AdminUserRepo.findById(req.admin.sub);
    if (!admin) return fail(res, "Not found", 404);
    ok(res, { id: admin.id, username: admin.username, email: admin.email, fullName: admin.fullName });
  } catch (e) {
    next(e);
  }
});

export default router;
