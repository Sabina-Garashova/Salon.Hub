import React, { useState, useEffect, useMemo } from 'react';
import { Star,
  MessageSquare,
  Clock,
  AlertCircle,
  Scissors,
  Building,
  Send,
  Search,
  CheckCircle2,
  Sparkles,
  CornerDownRight,
  Loader2,
  Filter,
  X
} from 'lucide-react';

export default function ReviewsManagement({
  reviews = [],
  employees = [],
  onRespond,
  showSalonName = false
}) {
  const [fetchedEmployees, setFetchedEmployees] = useState([]);

  useEffect(() => {
    const fetchEmps = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("https://localhost:7289/api/Employee", {
          headers: { Authorization: token ? `Bearer ${token}` : "" }
        });
        if (res.ok) {
          const data = await res.json();
          setFetchedEmployees(data || []);
        }
      } catch (e) {
        console.error("Employee fetch error:", e);
      }
    };
    fetchEmps();
  }, []);

  const getEmployeeName = (r) => {
    if (r.employeeFullName) return r.employeeFullName;
    if (!r.employeeId) return null;
    const list = (employees && employees.length > 0) ? employees : fetchedEmployees;
    const found = list.find(e => String(e.id) === String(r.employeeId));
    return found ? (found.fullName || (found.firstName ? `${found.firstName} ${found.lastName || ''}` : null)) : null;
  };
  const [selectedRating, setSelectedRating] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [replyingId, setReplyingId] = useState(null);
  const [replyTexts, setReplyTexts] = useState({});
  const [loadingIds, setLoadingIds] = useState({});
  const [successIds, setSuccessIds] = useState({});

  const totalReviews = reviews.length;

  const unansweredCount = useMemo(() => {
    return reviews.filter(r => !r.response).length;
  }, [reviews]);

  const avgRating = useMemo(() => {
    if (!reviews.length) return '0.0';
    const sum = reviews.reduce((acc, curr) => acc + (curr.rating || 0), 0);
    return (sum / reviews.length).toFixed(1);
  }, [reviews]);

  const ratingCounts = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(r => {
      if (counts[r.rating] !== undefined) counts[r.rating]++;
    });
    return counts;
  }, [reviews]);

  const filteredReviews = useMemo(() => {
    return reviews
      .filter(r => {
        if (selectedRating !== 'all' && r.rating !== Number(selectedRating)) {
          return false;
        }
        if (statusFilter === 'unanswered' && r.response) return false;
        if (statusFilter === 'answered' && !r.response) return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchCustomer = r.customerFullName?.toLowerCase().includes(q);
          const matchEmployee = getEmployeeName(r)?.toLowerCase().includes(q);
          const matchSalon = r.salonName?.toLowerCase().includes(q);
          const matchComment = r.comment?.toLowerCase().includes(q);
          return matchCustomer || matchEmployee || matchSalon || matchComment;
        }
        return true;
      })
      .sort((a, b) => {
        if (!a.response && b.response) return -1;
        if (a.response && !b.response) return 1;
        return b.id - a.id;
      });
  }, [reviews, selectedRating, statusFilter, searchQuery]);

  const handleSendResponse = async (reviewId) => {
    const text = replyTexts[reviewId]?.trim();
    if (!text) return;

    setLoadingIds(prev => ({ ...prev, [reviewId]: true }));
    try {
      if (onRespond) {
        await onRespond(reviewId, text);
      }
      setSuccessIds(prev => ({ ...prev, [reviewId]: true }));
      setReplyingId(null);
      setReplyTexts(prev => ({ ...prev, [reviewId]: '' }));

      setTimeout(() => {
        setSuccessIds(prev => ({ ...prev, [reviewId]: false }));
      }, 4000);
    } catch (err) {
      console.error('Cavab gonderilerken xeta', err);
    } finally {
      setLoadingIds(prev => ({ ...prev, [reviewId]: false }));
    }
  };

  const getInitials = (name) => {
    if (!name) return 'M';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0][0].toUpperCase();
  };

  return (
    <div className="w-full min-h-screen bg-[#FAF6F0] text-[#1A1714] font-sans -m-6 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5DFD5] pb-6">
          <div>
            <div className="flex items-center gap-2 text-[#C9A227] text-xs uppercase tracking-widest font-semibold mb-1">
              <Sparkles className="w-4 h-4" /> SalonHub Feedback
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#1A1714]">
              Musteri Reyleri ve Reytinqler
            </h1>
            <p className="text-[#8C8275] text-sm mt-1">
              Xidmetleriniz haqqinda yazilan reyleri idare edin ve musterilerle birbasa unsiyyet qurun.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

          <div className="bg-gradient-to-b from-[#FAF6F0] to-[#F3EAE0] rounded-2xl p-6 border border-[#EBDCC5] shadow-sm flex items-center justify-between relative overflow-hidden group hover:border-[#C9A227]/40 transition-all duration-300">
            <div className="space-y-1">
              <p className="text-sm font-medium text-[#8C8275]">Umumi Rey Sayi</p>
              <h2 className="font-serif text-3xl font-bold text-[#1A1714]">{totalReviews}</h2>
              <p className="text-xs text-[#B8935A] font-medium">Butun zamanlar uzre</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-[#FAF6F0] flex items-center justify-center text-[#1A1714] border border-[#E5DFD5] group-hover:scale-105 transition-transform duration-300">
              <MessageSquare className="w-7 h-7 text-[#C9A227]" />
            </div>
          </div>

          <div className="bg-gradient-to-b from-[#FAF6F0] to-[#F3EAE0] rounded-2xl p-6 border border-[#EBDCC5] shadow-sm flex items-center justify-between relative overflow-hidden group hover:border-[#C9A227]/40 transition-all duration-300">
            <div className="space-y-2">
              <p className="text-sm font-medium text-[#8C8275]">Ortalama Reytinq</p>
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-3xl font-bold text-[#1A1714]">{avgRating}</span>
                <span className="text-xs text-[#8C8275]">/ 5.0</span>
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={"w-4 h-4 " + (star <= Math.round(Number(avgRating)) ? 'text-[#C9A227] fill-[#C9A227]' : 'text-[#E5DFD5] fill-[#E5DFD5]')}
                  />
                ))}
              </div>
            </div>

            <div className="hidden sm:flex flex-col gap-1 w-24">
              {[5, 4, 3, 2, 1].map((st) => {
                const count = ratingCounts[st] || 0;
                const percent = totalReviews ? (count / totalReviews) * 100 : 0;
                return (
                  <div key={st} className="flex items-center gap-1.5 text-[10px] text-[#8C8275]">
                    <span className="w-2">{st}</span>
                    <Star className="w-2.5 h-2.5 text-[#C9A227] fill-[#C9A227]" />
                    <div className="flex-1 h-1.5 bg-[#FAF6F0] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#C9A227] rounded-full"
                        style={{ width: percent + '%' }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className={"rounded-2xl p-6 border shadow-sm flex items-center justify-between relative overflow-hidden transition-all duration-300 " + (unansweredCount > 0 ? 'bg-[#1A1714] border-[#C9A227] text-white' : 'bg-white border-[#E5DFD5] text-[#1A1714]')}>
            <div className="space-y-2 z-10">
              <div className="flex items-center gap-2">
                <p className={"text-sm font-medium " + (unansweredCount > 0 ? 'text-[#F0D68A]' : 'text-[#8C8275]')}>
                  Cavabsiz Reyler
                </p>
                {unansweredCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#C9A227] text-[#1A1714] animate-pulse">
                    <AlertCircle className="w-3 h-3" /> Diqqet
                  </span>
                )}
              </div>
              <h2 className={"font-serif text-3xl font-bold " + (unansweredCount > 0 ? 'text-white' : 'text-[#1A1714]')}>
                {unansweredCount}
              </h2>
              <p className={"text-xs " + (unansweredCount > 0 ? 'text-[#F0D68A]/80' : 'text-[#8C8275]')}>
                {unansweredCount > 0 ? 'Musteriler cavabinizi gozleyir' : 'Butun reyler cavablandirilib'}
              </p>
            </div>

            <div className={"w-14 h-14 rounded-2xl flex items-center justify-center " + (unansweredCount > 0 ? 'bg-[#C9A227]/20 border border-[#C9A227]/40 text-[#F0D68A]' : 'bg-[#FAF6F0] border border-[#E5DFD5] text-[#8C8275]')}>
              <Clock className="w-7 h-7" />
            </div>
          </div>

        </div>

        <div className="bg-gradient-to-b from-[#FAF6F0] to-[#F3EAE0] rounded-2xl p-4 sm:p-5 border border-[#EBDCC5] shadow-sm space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">

            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C8275]" />
              <input
                type="text"
                placeholder="Musteri, usta ve ya rey metni uzre axtar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 bg-[#FAF6F0] border border-[#E5DFD5] rounded-xl text-sm focus:outline-none focus:border-[#C9A227] text-[#1A1714] placeholder-[#8C8275] transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8C8275] hover:text-[#1A1714]"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 bg-[#FAF6F0] p-1 rounded-xl border border-[#E5DFD5] self-start lg:self-auto">
              <button
                onClick={() => setStatusFilter('all')}
                className={"px-3 py-1.5 rounded-lg text-xs font-medium transition-all " + (statusFilter === 'all' ? 'bg-[#1A1714] text-[#F0D68A] shadow-sm' : 'text-[#8C8275] hover:text-[#1A1714]')}
              >
                Hamisi
              </button>
              <button
                onClick={() => setStatusFilter('unanswered')}
                className={"px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all " + (statusFilter === 'unanswered' ? 'bg-[#1A1714] text-[#F0D68A] shadow-sm' : 'text-[#8C8275] hover:text-[#1A1714]')}
              >
                <span>Cavabsizlar once</span>
                {unansweredCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-[#C9A227]"></span>
                )}
              </button>
              <button
                onClick={() => setStatusFilter('answered')}
                className={"px-3 py-1.5 rounded-lg text-xs font-medium transition-all " + (statusFilter === 'answered' ? 'bg-[#1A1714] text-[#F0D68A] shadow-sm' : 'text-[#8C8275] hover:text-[#1A1714]')}
              >
                Cavablananlar
              </button>
            </div>

          </div>

          <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-[#E5DFD5]/60">
            <span className="text-xs font-semibold text-[#8C8275] flex items-center gap-1 mr-1">
              <Filter className="w-3.5 h-3.5 text-[#C9A227]" /> Ulduz:
            </span>

            <button
              onClick={() => setSelectedRating('all')}
              className={"px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all " + (selectedRating === 'all' ? 'bg-[#C9A227] text-[#1A1714] font-semibold' : 'bg-[#FAF6F0] text-[#8C8275] hover:bg-[#E5DFD5]')}
            >
              Butun ulduzlar
            </button>

            {[5, 4, 3, 2, 1].map((rating) => {
              const isSelected = selectedRating === rating;
              return (
                <button
                  key={rating}
                  onClick={() => setSelectedRating(isSelected ? 'all' : rating)}
                  className={"px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 whitespace-nowrap transition-all " + (isSelected ? 'bg-[#1A1714] text-[#F0D68A] ring-1 ring-[#C9A227]' : 'bg-[#FAF6F0] text-[#8C8275] hover:bg-[#E5DFD5]')}
                >
                  <span>{rating}</span>
                  <Star className="w-3 h-3 text-[#C9A227] fill-[#C9A227]" />
                  <span className="text-[10px] opacity-60">({ratingCounts[rating] || 0})</span>
                </button>
              );
            })}
          </div>
        </div>

        {filteredReviews.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E5DFD5] p-12 text-center flex flex-col items-center justify-center space-y-4 shadow-sm">
            <div className="w-20 h-20 rounded-full bg-[#FAF6F0] border border-[#E5DFD5] flex items-center justify-center text-[#B8935A] relative">
              <MessageSquare className="w-10 h-10 stroke-[1.5]" />
              <Sparkles className="w-5 h-5 absolute -top-1 -right-1 text-[#C9A227]" />
            </div>
            <div className="max-w-md space-y-1">
              <h3 className="font-serif text-xl font-bold text-[#1A1714]">Hele ki, rey tapilmadi</h3>
              <p className="text-sm text-[#8C8275]">
                Secilmis filtrlere uygun hec bir rey movcud deyil ve ya hele ki musterileriniz terefinden rey bildirilmeyib.
              </p>
            </div>
            {(selectedRating !== 'all' || statusFilter !== 'all' || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedRating('all');
                  setStatusFilter('all');
                  setSearchQuery('');
                }}
                className="mt-2 text-xs font-semibold text-[#C9A227] hover:underline"
              >
                Suzgecleri sifirla
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReviews.map((review) => {
              const isReplying = replyingId === review.id;
              const isSubmitting = loadingIds[review.id];
              const isSuccess = successIds[review.id];
              const currentReplyText = replyTexts[review.id] || '';
              const charCount = currentReplyText.length;

              return (
                <div
                  key={review.id}
                  className={"rounded-2xl border transition-all duration-300 shadow-sm p-5 sm:p-6 relative overflow-hidden " + (isSuccess ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/20' : !review.response ? 'bg-gradient-to-b from-[#FAF6F0] to-[#F3EAE0] border-[#C9A227]/40 hover:border-[#C9A227]' : 'bg-gradient-to-b from-[#FAF6F0] to-[#F3EAE0] border-[#EBDCC5] hover:border-[#B8935A]/50')}
                >
                  {isSuccess && (
                    <div className="bg-emerald-600 text-white text-xs font-medium px-4 py-1.5 flex items-center justify-between -mx-5 sm:-mx-6 -mt-5 sm:-mt-6 mb-4">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" /> Cavabiniz ugurla derc olundu!
                      </span>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">

                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-[#1A1714] text-[#F0D68A] font-serif font-bold text-base flex items-center justify-center border-2 border-[#C9A227] shadow-sm shrink-0">
                        {getInitials(review.customerFullName)}
                      </div>
                      <div>
                        <h4 className="font-serif font-bold text-lg text-[#1A1714] leading-snug">
                          {review.customerFullName || 'Anonim Musteri'}
                        </h4>

                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          { (getEmployeeName(review) || employees?.find((e) => String(e.id) === String(review.employeeId))?.fullName) && ( <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FAF6F0] text-[#B8935A] border border-[#E5DFD5]"> <Scissors className="w-3 h-3 text-[#C9A227]" /> Usta: {getEmployeeName(review) || employees?.find((e) => String(e.id) === String(review.employeeId))?.fullName} </span> ) }

                          {showSalonName && review.salonName && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[#1A1714] text-[#F0D68A]">
                              <Building className="w-3 h-3 text-[#C9A227]" />
                              {review.salonName}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2">
                      <div className="flex items-center gap-1 bg-[#FAF6F0] px-3 py-1 rounded-xl border border-[#E5DFD5]">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={"w-4 h-4 " + (star <= review.rating ? 'text-[#C9A227] fill-[#C9A227]' : 'text-[#E5DFD5] fill-[#E5DFD5]')}
                          />
                        ))}
                        <span className="text-xs font-bold text-[#1A1714] ml-1">
                          {review.rating}.0
                        </span>
                      </div>

                      {!review.response ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-900 border border-amber-300">
                          <Clock className="w-3 h-3 text-amber-700 animate-pulse" />
                          Cavab gozleyir
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Cavablandirilib
                        </span>
                      )}
                    </div>

                  </div>

                  <div className="my-4 pl-4 border-l-2 border-[#C9A227]/40">
                    <p className="text-[#1A1714] text-sm leading-relaxed italic">
                      "{review.comment}"
                    </p>
                  </div>

                  {review.response && (() => {
                    const replyEmployeeName = getEmployeeName(review) || employees?.find((e) => String(e.id) === String(review.employeeId))?.fullName;
                    return (
                      <div className="mt-4 bg-[#FAF6F0] rounded-xl p-4 border border-[#E5DFD5] relative">
                        <div className="flex items-center gap-2 mb-2 text-xs font-bold text-[#B8935A]">
                          <CornerDownRight className="w-4 h-4 text-[#C9A227]" />
                          <span>{replyEmployeeName ? `Ustanin Cavabi: ${replyEmployeeName}` : 'Salonun Cavabi'}</span>
                        </div>
                        <p className="text-xs sm:text-sm text-[#1A1714] pl-6 leading-relaxed">
                          {review.response}
                        </p>
                      </div>
                    );
                  })()}

                  {!review.response && (
                    <div className="mt-4 pt-4 border-t border-[#E5DFD5]/60">
                      {!isReplying ? (
                        <button
                          onClick={() => setReplyingId(review.id)}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1A1714] text-[#F0D68A] hover:bg-[#C9A227] hover:text-[#1A1714] text-xs font-semibold transition-all duration-200 shadow-sm"
                        >
                          <Send className="w-3.5 h-3.5" />
                          Musteriye Cavab Yaz
                        </button>
                      ) : (
                        <div className="space-y-3 bg-[#FAF6F0] p-4 rounded-xl border border-[#C9A227]/50">
                          <div className="flex items-center justify-between text-xs text-[#8C8275]">
                            <span className="font-semibold text-[#1A1714]">
                              Resmi Salon Cavabi
                            </span>
                            <span className={"text-[11px] " + (charCount > 450 ? 'text-rose-600 font-bold' : '')}>
                              {charCount}/500 herf
                            </span>
                          </div>

                          <textarea
                            rows={3}
                            maxLength={500}
                            placeholder="Musteriye diqqetli ve nezaketli cavabinizi yazin..."
                            value={currentReplyText}
                            onChange={(e) =>
                              setReplyTexts(prev => ({ ...prev, [review.id]: e.target.value }))
                            }
                            className="w-full p-3 bg-white border border-[#E5DFD5] rounded-xl text-sm text-[#1A1714] placeholder-[#8C8275] focus:outline-none focus:border-[#C9A227] focus:ring-1 focus:ring-[#C9A227] transition-all resize-none"
                          />

                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setReplyingId(null)}
                              disabled={isSubmitting}
                              className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#8C8275] hover:text-[#1A1714] hover:bg-[#E5DFD5] transition-colors"
                            >
                              Legv et
                            </button>

                            <button
                              type="button"
                              onClick={() => handleSendResponse(review.id)}
                              disabled={isSubmitting || !currentReplyText.trim()}
                              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg bg-[#C9A227] text-[#1A1714] font-semibold text-xs hover:bg-[#B8935A] hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isSubmitting ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  Gonderilir...
                                </>
                              ) : (
                                <>
                                  <Send className="w-3.5 h-3.5" />
                                  Cavabi Gonder
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}







