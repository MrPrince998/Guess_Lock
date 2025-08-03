/**
 * Validate a 4-digit number with unique digits
 * @param {string} number - The number to validate
 * @returns {boolean} - True if valid, false otherwise
 */
function validateNumber(number) {
  // Check if it's a string of exactly 4 digits
  if (!/^\d{4}$/.test(number)) {
    return false;
  }

  // Check if all digits are unique
  const digits = number.split("");
  const uniqueDigits = new Set(digits);

  return uniqueDigits.size === 4;
}

/**
 * Validate player name
 * @param {string} name - The name to validate
 * @returns {object} - Validation result with isValid and message
 */
function validatePlayerName(name) {
  if (!name || typeof name !== "string") {
    return { isValid: false, message: "Name is required and must be a string" };
  }

  const trimmedName = name.trim();
  if (trimmedName.length === 0) {
    return { isValid: false, message: "Name cannot be empty" };
  }

  if (trimmedName.length > 20) {
    return { isValid: false, message: "Name must be 20 characters or less" };
  }

  return { isValid: true, message: "Valid name" };
}

/**
 * Validate game code format
 * @param {string} code - The game code to validate
 * @returns {boolean} - True if valid format, false otherwise
 */
function validateGameCode(code) {
  return /^[A-Z0-9]{4}$/.test(code);
}

module.exports = {
  validateNumber,
  validatePlayerName,
  validateGameCode,
};
