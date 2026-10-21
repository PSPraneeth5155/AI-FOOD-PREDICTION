export interface UserCorrectionRecord {
  id: string;
  timestamp: string;
  originalPrediction: string;
  selectedFood: string;
  confidenceTier: 'high' | 'medium' | 'low';
  feedbackType: 'approved_as_is' | 'swapped_candidate' | 'manual_search_override';
  cuisineRegion?: string;
  notes?: string;
}

const feedbackStore: UserCorrectionRecord[] = [];

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'POST') {
    try {
      const { originalPrediction, selectedFood, confidenceTier, feedbackType, cuisineRegion, notes } = req.body || {};
      if (!originalPrediction || !selectedFood) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const newRecord: UserCorrectionRecord = {
        id: `corr-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        timestamp: new Date().toISOString(),
        originalPrediction,
        selectedFood,
        confidenceTier: confidenceTier || 'medium',
        feedbackType: feedbackType || 'swapped_candidate',
        cuisineRegion: cuisineRegion || 'Pan-Indian',
        notes,
      };

      feedbackStore.unshift(newRecord);
      if (feedbackStore.length > 500) {
        feedbackStore.pop();
      }

      return res.status(200).json({
        success: true,
        loggedCorrection: newRecord,
        totalLoggedCorrections: feedbackStore.length,
      });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to record correction', details: err?.message });
    }
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      success: true,
      total: feedbackStore.length,
      corrections: feedbackStore,
    });
  }

  res.status(405).json({ error: 'Method not allowed' });
}
