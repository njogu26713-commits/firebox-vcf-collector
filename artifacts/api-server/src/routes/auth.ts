import { Router } from "express";
import bcrypt from "bcryptjs";
import { User } from "../lib/models";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function formatUser(user: any) {
  return {
    id: String(user._id),
    email: user.email,
    name: user.name ?? null,
  };
}

/** Regenerate session ID to prevent session fixation attacks. */
function regenerateSession(req: Express.Request): Promise<void> {
  return new Promise((resolve, reject) => {
    req.session.regenerate((err) => (err ? reject(err) : resolve()));
  });
}

// POST /auth/signup
router.post("/auth/signup", async (req, res) => {
  const { email, password, name } = req.body ?? {};

  if (typeof email !== "string" || !EMAIL_RE.test(email.trim())) {
    res.status(400).json({ error: "A valid email is required" });
    return;
  }
  if (typeof password !== "string" || password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters" });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();

  let user;
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    user = await User.create({
      email: normalizedEmail,
      passwordHash,
      name: typeof name === "string" && name.trim() ? name.trim() : null,
    });
  } catch (err: any) {
    // MongoDB duplicate-key error — email already registered.
    if (err.code === 11000) {
      res.status(409).json({ error: "An account with this email already exists" });
      return;
    }
    throw err;
  }

  // Regenerate session ID before setting userId (prevents session fixation).
  await regenerateSession(req);
  req.session.userId = String(user._id);
  res.status(201).json(formatUser(user));
});

// POST /auth/login
router.post("/auth/login", async (req, res) => {
  const { email, password } = req.body ?? {};

  if (typeof email !== "string" || typeof password !== "string") {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const user = await User.findOne({ email: email.trim().toLowerCase() });
  if (!user) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  // Regenerate session ID before setting userId (prevents session fixation).
  await regenerateSession(req);
  req.session.userId = String(user._id);
  res.json(formatUser(user));
});

// POST /auth/logout
router.post("/auth/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.status(204).end();
  });
});

// GET /auth/me
router.get("/auth/me", requireAuth, async (req, res) => {
  const user = await User.findById((req as any).userId);
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  res.json(formatUser(user));
});

// PATCH /auth/profile
router.patch("/auth/profile", requireAuth, async (req, res) => {
  const name = req.body?.name;
  if (name !== undefined && (typeof name !== "string" || name.trim().length > 100)) {
    res.status(400).json({ error: "Please enter a name with 100 characters or fewer" });
    return;
  }
  const user = await User.findByIdAndUpdate(
    (req as any).userId,
    { name: typeof name === "string" && name.trim() ? name.trim() : null },
    { new: true },
  );
  if (!user) {
    res.status(401).json({ error: "Your session has expired. Please sign in again." });
    return;
  }
  res.json(formatUser(user));
});

// POST /auth/password
router.post("/auth/password", requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body ?? {};
  if (typeof currentPassword !== "string" || typeof newPassword !== "string") {
    res.status(400).json({ error: "Please enter your current and new password" });
    return;
  }
  if (newPassword.length < 8) {
    res.status(400).json({ error: "Your new password must be at least 8 characters" });
    return;
  }
  if (currentPassword === newPassword) {
    res.status(400).json({ error: "Your new password must be different from your current password" });
    return;
  }
  const user = await User.findById((req as any).userId);
  if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
    res.status(401).json({ error: "Your current password is not correct" });
    return;
  }
  user.passwordHash = await bcrypt.hash(newPassword, 10);
  await user.save();
  res.status(204).end();
});

export default router;
