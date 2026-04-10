const Inventory = require("../models/Inventory");
const Medicine = require("../models/Medicine");

// ─── @route   GET /api/vendor/inventory ─────────────────────────────────────
// @desc    Get all inventory items for the logged-in vendor
// @access  Vendor only
const getMyInventory = async (req, res) => {
  try {
    const { page = 1, limit = 20, inStock, search } = req.query;

    const query = { vendor: req.user._id };
    if (inStock !== undefined) query.inStock = inStock === "true";

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Inventory.countDocuments(query);

    let inventoryQuery = Inventory.find(query)
      .populate("medicine", "name genericName brand dosageForm therapeuticCategory packSize")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ lastUpdated: -1 });

    const inventory = await inventoryQuery;

    // If search is provided, filter by medicine name after populate
    let filtered = inventory;
    if (search) {
      const searchRegex = new RegExp(search, "i");
      filtered = inventory.filter(
        (item) =>
          item.medicine &&
          (searchRegex.test(item.medicine.name) ||
            searchRegex.test(item.medicine.genericName) ||
            searchRegex.test(item.medicine.brand))
      );
    }

    res.status(200).json({
      success: true,
      count: filtered.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      inventory: filtered,
    });
  } catch (error) {
    console.error("GetMyInventory error:", error);
    res.status(500).json({ success: false, message: "Could not fetch inventory." });
  }
};

// ─── @route   POST /api/vendor/inventory ────────────────────────────────────
// @desc    Add a medicine to vendor's inventory
// @access  Vendor only
const addToInventory = async (req, res) => {
  try {
    const { medicineId, price, mrp, discount, stock, expiryDate, batchNumber } = req.body;

    if (!medicineId || price === undefined) {
      return res.status(400).json({
        success: false,
        message: "medicineId and price are required.",
      });
    }

    // Verify medicine exists
    const medicine = await Medicine.findById(medicineId);
    if (!medicine || !medicine.isActive) {
      return res.status(404).json({ success: false, message: "Medicine not found in catalog." });
    }

    // Check if vendor already has this medicine in inventory
    const existing = await Inventory.findOne({
      vendor: req.user._id,
      medicine: medicineId,
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Medicine already in your inventory. Use PUT to update price/stock.",
      });
    }

    const inventoryItem = await Inventory.create({
      vendor: req.user._id,
      medicine: medicineId,
      price,
      mrp: mrp || null,
      discount: discount || 0,
      stock: stock || 0,
      inStock: stock > 0,
      expiryDate: expiryDate || null,
      batchNumber: batchNumber || null,
    });

    // Update average price on medicine
    await updateAveragePrice(medicineId);

    const populated = await inventoryItem.populate(
      "medicine",
      "name genericName brand dosageForm"
    );

    res.status(201).json({
      success: true,
      message: "Medicine added to inventory.",
      inventory: populated,
    });
  } catch (error) {
    console.error("AddToInventory error:", error);
    res.status(500).json({ success: false, message: "Could not add to inventory." });
  }
};

// ─── @route   PUT /api/vendor/inventory/:id ─────────────────────────────────
// @desc    Update inventory item (price, stock, expiry, etc.)
// @access  Vendor only
const updateInventory = async (req, res) => {
  try {
    const { price, mrp, discount, stock, inStock, expiryDate, batchNumber } = req.body;

    const inventoryItem = await Inventory.findOne({
      _id: req.params.id,
      vendor: req.user._id,
    });

    if (!inventoryItem) {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found or you don't own it.",
      });
    }

    if (price !== undefined) inventoryItem.price = price;
    if (mrp !== undefined) inventoryItem.mrp = mrp;
    if (discount !== undefined) inventoryItem.discount = discount;
    if (stock !== undefined) {
      inventoryItem.stock = stock;
      inventoryItem.inStock = stock > 0;
    }
    if (inStock !== undefined) inventoryItem.inStock = inStock;
    if (expiryDate !== undefined) inventoryItem.expiryDate = expiryDate;
    if (batchNumber !== undefined) inventoryItem.batchNumber = batchNumber;
    inventoryItem.lastUpdated = new Date();

    await inventoryItem.save();

    // Update average price on medicine
    await updateAveragePrice(inventoryItem.medicine);

    const populated = await inventoryItem.populate(
      "medicine",
      "name genericName brand dosageForm"
    );

    res.status(200).json({
      success: true,
      message: "Inventory updated.",
      inventory: populated,
    });
  } catch (error) {
    console.error("UpdateInventory error:", error);
    res.status(500).json({ success: false, message: "Could not update inventory." });
  }
};

// ─── @route   DELETE /api/vendor/inventory/:id ──────────────────────────────
// @desc    Remove a medicine from vendor's inventory
// @access  Vendor only
const removeFromInventory = async (req, res) => {
  try {
    const inventoryItem = await Inventory.findOneAndDelete({
      _id: req.params.id,
      vendor: req.user._id,
    });

    if (!inventoryItem) {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found or you don't own it.",
      });
    }

    // Update average price on medicine
    await updateAveragePrice(inventoryItem.medicine);

    res.status(200).json({
      success: true,
      message: "Medicine removed from inventory.",
    });
  } catch (error) {
    console.error("RemoveFromInventory error:", error);
    res.status(500).json({ success: false, message: "Could not remove from inventory." });
  }
};

// ─── Helper: update average price across all vendors ────────────────────────
async function updateAveragePrice(medicineId) {
  try {
    const result = await Inventory.aggregate([
      { $match: { medicine: medicineId, inStock: true } },
      { $group: { _id: null, avg: { $avg: "$price" } } },
    ]);

    const avgPrice = result[0]?.avg || 0;
    await Medicine.findByIdAndUpdate(medicineId, {
      averagePrice: Math.round(avgPrice * 100) / 100,
    });
  } catch (error) {
    console.error("UpdateAveragePrice error:", error);
  }
}

module.exports = { getMyInventory, addToInventory, updateInventory, removeFromInventory };
