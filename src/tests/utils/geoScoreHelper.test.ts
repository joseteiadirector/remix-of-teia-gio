/**
 * @jest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getRealGeoScore, getGeoScoreBreakdown, getGeoScoreHistory, hasGeoScore } from '@/utils/geoScoreHelper';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('geoScoreHelper', () => {
  const mockBrandId = '123e4567-e89b-12d3-a456-426614174000';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getRealGeoScore', () => {
    it('should return score when data exists', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { score: 85.5 },
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const score = await getRealGeoScore(mockBrandId);
      
      expect(score).toBe(85.5);
      expect(supabase.from).toHaveBeenCalledWith('geo_scores');
      expect(mockChain.eq).toHaveBeenCalledWith('brand_id', mockBrandId);
    });

    it('should return null when no data exists', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'No rows found' },
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const score = await getRealGeoScore(mockBrandId);
      
      expect(score).toBeNull();
    });
  });

  describe('getGeoScoreBreakdown', () => {
    it('should return breakdown with all fields', async () => {
      const mockBreakdown = {
        score: 85.5,
        breakdown: {
          base_tecnica: 80,
          estrutura_semantica: 85,
          autoridade_cognitiva: 90,
          relevancia_conversacional: 88,
          inteligencia_estrategica: 84,
        },
        computed_at: '2024-01-01T00:00:00Z',
      };

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockBreakdown,
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const breakdown = await getGeoScoreBreakdown(mockBrandId);
      
      expect(breakdown).toEqual(mockBreakdown);
    });
  });

  describe('getGeoScoreHistory', () => {
    it('should return history array with default limit', async () => {
      const mockHistory = [
        { score: 80, breakdown: {}, computed_at: '2024-01-01' },
        { score: 85, breakdown: {}, computed_at: '2024-01-02' },
      ];

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: mockHistory,
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const history = await getGeoScoreHistory(mockBrandId);
      
      expect(history).toEqual(mockHistory);
      expect(mockChain.limit).toHaveBeenCalledWith(30);
    });

    it('should respect custom limit', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await getGeoScoreHistory(mockBrandId, 10);
      
      expect(mockChain.limit).toHaveBeenCalledWith(10);
    });
  });

  describe('hasGeoScore', () => {
    it('should return true when score exists', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: '123' },
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const exists = await hasGeoScore(mockBrandId);
      
      expect(exists).toBe(true);
    });

    it('should return false when no score exists', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'No rows found' },
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const exists = await hasGeoScore(mockBrandId);
      
      expect(exists).toBe(false);
    });
  });
});
