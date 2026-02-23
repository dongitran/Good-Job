import { useEffect, useMemo, useState } from 'react';
import { X, Star, Search } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cn, getInitials } from '@/lib/utils';
import { api, extractApiError } from '@/lib/api';
import { useOrgMembers } from '@/hooks/useOrgMembers';

interface CoreValue {
  id: string;
  name: string;
  emoji?: string;
}

interface GiveKudosModalProps {
  orgId: string;
  coreValues: CoreValue[];
  giveableBalance: number;
  minPerKudo: number;
  maxPerKudo: number;
  onClose: () => void;
}

export default function GiveKudosModal({
  orgId,
  coreValues,
  giveableBalance,
  minPerKudo,
  maxPerKudo,
  onClose,
}: GiveKudosModalProps) {
  const queryClient = useQueryClient();
  const [receiverId, setReceiverId] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [points, setPoints] = useState(25);
  const [valueId, setValueId] = useState('');
  const [message, setMessage] = useState('');
  const [searchQ, setSearchQ] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: members } = useOrgMembers(orgId, searchQ);
  const sliderMin = useMemo(() => Math.max(1, Math.trunc(minPerKudo || 1)), [minPerKudo]);
  const settingsMax = useMemo(
    () => Math.max(sliderMin, Math.trunc(maxPerKudo || sliderMin)),
    [maxPerKudo, sliderMin],
  );
  const effectiveGiveableBalance = useMemo(
    () => (giveableBalance > 0 ? giveableBalance : settingsMax),
    [giveableBalance, settingsMax],
  );
  const sliderMax = useMemo(
    () => Math.max(sliderMin, Math.min(settingsMax, effectiveGiveableBalance)),
    [effectiveGiveableBalance, settingsMax, sliderMin],
  );

  useEffect(() => {
    setPoints((prev) => Math.min(Math.max(prev, sliderMin), sliderMax));
  }, [sliderMin, sliderMax]);

  const isValid =
    !!receiverId &&
    points >= sliderMin &&
    points <= settingsMax &&
    (giveableBalance > 0 ? points <= giveableBalance : true) &&
    !!valueId &&
    message.trim().length >= 10;

  const handleSelectMember = (id: string, name: string) => {
    setReceiverId(id);
    setReceiverName(name);
    setSearchQ('');
    setShowDropdown(false);
  };

  const handleSubmit = async () => {
    if (!isValid || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await api.post('/kudos', { receiverId, points, valueId, message });
      await queryClient.invalidateQueries({ queryKey: ['feed'] });
      await queryClient.invalidateQueries({ queryKey: ['points', 'balance'] });
      toast.success('Kudos sent! 🎉');
      onClose();
    } catch (err) {
      toast.error(extractApiError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Dialog */}
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="flex flex-col items-center pt-8 pb-2 px-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-500 text-white shadow-md">
            <Star className="h-6 w-6" />
          </div>
          <h2 className="mt-3 text-xl font-bold text-slate-900">Give Kudos</h2>
          <p className="mt-1 text-sm text-slate-500">Recognize someone's great work</p>
        </div>

        <div className="px-6 pb-6 space-y-5 mt-4">
          {/* To: recipient search */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">To</label>
            <div className="relative">
              {receiverId ? (
                <div className="flex items-center justify-between rounded-xl border border-violet-300 bg-violet-50 px-3 py-2.5">
                  <span className="text-sm font-medium text-violet-800">{receiverName}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setReceiverId('');
                      setReceiverName('');
                    }}
                    className="text-violet-400 hover:text-violet-600 transition"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search for a teammate..."
                    value={searchQ}
                    onChange={(e) => {
                      setSearchQ(e.target.value);
                      setShowDropdown(true);
                    }}
                    onFocus={() => setShowDropdown(true)}
                    className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-4 text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-200"
                  />
                  {/* Dropdown */}
                  {showDropdown && members && members.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-10 mt-1 max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
                      {members.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition hover:bg-violet-50"
                          onClick={() => handleSelectMember(m.id, m.fullName)}
                        >
                          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-violet-100 text-[10px] font-bold text-violet-700">
                            {getInitials(m.fullName)}
                          </div>
                          <div>
                            <p className="font-medium text-slate-800">{m.fullName}</p>
                            <p className="text-xs text-slate-400">{m.email}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Points slider */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-700">
                Points{' '}
                <span className="font-normal text-slate-400">({giveableBalance} available)</span>
              </label>
              <span className="text-sm font-bold text-violet-600">{points} pts</span>
            </div>
            <input
              type="range"
              min={sliderMin}
              max={sliderMax}
              step={1}
              value={points}
              onChange={(e) => setPoints(Number(e.target.value))}
              className="w-full accent-violet-600"
            />
          </div>

          {/* Core value */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Core Value</label>
            <div className="grid grid-cols-2 gap-2">
              {coreValues.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setValueId(v.id)}
                  className={cn(
                    'rounded-xl border-2 p-2.5 text-sm font-medium text-left transition',
                    valueId === v.id
                      ? 'border-violet-500 bg-violet-50 text-violet-700'
                      : 'border-slate-200 text-slate-600 hover:border-violet-300',
                  )}
                >
                  {v.emoji} {v.name}
                </button>
              ))}
            </div>
          </div>

          {/* Message */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-700">Message</label>
              <span
                className={cn(
                  'text-xs',
                  message.trim().length >= 10 ? 'text-slate-400' : 'text-slate-300',
                )}
              >
                {message.trim().length}/10 min
              </span>
            </div>
            <textarea
              rows={3}
              placeholder="Tell them why they're awesome..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-200"
            />
          </div>

          {/* Submit */}
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={!isValid || isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-500 py-3 text-sm font-semibold text-white transition hover:brightness-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Sending...' : 'Send Kudos →'}
          </button>
        </div>
      </div>
    </div>
  );
}
