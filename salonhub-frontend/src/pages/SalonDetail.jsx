import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import BookingModal from "../components/BookingModal";
import SalonProfile from "../components/SalonProfile";
import api from "../services/api";

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

  const token = localStorage.getItem("token");

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

        if (token) {
          api.get("/Reservation").then((resvRes) => {
            const decoded = decodeToken(token);
            const userId =
              decoded?.["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] ||
              decoded?.sub;
            const myCompleted = resvRes.data.filter(
              (r) => r.customerId === userId && r.status === "Completed" && r.salonId === salonId
            );
            setCanReview(myCompleted.length > 0);
            const uniqueEmployeeIds = [...new Set(myCompleted.map((r) => r.employeeId))];
            const myEmployees = empRes.data.filter((e) => uniqueEmployeeIds.includes(e.id));
            setReviewableEmployees(myEmployees);
          });
        }
      })
      .catch((err) => console.error("Salon melumati yuklenmedi", err))
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

  const handleSubmitReview = async ({ rating, comment }) => {
    if (!token) {
      navigate("/auth", { state: { tab: "login" } });
      return;
    }

    setSubmittingReview(true);
    try {
      await api.post("/Review", { salonId, rating, comment });
      alert("Reyiniz ucun tesekkur edirik!");
      const revRes = await api.get("/Review");
      setReviews(revRes.data.filter((r) => r.salonId === salonId));
    } catch (err) {
      alert(err.response?.data?.message || "Xeta bas verdi");
    } finally {
      setSubmittingReview(false);
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
        loading={loading}
        isSubmittingReview={submittingReview}
        onBack={() => navigate(-1)}
        onBook={handleBook}
        onSubmitReview={handleSubmitReview}
      />

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









