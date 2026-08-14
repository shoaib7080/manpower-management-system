import Specialization from "../models/Specialization.js";
import Trade from "../models/Trade.js";

export const getSpecializations = async (req, res, next) => {
  try {
    const query = { active: true };
    if (req.query.trade) query.trades = req.query.trade;
    const list = await Specialization.find(query).sort({ name: 1 });
    res.status(200).json(list);
  } catch (error) {
    next(error);
  }
};

export const createSpecialization = async (req, res, next) => {
  try {
    const { name, trades, certifications } = req.body;
    if (!name?.trim() || !Array.isArray(trades) || !trades.length)
      return res
        .status(400)
        .json({ message: "name and at least one trade are required." });

    const activeTrades = await Trade.find({ active: true });
    const activeTradeNames = new Set(activeTrades.map((t) => t.name));
    const validTrades = trades
      .map((t) => String(t).trim())
      .filter((t) => activeTradeNames.has(t));

    if (validTrades.length === 0) {
      return res
        .status(400)
        .json({ message: "At least one valid active trade is required." });
    }
    const existing = await Specialization.findOne({
      nameLower: name.trim().toLowerCase(),
    });

    if (existing)
      return res
        .status(400)
        .json({ message: `Specialization "${name}" already exists.` });

    const certList = Array.isArray(certifications)
      ? certifications
          .map((c) => (typeof c === "string" ? c.trim() : c?.name?.trim()))
          .filter(Boolean)
      : [];

    const spec = await Specialization.create({
      name: name.trim(),
      trades,
      certifications: certList,
    });
    res.status(201).json(spec);
  } catch (error) {
    next(error);
  }
};

export const updateSpecialization = async (req, res, next) => {
  try {
    const { name, trades, certifications } = req.body;
    if (!name?.trim() || !Array.isArray(trades) || !trades.length)
      return res
        .status(400)
        .json({ message: "name and at least one trade are required." });

    const spec = await Specialization.findById(req.params.id);
    if (!spec)
      return res.status(404).json({ message: "Specialization not found." });

    const nameTrimmed = name.trim();
    const existing = await Specialization.findOne({
      _id: { $ne: spec._id },
      nameLower: nameTrimmed.toLowerCase(),
    });

    if (existing)
      return res
        .status(400)
        .json({ message: `Specialization "${nameTrimmed}" already exists.` });

    const activeTrades = await Trade.find({ active: true });
    const activeTradeNames = new Set(activeTrades.map((t) => t.name));
    const validTrades = trades
      .map((t) => String(t).trim())
      .filter((t) => activeTradeNames.has(t));

    if (validTrades.length === 0) {
      return res
        .status(400)
        .json({ message: "At least one valid active trade is required." });
    }

    const certList = Array.isArray(certifications)
      ? certifications
          .map((c) => (typeof c === "string" ? c.trim() : c?.name?.trim()))
          .filter(Boolean)
      : [];

    spec.name = nameTrimmed;
    spec.nameLower = nameTrimmed.toLowerCase();
    spec.trades = validTrades;
    spec.certifications = certList;
    await spec.save();

    res.status(200).json(spec);
  } catch (error) {
    next(error);
  }
};

export const deactivateSpecialization = async (req, res, next) => {
  try {
    const spec = await Specialization.findByIdAndUpdate(
      req.params.id,
      { active: false },
      { new: true },
    );
    if (!spec)
      return res.status(404).json({ message: "Specialization not found." });
    res.status(200).json(spec);
  } catch (error) {
    next(error);
  }
};
