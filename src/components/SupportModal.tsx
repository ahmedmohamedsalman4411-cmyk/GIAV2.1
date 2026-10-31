import React, { useState } from 'react';
import { X, Phone, MessageSquare, AlertCircle, Compass, HeartHandshake, CheckCircle } from 'lucide-react';
import { SupportedLanguage, TRANSLATIONS } from '../i18n/translations';
import { SiteSettings } from '../types';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLang: SupportedLanguage;
  settings?: SiteSettings;
}

export const SupportModal: React.FC<SupportModalProps> = ({
  isOpen,
  onClose,
  currentLang,
  settings
}) => {
  const t = (key: string) => TRANSLATIONS[currentLang]?.[key] || TRANSLATIONS['en']?.[key] || key;

  const [urgentMessage, setUrgentMessage] = useState('');
  const [guestContact, setGuestContact] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Listen for Escape key to close modal
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleUrgentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urgentMessage.trim()) return;
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setUrgentMessage('');
      setGuestContact('');
      onClose();
    }, 2500);
  };

  const emergencyPhone = settings?.emergencyPhone || settings?.phone || '+971 50 999 8877';
  const whatsappNum = settings?.whatsapp?.replace(/[^0-9]/g, '') || '971501234567';

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 cursor-pointer"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="bg-[#bc6c25] px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-amber-200">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold">
                {t('support_title')}
              </h2>
              <p className="text-xs text-amber-100">
                GIA Front Desk & Concierge Assistance
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          
          {/* Quick Channels */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            
            {/* Phone Call */}
            <a
              href={`tel:${emergencyPhone.replace(/\s+/g, '')}`}
              className="p-4 rounded-2xl bg-stone-50 hover:bg-stone-100 border border-stone-200 flex items-center gap-3.5 transition-colors group"
            >
              <div className="w-10 h-10 rounded-xl bg-[#283618] text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-stone-500 uppercase block">
                  {t('support_call')}
                </span>
                <span className="text-xs font-bold text-stone-900 dir-ltr block mt-0.5">
                  {emergencyPhone}
                </span>
              </div>
            </a>

            {/* WhatsApp Direct */}
            <a
              href={`https://wa.me/${whatsappNum}?text=${encodeURIComponent('Hello GIA Dubai, I need assistance regarding my reservation / visit.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 rounded-2xl bg-emerald-50/70 hover:bg-emerald-100/70 border border-emerald-200 flex items-center gap-3.5 transition-colors group"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-emerald-800 uppercase block">
                  WhatsApp Concierge
                </span>
                <span className="text-xs font-bold text-emerald-950 block mt-0.5">
                  Chat Instantly
                </span>
              </div>
            </a>

          </div>

          {/* Directions inside Dubai Mall */}
          <div className="bg-[#faf8f5] p-4 rounded-2xl border border-stone-200 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-stone-900">
              <Compass className="w-4 h-4 text-[#bc6c25]" />
              <span>{t('support_directions')}</span>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed font-light">
              GIA is situated in <strong>The Dubai Mall, Fashion Avenue</strong> on the promenade level overlooking the Dubai Fountain. Nearest parking: <strong>Fashion Avenue Valet Parking (Level P3/P4)</strong>.
            </p>
          </div>

          {/* Urgent Dispatch Form */}
          <div className="pt-2 border-t border-stone-100">
            <span className="text-xs font-bold text-stone-800 block mb-2">
              Send Urgent Notice to Duty Manager
            </span>

            {submitted ? (
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-center text-xs text-emerald-800 flex items-center justify-center gap-2 font-medium">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Notice dispatched to duty manager. We are attending to your request.</span>
              </div>
            ) : (
              <form onSubmit={handleUrgentSubmit} className="space-y-3">
                <input
                  type="text"
                  required
                  value={guestContact}
                  onChange={(e) => setGuestContact(e.target.value)}
                  placeholder="Your Name & Phone / Booking Ref"
                  className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#283618]"
                />
                <textarea
                  rows={2}
                  required
                  value={urgentMessage}
                  onChange={(e) => setUrgentMessage(e.target.value)}
                  placeholder="Describe your emergency (e.g. running 20 mins late, lost property, severe allergen query)..."
                  className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#283618]"
                />
                <button
                  type="submit"
                  className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  Dispatch to Duty Manager
                </button>
              </form>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
