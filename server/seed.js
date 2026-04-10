const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();
const connectDB = require("./config/db");

const User = require("./models/User");
const Medicine = require("./models/Medicine");
const Inventory = require("./models/Inventory");

const seed = async () => {
  await connectDB();
  console.log("🌱 Seeding database...\n");

  // ═══════════════════════════════════════════════════════════════
  //  1. CREATE A VERIFIED VENDOR
  // ═══════════════════════════════════════════════════════════════
  let vendor = await User.findOne({ email: "vendor@vitality.com" });
  if (!vendor) {
    vendor = await User.create({
      name: "MedPlus Pharmacy",
      email: "vendor@vitality.com",
      password: "vendor123",
      role: "vendor",
      phone: "9876543210",
      isActive: true,
      vendorDetails: {
        pharmacyName: "MedPlus Pharmacy",
        licenseNumber: "PH-MUM-2024-001",
        address: {
          street: "123, MG Road",
          city: "Mumbai",
          state: "Maharashtra",
          pincode: "400001",
          coordinates: { lat: 19.076, lng: 72.8777 },
        },
        location: {
          type: "Point",
          coordinates: [72.8777, 19.076],
        },
        isVerified: true,
        approvedAt: new Date(),
      },
    });
    console.log("✅ Vendor created: vendor@vitality.com / vendor123");
  } else {
    console.log("ℹ️  Vendor already exists: vendor@vitality.com");
  }

  // ═══════════════════════════════════════════════════════════════
  //  2. CREATE AN ADMIN USER
  // ═══════════════════════════════════════════════════════════════
  let admin = await User.findOne({ email: "admin@vitality.com" });
  if (!admin) {
    admin = await User.create({
      name: "Admin User",
      email: "admin@vitality.com",
      password: "admin123",
      role: "admin",
      isActive: true,
    });
    console.log("✅ Admin created: admin@vitality.com / admin123");
  } else {
    console.log("ℹ️  Admin already exists: admin@vitality.com");
  }

  // ═══════════════════════════════════════════════════════════════
  //  3. SEED MEDICINES
  // ═══════════════════════════════════════════════════════════════
  const medicines = [
    {
      name: "Dolo 650",
      genericName: "Paracetamol",
      activeIngredients: [{ name: "Paracetamol", strength: "650mg" }],
      therapeuticCategory: "Antipyretic",
      dosageForm: "Tablet",
      description: "Used for relief of fever and mild to moderate pain such as headache, toothache, body ache, and cold.",
      sideEffects: ["Nausea", "Allergic skin reactions", "Liver damage (overdose)"],
      warnings: ["Do not exceed 4g per day", "Avoid alcohol while taking"],
      packSize: "15 tablets",
      manufacturer: "Micro Labs Ltd",
      brand: "Dolo",
      isBranded: true,
      averagePrice: 30,
      prescriptionRequired: false,
      regulatoryApproval: { approvedBy: "CDSCO", isApproved: true },
    },
    {
      name: "Crocin 500",
      genericName: "Paracetamol",
      activeIngredients: [{ name: "Paracetamol", strength: "500mg" }],
      therapeuticCategory: "Antipyretic",
      dosageForm: "Tablet",
      description: "Pain reliever and fever reducer. Commonly used for headaches, muscle aches, arthritis, and colds.",
      sideEffects: ["Nausea", "Rash"],
      warnings: ["Not for children under 6 without medical advice"],
      packSize: "15 tablets",
      manufacturer: "GlaxoSmithKline",
      brand: "Crocin",
      isBranded: true,
      averagePrice: 25,
      prescriptionRequired: false,
      regulatoryApproval: { approvedBy: "CDSCO", isApproved: true },
    },
    {
      name: "Azithromycin 500",
      genericName: "Azithromycin",
      activeIngredients: [{ name: "Azithromycin", strength: "500mg" }],
      therapeuticCategory: "Antibiotic",
      dosageForm: "Tablet",
      description: "Macrolide antibiotic used to treat bacterial infections including respiratory, skin, ear, and sexually transmitted infections.",
      sideEffects: ["Diarrhea", "Nausea", "Abdominal pain", "Vomiting"],
      warnings: ["Complete the full course", "May cause QT prolongation"],
      packSize: "3 tablets",
      manufacturer: "Cipla Ltd",
      brand: "Azee",
      isBranded: true,
      averagePrice: 85,
      prescriptionRequired: true,
      regulatoryApproval: { approvedBy: "CDSCO", isApproved: true },
    },
    {
      name: "Amoxicillin 500",
      genericName: "Amoxicillin",
      activeIngredients: [{ name: "Amoxicillin", strength: "500mg" }],
      therapeuticCategory: "Antibiotic",
      dosageForm: "Capsule",
      description: "Penicillin-type antibiotic used for ear infections, urinary tract infections, and H. pylori.",
      sideEffects: ["Diarrhea", "Allergic reactions", "Nausea"],
      warnings: ["Not for penicillin-allergic patients"],
      packSize: "10 capsules",
      manufacturer: "Ranbaxy",
      brand: "Mox",
      isBranded: true,
      averagePrice: 60,
      prescriptionRequired: true,
      regulatoryApproval: { approvedBy: "CDSCO", isApproved: true },
    },
    {
      name: "Cetirizine 10mg",
      genericName: "Cetirizine",
      activeIngredients: [{ name: "Cetirizine Hydrochloride", strength: "10mg" }],
      therapeuticCategory: "Antihistamine",
      dosageForm: "Tablet",
      description: "Antihistamine for allergies, hay fever, hives, and runny nose.",
      sideEffects: ["Drowsiness", "Dry mouth", "Fatigue"],
      warnings: ["May cause drowsiness, avoid driving"],
      packSize: "10 tablets",
      manufacturer: "Dr. Reddy's Labs",
      brand: "Cetzine",
      isBranded: true,
      averagePrice: 35,
      prescriptionRequired: false,
      regulatoryApproval: { approvedBy: "CDSCO", isApproved: true },
    },
    {
      name: "Metformin 500",
      genericName: "Metformin",
      activeIngredients: [{ name: "Metformin Hydrochloride", strength: "500mg" }],
      therapeuticCategory: "Antidiabetic",
      dosageForm: "Tablet",
      description: "First-line medication for type 2 diabetes. Helps control blood sugar levels.",
      sideEffects: ["Nausea", "Diarrhea", "Metallic taste", "Lactic acidosis (rare)"],
      warnings: ["Monitor kidney function regularly", "Do not use in severe kidney disease"],
      packSize: "20 tablets",
      manufacturer: "USV Pvt Ltd",
      brand: "Glycomet",
      isBranded: true,
      averagePrice: 22,
      prescriptionRequired: true,
      regulatoryApproval: { approvedBy: "CDSCO", isApproved: true },
    },
    {
      name: "Amlodipine 5mg",
      genericName: "Amlodipine",
      activeIngredients: [{ name: "Amlodipine Besylate", strength: "5mg" }],
      therapeuticCategory: "Antihypertensive",
      dosageForm: "Tablet",
      description: "Calcium channel blocker used to treat high blood pressure and chest pain (angina).",
      sideEffects: ["Swelling of ankles", "Dizziness", "Flushing", "Headache"],
      warnings: ["Do not stop abruptly", "Monitor blood pressure"],
      packSize: "10 tablets",
      manufacturer: "Pfizer",
      brand: "Amlong",
      isBranded: true,
      averagePrice: 40,
      prescriptionRequired: true,
      regulatoryApproval: { approvedBy: "CDSCO", isApproved: true },
    },
    {
      name: "Omeprazole 20mg",
      genericName: "Omeprazole",
      activeIngredients: [{ name: "Omeprazole", strength: "20mg" }],
      therapeuticCategory: "Gastrointestinal",
      dosageForm: "Capsule",
      description: "Proton pump inhibitor used for acid reflux, GERD, and stomach ulcers.",
      sideEffects: ["Headache", "Nausea", "Diarrhea", "Flatulence"],
      warnings: ["Long term use may reduce magnesium and B12 levels"],
      packSize: "10 capsules",
      manufacturer: "Sun Pharma",
      brand: "Omez",
      isBranded: true,
      averagePrice: 55,
      prescriptionRequired: false,
      regulatoryApproval: { approvedBy: "CDSCO", isApproved: true },
    },
    {
      name: "Paracetamol 500mg (Generic)",
      genericName: "Paracetamol",
      activeIngredients: [{ name: "Paracetamol", strength: "500mg" }],
      therapeuticCategory: "Antipyretic",
      dosageForm: "Tablet",
      description: "Generic paracetamol for fever and pain relief.",
      sideEffects: ["Nausea"],
      packSize: "10 tablets",
      manufacturer: "Cipla Ltd",
      brand: "Cipla",
      isBranded: false,
      averagePrice: 10,
      prescriptionRequired: false,
      regulatoryApproval: { approvedBy: "CDSCO", isApproved: true },
    },
    {
      name: "Montelukast 10mg",
      genericName: "Montelukast",
      activeIngredients: [{ name: "Montelukast Sodium", strength: "10mg" }],
      therapeuticCategory: "Respiratory",
      dosageForm: "Tablet",
      description: "Leukotriene receptor antagonist used for asthma and seasonal allergies.",
      sideEffects: ["Headache", "Abdominal pain", "Dizziness"],
      warnings: ["Monitor for mood/behavioral changes"],
      packSize: "10 tablets",
      manufacturer: "Sun Pharma",
      brand: "Montair",
      isBranded: true,
      averagePrice: 140,
      prescriptionRequired: true,
      regulatoryApproval: { approvedBy: "CDSCO", isApproved: true },
    },
    {
      name: "Ibuprofen 400mg",
      genericName: "Ibuprofen",
      activeIngredients: [{ name: "Ibuprofen", strength: "400mg" }],
      therapeuticCategory: "Analgesic",
      dosageForm: "Tablet",
      description: "NSAID used for pain, inflammation, and fever. Common for headaches, toothaches, and arthritis.",
      sideEffects: ["Stomach upset", "Heartburn", "Dizziness", "Rash"],
      warnings: ["Not for people with stomach ulcers", "May increase cardiovascular risk"],
      packSize: "10 tablets",
      manufacturer: "Abbott",
      brand: "Brufen",
      isBranded: true,
      averagePrice: 20,
      prescriptionRequired: false,
      regulatoryApproval: { approvedBy: "CDSCO", isApproved: true },
    },
    {
      name: "Pantoprazole 40mg",
      genericName: "Pantoprazole",
      activeIngredients: [{ name: "Pantoprazole Sodium", strength: "40mg" }],
      therapeuticCategory: "Gastrointestinal",
      dosageForm: "Tablet",
      description: "Proton pump inhibitor for GERD, acid reflux, and Zollinger-Ellison syndrome.",
      sideEffects: ["Headache", "Diarrhea", "Nausea"],
      warnings: ["Take before meals"],
      packSize: "10 tablets",
      manufacturer: "Alkem Labs",
      brand: "Pan",
      isBranded: true,
      averagePrice: 65,
      prescriptionRequired: false,
      regulatoryApproval: { approvedBy: "CDSCO", isApproved: true },
    },
  ];

  // Link Paracetamol equivalents after insert
  const createdMeds = [];
  for (const med of medicines) {
    let existing = await Medicine.findOne({ name: med.name });
    if (!existing) {
      existing = await Medicine.create(med);
      console.log(`  💊 Created: ${med.name}`);
    } else {
      console.log(`  ℹ️  Already exists: ${med.name}`);
    }
    createdMeds.push(existing);
  }

  // Link paracetamol equivalents
  const paracetamolMeds = createdMeds.filter(m => m.genericName === "Paracetamol");
  if (paracetamolMeds.length > 1) {
    for (const med of paracetamolMeds) {
      med.equivalentMedicines = paracetamolMeds.filter(m => m._id.toString() !== med._id.toString()).map(m => m._id);
      await med.save();
    }
    console.log("  🔗 Linked Paracetamol equivalents");
  }

  // ═══════════════════════════════════════════════════════════════
  //  4. SEED VENDOR INVENTORY
  // ═══════════════════════════════════════════════════════════════
  console.log("\n📦 Seeding vendor inventory...");
  const inventoryData = [
    { medicine: createdMeds[0], price: 28, mrp: 32, discount: 12, stock: 200 },   // Dolo 650
    { medicine: createdMeds[1], price: 22, mrp: 26, discount: 15, stock: 150 },   // Crocin 500
    { medicine: createdMeds[2], price: 78, mrp: 90, discount: 13, stock: 80 },    // Azithromycin
    { medicine: createdMeds[3], price: 52, mrp: 65, discount: 20, stock: 120 },   // Amoxicillin
    { medicine: createdMeds[4], price: 30, mrp: 38, discount: 21, stock: 300 },   // Cetirizine
    { medicine: createdMeds[5], price: 18, mrp: 25, discount: 28, stock: 250 },   // Metformin
    { medicine: createdMeds[6], price: 35, mrp: 42, discount: 17, stock: 100 },   // Amlodipine
    { medicine: createdMeds[7], price: 48, mrp: 60, discount: 20, stock: 90 },    // Omeprazole
    { medicine: createdMeds[8], price: 8, mrp: 12, discount: 33, stock: 500 },    // Generic Paracetamol
    { medicine: createdMeds[10], price: 17, mrp: 22, discount: 23, stock: 180 },  // Ibuprofen
    { medicine: createdMeds[11], price: 58, mrp: 70, discount: 17, stock: 110 },  // Pantoprazole
  ];

  for (const item of inventoryData) {
    const exists = await Inventory.findOne({
      vendor: vendor._id,
      medicine: item.medicine._id,
    });
    if (!exists) {
      await Inventory.create({
        vendor: vendor._id,
        medicine: item.medicine._id,
        price: item.price,
        mrp: item.mrp,
        discount: item.discount,
        stock: item.stock,
        inStock: true,
        expiryDate: new Date("2027-06-30"),
        batchNumber: `BATCH-${Date.now()}`,
      });
      console.log(`  📦 Inventory: ${item.medicine.name} → ₹${item.price} (stock: ${item.stock})`);
    } else {
      console.log(`  ℹ️  Inventory exists: ${item.medicine.name}`);
    }
  }

  console.log("\n✅ Seed complete!");
  console.log("═══════════════════════════════════════════");
  console.log("  Vendor login:  vendor@vitality.com / vendor123");
  console.log("  Admin login:   admin@vitality.com / admin123");
  console.log("═══════════════════════════════════════════\n");

  process.exit(0);
};

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
