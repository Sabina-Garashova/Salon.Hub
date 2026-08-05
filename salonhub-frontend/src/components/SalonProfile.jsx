import { useState, useRef } from "react";
import { useLanguage } from "../context/LanguageContext";
import {
  ArrowLeft,
  CalendarPlus,
  Clock,
  Crown,
  ImagePlus,
  Images,
  Loader2,
  MapPin,
  MessageSquare,
  Phone,
  Scissors,
  Send,
  Sparkles,
  Star,
  Users,
} from "lucide-react";

function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  return parts.length === 1
    ? parts[0].slice(0, 2).toUpperCase()
    : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function StarRating({ rating, size = "sm", interactive = false, onChange }) {
  const sizeClass = size === "lg" ? "w-6 h-6" : size === "md" ? "w-4 h-4" : "w-3.5 h-3.5";

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i < rating;
        const star = (
          <Star
            className={sizeClass + " transition-colors " + (filled ? "text-[#C9A227] fill-[#C9A227]" : "text-gray-300 fill-gray-200")}
          />
        );

        if (interactive) {
          return (
            <button
              key={i}
              type="button"
              onClick={() => onChange?.(i + 1)}
              className="rounded p-0.5 hover:scale-110 transition-transform"
              aria-label={(i + 1) + " ulduz"}
            >
              {star}
            </button>
          );
        }

        return <span key={i}>{star}</span>;
      })}
    </div>
  );
}

function SectionTitle({ icon: Icon, children }) {
  return (
    <h2 className="text-xl font-serif font-bold text-[#1A1714] flex items-center gap-2 mb-4">
      <Icon className="w-5 h-5 text-[#C9A227]" />
      {children}
    </h2>
  );
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-8">
      <div className="h-64 bg-gray-200 rounded-2xl" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="h-40 bg-gray-200 rounded-xl" />
          <div className="h-48 bg-gray-200 rounded-xl" />
          <div className="h-56 bg-gray-200 rounded-xl" />
        </div>
        <div className="h-64 bg-gray-200 rounded-xl" />
      </div>
    </div>
  );
}

export default function SalonProfile({
  salon,
  services = [],
  tags = [],
  employees = [],
  reviews = [],
  canReview = false,
  loading = false,
  isSubmittingReview = false,
  onBack,
  onBook,
  onSubmitReview,
  reviewableEmployees = [],
  workPhotos = [],
  canManageWorks = false,
  onUploadWorkPhoto,
  uploadingWorkPhoto = false,
}) {
  const { t } = useLanguage();
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewEmployeeId, setReviewEmployeeId] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const workPhotoInputRef = useRef(null);

  const handleReviewSubmit = (e) => {
    e.preventDefault();
    if (!reviewComment.trim()) return;
    onSubmitReview?.({ rating: reviewRating, comment: reviewComment.trim(), employeeId: reviewEmployeeId ? Number(reviewEmployeeId) : null });
  };

  const bannerUrl = salon?.bannerImageUrl || salon?.imageUrl || "/craftsman-modal-bg.png";

  return (
    <div className="min-h-screen font-sans relative overflow-hidden">
      <div className="pointer-events-none fixed inset-0 -z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-[#E8C97A] opacity-[0.10] blur-[140px] rounded-full" />
        <div className="absolute bottom-[-15%] left-[-10%] w-[600px] h-[600px] bg-[#B8935A] opacity-[0.08] blur-[160px] rounded-full" />
        <div className="absolute top-[40%] left-[45%] w-[350px] h-[350px] bg-[#C9A227] opacity-[0.05] blur-[120px] rounded-full" />

        <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="salon-profile-dots" width="36" height="36" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.3" fill="#B8935A" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#salon-profile-dots)" />
        </svg>

        <Scissors className="absolute top-[8%] right-[8%] w-40 h-40 text-[#C9A227]/[0.06] rotate-[20deg]" />
        <Sparkles className="absolute bottom-[10%] left-[6%] w-28 h-28 text-[#B8935A]/[0.07] rotate-[-15deg]" />
      </div>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 relative z-10">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#C9A227] mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Geri
        </button>

        {loading ? (
          <LoadingSkeleton />
        ) : !salon ? (
          <div className="bg-[#F1E2C5] rounded-2xl border border-dashed border-[#C9A227]/40 p-12 text-center">
            <p className="text-gray-400 text-sm">{t("sp_not_found")}</p>
          </div>
        ) : (
          <>
            <section className="relative rounded-2xl overflow-hidden shadow-xl mb-8 min-h-[280px] sm:min-h-[320px]">
              <img
                src={bannerUrl}
                alt={salon.name}
                className="absolute inset-0 w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = "/craftsman-modal-bg.png";
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1A1714] via-[#1A1714]/80 to-[#1A1714]/30" />

              <div className="relative z-10 p-6 sm:p-8 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 min-h-[280px] sm:min-h-[320px]">
                <div className="flex-1 mt-auto">
                  <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#F4EDE0] flex items-center gap-2 flex-wrap">
                    {salon.name}
                    {salon.isMonthlyTopSalon && (
                      <Crown className="w-7 h-7 text-[#C9A227] fill-[#C9A227]" aria-label={t("sp_top_salon")} />
                    )}
                  </h1>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-sm text-gray-300">
                    {salon.address && (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-[#C9A227] shrink-0" />
                        {salon.address}
                      </span>
                    )}
                    {salon.phoneNumber && (
                      <span className="flex items-center gap-1.5">
                        <Phone className="w-4 h-4 text-[#C9A227] shrink-0" />
                        {salon.phoneNumber}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 mt-4">
                    <StarRating rating={Math.round(salon.averageRating ?? 0)} size="md" />
                    <span className="text-[#F0D68A] font-semibold text-sm">
                      {(salon.averageRating ?? 0).toFixed(1)}
                    </span>
                    <span className="text-gray-400 text-sm">
                      ({salon.reviewCount ?? 0} rey)
                    </span>
                  </div>

                  {salon.description && (
                    <p className="text-sm text-gray-300 mt-3 max-w-2xl leading-relaxed">
                      {salon.description}
                    </p>
                  )}
                </div>

                <div className="shrink-0 lg:self-end">
                  <button
                    type="button"
                    onClick={onBook}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-[#F0D68A] to-[#B8935A] text-[#1A1714] font-bold text-sm rounded-xl hover:opacity-95 transition shadow-lg"
                  >
                    <CalendarPlus className="w-5 h-5" />
                    Rezervasiya Et
                  </button>
                </div>
              </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
              <div className="lg:col-span-2 space-y-8">
                <section>
                  <SectionTitle icon={Scissors}>{t("sp_services")}</SectionTitle>
                  {services.length === 0 ? (
                    <div className="bg-[#F1E2C5] rounded-xl border border-dashed border-[#C9A227]/40 p-8 text-center text-sm text-[#6B5D45]">
                      {t("sp_no_services")}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {services.map((service) => (
                        <div
                          key={service.id}
                          className="relative bg-gradient-to-br from-[#F6EAD3] via-[#F1E2C5] to-[#E9D5A8] rounded-xl border border-amber-300/30 shadow-md p-4 hover:border-[#C9A227]/30 hover:shadow-md transition-all overflow-hidden"
                        >
                          <p className="font-semibold text-[#1A1714] text-sm">{service.name}</p>
                          {service.discountPercent != null && (
                            <div className="absolute top-0 right-0 bg-gradient-to-tr from-[#B8935A] to-[#C9A227] text-white text-xs font-bold px-3 py-1 rounded-bl-xl shadow-md">
                              -{service.discountPercent}%
                            </div>
                          )}
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-[#C9A227] font-bold text-sm">
                              {service.price} AZN
                            </span>
                            {service.durationMinutes != null && (
                              <span className="flex items-center gap-1 text-xs text-gray-400">
                                <Clock className="w-3.5 h-3.5" />
                                {service.durationMinutes} deq
                              </span>
                            )}
                          </div>
                          {service.tagIds && service.tagIds.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {service.tagIds.map((tid) => {
                                const tag = tags.find((t) => t.id === tid);
                                if (!tag) return null;
                                return (
                                  <span key={tid} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#C9A227]/10 text-[#B8935A] border border-[#C9A227]/20">
                                    {tag.name}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section>
                  <SectionTitle icon={Users}>{t("sp_masters")}</SectionTitle>
                  {employees.length === 0 ? (
                    <div className="bg-[#F1E2C5] rounded-xl border border-dashed border-[#C9A227]/40 p-8 text-center text-sm text-[#6B5D45]">
                      {t("sp_no_masters")}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {employees.map((employee) => (
                        <div
                          key={employee.id}
                          className="bg-gradient-to-br from-[#F6EAD3] via-[#F1E2C5] to-[#E9D5A8] rounded-xl border border-amber-300/30 shadow-md p-4 text-center hover:border-[#C9A227]/30 hover:shadow-md transition-all"
                        >
                          {employee.profileImageUrl ? (
                            <img
                              src={employee.profileImageUrl}
                              alt={employee.fullName}
                              className="w-16 h-16 rounded-full object-cover mx-auto mb-2 border-2 border-[#C9A227]/30"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#F0D68A] to-[#B8935A] flex items-center justify-center mx-auto mb-2 text-[#1A1714] font-bold text-sm">
                              {getInitials(employee.fullName)}
                            </div>
                          )}
                          <p className="text-sm font-semibold text-[#1A1714] truncate">
                            {employee.fullName}
                          </p>
                          <div className="flex items-center justify-center gap-1 mt-1">
                            <Star className="w-3 h-3 text-[#C9A227] fill-[#C9A227]" />
                            <span className="text-xs text-[#B8935A] font-medium">
                              {(employee.averageRating ?? 0).toFixed(1)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section>
                  <div className="flex items-center justify-between mb-4">
                    <SectionTitle icon={Images}>{t("sp_our_works")}</SectionTitle>
                    {canManageWorks && (
                      <>
                        <input
                          ref={workPhotoInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            onUploadWorkPhoto?.(file);
                            e.target.value = "";
                          }}
                        />
                        <button
                          type="button"
                          disabled={uploadingWorkPhoto}
                          onClick={() => workPhotoInputRef.current?.click()}
                          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-gradient-to-r from-[#B8935A] to-[#C9A227] text-white hover:opacity-95 transition disabled:opacity-50 -mb-4"
                        >
                          {uploadingWorkPhoto ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <ImagePlus className="w-3.5 h-3.5" />
                          )}
                          {t("sp_add_work_photo")}
                        </button>
                      </>
                    )}
                  </div>
                  {workPhotos.length === 0 ? (
                    <div className="bg-[#F1E2C5] rounded-xl border border-dashed border-[#C9A227]/40 p-8 text-center text-sm text-[#6B5D45]">
                      {t("sp_no_work_photos")}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {workPhotos.map((photo) => (
                        <div
                          key={photo.id}
                          className="aspect-square rounded-xl overflow-hidden border border-amber-300/30 shadow-sm"
                        >
                          <img
                            src={photo.imageUrl}
                            alt={photo.description || t("sp_our_works")}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section>
                  <SectionTitle icon={MessageSquare}>{t("sp_reviews")}</SectionTitle>
                  {reviews.length === 0 ? (
                    <div className="bg-[#F1E2C5] rounded-xl border border-dashed border-[#C9A227]/40 p-8 text-center text-sm text-[#6B5D45]">
                      {t("sp_no_reviews")}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {reviews.map((review) => (
                        <article
                          key={review.id}
                          className="bg-gradient-to-br from-[#F6EAD3] via-[#F1E2C5] to-[#E9D5A8] rounded-xl border border-amber-300/30 shadow-md p-5"
                        >
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <span className="font-semibold text-[#1A1714] text-sm">
                              {review.customerFullName}
                            </span>
                            <StarRating rating={review.rating} size="sm" />
                          </div>
                          {(() => {
                            const reviewEmployeeName = review.employeeFullName || employees?.find((e) => String(e.id) === String(review.employeeId))?.fullName;
                            return (
                              <>
                                {reviewEmployeeName && (
                                  <p className="text-xs text-[#B8935A] font-medium mb-1">{t("sp_master_label")} {reviewEmployeeName}</p>
                                )}
                                <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>
                                {review.response && (
                                  <div className="mt-3 pl-3 border-l-2 border-[#C9A227]/40 bg-[#FAF6F0] rounded-r-lg py-2 pr-3">
                                    <p className="text-xs text-gray-500">
                                      <span className="font-semibold text-[#B8935A]">
                                        {reviewEmployeeName ? `${t("sp_usta_reply")} ${reviewEmployeeName} — ` : t("sp_salon_reply") + " "}
                                      </span>
                                      {review.response}
                                    </p>
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              </div>

              <aside className="lg:col-span-1">
                <div className="lg:sticky lg:top-6 bg-gradient-to-br from-[#F6EAD3] via-[#F1E2C5] to-[#E9D5A8] rounded-xl border border-amber-300/30 shadow-md p-5">
                  <h3 className="text-lg font-serif font-bold text-[#1A1714] mb-4">
                    {t("sp_leave_review")}
                  </h3>

                  {canReview ? (
                    <form onSubmit={handleReviewSubmit} className="space-y-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-2">{t("sp_rating")}</p>
                        <StarRating
                          rating={reviewRating}
                          size="lg"
                          interactive
                          onChange={setReviewRating}
                        />
                      </div>
                      {reviewableEmployees.length > 0 && (
                        <div>
                          <p className="text-xs text-gray-500 mb-2">{t("sp_which_master")}</p>
                          <select
                            value={reviewEmployeeId}
                            onChange={(e) => setReviewEmployeeId(e.target.value)}
                            className="w-full p-3 bg-[#FAF6F0] border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A227]/50 transition"
                          >
                            <option value="">{t("sp_only_salon")}</option>
                            {reviewableEmployees.map((emp) => (
                              <option key={emp.id} value={emp.id}>{emp.fullName}</option>
                            ))}
                          </select>
                        </div>
                      )}
                      <textarea
                        rows={4}
                        required
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder={t("sp_review_placeholder")}
                        className="w-full p-3 bg-[#FAF6F0] border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#C9A227]/50 transition"
                      />
                      <button
                        type="submit"
                        disabled={isSubmittingReview || !reviewComment.trim()}
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-[#B8935A] to-[#C9A227] text-white rounded-xl text-sm font-bold disabled:opacity-50 hover:opacity-95 transition"
                      >
                        <Send className="w-4 h-4" />
                        {isSubmittingReview ? t("sp_sending") : t("sp_send")}
                      </button>
                    </form>
                  ) : (
                    <div className="bg-[#F1E2C5] border border-dashed border-[#C9A227]/40 rounded-xl p-4 text-center text-xs text-[#6B5D45] leading-relaxed">
                      {t("sp_review_gate")}
                    </div>
                  )}
                </div>
              </aside>
            </div>
          </>
        )}
      </div>
    </div>
  );
}










