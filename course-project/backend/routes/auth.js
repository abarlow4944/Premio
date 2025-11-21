const express = require("express");
const router = express.Router();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const resetRateLimiter = new Map();

// POST /auth/tokens: Authenticate a user and return a JWT token
router.post("/tokens", async (req, res) => {
	const { utorid, password } = req.body;

	if (!utorid || !password) {
		return res.status(400).json({ error: "Missing fields" });
	}
	if (typeof utorid !== "string" || typeof password !== "string") {
		return res.status(400).json({ error: "Incorrect type for fields" });
	}

	try {
		const user = await prisma.user.findUnique({ where: { utorid } });
		if (!user) {
			return res.status(404).json({ error: "UTORid not found" });
		}

		if (!user.password) {
			return res.status(401).json({ error: "Incorrect password" });
		}

		const match = await bcrypt.compare(password, user.password);
		if (!match) {
			return res.status(401).json({ error: "Invalid UTORid or password" });
		}

		// mark user as activated and update lastLogin
		try {
			await prisma.user.update({ where: { utorid }, data: { activated: true, lastLogin: new Date() } });
		} catch (e) {
			console.error('Failed to update lastLogin/activated for user', utorid, e);
		}

		const JWT_SECRET = process.env.JWT_SECRET;
		if (!JWT_SECRET) {
			console.error("JWT_SECRET not set in environment");
			return res.status(500).json({ error: "Server configuration error" });
		}

		const payload = { utorid: user.utorid, role: user.role };
		const expiresInSeconds = 60 * 60 * 24; // 1 day default expiry
		const token = jwt.sign(payload, JWT_SECRET, { algorithm: "HS256", expiresIn: expiresInSeconds });
		const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();

		// HTTP-only cookie
		res.cookie("auth_token", token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production", //true in production
			sameSite: "strict",
			maxAge: expiresInSeconds * 1000
		});

		// return only non-sensitive info to front end
		return res.status(200).json({ ok: true, role: user.role });
	} catch (err) {
		console.error("Error in /auth/tokens:", err);
		return res.status(500).json({ error: "Internal server error" });
	}
});

// for decoding the token from the cookie
router.get("/me", async (req, res) => {
  try {
    const token = req.cookies.auth_token;
    if (!token) return res.status(401).json({ error: "Not authenticated" });

    const payload = jwt.verify(token, process.env.JWT_SECRET);

    return res.status(200).json({
      utorid: payload.utorid,
      role: payload.role,
    });

  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
});

// for logging out
router.post("/logout", (req, res) => {
  res.clearCookie("auth_token", { // clear the cookie
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // true in production
    sameSite: "strict",
  });

  return res.status(200).json({ ok: true });
});


// POST /auth/resets: Request a password reset email
router.post("/resets", async (req, res) => {
	const { utorid } = req.body;

	if (!utorid || typeof utorid !== "string") {
		return res.status(400).json({ error: "Missing or invalid utorid" });
	}

	// rate limit: 60 seconds between requests
	const ip = req.ip || req.connection?.remoteAddress || "unknown";
	const key = (utorid && typeof utorid === 'string') ? `utorid:${utorid}` : `ip:${ip}`;
	const last = resetRateLimiter.get(key) || 0;
	const now = Date.now();
	if (now - last < 60 * 1000) {
		return res.status(429).json({ error: "Too Many Requests" });
	}
	resetRateLimiter.set(key, now);

	try {
		const user = await prisma.user.findUnique({ where: { utorid } });

		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		const token = uuidv4();
		const expiresAtDate = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

		const saved = await prisma.resetToken.upsert({
			where: { utorid },
			update: { token, expiresAt: expiresAtDate, used: false },
			create: { utorid, token, expiresAt: expiresAtDate, used: false },
		});

		return res.status(202).json({ expiresAt: saved.expiresAt.toISOString(), resetToken: saved.token });
	} catch (err) {
		console.error("Error in /auth/resets:", err);
		return res.status(500).json({ error: "Internal server error" });
	}
});

// POST /auth/resets/:resetToken: Reset the password of a user given a reset token.
router.post("/resets/:resetToken", async (req, res) => {
	const { resetToken } = req.params;
	const { utorid, password } = req.body;

	if (!resetToken || typeof resetToken !== "string") {
		return res.status(400).json({ error: "Missing or invalid reset token" });
	}
	if (!utorid || typeof utorid !== "string") {
		return res.status(400).json({ error: "Missing or invalid utorid" });
	}
	if (!password || typeof password !== "string") {
		return res.status(400).json({ error: "Missing or invalid password" });
	}

	// password requirement: 8-20 chars, at least one uppercase, one lowercase, one number, one special character
	const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,20}$/;
	if (!pwdRegex.test(password)) {
		return res.status(400).json({ error: "Password does not meet complexity requirements" });
	}

	try {
		const tokenRow = await prisma.resetToken.findUnique({ where: { token: resetToken } });
		if (!tokenRow) {
			return res.status(404).json({ message: "Reset token not found" });
		}

		if (tokenRow.used) {
			return res.status(410).json({ error: "Reset token already used" });
		}

		const expiresAtTime = new Date(tokenRow.expiresAt).getTime();
		if (!expiresAtTime || expiresAtTime <= Date.now()) {
			return res.status(410).json({ message: "Token expired" });
		}

		if (tokenRow.utorid !== utorid) {
			return res.status(401).json({ message: "Token does not match user" });
		}

		// hash new password and update user
		const cost = 10;
		const hashed = await bcrypt.hash(password, cost);

		await prisma.user.update({ where: { utorid }, data: { password: hashed } });

		// mark token as used
		await prisma.resetToken.update({ where: { token: resetToken }, data: { used: true } });

		return res.status(200).json({});
	} catch (err) {
		console.error("Error in /auth/resets/:resetToken:", err);
		return res.status(500).json({ error: "Internal server error" });
	}
});

router.all("/tokens", (req, res) => {
	return res.status(405).json({ error: "Method Not Allowed" });
});

router.all("/resets", (req, res) => {
	return res.status(405).json({ error: "Method Not Allowed" });
});

router.all("/resets/:resetToken", (req, res) => {
	return res.status(405).json({ error: "Method Not Allowed" });
});

module.exports = router;
