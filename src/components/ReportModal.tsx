import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, Flag, CheckCircle, X, AlertTriangle, UserX } from 'lucide-react';

interface ReportModalProps {
  reportedUser: {
    id: string;
    name: string;
    tcgId?: string;
    avatarUrl?: string;
  };
  onClose: () => void;
  onReportSuccess?: (wasBlocked: boolean) => void;
}

const REPORT_REASONS = [
  { id: 'inappropriate_content', label: 'Inappropriate or Offensive Content', desc: 'Offensive language, inappropriate profile details, or media.' },
  { id: 'harassment', label: 'Harassment or Bullying', desc: 'Unwanted targeting, threatening messages, or persistent annoyance.' },
  { id: 'underage', label: 'Underage User (Under 7 Years Old)', desc: 'TCG Friends strictly requires members to be at least 7 years old.' },
  { id: 'fake_profile', label: 'Impersonation or Fake Identity', desc: 'Pretending to be someone else or creating deceptive cards.' },
  { id: 'scam_spam', label: 'Spam, Phishing, or Commercial Links', desc: 'Suspicious links, selling items, or spamming chat channels.' },
  { id: 'minigame_cheating', label: 'Minigame Disruption or Cheating', desc: 'Intentional stalling, unsportsmanlike behavior, or exploits.' },
  { id: 'other', label: 'Other Safety Concern', desc: 'Any other safety or community guideline issue.' },
];

export const ReportModal: React.FC<ReportModalProps> = ({
  reportedUser,
  onClose,
  onReportSuccess,
}) => {
  const { token } = useAuth();
  const [selectedReason, setSelectedReason] = useState(REPORT_REASONS[0].label);
  const [details, setDetails] = useState('');
  const [autoBlock, setAutoBlock] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/safety/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reportedUserId: reportedUser.id,
          reason: selectedReason,
          details: details.trim(),
          autoBlock,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit report.');
      }

      setIsSuccess(true);
      setTimeout(() => {
        if (onReportSuccess) onReportSuccess(autoBlock);
        onClose();
      }, 1600);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error sending report.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 15 }}
        className="relative max-w-lg w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[36px] shadow-2xl overflow-hidden font-sans"
      >
        {/* Top Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-rose-50/60 dark:bg-rose-950/20">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                Report User
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Help keep TCG Friends safe and welcoming
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Target User Summary Card */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
            {reportedUser.avatarUrl ? (
              <img
                src={reportedUser.avatarUrl}
                alt={reportedUser.name}
                className="w-11 h-11 rounded-full object-cover border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800"
              />
            ) : (
              <div className="w-11 h-11 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-700 dark:text-slate-200">
                {reportedUser.name.charAt(0)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="font-bold text-slate-900 dark:text-white text-sm truncate">
                {reportedUser.name}
              </div>
              {reportedUser.tcgId && (
                <div className="text-[11px] font-mono text-amber-600 dark:text-amber-400 font-medium">
                  {reportedUser.tcgId}
                </div>
              )}
            </div>
            <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-100/70 dark:bg-rose-900/30 px-2.5 py-1 rounded-full">
              <Flag className="w-3 h-3" />
              <span>Being Reported</span>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {isSuccess ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="py-8 text-center space-y-3"
              >
                <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Report Submitted
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 max-w-sm mx-auto leading-relaxed">
                  Thank you for looking out for our community. Our safety moderation team has received your report and is investigating.
                  {autoBlock && ' This user has also been blocked from interacting with you.'}
                </p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {errorMsg && (
                  <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Reason Selection */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                    Reason for Report
                  </label>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {REPORT_REASONS.map((r) => {
                      const isSelected = selectedReason === r.label;
                      return (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => setSelectedReason(r.label)}
                          className={`w-full text-left p-2.5 rounded-2xl border transition-all cursor-pointer flex flex-col ${
                            isSelected
                              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-400 dark:border-rose-500/50 shadow-sm'
                              : 'bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                          }`}
                        >
                          <span
                            className={`text-xs font-bold ${
                              isSelected
                                ? 'text-rose-700 dark:text-rose-300'
                                : 'text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            {r.label}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                            {r.desc}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Details text area */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                    Additional Details (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="Provide any specific context or messages that happened..."
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-rose-400 resize-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>

                {/* Auto block checkbox */}
                <label className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoBlock}
                    onChange={(e) => setAutoBlock(e.target.checked)}
                    className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300 dark:border-slate-700"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">
                      Block {reportedUser.name} immediately
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                      They will no longer be able to message you or view your online status.
                    </span>
                  </div>
                </label>

                {/* Actions */}
                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 rounded-full text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs tracking-wide shadow-md shadow-rose-600/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <ShieldAlert className="w-4 h-4" />
                        <span>Submit Report</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
