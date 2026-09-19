import React, { useState } from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  ArrowLeft, 
  FileText, 
  DollarSign, 
  HelpCircle,
  XCircle
} from 'lucide-react';

const EscrowDisputeManager = ({ 
  escrow = {
    id: "ESC-892304",
    amount: "4,500,000",
    vehicle: "2021 Toyota Camry (VIN: 4T1B11HK2MU)",
    buyerName: "Oluwatimilehin",
    sellerName: "Autochek Prime Dealership",
    status: "DISPUTED",
    dispute: {
      id: "DSP-1029",
      initiatedBy: "Buyer",
      reason: "VEHICLE_CONDITION_MISMATCH",
      description: "The vehicle inspection revealed severe undercarriage corrosion and a modified catalytic converter that was not disclosed in the listing.",
      createdAt: "2026-09-12 14:30 WAT",
      status: "OPEN", // Options: "OPEN", "IN_REVIEW", "RESOLVED"
      resolution: {
        outcome: "PARTIAL_REFUND",
        buyerRefund: "1,500,000",
        sellerPayout: "3,000,000",
        notes: "Independent inspector verified non-disclosed exhaust damage. Partial refund awarded to buyer to cover repair estimates.",
        resolvedAt: "2026-09-14 10:15 WAT"
      }
    }
  },
  currentUserRole = "BUYER", // Options: "BUYER", "DEALERSHIP"
  onSubmitDispute,
  onBack 
}) => {
  // Local state for creating a new dispute
  const [reason, setReason] = useState('VEHICLE_CONDITION_MISMATCH');
  const [description, setDescription] = useState('');
  const [evidenceFiles, setEvidenceFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Local copy of escrow state for interactive testing
  const [activeEscrow, setActiveEscrow] = useState(escrow);

  const disputeReasons = [
    { value: 'VEHICLE_CONDITION_MISMATCH', label: 'Vehicle Condition Mismatch (Failed Inspection)' },
    { value: 'UNDISCLOSED_DAMAGE', label: 'Undisclosed Mechanical or Body Damage' },
    { value: 'LOGISTICS_DELAY_DAMAGE', label: 'Transit Damage / Delivery Failure' },
    { value: 'DOCUMENTATION_ISSUE', label: 'Title / Registration / Documentation Issue' },
    { value: 'OTHER', label: 'Other Dispute Reason' }
  ];

  const handleFileChange = (e) => {
    if (e.target.files) {
      setEvidenceFiles(Array.from(e.target.files));
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      escrowId: activeEscrow.id,
      reason,
      description,
      evidenceFiles
    };

    try {
      if (onSubmitDispute) {
        await onSubmitDispute(payload);
      } else {
        // Mock submission response updating state locally
        setActiveEscrow(prev => ({
          ...prev,
          status: 'DISPUTED',
          dispute: {
            id: `DSP-${Math.floor(1000 + Math.random() * 9000)}`,
            initiatedBy: currentUserRole === 'BUYER' ? 'Buyer' : 'Dealership',
            reason,
            description,
            createdAt: 'Just now',
            status: 'OPEN',
            resolution: null
          }
        }));
      }
    } catch (err) {
      console.error('Failed to open dispute', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isResolved = activeEscrow.dispute?.status === 'RESOLVED';
  const hasDispute = activeEscrow.status === 'DISPUTED' || Boolean(activeEscrow.dispute);

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 bg-slate-50 min-h-screen text-slate-800">
      {/* Top Header / Navigation */}
      <div className="flex items-center justify-between mb-6">
        <button 
          onClick={onBack}
          className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Escrow
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-wider font-semibold text-slate-500">Escrow ID:</span>
          <span className="font-mono font-bold text-slate-900">{activeEscrow.id}</span>
        </div>
      </div>

      {/* Contract Context Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">{activeEscrow.vehicle}</h1>
            <p className="text-sm text-slate-500 mt-1">
              Buyer: <span className="font-medium text-slate-700">{activeEscrow.buyerName}</span> • 
              Seller: <span className="font-medium text-slate-700"> {activeEscrow.sellerName}</span>
            </p>
          </div>
          <div className="bg-slate-100 px-4 py-2 rounded-lg border border-slate-200 flex items-center justify-between md:justify-end gap-3">
            <span className="text-xs text-slate-500 font-medium">Locked Value</span>
            <span className="text-lg font-bold text-slate-900">₦{activeEscrow.amount}</span>
          </div>
        </div>
      </div>

      {/* CASE 1: Active Dispute Exists or Resolved */}
      {hasDispute ? (
        <div className="space-y-6">
          {/* Status Header Badge */}
          <div className={`p-5 rounded-xl border flex items-start gap-4 ${
            isResolved
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}>
            {isResolved ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <ShieldAlert className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h2 className="text-lg font-bold">
                  {isResolved
                    ? 'Dispute Case Resolved'
                    : 'Dispute Open — Funds Locked'}
                </h2>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white border border-current">
                  Case #{activeEscrow.dispute?.id || 'DSP-PENDING'}
                </span>
              </div>
              <p className="text-sm mt-1 opacity-90">
                {isResolved
                  ? 'An independent arbiter has reviewed the case and finalized payouts.'
                  : 'All transaction funds are safely frozen in escrow while platform administrators review evidence.'}
              </p>
            </div>
          </div>

          {/* Dispute Timeline Progress */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-4">Resolution Progress</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-l-2 md:border-l-0 md:border-t-2 border-slate-200 pl-4 md:pl-0 md:pt-4">
              <div className="relative">
                <div className="flex items-center gap-2 font-semibold text-slate-900 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  1. Claim Submitted
                </div>
                <p className="text-xs text-slate-500 mt-1">{activeEscrow.dispute?.createdAt}</p>
              </div>

              <div className="relative">
                <div className={`flex items-center gap-2 font-semibold text-sm ${
                  isResolved ? 'text-slate-900' : 'text-amber-600'
                }`}>
                  {isResolved ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Clock className="w-4 h-4 text-amber-500 animate-pulse" />
                  )}
                  2. Arbiter Review
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {activeEscrow.dispute?.status === 'RESOLVED' ? 'Review Completed' : 'Evidence under inspection'}
                </p>
              </div>

              <div className="relative">
                <div className={`flex items-center gap-2 font-semibold text-sm ${
                  isResolved ? 'text-emerald-600' : 'text-slate-400'
                }`}>
                  {isResolved ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Clock className="w-4 h-4 text-slate-300" />
                  )}
                  3. Payout & Closure
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {activeEscrow.dispute?.resolution?.resolvedAt || 'Awaiting decision'}
                </p>
              </div>
            </div>
          </div>

          {/* Dispute Claim Details */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">Dispute Claims Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500 block text-xs">Initiated By</span>
                <span className="font-semibold text-slate-800">{activeEscrow.dispute?.initiatedBy}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-xs">Primary Category</span>
                <span className="font-semibold text-slate-800">{activeEscrow.dispute?.reason.replace(/_/g, ' ')}</span>
              </div>
            </div>

            <div>
              <span className="text-slate-500 block text-xs mb-1">Detailed Statement</span>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 leading-relaxed">
                {activeEscrow.dispute?.description}
              </div>
            </div>
          </div>

          {/* Resolution Summary Breakdown (If Resolved) */}
          {activeEscrow.dispute?.resolution && (
            <div className="bg-white rounded-xl border border-emerald-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-600" /> Official Payout Allocation
                </h3>
                <span className="text-xs font-bold text-emerald-700 uppercase bg-emerald-100 px-2.5 py-1 rounded">
                  {activeEscrow.dispute.resolution.outcome.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-lg">
                  <span className="text-xs text-emerald-800 font-semibold block">Buyer Refund Allocation</span>
                  <span className="text-xl font-extrabold text-emerald-900">₦{activeEscrow.dispute.resolution.buyerRefund}</span>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-xs text-slate-600 font-semibold block">Seller Payout Allocation</span>
                  <span className="text-xl font-extrabold text-slate-900">₦{activeEscrow.dispute.resolution.sellerPayout}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-500 block text-xs mb-1">Arbiter Resolution Notes</span>
                <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200 italic">
                  "{activeEscrow.dispute.resolution.notes}"
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* CASE 2: No Active Dispute (Form to Open Dispute) */
        <form onSubmit={handleFormSubmit} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" /> Open Escrow Dispute
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Filing a dispute will freeze funds in escrow immediately until a platform arbiter investigates the case.
            </p>
          </div>

          {/* Reason Selection */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Dispute Category <span className="text-red-500">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-800"
              required
            >
              {disputeReasons.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          {/* Detailed Statement */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Detailed Description of Claim <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide a clear explanation of what went wrong, including vehicle inspection findings, undelivered components, or title disagreements..."
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-800 placeholder:text-slate-400"
              required
            />
          </div>

          {/* Document / Media Evidence Upload */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Upload Supporting Evidence (Photos, Inspection Reports, Receipts)
            </label>
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-slate-900 file:text-white hover:file:bg-slate-800 transition-all cursor-pointer"
            />
            {evidenceFiles.length > 0 && (
              <ul className="mt-2 text-xs text-slate-600 space-y-1">
                {evidenceFiles.map((file, idx) => (
                  <li key={idx} className="flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-slate-400" /> {file.name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Notice Box */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex items-start gap-3 text-xs text-slate-600">
            <HelpCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <p>
              By raising a dispute, you agree to abide by the decision of the official transaction arbiters. False claims or withholding delivery deliberately may lead to account penalties.
            </p>
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onBack}
              className="px-4 py-2 border border-slate-300 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !description.trim()}
              className="px-5 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-2"
            >
              {isSubmitting ? 'Freezing Escrow...' : 'Freeze Escrow & Raise Dispute'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default EscrowDisputeManager;
