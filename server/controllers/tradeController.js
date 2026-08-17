import Trade from "../models/Trade.js";

// @desc    Get all active trades
// @route   GET /api/trades
// @access  Protected
export const getTrades = async (req, res, next) => {
  try {
    const query = req.query.includeInactive === "true" ? {} : { active: true };
    const list = await Trade.find(query).sort({ name: 1 });
    res.status(200).json(list);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new trade
// @route   POST /api/trades
// @access  Protected (Level 1 Admin)
export const createTrade = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Trade name is required." });
    }

    const nameTrimmed = name.trim();
    const existing = await Trade.findOne({
      nameLower: nameTrimmed.toLowerCase(),
    });

    if (existing) {
      if (!existing.active) {
        // Reactivate if it was previously deactivated
        existing.active = true;
        if (description !== undefined) existing.description = description.trim();
        await existing.save();
        return res.status(200).json(existing);
      }
      return res
        .status(400)
        .json({ message: `Trade "${nameTrimmed}" already exists.` });
    }

    const trade = await Trade.create({
      name: nameTrimmed,
      description: description ? description.trim() : "",
    });

    res.status(201).json(trade);
  } catch (error) {
    next(error);
  }
};

// @desc    Update an existing trade
// @route   PUT /api/trades/:id
// @access  Protected (Level 1 Admin)
export const updateTrade = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Trade name is required." });
    }

    const nameTrimmed = name.trim();
    const trade = await Trade.findById(req.params.id);
    if (!trade) {
      return res.status(404).json({ message: "Trade not found." });
    }

    // Check if another trade with this name exists
    const duplicate = await Trade.findOne({
      _id: { $ne: trade._id },
      nameLower: nameTrimmed.toLowerCase(),
    });

    if (duplicate) {
      return res
        .status(400)
        .json({ message: `Trade "${nameTrimmed}" already exists.` });
    }

    trade.name = nameTrimmed;
    trade.nameLower = nameTrimmed.toLowerCase();
    if (description !== undefined) trade.description = description.trim();
    await trade.save();

    res.status(200).json(trade);
  } catch (error) {
    next(error);
  }
};

// @desc    Deactivate a trade
// @route   PATCH /api/trades/:id/deactivate
// @access  Protected (Level 1 Admin)
export const deactivateTrade = async (req, res, next) => {
  try {
    const trade = await Trade.findByIdAndUpdate(
      req.params.id,
      { active: false },
      { new: true },
    );
    if (!trade) {
      return res.status(404).json({ message: "Trade not found." });
    }
    res.status(200).json(trade);
  } catch (error) {
    next(error);
  }
};
