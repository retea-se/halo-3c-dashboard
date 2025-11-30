/**
 * Trend Calculator - Beräknar trender baserat på linjär regression
 */

export interface DataPoint {
  timestamp: number; // Unix timestamp i millisekunder
  value: number;
}

export interface TrendResult {
  trend: 'up' | 'down' | 'stable';
  percentageChange: number;
  slope: number;
  dataPoints: DataPoint[];
  startValue: number;
  endValue: number;
}

interface LinearRegressionResult {
  slope: number;
  intercept: number;
}

/**
 * Beräkna linjär regression för datapunkter
 */
function calculateLinearRegression(points: Array<{ x: number; y: number }>): LinearRegressionResult {
  if (points.length < 2) {
    return { slope: 0, intercept: points[0]?.y || 0 };
  }

  const n = points.length;
  const sumX = points.reduce((sum, p) => sum + p.x, 0);
  const sumY = points.reduce((sum, p) => sum + p.y, 0);
  const sumXY = points.reduce((sum, p) => sum + p.x * p.y, 0);
  const sumXX = points.reduce((sum, p) => sum + p.x * p.x, 0);

  const denominator = n * sumXX - sumX * sumX;
  if (Math.abs(denominator) < 1e-10) {
    // Alla x-värden är samma, ingen lutning
    return { slope: 0, intercept: sumY / n };
  }

  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
}

/**
 * Aggregera datapunkter för att minska brus
 * Grupperar punkter i tidsintervall och tar medelvärde
 */
function aggregateDataPoints(
  points: DataPoint[],
  intervalMinutes: number = 5
): DataPoint[] {
  if (points.length === 0) return [];

  // Sortera efter timestamp
  const sorted = [...points].sort((a, b) => a.timestamp - b.timestamp);

  const aggregated: DataPoint[] = [];
  const intervalMs = intervalMinutes * 60 * 1000;

  let currentIntervalStart = sorted[0].timestamp;
  let currentIntervalValues: number[] = [];

  for (const point of sorted) {
    if (point.timestamp < currentIntervalStart + intervalMs) {
      // Punkt tillhör nuvarande intervall
      currentIntervalValues.push(point.value);
    } else {
      // Spara medelvärdet för nuvarande intervall
      if (currentIntervalValues.length > 0) {
        const avgValue = currentIntervalValues.reduce((a, b) => a + b, 0) / currentIntervalValues.length;
        aggregated.push({
          timestamp: currentIntervalStart + intervalMs / 2,
          value: avgValue,
        });
      }

      // Starta nytt intervall
      currentIntervalStart = point.timestamp;
      currentIntervalValues = [point.value];
    }
  }

  // Spara sista intervallet
  if (currentIntervalValues.length > 0) {
    const avgValue = currentIntervalValues.reduce((a, b) => a + b, 0) / currentIntervalValues.length;
    aggregated.push({
      timestamp: currentIntervalStart + intervalMs / 2,
      value: avgValue,
    });
  }

  return aggregated;
}

/**
 * Konvertera historik-data från API till DataPoint-format
 */
function convertHistoryToDataPoints(historyData: any[]): DataPoint[] {
  return historyData
    .filter((item) => {
      const value = item.value ?? item._value;
      return value !== null && value !== undefined && !isNaN(Number(value));
    })
    .map((item) => {
      const value = item.value ?? item._value;
      const timestamp = item.timestamp || item._time;
      return {
        timestamp: new Date(timestamp).getTime(),
        value: Number(value),
      };
    })
    .sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Beräkna trend baserat på historik-data
 */
export function calculateTrend(
  historyData: any[],
  timePeriodHours: number = 1
): TrendResult | null {
  if (!historyData || historyData.length === 0) {
    return null;
  }

  // Konvertera till DataPoint-format
  let dataPoints = convertHistoryToDataPoints(historyData);

  if (dataPoints.length < 2) {
    return null;
  }

  // Filtrera till vald tidsperiod
  const now = Date.now();
  const periodStart = now - timePeriodHours * 60 * 60 * 1000;
  dataPoints = dataPoints.filter((p) => p.timestamp >= periodStart);

  if (dataPoints.length < 2) {
    return null;
  }

  // Aggregera datapunkter för att minska brus
  // Använd längre intervall för längre tidsperioder
  const intervalMinutes = timePeriodHours <= 1 ? 5 : timePeriodHours <= 6 ? 10 : 15;
  const aggregatedPoints = aggregateDataPoints(dataPoints, intervalMinutes);

  if (aggregatedPoints.length < 2) {
    // Om aggregering gav för få punkter, använd originaldata
    dataPoints = aggregatedPoints.length > 0 ? aggregatedPoints : dataPoints;
  } else {
    dataPoints = aggregatedPoints;
  }

  // Normalisera timestamps till 0-baserade för regression
  const minTimestamp = dataPoints[0].timestamp;
  const normalizedPoints = dataPoints.map((p) => ({
    x: (p.timestamp - minTimestamp) / (1000 * 60), // Minuter från start
    y: p.value,
  }));

  // Beräkna linjär regression
  const regression = calculateLinearRegression(normalizedPoints);

  // Beräkna procentuell förändring
  const startValue = dataPoints[0].value;
  const endValue = dataPoints[dataPoints.length - 1].value;
  const percentageChange =
    startValue !== 0 ? ((endValue - startValue) / Math.abs(startValue)) * 100 : 0;

  // Bestäm trend baserat på lutning
  // Tröskel: 0.1% av medelvärde per timme
  const meanValue = dataPoints.reduce((sum, p) => sum + p.value, 0) / dataPoints.length;
  const thresholdPerHour = Math.abs(meanValue) * 0.001; // 0.1% per timme
  const thresholdPerMinute = thresholdPerHour / 60;

  let trend: 'up' | 'down' | 'stable' = 'stable';
  if (regression.slope > thresholdPerMinute) {
    trend = 'up';
  } else if (regression.slope < -thresholdPerMinute) {
    trend = 'down';
  }

  return {
    trend,
    percentageChange,
    slope: regression.slope,
    dataPoints,
    startValue,
    endValue,
  };
}

