import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import BookingModal from "../components/BookingModal";
import SalonProfile from "../components/SalonProfile";
import NewsSection from "../components/NewsSection";
import api from "../services/api";
import { useLanguage } from "../context/LanguageContext";
import { useToast } from "../context/ToastContext";

function decodeToken(t) {
  try {
    const base64 = t.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export default function SalonDetail() {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const { id } = useParams();
  const navigate = useNavigate();
  const salonId = Number(id);

  const [salon, setSalon] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [services, setServices] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [canReview, setCanReview] = useState(false);
  const [reviewableEmployees, setReviewableEmployees] = useState([]);
  const [showBooking, setShowBooking] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [uploadingWorkPhoto, setUploadingWorkPhoto] = useState(false);

  const token = sessionStorage.getItem("token");
  const decodedForRole = token ? decodeToken(token) : null;
  const myUserId =
    decodedForRole?.["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] ||
    decodedForRole?.sub;
  const myRole =
    decodedForRole?.role ||
    decodedForRole?.["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ||
    "Customer";
  const isMyOwnSalon = salon && String(salon.ownerId) === String(myUserId);
  const isMyEmployeeSalon = employees.some((e) => String(e.applicationUserId) === String(myUserId));
  const canManageWorks =
    myRole === "SuperAdmin" ||
    (myRole === "SalonAdmin" && isMyOwnSalon) ||
    (myRole === "Employee" && isMyEmployeeSalon);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`/salon/${salonId}`),
      api.get("/Employee"),
      api.get("/Service"),
      api.get("/Review"),
      api.get("/GalleryImage"),
      api.get("/Tag"),
    ])
      .then(([salonRes, empRes, servRes, revRes, galRes, tagRes]) => {
        setSalon(salonRes.data);
        setEmployees(empRes.data.filter((e) => e.salonId === salonId));
        setServices(servRes.data.filter((s) => s.salonId === salonId));
        setReviews(revRes.data.filter((r) => r.salonId === salonId));
        setGallery(
          (Array.isArray(galRes.data) ? galRes.data : [galRes.data]).filter(
            (g) => g.salonId === salonId
          )
        );
        setTags(tagRes.data);

        if (token) {
          api.get("/Reservation").then((resvRes) => {
            const decoded = decodeToken(token);
            const userId =
              decoded?.["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] ||
              decoded?.sub;
            
            const myCompleted = resvRes.data.filter((r) => {
              const isCustomer = String(r.customerId) === String(userId);
              const isSalon = String(r.salonId) === String(salonId);
              
              if (isCustomer && isSalon) {
              }
              
              return isCustomer && r.status === "Completed" && isSalon;
            });
            
            setCanReview(myCompleted.length > 0);
            
            const uniqueEmployeeIds = [...new Set(myCompleted.map((r) => String(r.employeeId)))];
            const myEmployees = empRes.data.filter((e) => uniqueEmployeeIds.includes(String(e.id)));
            
            setReviewableEmployees(myEmployees);
          });
        }
      })
      .catch((err) => console.error("Salon mÉ™lumatÄ± yÃ¼klÉ™nmÉ™di", err))
      .finally(() => setLoading(false));
  }, [salonId, token]);

  const salonWithBanner = salon
    ? { ...salon, bannerImageUrl: gallery[0]?.imageUrl }
    : null;

  const handleBook = () => {
    if (!token) {
      navigate("/auth", { state: { tab: "login" } });
      return;
    }
    setShowBooking(true);
  };

  const handleSubmitReview = async ({ rating, comment, employeeId }) => {
    if (!token) {
      navigate("/auth", { state: { tab: "login" } });
      return;
    }

    setSubmittingReview(true);
    try {
      await api.post("/Review", { salonId, rating, comment, employeeId: employeeId || null });
      showToast(t("home_review_thanks"), "success");
      const revRes = await api.get("/Review");
      setReviews(revRes.data.filter((r) => r.salonId === salonId));
    } catch (err) {
      showToast(err.response?.data?.message || t("home_review_error"), "error");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleUploadWorkPhoto = async (file) => {
    if (!file) return;
    setUploadingWorkPhoto(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await api.post("/Upload/image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await api.post("/GalleryImage", {
        imageUrl: uploadRes.data.url,
        description: "",
        type: "Portfolio",
        salonId,
        employeeId: null,
        pairedImageId: null,
      });
      const galRes = await api.get("/GalleryImage");
      setGallery(
        (Array.isArray(galRes.data) ? galRes.data : [galRes.data]).filter(
          (g) => g.salonId === salonId
        )
      );
      showToast(t("sp_work_photo_added"), "success");
    } catch (err) {
      showToast(err.response?.data?.message || t("admin_image_upload_error"), "error");
    } finally {
      setUploadingWorkPhoto(false);
    }
  };

  const content = (
    <>
      <SalonProfile
        key={reviewableEmployees.length}
        salon={salonWithBanner}
        services={services}
        tags={tags}
        employees={employees}
        reviews={reviews}
        canReview={canReview}
        reviewableEmployees={reviewableEmployees}
        loading={loading}
        isSubmittingReview={submittingReview}
        onBack={() => navigate(-1)}
        onBook={handleBook}
        onSubmitReview={handleSubmitReview}
        workPhotos={gallery.filter((g) => g.type === "Portfolio")}
        canManageWorks={canManageWorks}
        onUploadWorkPhoto={handleUploadWorkPhoto}
        uploadingWorkPhoto={uploadingWorkPhoto}
      />

      {salon && (
        <div className="max-w-6xl mx-auto px-4">
          <NewsSection limit={3} salonId={salonId} />
        </div>
      )}

      {showBooking && salon && (
        <BookingModal
          isOpen={showBooking}
          onClose={() => setShowBooking(false)}
          salonId={salon.id}
          salonName={salon.name}
        />
      )}
    </>
  );

  return token ? <Layout>{content}</Layout> : content;
}













