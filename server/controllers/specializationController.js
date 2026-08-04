import Specialization from "../models/Specialization.js";

export const getSpecializations = async (req, res) => {
  try {
    const query = { active: true };
    if (req.query.trade) query.trade = req.query.trade;
    const list = await Specialization.find(query).sort({ name: 1 });
    res.status(200).json(list);
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Failed to fetch specializations",
        error: error.message,
      });
  }
};

export const createSpecialization = async (req, res) => {
  try {
    const { name, trade } = req.body;
    if (!name?.trim() || !trade)
      return res.status(400).json({ message: "name and trade are required." });
    const existing = await Specialization.findOne({
      nameLower: name.trim().toLowerCase(),
    });
    if (existing)
      return res
        .status(400)
        .json({ message: `Specialization "${name}" already exists.` });
    const spec = await Specialization.create({ name: name.trim(), trade });
    res.status(201).json(spec);
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Failed to create specialization",
        error: error.message,
      });
  }
};

export const deactivateSpecialization = async (req, res) => {
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
    res
      .status(500)
      .json({
        message: "Failed to deactivate specialization",
        error: error.message,
      });
  }
};
