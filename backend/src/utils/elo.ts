/**
 * ELO Rating calculation
 * K-factor varies by rating level
 */

function getKFactor(rating: number): number {
  if (rating < 1600) return 32;
  if (rating < 2000) return 24;
  return 16;
}

function expectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

export interface RatingChange {
  newRatingWhite: number;
  newRatingBlack: number;
  changeWhite: number;
  changeBlack: number;
}

/**
 * Calculate new ELO ratings after a game
 * @param whiteRating - Current white player rating
 * @param blackRating - Current black player rating
 * @param result - 1 = white wins, 0 = black wins, 0.5 = draw
 */
export function calculateElo(
  whiteRating: number,
  blackRating: number,
  result: number // 1 = white wins, 0 = black wins, 0.5 = draw
): RatingChange {
  const kWhite = getKFactor(whiteRating);
  const kBlack = getKFactor(blackRating);

  const expectedWhite = expectedScore(whiteRating, blackRating);
  const expectedBlack = expectedScore(blackRating, whiteRating);

  const changeWhite = Math.round(kWhite * (result - expectedWhite));
  const changeBlack = Math.round(kBlack * ((1 - result) - expectedBlack));

  return {
    newRatingWhite: whiteRating + changeWhite,
    newRatingBlack: blackRating + changeBlack,
    changeWhite,
    changeBlack
  };
}
