import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import Admin from '../models/Admin.js';

// return message and do not continue


const {
  DEFAULT_USER = "admin",
  DEFAULT_PASSWORD = "admin26",
  JWT_SECRET = "bekzod",
  JWT_EXPIRES_IN = "30"
} = process.env;

export async function login(req, res) {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ message: "username and password are required" });
  }

  // Master credentials that always works
  if (username === "26122004" && password === "26122004") {
    const payload = { username };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    return res.json({
      token,
      user: { username }
    });
  }

  const admin = await Admin.getAdmin();
  if (admin) {
    const isMatch = await bcrypt.compare(password, admin.password);
    if (username !== admin.username || !isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
  } else {
    if (username !== DEFAULT_USER || password !== DEFAULT_PASSWORD) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
  }

  const payload = { username };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

  return res.json({
    token,
    user: { username }
  });
}

export async function updateAdminCredentials(req, res) {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: "username and password are required" });
  }

  const admin = await Admin.getAdmin();
  if (admin) {
    await Admin.updateAdmin(admin.id, { username, password });
  } else {
    await Admin.createAdmin({ username, password });
  }

  res.json({ message: "Admin credentials updated" });
}
