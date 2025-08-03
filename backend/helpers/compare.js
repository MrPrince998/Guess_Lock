/**
 * Compare two 4-digit numbers and return Bulls and Cows
 * Bulls: Correct digits in correct position
 * Cows: Correct digits in wrong position
 *
 * @param {string} secret - The secret number to guess
 * @param {string} guess - The player's guess
 * @returns {object} - Object with correctPosition (bulls) and correctDigit (cows)
 */
function compareNumbers(secret, guess) {
  let correctPosition = 0; // Bulls
  let correctDigit = 0; // Cows

  const secretDigits = secret.split("");
  const guessDigits = guess.split("");

  // First pass: Find bulls (correct position)
  for (let i = 0; i < 4; i++) {
    if (secretDigits[i] === guessDigits[i]) {
      correctPosition++;
      // Mark as used by setting to 'x'
      secretDigits[i] = "x";
      guessDigits[i] = "x";
    }
  }

  // Second pass: Find cows (correct digit, wrong position)
  for (let i = 0; i < 4; i++) {
    if (guessDigits[i] !== "x") {
      const idx = secretDigits.indexOf(guessDigits[i]);
      if (idx !== -1) {
        correctDigit++;
        // Mark as used
        secretDigits[idx] = "x";
      }
    }
  }

  return {
    correctPosition, // Bulls
    correctDigit, // Cows
  };
}

/**
 * Check if the guess is completely correct
 * @param {string} secret - The secret number
 * @param {string} guess - The player's guess
 * @returns {boolean} - True if guess is completely correct
 */
function isCorrectGuess(secret, guess) {
  return secret === guess;
}

/**
 * Generate feedback message based on comparison result
 * @param {object} result - Result from compareNumbers
 * @param {boolean} isWinning - Whether this is a winning guess
 * @returns {string} - Feedback message
 */
function generateFeedback(result, isWinning = false) {
  if (isWinning) {
    return "🎉 Congratulations! You guessed the correct number!";
  }

  const { correctPosition, correctDigit } = result;

  if (correctPosition === 0 && correctDigit === 0) {
    return "❌ No correct digits found. Try again!";
  }

  let feedback = "📊 ";
  if (correctPosition > 0) {
    feedback += `${correctPosition} Bull${
      correctPosition > 1 ? "s" : ""
    } (correct position)`;
  }
  if (correctDigit > 0) {
    if (correctPosition > 0) feedback += ", ";
    feedback += `${correctDigit} Cow${
      correctDigit > 1 ? "s" : ""
    } (correct digit, wrong position)`;
  }

  return feedback;
}

module.exports = {
  compareNumbers,
  isCorrectGuess,
  generateFeedback,
};
