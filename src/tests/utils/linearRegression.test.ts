import { describe, it, expect } from 'vitest';
import { 
  calculateLinearRegression, 
  calculateConfidenceInterval,
  generatePredictions
} from '@/utils/linearRegression';

describe('linearRegression', () => {
  describe('calculateLinearRegression', () => {
    it('should calculate regression for ascending data', () => {
      const data = [
        { timestamp: '2024-01-01', value: 10 },
        { timestamp: '2024-01-02', value: 20 },
        { timestamp: '2024-01-03', value: 30 },
        { timestamp: '2024-01-04', value: 40 },
      ];

      const result = calculateLinearRegression(data);

      expect(result.slope).toBeGreaterThan(0);
      expect(result.rSquared).toBeCloseTo(1, 1);
      expect(result.correlation).toBeCloseTo(1, 1);
    });

    it('should calculate regression for descending data', () => {
      const data = [
        { timestamp: '2024-01-01', value: 40 },
        { timestamp: '2024-01-02', value: 30 },
        { timestamp: '2024-01-03', value: 20 },
        { timestamp: '2024-01-04', value: 10 },
      ];

      const result = calculateLinearRegression(data);

      expect(result.slope).toBeLessThan(0);
      expect(result.rSquared).toBeCloseTo(1, 1);
      expect(result.correlation).toBeCloseTo(-1, 1);
    });

    it('should handle flat data', () => {
      const data = [
        { timestamp: '2024-01-01', value: 50 },
        { timestamp: '2024-01-02', value: 50 },
        { timestamp: '2024-01-03', value: 50 },
      ];

      const result = calculateLinearRegression(data);

      expect(result.slope).toBeCloseTo(0, 5);
      expect(result.intercept).toBeCloseTo(50, 1);
    });

    it('should throw error for insufficient data', () => {
      const data = [{ timestamp: '2024-01-01', value: 10 }];

      expect(() => calculateLinearRegression(data)).toThrow('Insufficient data');
    });
  });

  describe('calculateConfidenceInterval', () => {
    it('should calculate confidence interval', () => {
      const data = [
        { timestamp: '2024-01-01', value: 10 },
        { timestamp: '2024-01-02', value: 20 },
        { timestamp: '2024-01-03', value: 30 },
      ];

      const regression = calculateLinearRegression(data);
      const interval = calculateConfidenceInterval(data, regression, 3);

      expect(interval.lower).toBeLessThanOrEqual(interval.upper);
      expect(interval.lower).toBeGreaterThanOrEqual(0);
      expect(interval.upper).toBeLessThanOrEqual(100);
    });

    it('should respect score boundaries', () => {
      const data = [
        { timestamp: '2024-01-01', value: 95 },
        { timestamp: '2024-01-02', value: 98 },
        { timestamp: '2024-01-03', value: 99 },
      ];

      const regression = calculateLinearRegression(data);
      const interval = calculateConfidenceInterval(data, regression, 4);

      expect(interval.upper).toBeLessThanOrEqual(100);
      expect(interval.lower).toBeGreaterThanOrEqual(0);
    });
  });

  describe('generatePredictions', () => {
    it('should generate predictions for future dates', () => {
      const data = [
        { timestamp: '2024-01-01', value: 10 },
        { timestamp: '2024-01-02', value: 20 },
        { timestamp: '2024-01-03', value: 30 },
      ];

      const result = generatePredictions(data, [7, 14, 21, 30]);

      expect(result.predictions.length).toBeGreaterThan(0);
      expect(result.currentTrend).toBe('crescente');
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should detect downward trend', () => {
      const data = [
        { timestamp: '2024-01-01', value: 90 },
        { timestamp: '2024-01-02', value: 80 },
        { timestamp: '2024-01-03', value: 70 },
      ];

      const result = generatePredictions(data, [7, 14, 21, 30]);

      expect(result.currentTrend).toBe('decrescente');
    });

    it('should detect stable trend', () => {
      const data = [
        { timestamp: '2024-01-01', value: 50 },
        { timestamp: '2024-01-02', value: 50.1 },
        { timestamp: '2024-01-03', value: 49.9 },
      ];

      const result = generatePredictions(data, [7, 14, 21, 30]);

      expect(result.currentTrend).toBe('estável');
    });

    it('should generate valid date strings', () => {
      const data = [
        { timestamp: '2024-01-01', value: 10 },
        { timestamp: '2024-01-02', value: 20 },
      ];

      const result = generatePredictions(data, [7, 14, 21, 30]);

      result.predictions.forEach(prediction => {
        expect(prediction.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(new Date(prediction.date)).toBeInstanceOf(Date);
      });
    });
  });
});
