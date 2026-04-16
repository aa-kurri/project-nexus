/**
 * Westgard Rules and QC Logic for Levey-Jennings Charts
 * 
 * Rules supported:
 * - 1_2s: Warning (Alert user, but result is usually accepted)
 * - 1_3s: Rejection (Stop run)
 * - 2_2s: Rejection (Two across or two in a row on same side)
 */

export interface QCResult {
  value: number;
  mean: number;
  sd: number;
  zScore: number;
}

export interface WestgardViolation {
  rule: string;
  severity: 'warning' | 'error';
  message: string;
}

/**
 * Evaluates a result against standard Westgard rules.
 * @param result The current measurement
 * @param history Previous measurements (sorted newest first)
 */
export function evaluateWestgard(
  result: QCResult,
  history: QCResult[] = []
): WestgardViolation[] {
  const violations: WestgardViolation[] = [];
  const zAbs = Math.abs(result.zScore);

  // 1-3s Rule: One measurement exceeds 3 SD
  if (zAbs > 3) {
    violations.push({
      rule: '1-3s',
      severity: 'error',
      message: 'Result exceeds 3 Standard Deviations. Run must be rejected.'
    });
  }

  // 1-2s Rule: One measurement exceeds 2 SD (Warning)
  if (zAbs > 2 && zAbs <= 3) {
    violations.push({
      rule: '1-2s',
      severity: 'warning',
      message: 'Result exceeds 2 Standard Deviations. Potential shift/trend.'
    });
  }

  // 2-2s Rule: 2 consecutive measurements exceed 2 SD on same side
  if (history.length >= 1) {
    const prev = history[0];
    if (Math.abs(prev.zScore) > 2 && zAbs > 2) {
      const sameSide = (prev.zScore > 0 && result.zScore > 0) || (prev.zScore < 0 && result.zScore < 0);
      if (sameSide) {
        violations.push({
          rule: '2-2s',
          severity: 'error',
          message: 'Two consecutive measurements exceed 2 SD on the same side.'
        });
      } else if (Math.abs(prev.zScore - result.zScore) >= 4) {
        // R-4s Rule: Difference between two consecutive measurements is 4 SD or more
        violations.push({
          rule: 'R-4s',
          severity: 'error',
          message: 'Range of 4 SD exceeded between consecutive measurements.'
        });
      }
    }
  }

  return violations;
}
