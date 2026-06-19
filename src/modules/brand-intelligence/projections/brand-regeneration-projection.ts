import { regenerateBrand } from '../services/brand-regeneration-service';
import type { BrandRegenerationSnapshot } from '../types/brand-regeneration';

export async function getBrandRegenerationPreview(userId: string): Promise<BrandRegenerationSnapshot> {
  return regenerateBrand(userId);
}
