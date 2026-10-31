import React, { useState, useEffect } from 'react';
import { 
  X, Calendar, Clock, Users, CheckCircle2, AlertCircle, Phone, 
  Sparkles, ArrowRight, ArrowLeft, ShieldCheck, Check, CalendarPlus,
  HelpCircle, Info
} from 'lucide-react';
import { SupportedLanguage, TRANSLATIONS } from '../i18n/translations';
import { ReservationSettings, Reservation } from '../types';
import { api, SlotInfo } from '../services/api';

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLang: SupportedLanguage;
  reservationSettings?: ReservationSettings;
}

export const ReservationModal: React.FC<ReservationModalProps> = ({
  isOpen,
  onClose,
  currentLang,
  reservationSettings
}) => {
  const t = (key: string) => TRANSLATIONS[currentLang]?.[key] || TRANSLATIONS['en']?.[key] || key;
  const isRtl = currentLang === 'ar';

  // Wizard Step: 1 = Details (Date/Guests/Time), 2 = Contact, 3 = Review, 4 = Confirmation
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [guestsCount, setGuestsCount] = useState<number>(2);
  const [date, setDate] = useState<string>('');
  const [time, setTime] = useState<string>('');
  const [isWaitlistMode, setIsWaitlistMode] = useState<boolean>(false);

  // Contact Info
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+971');
  const [email, setEmail] = useState('');
  const [occasion, setOccasion] = useState<string>('none');
  const [specialRequests, setSpecialRequests] = useState('');

  // Slots State
  const [slots, setSlots] = useState<SlotInfo[]>([]);
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);
  const [isBlackoutDate, setIsBlackoutDate] = useState<boolean>(false);

  // Submission State
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmedReservation, setConfirmedReservation] = useState<{
    bookingRef: string;
    message: string;
    status: string;
  } | null>(null);

  // Minimum date is today (strictly in Dubai GST timezone)
  const getDubaiDateStr = (d = new Date()) => {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Dubai',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(d);
  };
  const todayStr = getDubaiDateStr();
  const maxDays = reservationSettings?.maxAdvanceDays || 30;
  const maxDateObj = new Date();
  maxDateObj.setDate(maxDateObj.getDate() + maxDays);
  const maxDateStr = getDubaiDateStr(maxDateObj);

  // Set default date when modal opens
  useEffect(() => {
    if (isOpen && !date) {
      setDate(todayStr);
    }
  }, [isOpen]);

  // Listen for Escape key to close modal
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleResetAndClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  // Fetch available slots whenever date changes
  useEffect(() => {
    if (!date) return;
    setLoadingSlots(true);
    setErrorMsg(null);
    setTime('');
    setIsWaitlistMode(false);

    api.getAvailableSlots(date)
      .then(res => {
        setIsBlackoutDate(res.isBlackout);
        setSlots(res.slots || []);
        // Auto pick first available slot
        const firstAvailable = res.slots.find(s => !s.isFull && s.availableGuests >= guestsCount);
        if (firstAvailable) {
          setTime(firstAvailable.time);
        }
      })
      .catch(err => {
        console.error('Error fetching slots:', err);
        setErrorMsg('Unable to retrieve available times. Please check connection.');
      })
      .finally(() => {
        setLoadingSlots(false);
      });
  }, [date, guestsCount]);

  if (!isOpen) return null;

  const maxGuests = reservationSettings?.maxGuestsPerParty || 12;

  // Validation before going to Step 2
  const handleProceedToStep2 = () => {
    setErrorMsg(null);
    if (!date) {
      setErrorMsg(currentLang === 'ar' ? 'يرجى اختيار تاريخ الحجز' : 'Please select a reservation date');
      return;
    }
    if (!time) {
      setErrorMsg(currentLang === 'ar' ? 'يرجى اختيار وقت الحجز المتاح' : 'Please select an available dining time');
      return;
    }
    setCurrentStep(2);
  };

  // Validation before going to Step 3 (Review)
  const handleProceedToStep3 = () => {
    setErrorMsg(null);
    if (!customerName.trim()) {
      setErrorMsg(currentLang === 'ar' ? 'يرجى إدخال اسمك الكريم' : 'Please enter your full name');
      return;
    }
    if (!phone.trim() || phone.trim().length < 6) {
      setErrorMsg(currentLang === 'ar' ? 'يرجى إدخال رقم هاتف محمول صالح' : 'Please enter a valid mobile number');
      return;
    }
    setCurrentStep(3);
  };

  // Submit Reservation
  const handleFinalSubmit = async () => {
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const response = await api.submitReservation({
        customerName: customerName.trim(),
        phone: phone.trim(),
        countryCode,
        email: email.trim() || undefined,
        guestsCount,
        date,
        time,
        occasion: occasion !== 'none' ? occasion : undefined,
        specialRequests: specialRequests.trim() || undefined,
        isWaitlist: isWaitlistMode
      });

      if (response.success) {
        setConfirmedReservation({
          bookingRef: response.bookingRef,
          message: response.message,
          status: response.status
        });
        setCurrentStep(4);
      }
    } catch (err: any) {
      setErrorMsg(err.message || (currentLang === 'ar' ? 'تعذر إرسال الحجز، يرجى المحاولة ثانية' : 'Failed to submit reservation'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setCurrentStep(1);
    setConfirmedReservation(null);
    setCustomerName('');
    setPhone('');
    setEmail('');
    setOccasion('none');
    setSpecialRequests('');
    setIsWaitlistMode(false);
    onClose();
  };

  // Helper to generate Google Calendar link
  const getGoogleCalendarUrl = () => {
    if (!date || !time) return '#';
    const [year, month, day] = date.split('-');
    const [hour, minute] = time.split(':');
    const startIso = `${year}${month}${day}T${hour}${minute}00`;
    // Approx 2 hours duration
    const endHour = String((Number(hour) + 2) % 24).padStart(2, '0');
    const endIso = `${year}${month}${day}T${endHour}${minute}00`;
    const title = encodeURIComponent('Reservation at GIA Restaurant Dubai');
    const details = encodeURIComponent(`Booking Ref: ${confirmedReservation?.bookingRef || ''}\nGuests: ${guestsCount}\nVenue: GIA Dubai, Fashion Avenue, Dubai Mall\nHost Phone: +971 4 330 8899`);
    const location = encodeURIComponent('GIA Dubai, Ground Floor, Fashion Avenue, The Dubai Mall, Downtown Dubai');
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startIso}/${endIso}&details=${details}&location=${location}`;
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 cursor-pointer"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleResetAndClose();
        }
      }}
    >
      <div
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-6 cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header Bar */}
        <div className="bg-[#283618] px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-[#dda15e]">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-xl font-bold tracking-tight">
                {currentLang === 'ar' ? 'حجز طاولة في مطعم جيا دبي' : t('res_title')}
              </h2>
              <p className="text-xs text-stone-300">
                {currentLang === 'ar' ? 'دبي مول · جادة الأزياء Fashion Avenue · إطلالة النافورة' : 'GIA Dubai Mall · Fashion Avenue · Fountain View'}
              </p>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Multi-Step Indicator (Steps 1 to 3) */}
        {currentStep < 4 && (
          <div className="bg-[#faf8f5] px-6 py-3 border-b border-stone-200">
            <div className="flex items-center justify-between max-w-md mx-auto text-xs">
              
              {/* Step 1 badge */}
              <button
                type="button"
                onClick={() => currentStep > 1 && setCurrentStep(1)}
                className={`flex items-center gap-1.5 font-semibold transition-colors ${
                  currentStep === 1 ? 'text-[#283618]' : 'text-stone-400 hover:text-stone-600'
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                  currentStep === 1 ? 'bg-[#283618] text-white' : currentStep > 1 ? 'bg-emerald-600 text-white' : 'bg-stone-200 text-stone-600'
                }`}>
                  {currentStep > 1 ? '✓' : '1'}
                </span>
                <span>{currentLang === 'ar' ? 'الموعد والضيوف' : 'Date & Guests'}</span>
              </button>

              <div className="h-0.5 w-8 bg-stone-200" />

              {/* Step 2 badge */}
              <button
                type="button"
                onClick={() => currentStep > 2 && setCurrentStep(2)}
                className={`flex items-center gap-1.5 font-semibold transition-colors ${
                  currentStep === 2 ? 'text-[#283618]' : 'text-stone-400 hover:text-stone-600'
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                  currentStep === 2 ? 'bg-[#283618] text-white' : currentStep > 2 ? 'bg-emerald-600 text-white' : 'bg-stone-200 text-stone-600'
                }`}>
                  {currentStep > 2 ? '✓' : '2'}
                </span>
                <span>{currentLang === 'ar' ? 'بيانات التواصل' : 'Contact'}</span>
              </button>

              <div className="h-0.5 w-8 bg-stone-200" />

              {/* Step 3 badge */}
              <div className={`flex items-center gap-1.5 font-semibold ${
                currentStep === 3 ? 'text-[#283618]' : 'text-stone-400'
              }`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                  currentStep === 3 ? 'bg-[#283618] text-white' : 'bg-stone-200 text-stone-600'
                }`}>
                  3
                </span>
                <span>{currentLang === 'ar' ? 'مراجعة وتأكيد' : 'Review'}</span>
              </div>

            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 sm:p-8">

          {errorMsg && (
            <div className="mb-5 p-3.5 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: GUESTS, DATE, AND TIME SLOTS */}
          {currentStep === 1 && (
            <div className="space-y-6">
              
              {/* Instructions banner */}
              <div className="p-3.5 bg-amber-50/90 rounded-2xl border border-amber-200/80 text-xs text-amber-900 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-[#bc6c25] shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block mb-0.5">
                    {currentLang === 'ar' ? 'تجربة طعام إيطالية استثنائية' : t('res_instructions_title')}
                  </span>
                  <p className="text-[11px] text-amber-800/90 leading-relaxed font-light">
                    {reservationSettings?.instructions?.[currentLang] || 
                     reservationSettings?.instructions?.['en'] || 
                     (currentLang === 'ar' ? 'يُرجى اختيار موعد الحجز وعدد الضيوف. المواعيد معروضة بالتوقيت المحلي لمدينة دبي (GST).' : t('res_subtitle'))}
                  </p>
                </div>
              </div>

              {/* Date & Party Size */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Date Picker */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                    {currentLang === 'ar' ? 'تاريخ الحجز' : t('res_date')} *
                  </label>
                  <input
                    type="date"
                    required
                    min={todayStr}
                    max={maxDateStr}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#283618]"
                  />
                  <span className="text-[10px] text-stone-400 mt-1 block">
                    {currentLang === 'ar' ? 'الحجز متاح حتى 30 يوماً مقدماً' : `Advance booking up to ${maxDays} days`}
                  </span>
                </div>

                {/* Guests Count Selector */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                    {currentLang === 'ar' ? 'عدد الضيوف' : t('res_guests')} *
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setGuestsCount(Math.max(1, guestsCount - 1))}
                      className="w-10 h-10 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold flex items-center justify-center transition-colors"
                    >
                      -
                    </button>
                    <div className="flex-1 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-center text-xs sm:text-sm font-semibold text-stone-900">
                      {guestsCount} {currentLang === 'ar' ? (guestsCount === 1 ? 'ضيف واحد' : guestsCount === 2 ? 'ضيفان' : 'ضيوف') : (guestsCount === 1 ? 'Guest' : 'Guests')}
                    </div>
                    <button
                      type="button"
                      onClick={() => setGuestsCount(Math.min(maxGuests, guestsCount + 1))}
                      className="w-10 h-10 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold flex items-center justify-center transition-colors"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-[10px] text-stone-400 mt-1 block">
                    {currentLang === 'ar' ? 'للمجموعات الأكثر من 12 شخصاً، يرجى التواصل هاتفياً' : 'For parties above 12, please call directly'}
                  </span>
                </div>

              </div>

              {/* Time Slots Selector */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#283618]" />
                    <span>{currentLang === 'ar' ? 'الوقت المتاح' : t('res_time')} *</span>
                  </label>
                  <span className="text-[10px] font-medium text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md">
                    {currentLang === 'ar' ? 'توقيت دبي (GST / GMT+4)' : 'Dubai GST Timezone'}
                  </span>
                </div>

                {loadingSlots ? (
                  <div className="py-8 text-center text-xs text-stone-500 bg-stone-50 rounded-xl border border-dashed border-stone-200">
                    <div className="animate-spin w-5 h-5 border-2 border-[#283618] border-t-transparent rounded-full mx-auto mb-2" />
                    <span>{currentLang === 'ar' ? 'جاري التحقق من توفر الطاولات...' : `Checking table capacity for ${date}...`}</span>
                  </div>
                ) : isBlackoutDate ? (
                  <div className="p-4 text-center text-xs text-amber-800 bg-amber-50 rounded-xl border border-amber-200">
                    {currentLang === 'ar' ? 'المطعم مغلق للحجوزات في هذا التاريخ المختار (مناسبة خاصة).' : t('res_closed_date')}
                  </div>
                ) : slots.length === 0 ? (
                  <div className="p-4 text-center text-xs text-stone-500 bg-stone-50 rounded-xl border border-stone-200">
                    {currentLang === 'ar' ? 'لا توجد فترات متاحة في هذا اليوم.' : t('res_no_slots')}
                  </div>
                ) : (
                  <div>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 max-h-48 overflow-y-auto p-1.5 bg-stone-50/50 rounded-xl border border-stone-100">
                      {slots.map((s) => {
                        const isCapacityFull = s.isFull || s.availableGuests < guestsCount;
                        const isSelected = time === s.time;
                        return (
                          <button
                            key={s.time}
                            type="button"
                            onClick={() => {
                              setTime(s.time);
                              setIsWaitlistMode(isCapacityFull);
                            }}
                            className={`py-2.5 px-1.5 rounded-xl text-xs font-semibold text-center transition-all flex flex-col items-center justify-center ${
                              isSelected
                                ? isWaitlistMode
                                  ? 'bg-amber-700 text-white shadow-sm ring-2 ring-amber-500'
                                  : 'bg-[#283618] text-white shadow-sm ring-2 ring-[#283618]'
                                : isCapacityFull
                                ? 'bg-amber-50/80 border border-amber-200 text-amber-800 hover:bg-amber-100'
                                : 'bg-white border border-stone-200 text-stone-800 hover:border-[#283618] hover:bg-stone-50'
                            }`}
                          >
                            <span className="tabular-nums text-xs">{s.time}</span>
                            <span className={`text-[9px] mt-0.5 ${
                              isSelected ? 'text-white/80' : isCapacityFull ? 'text-amber-700' : 'text-stone-400'
                            }`}>
                              {isCapacityFull ? (currentLang === 'ar' ? 'قائمة انتظار' : 'Waitlist') : (currentLang === 'ar' ? 'متاح' : 'Available')}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Waitlist explanation notice if selected */}
                    {isWaitlistMode && (
                      <div className="mt-2.5 p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px] flex items-center gap-2">
                        <Info className="w-4 h-4 shrink-0 text-amber-700" />
                        <span>
                          {currentLang === 'ar' 
                            ? 'هذا الموعد مكتمل السعة. باختياره، سيتم إدراج طلبك في قائمة الانتظار (Waitlist) وسيتواصل معك الاستقبال فور توفر مقاعد.'
                            : 'This time slot is full. Selecting it will place your request on the priority Waitlist.'}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Step 1 Actions */}
              <div className="pt-2">
                <button
                  type="button"
                  disabled={!time || isBlackoutDate || loadingSlots}
                  onClick={handleProceedToStep2}
                  className="w-full py-3.5 bg-[#283618] hover:bg-[#1c2711] disabled:bg-stone-300 text-white font-semibold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                >
                  <span>{currentLang === 'ar' ? 'متابعة لبيانات التواصل' : 'Continue to Contact Details'}</span>
                  {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                </button>
              </div>

            </div>
          )}

          {/* STEP 2: CONTACT DETAILS & REQUESTS */}
          {currentStep === 2 && (
            <div className="space-y-5">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                    {currentLang === 'ar' ? 'الاسم الكامل' : t('res_name')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder={currentLang === 'ar' ? 'مثال: محمد بن راشد' : 'e.g. Tariq Al-Mansoor'}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#283618]"
                  />
                </div>

                {/* Phone & Country Code */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                    {currentLang === 'ar' ? 'رقم الهاتف المحمول' : t('res_phone')} *
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="w-24 px-2 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#283618]"
                    >
                      <option value="+971">🇦🇪 +971</option>
                      <option value="+966">🇸🇦 +966</option>
                      <option value="+965">🇰🇼 +965</option>
                      <option value="+974">🇶🇦 +974</option>
                      <option value="+968">🇴🇲 +968</option>
                      <option value="+973">🇧🇭 +973</option>
                      <option value="+44">🇬🇧 +44</option>
                      <option value="+1">🇺🇸 +1</option>
                      <option value="+39">🇮🇹 +39</option>
                      <option value="+33">🇫🇷 +33</option>
                      <option value="+49">🇩🇪 +49</option>
                      <option value="+91">🇮🇳 +91</option>
                      <option value="+86">🇨🇳 +86</option>
                      <option value="+63">🇵🇭 +63</option>
                    </select>

                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="50 123 4567"
                      className="flex-1 px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#283618]"
                    />
                  </div>
                </div>

                {/* Email (Optional) */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-semibold text-stone-700">
                      {currentLang === 'ar' ? 'البريد الإلكتروني' : t('res_email')}
                    </label>
                    <span className="text-[10px] text-stone-400">
                      {currentLang === 'ar' ? '(اختياري)' : '(Optional)'}
                    </span>
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="guest@example.com"
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#283618]"
                  />
                </div>

                {/* Occasion (Optional) */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-semibold text-stone-700">
                      {currentLang === 'ar' ? 'المناسبة' : t('res_occasion')}
                    </label>
                    <span className="text-[10px] text-stone-400">
                      {currentLang === 'ar' ? '(اختياري)' : '(Optional)'}
                    </span>
                  </div>
                  <select
                    value={occasion}
                    onChange={(e) => setOccasion(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#283618]"
                  >
                    <option value="none">{currentLang === 'ar' ? 'بدون مناسبة خاصة' : t('res_occasion_none')}</option>
                    <option value="Birthday">{currentLang === 'ar' ? 'عيد ميلاد' : t('res_occasion_birthday')}</option>
                    <option value="Anniversary">{currentLang === 'ar' ? 'ذكرى زواج' : t('res_occasion_anniversary')}</option>
                    <option value="Business">{currentLang === 'ar' ? 'غداء أو عشاء عمل' : t('res_occasion_business')}</option>
                    <option value="Family">{currentLang === 'ar' ? 'عائلي' : t('res_occasion_family')}</option>
                    <option value="Romance">{currentLang === 'ar' ? 'أمسية رومانسية' : 'Romantic Dinner'}</option>
                  </select>
                </div>

              </div>

              {/* Special Requests (Optional) */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold text-stone-700">
                    {currentLang === 'ar' ? 'ملاحظات أو طلبات خاصة' : t('res_special_requests')}
                  </label>
                  <span className="text-[10px] text-stone-400">
                    {currentLang === 'ar' ? '(اختياري)' : '(Optional)'}
                  </span>
                </div>
                <textarea
                  rows={2}
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  placeholder={currentLang === 'ar' ? 'مثال: تفضيل شرفة إطلالة النافورة، كرسي أطفال، أو حساسية من المكسرات...' : 'e.g. Fountain view terrace preference, high chair for child, or allergy details...'}
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#283618]"
                />
              </div>

              {/* Navigation Buttons */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-5 py-3.5 border border-stone-200 hover:bg-stone-50 text-stone-700 font-semibold text-xs rounded-xl transition-colors"
                >
                  {currentLang === 'ar' ? 'رجوع' : 'Back'}
                </button>
                <button
                  type="button"
                  onClick={handleProceedToStep3}
                  className="flex-1 py-3.5 bg-[#283618] hover:bg-[#1c2711] text-white font-semibold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{currentLang === 'ar' ? 'مراجعة وتأكيد الطلب' : 'Review Reservation Details'}</span>
                  {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                </button>
              </div>

            </div>
          )}

          {/* STEP 3: REVIEW & ORDER SUMMARY BEFORE SENDING */}
          {currentStep === 3 && (
            <div className="space-y-6">
              
              <div className="text-center">
                <h3 className="font-serif text-lg font-bold text-stone-900">
                  {currentLang === 'ar' ? 'مراجعة تفاصيل الحجز' : 'Review Your Reservation'}
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  {currentLang === 'ar' ? 'يرجى التأكد من صحة البيانات قبل إرسال طلب الحجز' : 'Please check your details before final confirmation'}
                </p>
              </div>

              {/* Summary Card */}
              <div className="bg-[#faf8f5] rounded-2xl p-5 border border-stone-200 divide-y divide-stone-200/80 text-xs text-stone-700 space-y-3">
                
                <div className="flex justify-between items-center pb-2">
                  <span className="text-stone-500">{currentLang === 'ar' ? 'التاريخ والوقت:' : 'Date & Time:'}</span>
                  <span className="font-bold text-stone-900 tabular-nums">
                    {date} · {time} ({currentLang === 'ar' ? 'توقيت دبي' : 'Dubai GST'})
                  </span>
                </div>

                <div className="flex justify-between items-center pt-2 pb-2">
                  <span className="text-stone-500">{currentLang === 'ar' ? 'عدد الضيوف:' : 'Guests:'}</span>
                  <span className="font-bold text-stone-900">
                    {guestsCount} {currentLang === 'ar' ? 'أشخاص' : 'Guests'}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-2 pb-2">
                  <span className="text-stone-500">{currentLang === 'ar' ? 'الاسم الكريم:' : 'Guest Name:'}</span>
                  <span className="font-bold text-stone-900">{customerName}</span>
                </div>

                <div className="flex justify-between items-center pt-2 pb-2">
                  <span className="text-stone-500">{currentLang === 'ar' ? 'رقم الهاتف:' : 'Phone Number:'}</span>
                  <span className="font-bold text-stone-900 dir-ltr">{countryCode} {phone}</span>
                </div>

                {email && (
                  <div className="flex justify-between items-center pt-2 pb-2">
                    <span className="text-stone-500">{currentLang === 'ar' ? 'البريد الإلكتروني:' : 'Email:'}</span>
                    <span className="font-semibold text-stone-800">{email}</span>
                  </div>
                )}

                {occasion && occasion !== 'none' && (
                  <div className="flex justify-between items-center pt-2 pb-2">
                    <span className="text-stone-500">{currentLang === 'ar' ? 'المناسبة:' : 'Occasion:'}</span>
                    <span className="font-semibold text-[#bc6c25]">{occasion}</span>
                  </div>
                )}

                {specialRequests && (
                  <div className="pt-2">
                    <span className="text-stone-500 block mb-1">{currentLang === 'ar' ? 'الطلبات والملاحظات:' : 'Special Requests:'}</span>
                    <p className="font-normal text-stone-800 bg-white p-2.5 rounded-lg border border-stone-200 italic">
                      "{specialRequests}"
                    </p>
                  </div>
                )}

                {isWaitlistMode && (
                  <div className="pt-2 bg-amber-50 p-2.5 rounded-lg border border-amber-200 text-amber-900">
                    <strong>{currentLang === 'ar' ? 'نوع الحجز: قائمة الانتظار (Waitlist)' : 'Status: Waitlist Entry'}</strong>
                  </div>
                )}

              </div>

              {/* Crucial Cancellation Policy Notice */}
              <div className="p-3.5 bg-stone-100 rounded-2xl border border-stone-200 text-xs text-stone-700 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-[#283618] shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-stone-900 font-semibold mb-0.5">
                    {currentLang === 'ar' ? 'سياسة الإلغاء والتعديل:' : 'Cancellation & Modification Policy:'}
                  </strong>
                  <p className="text-[11px] text-stone-600 leading-relaxed">
                    {currentLang === 'ar'
                      ? 'أي تعديل أو إلغاء للحجز يتم حصرياً عبر التواصل المباشر مع فريق الاستقبال في المطعم هاتفياً أو عبر الواتساب مع تزويدنا بالرقم المرجعي للحجز.'
                      : 'All modifications or cancellations must be handled directly with our restaurant team via phone or WhatsApp quoting your booking reference.'}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setCurrentStep(2)}
                  className="px-5 py-3.5 border border-stone-200 hover:bg-stone-50 text-stone-700 font-semibold text-xs rounded-xl transition-colors"
                >
                  {currentLang === 'ar' ? 'تعديل التفاصيل' : 'Edit Details'}
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleFinalSubmit}
                  className="flex-1 py-3.5 bg-[#bc6c25] hover:bg-[#a1581b] disabled:bg-stone-300 text-white font-semibold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {submitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>{currentLang === 'ar' ? 'جاري إرسال الحجز...' : 'Submitting booking...'}</span>
                    </div>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{currentLang === 'ar' ? 'تأكيد وإرسال الحجز الآن' : 'Confirm & Send Reservation'}</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          )}

          {/* STEP 4: SUCCESS CONFIRMATION STATE */}
          {currentStep === 4 && confirmedReservation && (
            <div className="text-center py-4 space-y-5 animate-in fade-in duration-300">
              
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border-4 border-emerald-100">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h3 className="font-serif text-2xl font-bold text-stone-900">
                  {confirmedReservation.status === 'waitlist'
                    ? (currentLang === 'ar' ? 'تم تسجيلك في قائمة الانتظار بنجاح' : 'Registered on Waitlist')
                    : (currentLang === 'ar' ? 'تم استلام وتأكيد طلب الحجز' : t('res_success_title'))}
                </h3>
                <p className="text-xs text-stone-600 mt-2 max-w-md mx-auto">
                  {confirmedReservation.message}
                </p>
              </div>

              {/* Unique Booking Reference Code */}
              <div className="py-4 px-6 bg-stone-100 rounded-2xl max-w-xs mx-auto border border-stone-200">
                <span className="text-[10px] uppercase font-bold text-stone-400 tracking-widest block">
                  {currentLang === 'ar' ? 'الرقم المرجعي للحجز' : 'Booking Reference'}
                </span>
                <span className="font-serif text-3xl font-extrabold text-[#283618] tracking-widest tabular-nums mt-1 block">
                  {confirmedReservation.bookingRef}
                </span>
                <span className="text-xs text-stone-600 mt-1 block font-medium">
                  {currentLang === 'ar' ? 'الحالة:' : 'Status:'}{' '}
                  <strong className="capitalize text-[#bc6c25]">
                    {confirmedReservation.status === 'confirmed'
                      ? (currentLang === 'ar' ? 'مؤكد تلقائياً' : 'Confirmed')
                      : confirmedReservation.status === 'waitlist'
                      ? (currentLang === 'ar' ? 'قائمة الانتظار' : 'Waitlist')
                      : (currentLang === 'ar' ? 'قيد المراجعة الفورية' : 'Pending Review')}
                  </strong>
                </span>
              </div>

              {/* Reservation Snapshot */}
              <div className="bg-[#faf8f5] p-4 rounded-xl border border-stone-200 text-xs text-stone-700 max-w-md mx-auto text-left rtl:text-right space-y-2">
                <div className="flex justify-between">
                  <span className="text-stone-500">{currentLang === 'ar' ? 'اسم الضيف:' : 'Guest Name:'}</span>
                  <span className="font-semibold text-stone-900">{customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">{currentLang === 'ar' ? 'الموعد:' : 'Date & Time:'}</span>
                  <span className="font-semibold text-stone-900 tabular-nums">{date} at {time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">{currentLang === 'ar' ? 'عدد الضيوف:' : 'Party Size:'}</span>
                  <span className="font-semibold text-stone-900">{guestsCount} {currentLang === 'ar' ? 'ضيوف' : 'Guests'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">{currentLang === 'ar' ? 'الهاتف:' : 'Contact:'}</span>
                  <span className="font-semibold text-stone-900 dir-ltr">{countryCode} {phone}</span>
                </div>
              </div>

              {/* PROMINENT DIRECT CONTACT CANCELLATION NOTICE AS REQUIRED */}
              <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200 text-emerald-950 text-xs text-left rtl:text-right max-w-md mx-auto space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                  <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>{currentLang === 'ar' ? 'تعديل أو إلغاء الحجز عبر التواصل المباشر' : 'Modifications & Cancellations via Direct Contact'}</span>
                </div>
                <p className="text-[11px] leading-relaxed text-emerald-800">
                  {currentLang === 'ar'
                    ? 'في حال رغبتكم في تعديل الموعد أو إلغاء الحجز، يُرجى التواصل مباشرة مع فريق الاستقبال هاتفياً على 8899 330 4 971+ أو عبر الواتساب على 4567 123 50 971+ مع ذكر الرقم المرجعي.'
                    : 'To modify or cancel your booking, please contact our restaurant host team directly by phone at +971 4 330 8899 or WhatsApp at +971 50 123 4567 quoting your reference number.'}
                </p>
              </div>

              {/* Action Buttons: Add to Google Calendar & Done */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
                <a
                  href={getGoogleCalendarUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold rounded-xl border border-stone-200 flex items-center justify-center gap-2 transition-colors"
                >
                  <CalendarPlus className="w-4 h-4 text-[#283618]" />
                  <span>{currentLang === 'ar' ? 'إضافة إلى تقويم Google' : 'Add to Google Calendar'}</span>
                </a>

                <button
                  onClick={handleResetAndClose}
                  className="w-full sm:w-auto px-8 py-2.5 bg-[#283618] hover:bg-[#1a2410] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {currentLang === 'ar' ? 'تم الانتهاء' : 'Done'}
                </button>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
