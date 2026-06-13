const BAR_WEIGHT = 45;
const AVAILABLE_PLATES = [45, 35, 25, 10, 5, 2.5];

export interface PlateBreakdown {
  perSide: number[];
  achievedWeight: number;
  exact: boolean;
}

/**
 * Given a target total weight (bar + plates on both sides), returns the
 * plates needed per side using standard available denominations.
 * Returns null if targetWeight is null or less than the bar weight.
 */
export function getPlateBreakdown(targetWeight: number | null): PlateBreakdown | null {
  if (targetWeight === null || targetWeight < BAR_WEIGHT) return null;

  let remainingPerSide = (targetWeight - BAR_WEIGHT) / 2;
  const perSide: number[] = [];

  for (const plate of AVAILABLE_PLATES) {
    while (remainingPerSide >= plate - 0.001) {
      perSide.push(plate);
      remainingPerSide -= plate;
    }
  }

  const achievedWeight = BAR_WEIGHT + perSide.reduce((sum, p) => sum + p, 0) * 2;
  const exact = Math.abs(achievedWeight - targetWeight) < 0.01;

  return { perSide, achievedWeight, exact };
}
