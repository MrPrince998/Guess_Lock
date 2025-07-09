function validateNumber(number) {
  return /^\d{4}$/.test(number) && new Set(number.split("")).size === 4;
}

module.exports = { validateNumber };
