function compareNumbers(secret, guess) {
  let correctPosition = 0;
  let correctDigit = 0;

  const secretDigits = secret.split("");
  const guessDigits = guess.split("");

  for (let i = 0; i < 4; i++) {
    if (secretDigits[i] === guessDigits[i]) {
      correctPosition++;
      secretDigits[i] = guessDigits[i] = "x";
    }
  }

  for (let i = 0; i < 4; i++) {
    if (guessDigits[i] !== "x") {
      const idx = secretDigits.indexOf(guessDigits[i]);
      if (idx !== -1) {
        correctDigit++;
        secretDigits[idx] = "x";
      }
    }
  }

  return { correctPosition, correctDigit };
}

module.exports = { compareNumbers };
