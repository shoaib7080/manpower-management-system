import Staff from "../models/Staff.js";

export const getStaff = async (req, res, next) => {
  try {
    const list = await Staff.find({ active: true }).sort({ name: 1 });
    res.status(200).json(list);
  } catch (error) {
    next(error);
  }
};

export const createStaff = async (req, res, next) => {
  try {
    const { name, designation } = req.body;
    if (!name?.trim() || !designation?.trim())
      return res
        .status(400)
        .json({ message: "Name and designation are required." });

    const existing = await Staff.findOne({
      nameLower: name.trim().toLowerCase(),
    });
    if (existing)
      return res
        .status(400)
        .json({ message: `Staff member "${name}" already exists.` });

    const staff = await Staff.create({
      name: name.trim(),
      designation: designation.trim(),
    });
    res.status(201).json(staff);
  } catch (error) {
    next(error);
  }
};

export const updateStaff = async (req, res, next) => {
  try {
    const { name, designation } = req.body;
    if (!name?.trim() || !designation?.trim())
      return res
        .status(400)
        .json({ message: "Name and designation are required." });

    const staff = await Staff.findById(req.params.id);
    if (!staff)
      return res.status(404).json({ message: "Staff member not found." });

    const nameTrimmed = name.trim();
    const existing = await Staff.findOne({
      _id: { $ne: staff._id },
      nameLower: nameTrimmed.toLowerCase(),
    });
    if (existing)
      return res
        .status(400)
        .json({ message: `Staff member "${nameTrimmed}" already exists.` });

    staff.name = nameTrimmed;
    staff.nameLower = nameTrimmed.toLowerCase();
    staff.designation = designation.trim();
    await staff.save();

    res.status(200).json(staff);
  } catch (error) {
    next(error);
  }
};

export const deactivateStaff = async (req, res, next) => {
  try {
    const staff = await Staff.findByIdAndUpdate(
      req.params.id,
      { active: false },
      { new: true },
    );
    if (!staff)
      return res.status(404).json({ message: "Staff member not found." });
    res.status(200).json(staff);
  } catch (error) {
    next(error);
  }
};
