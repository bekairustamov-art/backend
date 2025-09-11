import { getCurrency, upsertCurrency } from "../models/currencyModel.js";

export async function getRate(req, res) {
  try {
    const row = await getCurrency();
    res.json({ success: true, data: { rate: Number(row.rate) || 0, updated_at: row.updated_at } });
  } catch (e) {
    res.status(500).json({ success: false, message: "Failed to get currency", error: e.message });
  }
}

export async function setRate(req, res) {
  try {
    const { rate } = req.body || {};
    if (rate === undefined || rate === null || isNaN(Number(rate))) {
      return res.status(400).json({ success: false, message: "Invalid rate" });
    }
    const data = await upsertCurrency(rate);
    res.json({ success: true, message: "Currency updated", data });
  } catch (e) {
    res.status(500).json({ success: false, message: "Failed to update currency", error: e.message });
  }
}


