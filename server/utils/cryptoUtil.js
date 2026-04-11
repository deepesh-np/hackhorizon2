const crypto = require("crypto");

// Configuration
const algorithm = "aes-256-cbc";
const secretToken = process.env.ENCRYPTION_SECRET || "default_secure_medical_secret_hackathon";
// Generate exactly 32 bytes using SHA-256
const key = crypto.createHash("sha256").update(secretToken).digest();

/**
 * Encrypt a plain text string.
 * @param {string} text - The plain text to encrypt.
 * @returns {string} - The initialization vector and encrypted text (hex encoded).
 */
const encrypt = (text) => {
  if (!text) return text;
  try {
    // 16 bytes IV
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    // Return iv:encryptedData
    return iv.toString("hex") + ":" + encrypted;
  } catch (error) {
    console.error("Encryption failed:", error);
    return text;
  }
};

/**
 * Decrypt an encrypted hex string.
 * @param {string} text - The iv:encrypted format string.
 * @returns {string} - The decrypted plain text.
 */
const decrypt = (text) => {
  if (!text) return text;
  try {
    // If it doesn't look like an encrypted string with IV, just return it (graceful fallback)
    if (!text.includes(":")) return text;

    const textParts = text.split(":");
    const iv = Buffer.from(textParts.shift(), "hex");
    const encryptedText = Buffer.from(textParts.join(":"), "hex");

    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    // If decryption fails, it might be legacy unencrypted data, return gracefully
    return text;
  }
};

module.exports = {
  encrypt,
  decrypt,
};
