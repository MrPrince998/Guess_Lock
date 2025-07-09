export const validateNumber = (number: string): boolean => {
  // Check if it's exactly 4 digits
  if (!/^\d{4}$/.test(number)) {
    return false;
  }

  // Check if all digits are unique
  const digits = number.split("");
  const uniqueDigits = new Set(digits);

  return uniqueDigits.size === 4;
};
