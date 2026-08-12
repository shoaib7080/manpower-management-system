import Specialization from "../models/Specialization.js";

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
    const { name, trades } = req.body;
    if (!name?.trim() || !Array.isArray(trades) || !trades.length)
      return res
        .status(400)
        .json({ message: "name and at least one trade are required." });
    const existing = await Specialization.findOne({
      nameLower: name.trim().toLowerCase(),
    });

    if (existing)
      return res
        .status(400)
        .json({ message: `Specialization "${name}" already exists.` });
    const spec = await Specialization.create({ name: name.trim(), trades });
    res.status(201).json(spec);
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
