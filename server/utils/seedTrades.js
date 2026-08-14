import Trade from "../models/Trade.js";
import { TRADES } from "../config/constants.js";

export const seedInitialTrades = async () => {
  try {
    const count = await Trade.countDocuments();
    if (count === 0 && Array.isArray(TRADES) && TRADES.length > 0) {
      console.log("Seeding initial trades into database...");
      const tradesToInsert = TRADES.map((name) => ({
        name,
        nameLower: name.toLowerCase(),
        description: `Standard ${name} trade`,
        active: true,
      }));
      await Trade.insertMany(tradesToInsert);
      console.log(`Successfully seeded ${tradesToInsert.length} initial trades.`);
    }
  } catch (error) {
    console.error("Error seeding initial trades:", error.message);
  }
};
