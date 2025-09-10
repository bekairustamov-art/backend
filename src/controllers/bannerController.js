import { getPool } from "../config/db.js";
import {
  listBannersOrdered,
  getMaxPriority,
  addOffsetAtOrAbove,
  insertBanner,
  normalizeAfterInsert,
  findById,
  setPriorityZero,
  shiftUpBetween,
  shiftDownBetween,
  updateFields,
  deleteById,
  shiftAfterDelete,
} from "../models/bannerModel.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { sendPushToTopic } from "../services/pushService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOAD_DIR = path.resolve(__dirname, "../../public/uploads/banners");
// Large offset used to avoid UNIQUE index collisions during in-place reordering
const PRIORITY_OFFSET = 1000000;

async function ensureUploadsDir() {
  await fs.promises.mkdir(UPLOAD_DIR, { recursive: true });
}

export async function listBanners(_req, res) {
  const pool = await getPool();
  const conn = await pool.getConnection();
  try {
    await ensureUploadsDir();
    const rows = await listBannersOrdered(conn);
    res.json({ items: rows });
  } catch (err) {
    console.error("listBanners error:", err);
    res.status(500).json({ message: "Failed to load banners", error: err.message });
  } finally {
    conn.release();
  }
}

export async function createBanner(req, res) {
  const pool = await getPool();
  const conn = await pool.getConnection();
  try {
    await ensureUploadsDir();
    const { priority } = req.body || {};
    if (!req.file) return res.status(400).json({ message: "image file is required" });

    const filename = req.file.filename;
    const publicPath = `/public/uploads/banners/${filename}`;

    await conn.beginTransaction();

    let desired = priority !== undefined && priority !== null && priority !== "" ? Number(priority) : null;
    if (!Number.isInteger(desired) || desired <= 0) {
      // Suggest next priority
      const maxp = await getMaxPriority(conn);
      desired = (maxp || 0) + 1;
    } else {
      // Shift priorities down to make room using a large offset to prevent
      // transient UNIQUE collisions.
      await addOffsetAtOrAbove(conn, desired, PRIORITY_OFFSET);
    }

    const insertId = await insertBanner(conn, publicPath, desired);

    // Normalize shifted priorities back (-offset + 1 results in +1 net)
    if (Number.isInteger(desired) && desired > 0) {
      await normalizeAfterInsert(conn, desired, PRIORITY_OFFSET);
    }

    await conn.commit();

    // Notify users about new banner
    try {
      const base = process.env.PUBLIC_BASE_URL
        || (req.headers["x-forwarded-proto"]
          ? `${req.headers["x-forwarded-proto"]}://${req.headers["x-forwarded-host"] || req.get('host')}`
          : `${req.protocol}://${req.get('host')}`);
      const fullImage = `${base}${publicPath}`;
      await sendPushToTopic({
        title: "Hilook electronics",
        body: "Yangiliklardan xabardor bo’ling",
        data: { type: "banner_created", bannerId: String(insertId) },
        image: fullImage,
        topic: "all",
      });
    } catch {}

    res.status(201).json({ message: "Banner created", item: { id: insertId, banner_image: publicPath, priority: desired } });
  } catch (err) {
    await conn.rollback().catch(() => {});
    console.error("createBanner error:", err);
    res.status(500).json({ message: "Failed to create banner", error: err.message });
  } finally {
    conn.release();
  }
}

export async function updateBanner(req, res) {
  const pool = await getPool();
  const conn = await pool.getConnection();
  try {
    await ensureUploadsDir();
    const { id } = req.params || {};
    const { priority } = req.body || {};
    const bannerId = Number(id);
    if (!Number.isInteger(bannerId)) return res.status(400).json({ message: "id must be an integer" });

    const existing = await findById(conn, bannerId);
    if (!existing) return res.status(404).json({ message: "Banner not found" });

    let current = existing;
    let newImagePath = current.banner_image;
    let changed = false;

    await conn.beginTransaction();

    if (req.file) {
      const filename = req.file.filename;
      try {
        if (newImagePath?.startsWith("/public/uploads/banners/")) {
          const oldName = path.basename(newImagePath);
          const oldFsPath = path.join(UPLOAD_DIR, oldName);
          await fs.promises.unlink(oldFsPath).catch(() => {});
        }
      } catch {}
      newImagePath = `/public/uploads/banners/${filename}`;
      changed = true;
    }

    const updates = {};

    if (priority !== undefined && priority !== null && priority !== "") {
      const newPri = Number(priority);
      if (!Number.isInteger(newPri) || newPri <= 0) {
        return res.status(400).json({ message: "priority must be a positive integer" });
      }

      if (newPri !== current.priority) {
        await setPriorityZero(conn, bannerId);

        if (newPri < current.priority) {
          await shiftUpBetween(conn, newPri, current.priority);
        } else {
          await shiftDownBetween(conn, newPri, current.priority);
        }
        current.priority = newPri;
        changed = true;
      }
    }

    if (newImagePath !== existing.banner_image) {
      updates.banner_image = newImagePath;
    }

    if (!changed) {
      await conn.rollback();
      return res.status(200).json({ message: "No changes" });
    }

    if (Number.isInteger(current.priority)) {
      updates.priority = current.priority;
    }

    await updateFields(conn, bannerId, updates);

    await conn.commit();

    res.json({ message: "Banner updated" });
  } catch (err) {
    await conn.rollback().catch(() => {});
    console.error("updateBanner error:", err);
    res.status(500).json({ message: "Failed to update banner", error: err.message });
  } finally {
    conn.release();
  }
}

export async function deleteBanner(req, res) {
  const pool = await getPool();
  const conn = await pool.getConnection();
  try {
    await ensureUploadsDir();
    const { id } = req.params || {};
    const bannerId = Number(id);
    if (!Number.isInteger(bannerId)) return res.status(400).json({ message: "id must be an integer" });

    const row = await findById(conn, bannerId);
    if (!row) return res.status(404).json({ message: "Banner not found" });

    const imagePath = row.banner_image;
    const pri = row.priority;

    await conn.beginTransaction();

    const affected = await deleteById(conn, bannerId);
    if (affected === 0) {
      await conn.rollback();
      return res.status(404).json({ message: "Banner not found" });
    }

    await shiftAfterDelete(conn, pri);

    await conn.commit();

    try {
      if (imagePath?.startsWith("/public/uploads/banners/")) {
        const name = path.basename(imagePath);
        const fsPath = path.join(UPLOAD_DIR, name);
        await fs.promises.unlink(fsPath).catch(() => {});
      }
    } catch {}

    res.json({ message: "Banner deleted" });
  } catch (err) {
    await conn.rollback().catch(() => {});
    console.error("deleteBanner error:", err);
    res.status(500).json({ message: "Failed to delete banner", error: err.message });
  } finally {
    conn.release();
  }
}

export async function suggestNextPriority(_req, res) {
  const pool = await getPool();
  const conn = await pool.getConnection();
  try {
    await ensureUploadsDir();
    const maxp = await getMaxPriority(conn);
    const next = (maxp || 0) + 1;
    res.json({ next });
  } catch (err) {
    console.error("suggestNextPriority error:", err);
    res.status(500).json({ message: "Failed to suggest priority", error: err.message });
  } finally {
    conn.release();
  }
}
