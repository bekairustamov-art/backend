import * as model from "../models/infoModel.js";

export async function getInfo(req, res) {
  try {
    const data = await model.getInfo();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch info" });
  }
}

export async function upsertData(req, res) {
  try {
    const { socials, description } = req.body;
    await model.upsertInfoData({ socials, description });
    res.json({ message: "Data updated successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to update data" });
  }
}

// Phone operations
export async function getPhones(_, res) {
  try {
    const phones = await model.getPhones();
    res.json(phones);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch phones" });
  }
}

export async function createPhone(req, res) {
  try {
    const id = await model.createPhone(req.body);
    res.status(201).json({ id, ...req.body });
  } catch (err) {
    res.status(500).json({ error: "Failed to create phone" });
  }
}

export async function updatePhone(req, res) {
  try {
    await model.updatePhone(req.params.id, req.body);
    res.json({ message: "Phone updated" });
  } catch (err) {
    res.status(500).json({ error: "Failed to update phone" });
  }
}

export async function deletePhone(req, res) {
  try {
    await model.deletePhone(req.params.id);
    res.json({ message: "Phone deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete phone" });
  }
}

// Map operations
export async function getMaps(_, res) {
  try {
    const maps = await model.getMaps();
    res.json(maps);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch maps" });
  }
}

export async function createMap(req, res) {
  try {
    const id = await model.createMap(req.body);
    res.status(201).json({ id, ...req.body });
  } catch (err) {
    res.status(500).json({ error: "Failed to create map" });
  }
}

export async function updateMap(req, res) {
  try {
    await model.updateMap(req.params.id, req.body);
    res.json({ message: "Map updated" });
  } catch (err) {
    res.status(500).json({ error: "Failed to update map" });
  }
}

export async function deleteMap(req, res) {
  try {
    await model.deleteMap(req.params.id);
    res.json({ message: "Map deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete map" });
  }
}