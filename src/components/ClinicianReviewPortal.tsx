import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  History,
  Edit2,
  Save,
  X,
  FileText,
  Scale,
  RefreshCw,
  Award,
} from 'lucide-react';
import { ClinicalSuitabilityRule, ConditionFamily, ConditionVariant, RuleApprovalStatus } from '../types';
import { CLINICAL_RULES_SEED } from '../data/clinicalRulesSeed';

interface ClinicianReviewPortalProps {
  isOpen: boolean;
  onClose: () => void;
  clinicianName?: string;
}

export const ClinicianReviewPortal: React.FC<ClinicianReviewPortalProps> = ({
  isOpen,
  onClose,
  clinicianName = 'Dr. Priya Rao, Chief Dietitian',
}) => {
  const [rules, setRules] = useState<ClinicalSuitabilityRule[]>(CLINICAL_RULES_SEED);
  const [selectedFamily, setSelectedFamily] = useState<string>('all');
  const [selectedVariant, setSelectedVariant] = useState<string>('all');
  const [selectedNutrient, setSelectedNutrient] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [editingRule, setEditingRule] = useState<ClinicalSuitabilityRule | null>(null);
  const [editSafe, setEditSafe] = useState<string>('');
  const [editWarning, setEditWarning] = useState<string>('');
  const [editDanger, setEditDanger] = useState<string>('');
  const [editWeight, setEditWeight] = useState<string>('');
  const [editCitation, setEditCitation] = useState<string>('');
  const [editStatus, setEditStatus] = useState<RuleApprovalStatus>('APPROVED_CITED');
  const [changeReason, setChangeReason] = useState<string>('');
  const [saveMessage, setSaveMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Load rules from API if running
  useEffect(() => {
    async function fetchRules() {
      try {
        const res = await fetch('/api/v1/clinical-rules');
        if (res.ok) {
          const data = await res.json();
          if (data.rules && Array.isArray(data.rules)) {
            setRules(data.rules);
          }
          if (data.recentAudits) {
            setAuditLogs(data.recentAudits);
          }
        }
      } catch (e) {
        // Fallback to seed in state
      }
    }
    if (isOpen) {
      fetchRules();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Filter rules
  const filteredRules = rules.filter(rule => {
    if (selectedFamily !== 'all' && rule.conditionFamily !== selectedFamily) return false;
    if (selectedVariant !== 'all' && rule.conditionVariant !== selectedVariant) return false;
    if (selectedNutrient !== 'all' && rule.nutrientName !== selectedNutrient) return false;
    if (selectedStatus !== 'all' && rule.approvalStatus !== selectedStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        rule.ruleId.toLowerCase().includes(q) ||
        rule.conditionVariant.toLowerCase().includes(q) ||
        rule.nutrientName.toLowerCase().includes(q) ||
        (rule.guidelineCitationText && rule.guidelineCitationText.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  const families = Array.from(new Set(rules.map(r => r.conditionFamily)));
  const variants = Array.from(new Set(rules.map(r => r.conditionVariant)));
  const nutrients = Array.from(new Set(rules.map(r => r.nutrientName)));

  // Calculate sum of weights for the variant currently being edited
  const getEditingVariantWeightSum = () => {
    if (!editingRule) return 1.0;
    const variantRules = rules.filter(r => r.conditionVariant === editingRule.conditionVariant);
    const otherSum = variantRules
      .filter(r => r.ruleId !== editingRule.ruleId)
      .reduce((sum, r) => sum + r.normalizedWeight, 0);
    const proposed = parseFloat(editWeight) || 0;
    return Number((otherSum + proposed).toFixed(4));
  };

  const currentWeightSum = editingRule ? getEditingVariantWeightSum() : 1.0;
  const isWeightSumValid = Math.abs(currentWeightSum - 1.0) <= 0.005;

  const handleEditClick = (rule: ClinicalSuitabilityRule) => {
    setEditingRule(rule);
    setEditSafe(rule.safeThreshold !== undefined ? rule.safeThreshold.toString() : '');
    setEditWarning(rule.warningThreshold !== undefined ? rule.warningThreshold.toString() : '');
    setEditDanger(rule.dangerThreshold !== undefined ? rule.dangerThreshold.toString() : '');
    setEditWeight(rule.normalizedWeight.toString());
    setEditCitation(rule.guidelineCitationText || '');
    setEditStatus(rule.approvalStatus);
    setChangeReason('Clinical guideline review update');
    setSaveMessage(null);
  };

  const handleSaveRule = async () => {
    if (!editingRule) return;
    if (!isWeightSumValid) {
      setSaveMessage({
        text: `Cannot save: Sum of weights across 12 nutrients for ${editingRule.conditionVariant} is ${currentWeightSum}. Must equal 1.0000.`,
        type: 'error',
      });
      return;
    }

    const payload = {
      ruleId: editingRule.ruleId,
      safeThreshold: editSafe ? parseFloat(editSafe) : undefined,
      warningThreshold: editWarning ? parseFloat(editWarning) : undefined,
      dangerThreshold: editDanger ? parseFloat(editDanger) : undefined,
      normalizedWeight: parseFloat(editWeight),
      guidelineCitationText: editCitation,
      approvalStatus: editStatus,
      changedBy: clinicianName,
      changeReason,
    };

    try {
      const res = await fetch('/api/v1/clinical-rules', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        // Update local state
        setRules(prev =>
          prev.map(r => (r.ruleId === editingRule.ruleId ? data.updatedRule : r))
        );
        if (data.audit) {
          setAuditLogs(prev => [data.audit, ...prev]);
        }
        setSaveMessage({
          text: `Rule ${editingRule.ruleId} updated to v${data.updatedRule.ruleVersion} & edge cache invalidated.`,
          type: 'success',
        });
        setTimeout(() => setEditingRule(null), 1200);
      } else {
        const err = await res.json();
        setSaveMessage({ text: err.error || 'Failed to update rule', type: 'error' });
      }
    } catch (e: any) {
      setSaveMessage({ text: e.message || 'Network error', type: 'error' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-6xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden my-6 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold">Clinician Governance & 504-Rule Portal</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-slate-950 uppercase tracking-wider">
                  Live Engine
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Dietitian Authority Portal &bull; Active Clinician: <span className="text-emerald-400 font-medium">{clinicianName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search rule ID, variant, nutrient or guideline citation..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Condition Family Filter */}
            <select
              value={selectedFamily}
              onChange={e => setSelectedFamily(e.target.value)}
              className="px-3 py-2 bg-white rounded-xl border border-slate-200 text-slate-700 font-medium focus:outline-none"
            >
              <option value="all">All Families (14)</option>
              {families.map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>

            {/* Condition Variant Filter */}
            <select
              value={selectedVariant}
              onChange={e => setSelectedVariant(e.target.value)}
              className="px-3 py-2 bg-white rounded-xl border border-slate-200 text-slate-700 font-medium focus:outline-none max-w-[180px] truncate"
            >
              <option value="all">All Variants (42)</option>
              {variants.map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>

            {/* Nutrient Filter */}
            <select
              value={selectedNutrient}
              onChange={e => setSelectedNutrient(e.target.value)}
              className="px-3 py-2 bg-white rounded-xl border border-slate-200 text-slate-700 font-medium focus:outline-none"
            >
              <option value="all">All Nutrients (12)</option>
              {nutrients.map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="px-3 py-2 bg-white rounded-xl border border-slate-200 text-slate-700 font-medium focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="APPROVED_CITED">Approved Cited</option>
              <option value="APPROVED_CLINICAL_CONSENSUS">Clinical Consensus</option>
              <option value="ESTIMATE_PENDING_REVIEW">Pending Review</option>
            </select>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-3 text-xs text-slate-500">
            <span>
              Showing <strong className="text-slate-900">{filteredRules.length}</strong> of 504 versioned clinical rules
            </span>
            <span className="flex items-center gap-1 text-emerald-700 font-medium">
              <CheckCircle className="w-3.5 h-3.5" /> Edge Cache Invalidation Enabled
            </span>
          </div>

          {/* Rules Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Rule ID & Variant</th>
                  <th className="py-3 px-3">Nutrient</th>
                  <th className="py-3 px-3">Weight (W)</th>
                  <th className="py-3 px-3">Safe &bull; Warn &bull; Danger</th>
                  <th className="py-3 px-4">Primary Citation</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRules.slice(0, 50).map(rule => (
                  <tr key={rule.ruleId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-medium text-slate-900">
                      <div className="font-bold text-slate-800">{rule.conditionVariant}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{rule.ruleId}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="capitalize font-semibold text-slate-800">{rule.nutrientName}</span>
                      <span className={`block text-[10px] font-bold ${rule.ruleDirection === 'LIMITING' ? 'text-orange-600' : 'text-emerald-600'}`}>
                        {rule.ruleDirection}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-700">
                      {rule.normalizedWeight.toFixed(4)}
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px]">
                      <span className="text-emerald-700 font-semibold">{rule.safeThreshold ?? '—'}</span> /{' '}
                      <span className="text-amber-700">{rule.warningThreshold ?? '—'}</span> /{' '}
                      <span className="text-rose-700 font-bold">{rule.dangerThreshold ?? '—'}</span>{' '}
                      <span className="text-slate-400 text-[10px]">{rule.nutrientUnit}</span>
                    </td>
                    <td className="py-3 px-4 max-w-[260px] truncate text-slate-600" title={rule.guidelineCitationText}>
                      <span className="font-medium text-slate-800 block truncate">{rule.guidelineOrganization || 'Guideline'}</span>
                      <span className="text-[10px] text-slate-400 truncate block">{rule.guidelineCitationText || 'Consensus estimate'}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          rule.approvalStatus === 'APPROVED_CITED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : rule.approvalStatus === 'APPROVED_CLINICAL_CONSENSUS'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {rule.approvalStatus.replace(/_/g, ' ')}
                      </span>
                      <span className="block text-[9px] text-slate-400 mt-0.5">v{rule.ruleVersion}</span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => handleEditClick(rule)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 font-semibold text-xs transition-colors inline-flex items-center gap-1"
                      >
                        <Edit2 className="w-3 h-3" /> Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Rule Edit Drawer Modal */}
        {editingRule && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex justify-end z-50">
            <div className="w-full max-w-lg bg-white h-full shadow-2xl p-6 flex flex-col overflow-y-auto animate-in slide-in-from-right duration-200">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
                <div>
                  <h3 className="font-bold text-base text-gray-900">Edit Clinical Rule</h3>
                  <p className="text-xs text-gray-400 font-mono">{editingRule.ruleId}</p>
                </div>
                <button onClick={() => setEditingRule(null)} className="p-2 text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {saveMessage && (
                <div
                  className={`p-3 rounded-xl mb-4 text-xs font-semibold ${
                    saveMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {saveMessage.text}
                </div>
              )}

              <div className="space-y-4 flex-1 text-xs">
                {/* Weight Invariant Live Card */}
                <div className={`p-3.5 rounded-xl border ${isWeightSumValid ? 'bg-emerald-50/70 border-emerald-200' : 'bg-rose-50/70 border-rose-200'}`}>
                  <div className="flex items-center justify-between font-bold text-xs">
                    <span>Variant 12-Nutrient Weight Sum:</span>
                    <span className={isWeightSumValid ? 'text-emerald-700' : 'text-rose-700 font-extrabold'}>
                      {currentWeightSum.toFixed(4)} / 1.0000
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1">
                    Invariant: &Sigma; W across all 12 nutrients for {editingRule.conditionVariant} must equal 1.0000.
                  </p>
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Normalized Weight (W)</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={editWeight}
                    onChange={e => setEditWeight(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 font-mono font-bold"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Safe ({editingRule.nutrientUnit})</label>
                    <input
                      type="number"
                      value={editSafe}
                      onChange={e => setEditSafe(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 font-mono text-emerald-700 font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Warning</label>
                    <input
                      type="number"
                      value={editWarning}
                      onChange={e => setEditWarning(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 font-mono text-amber-700 font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Danger</label>
                    <input
                      type="number"
                      value={editDanger}
                      onChange={e => setEditDanger(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 font-mono text-rose-700 font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Approval Status</label>
                  <select
                    value={editStatus}
                    onChange={e => setEditStatus(e.target.value as RuleApprovalStatus)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 font-semibold"
                  >
                    <option value="APPROVED_CITED">Approved Cited</option>
                    <option value="APPROVED_CLINICAL_CONSENSUS">Approved Clinical Consensus</option>
                    <option value="ESTIMATE_PENDING_REVIEW">Estimate Pending Review</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Clinical Guideline Citation</label>
                  <textarea
                    rows={2}
                    value={editCitation}
                    onChange={e => setEditCitation(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
                    placeholder="e.g. ADA 2024 Standards of Care Section 5, Table 5.1"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Reason for Change (Audit Log)</label>
                  <input
                    type="text"
                    value={changeReason}
                    onChange={e => setChangeReason(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
                    placeholder="e.g. Aligned threshold with newly released KDOQI 2024 updates"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  onClick={() => setEditingRule(null)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveRule}
                  disabled={!isWeightSumValid}
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
                    isWeightSumValid
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Save className="w-4 h-4" /> Save & Bump Version
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
