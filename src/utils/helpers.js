// Add this function to generate unique sale numbers
exports.generateSaleNumber = async (teamId) => {
  const Sale = require("../models/Sale");

  const today = new Date();
  const year = today.getFullYear().toString().slice(-2);
  const month = (today.getMonth() + 1).toString().padStart(2, "0");
  const day = today.getDate().toString().padStart(2, "0");

  // Get count of sales for today
  const startOfDay = new Date(today.setHours(0, 0, 0, 0));
  const endOfDay = new Date(today.setHours(23, 59, 59, 999));

  const salesCount = await Sale.countDocuments({
    teamId,
    createdAt: {
      $gte: startOfDay,
      $lte: endOfDay,
    },
  });

  // Generate sale number: YYMMDD-TEAM-COUNT
  const teamPrefix = teamId.toString().slice(-4);
  const count = (salesCount + 1).toString().padStart(4, "0");

  return `${year}${month}${day}-${teamPrefix}-${count}`;
};
