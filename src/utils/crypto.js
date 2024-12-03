const crypto = require("crypto");

const cryptoUtils = {
  // Generate salt
  generateSalt: (length = 40) => {
    return crypto.randomBytes(length).toString("hex");
  },

  // Hash password or PIN with salt
  hash: (text, salt) => {
    return crypto.pbkdf2Sync(text, salt, 10000, 64, "sha512").toString("hex");
  },

  // Verify password or PIN
  verify: (text, hash, salt) => {
    const newHash = crypto
      .pbkdf2Sync(text, salt, 10000, 64, "sha512")
      .toString("hex");
    return newHash === hash;
  },

  // Generate random PIN
  generatePin: (length = 6) => {
    return crypto
      .randomInt(Math.pow(10, length - 1), Math.pow(10, length))
      .toString()
      .padStart(length, "0");
  },
};

module.exports = cryptoUtils;
