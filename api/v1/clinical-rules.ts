import { getActiveClinicalRules, edgeCache, db } from '../../src/db/client';
import { clinicalSuitabilityRules, clinicalRuleAuditLog } from '../../src/db/schema';
import { eq } from 'drizzle-orm';
import { ClinicalSuitabilityRule, ConditionVariant, RuleApprovalStatus } from '../../src/types';

// In-memory audit trail buffer for development / serverless fallback
const AUDIT_TRAIL_MEMORY: Array<{
  auditId: string;
  ruleId: string;
  changedBy: string;
  changeReason: string;
  previousSnapshot: Partial<ClinicalSuitabilityRule>;
  newSnapshot: Partial<ClinicalSuitabilityRule>;
  timestamp: string;
}> = [];

export default async function handler(req: any, res: any) {
  const startTime = Date.now();

  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // 1. GET: Filterable clinical rules query
    if (req.method === 'GET') {
      const {
        family,
        variant,
        nutrient,
        direction,
        status,
        search,
      } = req.query || {};

      const allRules = await getActiveClinicalRules();

      let filtered = [...allRules];

      if (family) {
        filtered = filtered.filter(
          r => r.conditionFamily.toLowerCase() === (family as string).toLowerCase()
        );
      }
      if (variant) {
        filtered = filtered.filter(
          r => r.conditionVariant.toLowerCase() === (variant as string).toLowerCase()
        );
      }
      if (nutrient) {
        filtered = filtered.filter(
          r => r.nutrientName.toLowerCase() === (nutrient as string).toLowerCase()
        );
      }
      if (direction) {
        filtered = filtered.filter(
          r => r.ruleDirection.toUpperCase() === (direction as string).toUpperCase()
        );
      }
      if (status) {
        filtered = filtered.filter(
          r => r.approvalStatus.toUpperCase() === (status as string).toUpperCase()
        );
      }
      if (search) {
        const query = (search as string).toLowerCase();
        filtered = filtered.filter(
          r =>
            r.ruleId.toLowerCase().includes(query) ||
            r.conditionFamily.toLowerCase().includes(query) ||
            r.conditionVariant.toLowerCase().includes(query) ||
            r.nutrientName.toLowerCase().includes(query) ||
            (r.guidelineCitationText && r.guidelineCitationText.toLowerCase().includes(query)) ||
            (r.guidelineOrganization && r.guidelineOrganization.toLowerCase().includes(query))
        );
      }

      const totalCount = allRules.length;
      const approvedCount = allRules.filter(
        r => r.approvalStatus === 'APPROVED_CITED' || r.approvalStatus === 'APPROVED_CLINICAL_CONSENSUS'
      ).length;
      const pendingEstimateCount = allRules.filter(
        r => r.approvalStatus === 'ESTIMATE_PENDING_REVIEW'
      ).length;

      res.status(200).json({
        success: true,
        totalRulesCount: totalCount,
        matchedRulesCount: filtered.length,
        approvedCount,
        pendingEstimateCount,
        rules: filtered,
        recentAudits: AUDIT_TRAIL_MEMORY.slice(-10),
        latencyMs: Date.now() - startTime,
      });
      return;
    }

    // 2. PATCH: Clinician threshold / citation / weight editing
    if (req.method === 'PATCH' || req.method === 'POST') {
      const {
        ruleId,
        safeThreshold,
        warningThreshold,
        dangerThreshold,
        requiredTarget,
        normalizedWeight,
        approvalStatus,
        guidelineOrganization,
        guidelineCitationText,
        sourceBasis,
        changedBy = 'clinician_lead',
        changeReason = 'Clinical review update',
      } = req.body || {};

      if (!ruleId) {
        res.status(400).json({ error: 'Missing required field: ruleId.' });
        return;
      }

      const allRules = await getActiveClinicalRules();
      const ruleIndex = allRules.findIndex(r => r.ruleId === ruleId);

      if (ruleIndex === -1) {
        res.status(404).json({ error: `Rule not found for ruleId: ${ruleId}` });
        return;
      }

      const existingRule = allRules[ruleIndex];
      const previousSnapshot = { ...existingRule };

      // Invariant Check: If normalized weight is being updated, verify sum for that condition variant
      if (typeof normalizedWeight === 'number') {
        const variantRules = allRules.filter(
          r => r.conditionVariant === existingRule.conditionVariant
        );
        const otherWeightsSum = variantRules
          .filter(r => r.ruleId !== ruleId)
          .reduce((sum, r) => sum + r.normalizedWeight, 0);

        const newTotalWeight = otherWeightsSum + normalizedWeight;
        // Allow floating precision tolerance 0.005
        if (Math.abs(newTotalWeight - 1.0) > 0.005) {
          res.status(400).json({
            error: 'Invariant violation: sum of normalized weights across all 12 nutrients must equal 1.0000',
            variant: existingRule.conditionVariant,
            currentOtherWeightsSum: Number(otherWeightsSum.toFixed(4)),
            proposedWeight: Number(normalizedWeight.toFixed(4)),
            resultantSum: Number(newTotalWeight.toFixed(4)),
            difference: Number((newTotalWeight - 1.0).toFixed(4)),
          });
          return;
        }
      }

      // Apply modifications
      const updatedRule: ClinicalSuitabilityRule = {
        ...existingRule,
        safeThreshold: typeof safeThreshold === 'number' ? safeThreshold : existingRule.safeThreshold,
        warningThreshold:
          typeof warningThreshold === 'number' ? warningThreshold : existingRule.warningThreshold,
        dangerThreshold:
          typeof dangerThreshold === 'number' ? dangerThreshold : existingRule.dangerThreshold,
        requiredTarget:
          typeof requiredTarget === 'number' ? requiredTarget : existingRule.requiredTarget,
        normalizedWeight:
          typeof normalizedWeight === 'number' ? normalizedWeight : existingRule.normalizedWeight,
        approvalStatus: (approvalStatus as RuleApprovalStatus) || existingRule.approvalStatus,
        guidelineOrganization:
          guidelineOrganization !== undefined ? guidelineOrganization : existingRule.guidelineOrganization,
        guidelineCitationText:
          guidelineCitationText !== undefined ? guidelineCitationText : existingRule.guidelineCitationText,
        sourceBasis: sourceBasis || existingRule.sourceBasis,
        ruleVersion: (existingRule.ruleVersion || 1) + 1,
        reviewedAt: new Date().toISOString(),
      };

      allRules[ruleIndex] = updatedRule;

      // Invalidate and refresh Redis edge cache
      await edgeCache.set('rules:active_504', allRules, 86400);

      // Record Audit Trail
      const auditEntry = {
        auditId: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        ruleId,
        changedBy,
        changeReason,
        previousSnapshot,
        newSnapshot: updatedRule,
        timestamp: new Date().toISOString(),
      };
      AUDIT_TRAIL_MEMORY.push(auditEntry);

      res.status(200).json({
        success: true,
        message: `Rule ${ruleId} updated to version ${updatedRule.ruleVersion}`,
        updatedRule,
        audit: auditEntry,
        latencyMs: Date.now() - startTime,
      });
      return;
    }

    res.status(405).json({ error: 'Method not allowed. Use GET or PATCH.' });
  } catch (err: any) {
    console.error('[/api/v1/clinical-rules] Error:', err);
    res.status(500).json({
      error: 'Clinical rules operation failed',
      message: err.message,
    });
  }
}
