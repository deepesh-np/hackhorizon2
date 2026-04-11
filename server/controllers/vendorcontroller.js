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

// ─── @route   GET /api/vendor/stats ─────────────────────────────────────────
// @desc    Get dashboard aggregate stats
// @access  Vendor only
const getVendorStats = async (req, res) => {
  try {
    const Order = require("../models/Order");

    // 1. Total medicines listed
    const totalMedicines = await Inventory.countDocuments({ vendor: req.user._id });

    // 2. Medicines in stock & low stock
    const inventoryData = await Inventory.find({ vendor: req.user._id }, "stock inStock");
    const inStockCount = inventoryData.filter(i => i.inStock).length;
    const lowStockCount = inventoryData.filter(i => i.stock > 0 && i.stock <= 10).length + inventoryData.filter(i => !i.inStock).length;

    // 3. Orders today & Revenue today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todayOrders = await Order.find({
      vendor: req.user._id,
      createdAt: { $gte: startOfToday },
    });

    const totalOrdersToday = todayOrders.length;
    const revenueToday = todayOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);

    res.status(200).json({
      success: true,
      stats: {
        totalMedicines,
        inStockCount,
        lowStockCount,
        totalOrdersToday,
        revenueToday,
      },
    });
  } catch (error) {
    console.error("GetVendorStats error:", error);
    res.status(500).json({ success: false, message: "Could not fetch stats." });
  }
};

// ─── @route   GET /api/vendor/demand ────────────────────────────────────────
// @desc    Get nearby simulated demand heatmap
// @access  Vendor only
const getVendorDemand = async (req, res) => {
  try {
    // In a real app, this would aggregate recent global user searches near vendor's location.
    // For now, we return a simulated demand based on generic medicine popularity.
    const demandCategories = [
      { label: "Paracetamol", pct: 92, color: "#1B7B3A" },
      { label: "Amoxicillin", pct: 74, color: "#27AE60" },
      { label: "Metformin", pct: 68, color: "#52BE80" },
      { label: "Azithromycin", pct: 55, color: "#82E0AA" },
      { label: "Atorvastatin", pct: 41, color: "#ABEBC6" },
      { label: "Omeprazole", pct: 33, color: "#D5F5E3" },
      { label: "Cetirizine", pct: 24, color: "#EAFAF1" },
    ];

    res.status(200).json({
      success: true,
      demand: demandCategories,
      alert: "Paracetamol demand high — restock immediately"
    });
  } catch (error) {
    console.error("GetVendorDemand error:", error);
    res.status(500).json({ success: false, message: "Could not fetch demand." });
  }
};

// ─── @route   GET /api/vendor/price-insight ─────────────────────────────────
// @desc    Get price comparison insight for the vendor's top inventory item
// @access  Vendor only
const getPriceInsight = async (req, res) => {
  try {
    // Get vendorʼs first inventory item (or a specific one via query)
    const { medicineId } = req.query;

    let inventoryItem;
    if (medicineId) {
      inventoryItem = await Inventory.findOne({ vendor: req.user._id, medicine: medicineId }).populate("medicine", "name genericName averagePrice");
    } else {
      inventoryItem = await Inventory.findOne({ vendor: req.user._id, inStock: true }).populate("medicine", "name genericName averagePrice").sort({ lastUpdated: -1 });
    }

    if (!inventoryItem) {
      return res.status(200).json({
        success: true,
        insight: null,
        message: "No inventory items to compare.",
      });
    }

    // Get all vendor prices for this medicine
    const allPrices = await Inventory.find({ medicine: inventoryItem.medicine._id, inStock: true }, "price");
    const prices = allPrices.map(i => i.price);
    const areaAvg = prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0;
    const lowestPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const highestPrice = prices.length > 0 ? Math.max(...prices) : 0;

    const yourPrice = inventoryItem.price;
    const savingsPct = areaAvg > 0 ? Math.round(((areaAvg - yourPrice) / areaAvg) * 100) : 0;

    res.status(200).json({
      success: true,
      insight: {
        medicineName: `${inventoryItem.medicine.name}`,
        medicineGeneric: inventoryItem.medicine.genericName,
        yourPrice,
        areaAvg,
        lowestPrice,
        highestPrice,
        savingsPct,
        totalVendors: prices.length,
      },
    });
  } catch (error) {
    console.error("GetPriceInsight error:", error);
    res.status(500).json({ success: false, message: "Could not fetch price insight." });
  }
};

// Bulk add multiple inventory items at once from CSV/spreadsheet data
const bulkAddToInventory = async (req, res) => {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Request body must contain a non-empty 'items' array.",
      });
    }

    if (items.length > 200) {
      return res.status(400).json({
        success: false,
        message: "Maximum 200 items per bulk upload.",
      });
    }

    const results = [];
    let successCount = 0;
    let failCount = 0;
    let skipCount = 0;

    for (let i = 0; i < items.length; i++) {
      const row = items[i];
      const rowIndex = i + 1;

      try {
        const { medicineName, price, mrp, discount, stock, batchNumber, expiryDate } = row;

        if (!medicineName || price === undefined || price === null || price === '') {
          results.push({ row: rowIndex, status: 'failed', medicineName: medicineName || '(empty)', reason: 'Missing required fields: medicineName and price' });
          failCount++;
          continue;
        }

        const parsedPrice = parseFloat(price);
        if (isNaN(parsedPrice) || parsedPrice < 0) {
          results.push({ row: rowIndex, status: 'failed', medicineName, reason: 'Invalid price value' });
          failCount++;
          continue;
        }

        // Fuzzy match medicine by name (case-insensitive)
        const searchRegex = new RegExp(`^${medicineName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
        let medicine = await Medicine.findOne({ name: searchRegex, isActive: true });

        // If exact match fails, try partial match
        if (!medicine) {
          const partialRegex = new RegExp(medicineName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
          medicine = await Medicine.findOne({ name: partialRegex, isActive: true });
        }

        if (!medicine) {
          results.push({ row: rowIndex, status: 'failed', medicineName, reason: 'Medicine not found in catalog' });
          failCount++;
          continue;
        }

        // Check for existing inventory entry
        const existing = await Inventory.findOne({
          vendor: req.user._id,
          medicine: medicine._id,
        });

        if (existing) {
          results.push({ row: rowIndex, status: 'skipped', medicineName: medicine.name, reason: 'Already in your inventory (use edit to update)' });
          skipCount++;
          continue;
        }

        const parsedStock = parseInt(stock) || 0;
        const parsedMrp = mrp ? parseFloat(mrp) : null;
        const parsedDiscount = discount ? parseFloat(discount) : 0;

        await Inventory.create({
          vendor: req.user._id,
          medicine: medicine._id,
          price: parsedPrice,
          mrp: parsedMrp,
          discount: parsedDiscount,
          stock: parsedStock,
          inStock: parsedStock > 0,
          expiryDate: expiryDate ? new Date(expiryDate) : null,
          batchNumber: batchNumber || null,
        });

        await updateAveragePrice(medicine._id);
        results.push({ row: rowIndex, status: 'success', medicineName: medicine.name, reason: `Added at ₹${parsedPrice}` });
        successCount++;

      } catch (rowErr) {
        results.push({ row: rowIndex, status: 'failed', medicineName: row.medicineName || '(unknown)', reason: rowErr.message || 'Unexpected error' });
        failCount++;
      }
    }

    res.status(200).json({
      success: true,
      message: `Bulk upload complete: ${successCount} added, ${skipCount} skipped, ${failCount} failed.`,
      summary: { total: items.length, successCount, skipCount, failCount },
      results,
    });
  } catch (error) {
    console.error("BulkAddToInventory error:", error);
    res.status(500).json({ success: false, message: "Bulk upload failed." });
  }
};

module.exports = { getMyInventory, addToInventory, updateInventory, removeFromInventory, getVendorStats, getVendorDemand, getPriceInsight, bulkAddToInventory };
