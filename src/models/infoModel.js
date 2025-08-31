import { pool } from "../config/db.js";

export async function getInfo() {
  const [phones] = await pool.query("SELECT * FROM phones");
  const [maps] = await pool.query("SELECT * FROM maps");
  const [infoRows] = await pool.query("SELECT * FROM info LIMIT 1");
  const info = infoRows[0]?.data ? JSON.parse(infoRows[0].data) : { socials: {}, description: "" };
  
  return {
    phones,
    maps,
    socials: info.socials || {},
    description: info.description || ""
  };
}

export async function upsertInfoData({ socials, description }) {
  const data = JSON.stringify({ socials, description });
  await pool.query(
    `INSERT INTO info (id, data) VALUES (1, ?) 
     ON DUPLICATE KEY UPDATE data = VALUES(data)`,
    [data]
  );
}

export async function getPhones() {
  const [rows] = await pool.query("SELECT * FROM phones");
  return rows;
}

export async function createPhone({ label, phone_number }) {
  const [result] = await pool.query(
    "INSERT INTO phones (label, phone_number) VALUES (?, ?)",
    [label, phone_number]
  );
  return result.insertId;
}

export async function updatePhone(id, { label, phone_number }) {
  await pool.query(
    "UPDATE phones SET label = ?, phone_number = ? WHERE id = ?",
    [label, phone_number, id]
  );
}

export async function deletePhone(id) {
  await pool.query("DELETE FROM phones WHERE id = ?", [id]);
}

export async function getMaps() {
  const [rows] = await pool.query("SELECT * FROM maps");
  return rows;
}

export async function createMap({ location, google, yandex }) {
  const [result] = await pool.query(
    "INSERT INTO maps (location, google, yandex) VALUES (?, ?, ?)",
    [location, google, yandex]
  );
  return result.insertId;
}

export async function updateMap(id, { location, google, yandex }) {
  await pool.query(
    "UPDATE maps SET location = ?, google = ?, yandex = ? WHERE id = ?",
    [location, google, yandex, id]
  );
}

export async function deleteMap(id) {
  await pool.query("DELETE FROM maps WHERE id = ?", [id]);
}