import { useState, useEffect } from "react";
import WorkingHoursView from "../../components/admin/WorkingHoursView";
import BranchManagement from "../../components/admin/BranchManagement";
import { useLocation } from "react-router-dom";
import {
  LayoutDashboard, Inbox, Users, Scissors, Tag, Hash, Store, Wrench, Clock,
  Calendar, Image, Star, BarChart3, Building2, UserCog, Award, Newspaper,
  FileClock, Settings, Menu, X, Plus, Search, Edit2, Trash2, Check,
  AlertCircle, TrendingUp, ChevronRight, User, Mail, DollarSign,
} from "lucide-react";
import api from "../../services/api";
import ServicesManagement from "../../components/admin/ServicesManagement";
import DashboardOverview from "../../components/admin/DashboardOverview";
import AllReservations from "../../components/admin/AllReservations";
import ReviewsManagement from "../../components/admin/ReviewsManagement";
import AnalyticsPage from "../../components/admin/AnalyticsPage";
import EquipmentManagement from "../../components/admin/EquipmentManagement";
import EmployeeModal from "../../components/admin/EmployeeModal";
import SystemJobsPanel from "../../components/admin/SystemJobsPanel";
import CategoriesManagement from "../../components/admin/CategoriesManagement";
import AuditLogsPanel from "../../components/admin/AuditLogsPanel";
import TagsManagement from "../../components/admin/TagsManagement";
import NewsManagement from "../../components/admin/NewsManagement";

function decodeToken(token) {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
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

export default function AdminPanel() {
  const token = localStorage.getItem("token");
  const decoded = token ? decodeToken(token) : null;
  const role =
    decoded?.role ||
    decoded?.["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ||
    "Customer";
  const isSuperAdmin = role === "SuperAdmin";
  const currentUserId = decoded?.["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] || decoded?.sub;

  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.state?.tab || "Dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [applications, setApplications] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [salons, setSalons] = useState([]);
  const [allReservations, setAllReservations] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [workingHoursData, setWorkingHoursData] = useState([]);
  const [salonApplications, setSalonApplications] = useState([]);
  const [whSearchTerm, setWhSearchTerm] = useState("");
  const [equipment, setEquipment] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [tags, setTags] = useState([]);
  const [news, setNews] = useState([]);
  const [branches, setBranches] = useState([]);
  const [rejectReason, setRejectReason] = useState({});
  const [agreedSalary, setAgreedSalary] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState("");
  const [editItem, setEditItem] = useState(null);

  const [empForm, setEmpForm] = useState({ fullName: "", phoneNumber: "", bio: "", applicationUserId: "", email: "", salonId: "", branchId: "", assignedEquipmentId: "", serviceIds: [], salary: "" });
  const [mySalonForm, setMySalonForm] = useState({ name: "", address: "", phoneNumber: "", description: "" });
  const [savingMySalon, setSavingMySalon] = useState(false);
  const [isEditingMySalon, setIsEditingMySalon] = useState(false);
  const mySalon = salons.find((s) => s.ownerId === currentUserId);

  useEffect(() => {
    if (mySalon) {
      setMySalonForm({
        name: mySalon.name || "",
        address: mySalon.address || "",
        phoneNumber: mySalon.phoneNumber || "",
        description: mySalon.description || "",
      });
    }
  }, [mySalon?.id]);

  const handleSaveMySalon = async () => {
    if (!mySalon) return;
    setSavingMySalon(true);
    try {
      await api.put(`/salon/${mySalon.id}`, {
        nameAz: mySalonForm.name,
        address: mySalonForm.address,
        phoneNumber: mySalonForm.phoneNumber,
        descriptionAz: mySalonForm.description,
      });
      setSalons(salons.map((s) => (s.id === mySalon.id ? { ...s, ...mySalonForm } : s)));
      alert("Salon melumatlari yenilendi.");
    } catch (err) {
      alert(err.response?.data?.message || "Xeta bas verdi");
    } finally {
      setSavingMySalon(false);
    }
  };

  const salonAdminTabs = [
    { id: "Dashboard", name: "Ana Sehife", icon: LayoutDashboard },
    { id: "Applications", name: "Muracietler", icon: Inbox, badge: applications.length || null },
    { id: "MySalon", name: "Salonum", icon: Building2 },
    { id: "Branches", name: "Filiallar", icon: Building2 },
    { id: "Employees", name: "Iscilerim", icon: Users },
    { id: "WorkingHours", name: "Is Saatlari", icon: Clock },
    { id: "Categories", name: "Kateqoriyalar", icon: Tag },
    { id: "Services", name: "Xidmetlerim", icon: Scissors },
    { id: "Equipment", name: "Avadanliq", icon: Wrench },
    { id: "News", name: "Xeberler", icon: Newspaper },
    { id: "Tags", name: "Tag-lar", icon: Hash },
    { id: "Reviews", name: "Reyler", icon: Star },
    { id: "Analytics", name: "Analitika", icon: TrendingUp },
  ];

  const superAdminTabs = [
    { id: "Dashboard", name: "Ana Sehife", icon: LayoutDashboard },
    { id: "Applications", name: "Muracietler", icon: Inbox, badge: applications.length || null },
    { id: "AllSalons", name: "Butun Salonlar", icon: Building2 },
    { id: "Branches", name: "Filiallar", icon: Building2 },
    { id: "AllReservations", name: "Butun Rezervasiyalar", icon: Calendar },
    { id: "Employees", name: "Iscilerim", icon: Users },
    { id: "WorkingHours", name: "Is Saatlari", icon: Clock },
    { id: "Categories", name: "Kateqoriyalar", icon: Tag },
    { id: "Services", name: "Xidmetlerim", icon: Scissors },
    { id: "Equipment", name: "Avadanliq", icon: Wrench },
    { id: "Tags", name: "Tag-lar", icon: Hash },
    { id: "Reviews", name: "Reyler", icon: Star },
    { id: "News", name: "Xeberler", icon: Newspaper },
    { id: "SystemJobs", name: "Sistem Isleri", icon: Settings },
    { id: "Analytics", name: "Analitika", icon: TrendingUp },
    { id: "AuditLogs", name: "Audit Loglari", icon: FileClock },
  ];

  const currentTabs = isSuperAdmin ? superAdminTabs : salonAdminTabs;

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setIsSidebarOpen(false);
  };

  useEffect(() => {
    setIsLoading(true);
    const load = async () => {
      try {
        if (activeTab === "Applications" || activeTab === "Dashboard") {
          const res = await api.get("/SpecialistApplication/pending");
          setApplications(res.data);
          if (isSuperAdmin) {
            const salonAppRes = await api.get("/SalonApplication/pending");
          setSalonApplications(salonAppRes.data);
          }
        }
        if (activeTab === "Employees" || activeTab === "Dashboard" || activeTab === "Equipment") {
          const res = await api.get("/Employee?scoped=true");
          setEmployees(res.data);
        }
        if (activeTab === "WorkingHours") {
          const whRes = await api.get("/WorkingHour");
          const whAll = Array.isArray(whRes.data) ? whRes.data : (whRes.data?.$values || []);
          setWorkingHoursData(whAll);
          const empRes2 = await api.get("/Employee?scoped=true");
          setEmployees(empRes2.data);
        }
        if (activeTab === "Services" || activeTab === "Categories" || activeTab === "Dashboard") {
          const [servRes, catRes] = await Promise.all([api.get("/Service?scoped=true"), api.get("/Category")]);
          setServices(servRes.data);
          setCategories(catRes.data);
        }
        if (activeTab === "AllSalons" || activeTab === "Employees" || activeTab === "Services" || activeTab === "Categories" || activeTab === "Dashboard") {
          const salonRes = await api.get("/salon");
          setSalons(salonRes.data);
        }
        if (activeTab === "Reviews" || activeTab === "Dashboard") {
          const revRes = await api.get("/Review?scoped=true");
          setReviews(revRes.data);
        }
        if (activeTab === "Equipment" || activeTab === "Employees" || activeTab === "Services" || activeTab === "Branches") {
          const [eqRes, branchRes, salonRes] = await Promise.all([api.get("/Equipment?scoped=true"), api.get("/Branch?scoped=true"), api.get("/salon")]);
          setEquipment(eqRes.data);
          setBranches(branchRes.data);
          setSalons(salonRes.data);
        }
        if (activeTab === "AllReservations" || activeTab === "Dashboard") {
          const resvRes = await api.get("/Reservation");
          setAllReservations(resvRes.data.sort((a, b) => new Date(b.reservationDate) - new Date(a.reservationDate)));
        }
        if (activeTab === "AuditLogs") {
          const auditRes = await api.get("/AuditLogs");
          setAuditLogs(auditRes.data);
        }
        if (activeTab === "Tags" || activeTab === "Categories" || activeTab === "Services") {
          const tagRes = await api.get("/Tag");
          setTags(tagRes.data);
        }
        if (activeTab === "News") {
          const newsRes = await api.get("/News");
          setNews(newsRes.data);
        }
      } catch (err) {
        console.error("Data yuklenmedi", err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [activeTab]);

  const handleApprove = async (id) => {
    try {
      const payload = agreedSalary[id] ? { agreedSalary: Number(agreedSalary[id]) } : {};
      const res = await api.post(`/SpecialistApplication/${id}/approve`, payload);
      alert(res.data.message);
      setApplications(applications.filter((a) => a.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || "Xeta bas verdi");
    }
  };

  const handleApproveSalonApplication = async (id) => {
    try {
      const res = await api.post(`/SalonApplication/${id}/approve`);
      alert(res.data.message);
      setSalonApplications(salonApplications.filter((a) => a.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || "Xeta bas verdi");
    }
  };

  const handleRejectSalonApplication = async (id) => {
    const reason = prompt("Redd sebebi (opsional):");
    try {
      const res = await api.post(`/SalonApplication/${id}/reject`, { reason });
      alert(res.data.message);
      setSalonApplications(salonApplications.filter((a) => a.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || "Xeta bas verdi");
    }
  };

  const handleReject = async (id) => {
    try {
      const res = await api.post(`/SpecialistApplication/${id}/reject`, { reason: rejectReason[id] || null });
      alert(res.data.message);
      setApplications(applications.filter((a) => a.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || "Xeta bas verdi");
    }
  };

  const openAddModal = (type) => {
    setModalType(type);
    setEditItem(null);
    if (type === "employee") setEmpForm({ fullName: "", phoneNumber: "", bio: "", applicationUserId: "", email: "", salonId: "", branchId: "", assignedEquipmentId: "", serviceIds: [], salary: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (type, item) => {
    setModalType(type);
    setEditItem(item);
    if (type === "employee") setEmpForm({ fullName: item.fullName, phoneNumber: item.phoneNumber, bio: item.bio || "", applicationUserId: item.applicationUserId || "", email: item.email || "", salonId: item.salonId, branchId: item.branchId || "", assignedEquipmentId: item.assignedEquipmentId || "", serviceIds: item.serviceIds || [], salary: item.salary != null ? String(item.salary) : "" });
    setIsModalOpen(true);
  };

  const handleCreateServicesForSalons = async (payload, salonIds) => {
    await Promise.all(
      salonIds.map((salonId) =>
        api.post("/Service", {
          nameAz: payload.name,
          price: payload.price,
          durationMinutes: payload.durationMinutes,
          categoryId: payload.categoryId,
          discountPercent: payload.discountPercent ?? null,
          originalPrice: payload.originalPrice ?? null,
          salonId,
        })
      )
    );
    const res = await api.get("/Service?scoped=true");
    setServices(res.data);
  };

  const handleEditService = async (id, payload) => {
    const existing = services.find((s) => s.id === id);
    await api.put(`/Service/${id}`, {
      nameAz: payload.name,
      price: payload.price,
      durationMinutes: payload.durationMinutes,
      categoryId: payload.categoryId,
      salonId: existing?.salonId,
      requiredEquipmentId: payload.requiredEquipmentId ?? null,
      discountPercent: payload.discountPercent ?? null,
      originalPrice: payload.originalPrice ?? null,
    });
    const oldTagIds = existing?.tagIds || [];
    const newTagIds = payload.tagIds || [];
    const tagsToAdd = newTagIds.filter((tid) => !oldTagIds.includes(tid));
    const tagsToRemove = oldTagIds.filter((tid) => !newTagIds.includes(tid));
    await Promise.all([
      ...tagsToAdd.map((tid) => api.post("/Service/" + id + "/tags/" + tid).catch(() => {})),
      ...tagsToRemove.map((tid) => api.delete("/Service/" + id + "/tags/" + tid).catch(() => {})),
    ]);
    const res = await api.get("/Service?scoped=true");
    setServices(res.data);
  };

  const handleCreateTag = async (payload) => {
    await api.post("/Tag", { nameAz: payload.name });
    const res = await api.get("/Tag");
    setTags(res.data);
  };

  const handleEditTag = async (id, payload) => {
    await api.put(`/Tag/${id}`, { nameAz: payload.name });
    const res = await api.get("/Tag");
    setTags(res.data);
  };

  const handleDeleteTag = async (id) => {
    await api.delete(`/Tag/${id}`);
    setTags(tags.filter((t) => t.id !== id));
  };

  const handleCreateNews = async (payload) => {
    await api.post("/News", payload);
    const res = await api.get("/News");
    setNews(res.data);
  };

  const handleEditNews = async (id, payload) => {
    await api.put("/News/" + id, payload);
    const res = await api.get("/News");
    setNews(res.data);
  };

  const handleDeleteNews = async (id) => {
    await api.delete("/News/" + id);
    setNews(news.filter((n) => n.id !== id));
  };

  const handleDeleteService = async (id) => {
    await api.delete(`/Service/${id}`);
    setServices(services.filter((s) => s.id !== id));
  };

  const handleCreateCategory = async (payload) => {
    await api.post("/Category", { nameAz: payload.name, descriptionAz: payload.description });
    const res = await api.get("/Category");
    setCategories(res.data);
  };

  const handleEditCategory = async (id, payload) => {
    await api.put(`/Category/${id}`, { nameAz: payload.name, descriptionAz: payload.description });
    const res = await api.get("/Category");
    setCategories(res.data);
  };

  const handleDeleteCategory = async (id) => {
    await api.delete(`/Category/${id}`);
    setCategories(categories.filter((c) => c.id !== id));
  };


  const handleRespondReview = async (id, response) => {
    await api.post(`/Review/${id}/respond`, { response });
    setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, response, respondedAt: new Date().toISOString() } : r)));
  };
  const handleCreateEquipment = async (data) => {
    const { salonId, ...rest } = data;
    let branch = branches.find((b) => b.salonId === salonId);
    if (!branch) {
      const salon = salons.find((s) => s.id === salonId);
      const branchRes = await api.post("/Branch", {
        name: `${salon?.name || "Salon"} - Esas Filial`,
        address: salon?.address || "",
        phoneNumber: salon?.phoneNumber || "",
        salonId: salonId
      });
      branch = branchRes.data;
      setBranches((prev) => [...prev, branch]);
    }
    const res = await api.post("/Equipment", { ...rest, branchId: branch.id });
    setEquipment((prev) => [...prev, res.data]);
  };
  const handleUpdateEquipment = async (id, data) => {
    await api.put(`/Equipment/${id}`, data);
    setEquipment((prev) => prev.map((eq) => (eq.id === id ? { ...eq, ...data } : eq)));
  };
  const handleDeleteEquipment = async (id) => {
    await api.delete(`/Equipment/${id}`);
    setEquipment((prev) => prev.filter((eq) => eq.id !== id));
  };
  const handleCreateBranch = async (data) => {
    const res = await api.post("/Branch", data);
    setBranches((prev) => [...prev, res.data]);
  };
  const handleUpdateBranch = async (id, data) => {
    await api.put(`/Branch/${id}`, data);
    setBranches((prev) => prev.map((b) => (b.id === id ? { ...b, ...data } : b)));
  };
  const handleDeleteBranch = async (id) => {
    if (!window.confirm("Silmek isteyirsiniz?")) return;
    await api.delete(`/Branch/${id}`);
    setBranches((prev) => prev.filter((b) => b.id !== id));
  };
  const handleMoveServiceCategory = async (serviceIds, newCategoryId) => {
    const ids = Array.isArray(serviceIds) ? serviceIds : [serviceIds];
    await Promise.all(
      ids.map((serviceId) => {
        const existing = services.find((s) => s.id === serviceId);
        if (!existing) return Promise.resolve();
        return api.put(`/Service/${serviceId}`, {
          nameAz: existing.name,
          price: existing.price,
          durationMinutes: existing.durationMinutes,
          categoryId: newCategoryId,
          salonId: existing.salonId,
        });
      })
    );
    const res = await api.get("/Service?scoped=true");
    setServices(res.data);
  };

  const handleCreateServiceForCategory = async (payload, salonIds) => {
    await Promise.all(
      salonIds.map((salonId) =>
        api.post("/Service", {
          nameAz: payload.name,
          price: payload.price,
          durationMinutes: payload.durationMinutes,
          categoryId: payload.categoryId,
          salonId,
        })
      )
    );
    const res = await api.get("/Service?scoped=true");
    setServices(res.data);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (modalType === "employee") {
        console.log("DEBUG handleSave calisdi, modalType:", modalType, "editItem:", editItem);
        const payload = {
          fullName: empForm.fullName,
          phoneNumber: empForm.phoneNumber,
          bio: empForm.bio,
          profileImageUrl: empForm.profileImageUrl || editItem?.profileImageUrl || null,
          applicationUserId: empForm.applicationUserId,
          salonId: Number(empForm.salonId),
          branchId: empForm.branchId ? Number(empForm.branchId) : null,
          assignedEquipmentId: empForm.assignedEquipmentId ? Number(empForm.assignedEquipmentId) : null,
          salary: empForm.salary !== "" && empForm.salary != null ? Number(empForm.salary) : null,
        };
        let empId = editItem?.id;
        if (editItem) {
          await api.put(`/Employee/${editItem.id}`, payload);
        } else {
          const createRes = await api.post("/Employee", payload);
          empId = createRes.data.id;
        }
        const oldServiceIds = editItem?.serviceIds || [];
        const newServiceIds = empForm.serviceIds || [];
        const toAdd = newServiceIds.filter((sid) => !oldServiceIds.includes(sid));
        const toRemove = oldServiceIds.filter((sid) => !newServiceIds.includes(sid));
        await Promise.all([
          ...toAdd.map((sid) => api.post(`/Employee/${empId}/services/${sid}`)),
          ...toRemove.map((sid) => api.delete(`/Employee/${empId}/services/${sid}`)),
        ]);
        const res = await api.get("/Employee?scoped=true");
        setEmployees(res.data);
      }
      setIsModalOpen(false);
    } catch (err) {
      alert(err.response?.data?.message || JSON.stringify(err.response?.data) || "Xeta bas verdi");
    }
  };

  const handleDelete = async (type, id) => {
    if (!window.confirm("Silmek isteyirsiniz?")) return;
    try {
      if (type === "employee") {
        await api.delete(`/Employee/${id}`);
        setEmployees(employees.filter((e) => e.id !== id));
      }
      if (type === "salon") {
        await api.delete(`/salon/${id}`);
        setSalons(salons.filter((s) => s.id !== id));
      }
    } catch (err) {
      alert(err.response?.data?.message || "Xeta bas verdi");
    }
  };

  const handleRenameSalon = async (salon) => {
    const newName = window.prompt("Yeni salon adi:", salon.name);
    if (!newName || newName.trim() === "" || newName === salon.name) return;
    try {
      await api.put(`/salon/${salon.id}`, {
        nameAz: newName,
        address: salon.address,
        phoneNumber: salon.phoneNumber,
      });
      setSalons(salons.map((s) => (s.id === salon.id ? { ...s, name: newName } : s)));
    } catch (err) {
      alert(err.response?.data?.message || "Xeta bas verdi");
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF6F0] font-sans flex text-[#1A1714]">
      <aside className={`fixed inset-y-0 left-0 z-40 w-72 bg-[#1A1714] text-[#FAF6F0] border-r border-[#B8935A]/20 flex flex-col justify-between transition-transform duration-300 lg:static lg:translate-x-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div>
          <div className="p-6 border-b border-[#B8935A]/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full border border-[#C9A227] flex items-center justify-center bg-gradient-to-br from-[#1A1714] to-[#2A2420]">
                <span className="text-[#C9A227] font-serif text-xl font-bold">S</span>
              </div>
              <div>
                <h1 className="font-serif font-bold text-lg tracking-wider text-white">SALONHUB</h1>
                <p className="text-[10px] text-[#C9A227] tracking-widest uppercase font-medium">MANAGEMENT</p>
              </div>
            </div>
            <button className="lg:hidden p-1 rounded-md text-gray-400 hover:text-white" onClick={() => setIsSidebarOpen(false)}>
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-4 pt-4">
            <div className="bg-[#26211D] rounded-xl p-3 border border-[#B8935A]/10">
              <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Cari Sistem Rolu</p>
              <p className="text-xs font-serif text-[#F0D68A] font-semibold">{role}</p>
            </div>
          </div>

          <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-210px)]">
            {currentTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-medium tracking-wide transition group ${isActive ? "bg-gradient-to-r from-[#B8935A] to-[#C9A227] text-white shadow-md" : "text-gray-400 hover:bg-[#26211D] hover:text-[#FAF6F0]"}`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 transition ${isActive ? "text-white" : "text-[#B8935A] group-hover:scale-110"}`} />
                    <span>{tab.name}</span>
                  </div>
                  {tab.badge ? (
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${isActive ? "bg-white text-[#1A1714]" : "bg-[#C9A227]/20 text-[#C9A227]"}`}>
                      {tab.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-[#B8935A]/10 bg-[#151210]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#B8935A] to-[#F0D68A] p-0.5">
              <div className="w-full h-full bg-[#1A1714] rounded-full flex items-center justify-center">
                <span className="text-xs text-[#F0D68A] font-bold">
                  {decoded?.["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"]?.slice(0, 2).toUpperCase() || "AD"}
                </span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">
                {decoded?.["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] || "Admin"}
              </p>
              <p className="text-[10px] text-gray-500 truncate">
                {decoded?.["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"] || ""}
              </p>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 relative h-screen overflow-y-auto">
        <header className="sticky top-0 z-30 bg-[#FAF6F0]/80 backdrop-blur-md border-b border-gray-200/60 p-4 md:p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button className="lg:hidden p-2 rounded-xl bg-white border border-gray-200" onClick={() => setIsSidebarOpen(true)}>
              <Menu className="w-5 h-5 text-[#1A1714]" />
            </button>
            <h2 className="font-serif text-xl md:text-2xl font-bold tracking-tight text-[#1A1714]">
              {currentTabs.find((t) => t.id === activeTab)?.name || "Idareetme"}
            </h2>
          </div>
        </header>

        <div className="p-4 md:p-6 flex-1">
          {isLoading ? (
            <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
              <div className="w-12 h-12 border-4 border-[#B8935A]/20 border-t-[#C9A227] rounded-full animate-spin" />
              <p className="text-xs font-serif text-[#B8935A] tracking-widest uppercase font-semibold">Melumatlar Yuklenir...</p>
            </div>
          ) : (
            <>
              {activeTab === "Dashboard" && (() => {
                const uniqueServiceCount = new Set(services.map((s) => s.name)).size;
                const avgRating = reviews.length > 0 ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1) : "0.0";
                const recentApplications = applications.slice(0, 5).map((a) => ({
                  id: a.id,
                  name: a.applicantFullName,
                  role: a.specialty,
                  date: a.createdAt ? a.createdAt.split("T")[0] : "",
                }));
                const myOwnSalonId = salons.find((s) => s.ownerId === currentUserId)?.id;
                const scopedReservations = isSuperAdmin ? allReservations : allReservations.filter((r) => r.salonId === myOwnSalonId);
                const completedRes = scopedReservations.filter((r) => r.status === "Completed");
                const serviceCounts = {};
                completedRes.forEach((r) => {
                  if (!serviceCounts[r.serviceName]) serviceCounts[r.serviceName] = { name: r.serviceName, count: 0, price: r.price };
                  serviceCounts[r.serviceName].count++;
                });
                const topServices = Object.values(serviceCounts).sort((a, b) => b.count - a.count).slice(0, 5);
                const nowForToday = new Date();
                const todayStr = nowForToday.getFullYear() + "-" + String(nowForToday.getMonth() + 1).padStart(2, "0") + "-" + String(nowForToday.getDate()).padStart(2, "0");
                const todaysAppointments = scopedReservations.filter((r) => r.reservationDate?.split("T")[0] === todayStr);
                const adminName = decoded?.name || decoded?.["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] || "Admin";
                const salonName = isSuperAdmin ? "Butun Salonlar" : (salons.find((s) => s.ownerId === currentUserId)?.name || "Salon");
                return (
                  <DashboardOverview
                    adminName={adminName}
                    salonName={salonName}
                    pendingApplicationsCount={applications.length}
                    employeeCount={employees.length}
                    uniqueServiceCount={uniqueServiceCount}
                    avgRating={avgRating}
                    salonCount={isSuperAdmin ? salons.length : salons.filter((s) => s.ownerId === currentUserId).length}
                    recentApplications={recentApplications}
                    topServices={topServices}
                    todaysAppointments={todaysAppointments}
                  />
                );
              })()}

              {activeTab === "Applications" && (
                <div className="space-y-3">
                  <h3 className="font-serif text-lg font-bold text-[#1A1714] border-b border-gray-200 pb-2">Gozleyen Usta Muracietleri</h3>
                  {applications.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-8 text-center text-gray-400 text-xs">
                      Yeni usta muraciieti tapilmadi.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                      {applications.map((app) => (
                        <div key={app.id} className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col justify-between space-y-4 shadow-sm">
                          <div className="flex items-start gap-3">
                            {app.profileImageUrl ? (
                              <img src={app.profileImageUrl} alt={app.applicantFullName} className="w-12 h-12 rounded-full object-cover border border-gray-200 flex-shrink-0" />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs font-bold flex-shrink-0">
                                {app.applicantFullName?.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div className="flex-1">
                            <h4 className="font-serif font-bold text-base text-[#1A1714]">{app.applicantFullName}</h4>
                            <p className="text-xs text-gray-400 font-mono mt-0.5">{app.applicantEmail}</p>
                            <p className="text-xs text-gray-400 font-mono">{app.phoneNumber}</p>
                            <p className="text-xs text-gray-500 mt-1">Salon: <b>{app.salonName}</b> {app.specialty && <>· Ixtisas: <b>{app.specialty}</b></>}</p>
                            <div className="flex gap-4 mt-3 text-xs">
                              <span className="bg-amber-50 text-[#B8935A] px-2.5 py-1 rounded-lg border border-amber-100 font-medium">Tecrube: <b>{app.yearsOfExperience} il</b></span>
                              <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg border border-emerald-100 font-medium">
                                Gozlenilen: <b>{app.expectedSalaryMin}-{app.expectedSalaryMax} AZN</b>
                              </span>
                            </div>
                            </div>
                          </div>
                          <p className="text-xs text-gray-600 leading-relaxed bg-[#FAF6F0] p-3 rounded-xl border border-gray-100 italic">"{app.bio}"</p>

                          {app.portfolioImageUrls?.length > 0 && (
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Portfolio</p>
                              <div className="flex gap-2">
                                {app.portfolioImageUrls.map((img, i) => (
                                  <img key={i} src={img} alt="portfolio" className="w-12 h-12 rounded-lg object-cover border border-gray-200" />
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="pt-3 border-t border-gray-100 space-y-2">
                            <div className="relative">
                              <DollarSign className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-emerald-500" />
                              <input
                                type="number"
                                placeholder="Konkret maas (AZN)"
                                value={agreedSalary[app.id] || ""}
                                onChange={(e) => setAgreedSalary({ ...agreedSalary, [app.id]: e.target.value })}
                                className="w-full pl-8 pr-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400"
                              />
                            </div>
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                              <input
                                type="text"
                                placeholder="Redd sebebini yazin..."
                                value={rejectReason[app.id] || ""}
                                onChange={(e) => setRejectReason({ ...rejectReason, [app.id]: e.target.value })}
                                className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-red-400"
                              />
                              <div className="flex gap-2 justify-end">
                                <button onClick={() => handleReject(app.id)} className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold border border-red-200">
                                  Redd Et
                                </button>
                                <button onClick={() => handleApprove(app.id)} className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl text-xs font-bold">
                                  Tesdiqle
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}


              {activeTab === "Applications" && isSuperAdmin && (
                <div className="space-y-3 mt-6">
                  <h3 className="font-serif text-lg font-bold text-[#1A1714] border-b border-gray-200 pb-2">Gozleyen Salon Muracietleri</h3>
                  {salonApplications.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-8 text-center text-gray-400 text-xs">
                      Yeni salon muracieti tapilmadi.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                      {salonApplications.map((app) => (
                        <div key={app.id} className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col justify-between space-y-4 shadow-sm">
                          <div className="flex items-start gap-3">
                            {app.logoImageUrl ? (
                              <img src={app.logoImageUrl} alt={app.proposedSalonName} className="w-12 h-12 rounded-full object-cover border border-gray-200 flex-shrink-0" />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs font-bold flex-shrink-0">
                                {app.proposedSalonName?.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div className="flex-1">
                              <h4 className="font-serif font-bold text-base text-[#1A1714]">{app.proposedSalonName}</h4>
                              <p className="text-xs text-gray-400 font-mono mt-0.5">{app.applicantFullName} - {app.applicantEmail}</p>
                              <p className="text-xs text-gray-400 font-mono">{app.phoneNumber}</p>
                              <p className="text-xs text-gray-500 mt-1">Unvan: <b>{app.address}</b></p>
                              {app.description && <p className="text-xs text-gray-500 mt-1">{app.description}</p>}
                            </div>
                          </div>
                          <div className="flex gap-2 pt-3 border-t border-gray-100">
                            <button onClick={() => handleApproveSalonApplication(app.id)} className="flex-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl py-2 text-xs font-bold hover:bg-emerald-100 transition">Tesdiqle</button>
                            <button onClick={() => handleRejectSalonApplication(app.id)} className="flex-1 bg-red-50 text-red-600 border border-red-100 rounded-xl py-2 text-xs font-bold hover:bg-red-100 transition">Redd Et</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {activeTab === "Employees" && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-serif text-lg font-bold text-[#1A1714]">Usta ve Personal Siyahisi</h3>
                    <button onClick={() => openAddModal("employee")} className="bg-gradient-to-r from-[#B8935A] to-[#C9A227] text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5">
                      <Plus className="w-4 h-4" /> Yeni Isci
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {employees.map((emp) => (
                      <div key={emp.id} className="bg-white rounded-2xl border border-gray-200/70 p-5 flex flex-col justify-between shadow-sm">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            {emp.profileImageUrl ? (
                              <img src={emp.profileImageUrl} alt={emp.fullName} className="w-12 h-12 rounded-full object-cover border-2 border-[#C9A227]/30 shrink-0" />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#F0D68A] to-[#B8935A] flex items-center justify-center text-[#1A1714] font-bold text-sm shrink-0">
                                {emp.fullName?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div className="flex items-center justify-between flex-1 min-w-0">
                              <h4 className="font-serif font-bold text-base text-[#1A1714] truncate">{emp.fullName}</h4>
                              <div className="flex items-center gap-1 text-amber-500 font-bold text-xs bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200 shrink-0 ml-2">
                                <Star className="w-3 h-3 fill-amber-500" /> {emp.averageRating}
                              </div>
                            </div>
                          </div>
                          <p className="text-xs text-gray-400 font-mono">{emp.phoneNumber}</p>
                          {(() => {
                            const specialtyName = emp.serviceIds && emp.serviceIds.length > 0
                              ? services.find((s) => s.id === emp.serviceIds[0])?.name
                              : null;
                            return (
                              <p className="text-xs text-gray-600 line-clamp-2">
                                {specialtyName && <span className="font-semibold text-[#B8935A]">{specialtyName} — </span>}
                                {emp.bio}
                              </p>
                            );
                          })()}
                          {emp.salary && (
                            <p className="text-xs font-bold text-emerald-600">Maas: {emp.salary} AZN</p>
                          )}
                        </div>
                        <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-gray-100">
                          <button onClick={() => openEditModal("employee", emp)} className="p-2 bg-gray-50 hover:bg-gray-100 rounded-xl text-gray-600 border border-gray-200"><Edit2 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDelete("employee", emp.id)} className="p-2 bg-red-50 hover:bg-red-100 rounded-xl text-red-600 border border-red-100"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "WorkingHours" && (
                <div className="space-y-4">
                  <h3 className="font-serif text-lg font-bold text-[#1A1714]">Ustalarin Is Saatlari</h3>
                  <input
                    type="text"
                    value={whSearchTerm}
                    onChange={(e) => setWhSearchTerm(e.target.value)}
                    placeholder="Ad ile axtar..."
                    className="w-full max-w-sm px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A227]"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {employees.filter((emp) => (emp.fullName || "").toLowerCase().includes(whSearchTerm.toLowerCase())).map((emp) => (
                      <div key={emp.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                        <p className="font-semibold text-[#1A1714] mb-3">{emp.fullName}</p>
                        <WorkingHoursView workingHours={workingHoursData.filter((h) => h && String(h.employeeId) === String(emp.id))} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "Branches" && (
                <BranchManagement branches={branches} salons={salons} onCreate={handleCreateBranch} onUpdate={handleUpdateBranch} onDelete={handleDeleteBranch} />
              )}

              {activeTab === "Services" && (
                <ServicesManagement
                  services={services}
                  salons={isSuperAdmin ? salons : salons.filter((s) => s.ownerId === currentUserId)}
                  categories={categories}
                  equipment={equipment}
                  tags={tags}
                  branches={branches}
                  loading={isLoading}
                  onCreateForSalons={handleCreateServicesForSalons}
                  onEdit={handleEditService}
                  onDelete={handleDeleteService}
                />
              )}

              {activeTab === "Categories" && (
                <CategoriesManagement
                  categories={categories}
                  services={services}
                  salons={isSuperAdmin ? salons : salons.filter((s) => s.ownerId === currentUserId)}
                  onCreate={handleCreateCategory}
                  onEdit={handleEditCategory}
                  onDelete={handleDeleteCategory}
                  onMoveService={handleMoveServiceCategory}
                  onCreateServiceForCategory={handleCreateServiceForCategory}
                />
              )}

              {activeTab === "Tags" && (
                <TagsManagement
                  tags={tags}
                  onCreate={handleCreateTag}
                  onEdit={handleEditTag}
                  onDelete={handleDeleteTag}
                />
              )}
              {activeTab === "News" && (
                <NewsManagement
                  news={news}
                  salons={salons}
                  onCreate={handleCreateNews}
                  onEdit={handleEditNews}
                  onDelete={handleDeleteNews}
                />
              )}

              {activeTab === "Reviews" && (
                <ReviewsManagement
                  reviews={reviews}
                  onRespond={handleRespondReview}
                  showSalonName={isSuperAdmin}
                />
              )}

              {activeTab === "SystemJobs" && isSuperAdmin && (
                <SystemJobsPanel />
              )}

              {activeTab === "Analytics" && (
                <AnalyticsPage />
              )}

              {activeTab === "Equipment" && (
                <EquipmentManagement
                  equipment={equipment}
                  branches={isSuperAdmin ? branches : branches.filter((b) => salons.some((s) => s.id === b.salonId))}
                  salons={isSuperAdmin ? salons : salons.filter((s) => s.ownerId === currentUserId)}
                  employees={employees}
                  onCreate={handleCreateEquipment}
                  onUpdate={handleUpdateEquipment}
                  onDelete={handleDeleteEquipment}
                />
              )}

              {activeTab === "AuditLogs" && isSuperAdmin && (
                <AuditLogsPanel logs={auditLogs} loading={isLoading} />
              )}

              {activeTab === "MySalon" && !isSuperAdmin && (
                <div className="max-w-2xl space-y-4">
                  {mySalon ? (
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-sm">
                      {!isEditingMySalon ? (
                        <>
                          <div>
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Salon Adi</span>
                            <p className="text-base text-[#1A1714] mt-1">{mySalon.name}</p>
                          </div>
                          <div>
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Unvan</span>
                            <p className="text-base text-[#1A1714] mt-1">{mySalon.address}</p>
                          </div>
                          <div>
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Telefon</span>
                            <p className="text-base text-[#1A1714] mt-1">{mySalon.phoneNumber}</p>
                          </div>
                          <div>
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tesvir</span>
                            <p className="text-base text-[#1A1714] mt-1">{mySalon.description || "-"}</p>
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                            <div className="flex items-center gap-1 text-[#C9A227] font-bold text-sm">
                              <Star className="w-4 h-4 fill-current" /> {mySalon.averageRating?.toFixed(1) || "0.0"} ({mySalon.reviewCount || 0} rey)
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleDelete("salon", mySalon.id)}
                                className="px-3 py-2.5 bg-red-50 text-red-600 rounded-xl border border-red-100 hover:bg-red-100"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setIsEditingMySalon(true)}
                                className="px-5 py-2.5 bg-[#1A1714] text-white rounded-xl text-sm font-medium hover:bg-[#2A2420] flex items-center gap-2"
                              >
                                <Edit2 className="w-3.5 h-3.5" /> Redakte Et
                              </button>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Salon Adi</label>
                            <input
                              type="text"
                              value={mySalonForm.name}
                              onChange={(e) => setMySalonForm({ ...mySalonForm, name: e.target.value })}
                              className="w-full mt-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-[#C9A227]"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Unvan</label>
                            <input
                              type="text"
                              value={mySalonForm.address}
                              onChange={(e) => setMySalonForm({ ...mySalonForm, address: e.target.value })}
                              className="w-full mt-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-[#C9A227]"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Telefon</label>
                            <input
                              type="text"
                              value={mySalonForm.phoneNumber}
                              onChange={(e) => setMySalonForm({ ...mySalonForm, phoneNumber: e.target.value })}
                              className="w-full mt-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-[#C9A227]"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tesvir</label>
                            <textarea
                              value={mySalonForm.description}
                              onChange={(e) => setMySalonForm({ ...mySalonForm, description: e.target.value })}
                              rows={4}
                              className="w-full mt-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-[#C9A227]"
                            />
                          </div>
                          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                            <button
                              onClick={() => { setIsEditingMySalon(false); setMySalonForm({ name: mySalon.name || "", address: mySalon.address || "", phoneNumber: mySalon.phoneNumber || "", description: mySalon.description || "" }); }}
                              className="px-5 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200"
                            >
                              Legv Et
                            </button>
                            <button
                              onClick={handleSaveMySalon}
                              disabled={savingMySalon}
                              className="px-5 py-2.5 bg-[#1A1714] text-white rounded-xl text-sm font-medium hover:bg-[#2A2420] disabled:opacity-50"
                            >
                              {savingMySalon ? "Saxlanilir..." : "Yadda Saxla"}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">Salon melumati tapilmadi.</p>
                  )}
                </div>
              )}

              {activeTab === "AllSalons" && isSuperAdmin && (
                <div className="space-y-4">
                  <h3 className="font-serif text-lg font-bold text-[#1A1714]">Sistemdeki Butun Salonlar</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {salons.map((salon) => (
                      <div key={salon.id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-2">
                        <h4 className="font-serif font-bold text-base text-[#1A1714]">{salon.name}</h4>
                        <p className="text-xs text-gray-500">{salon.address}</p>
                        <p className="text-xs text-gray-400">{salon.phoneNumber}</p>
                        <div className="flex items-center justify-between gap-1 pt-2 border-t border-gray-100">
                          <div className="flex items-center gap-1 text-[#C9A227] font-bold text-xs">
                          <Star className="w-3.5 h-3.5 fill-current" /> {salon.averageRating.toFixed(1)} ({salon.reviewCount} rey)
                          </div>
                          <button
                            onClick={() => handleRenameSalon(salon)}
                            className="p-1.5 bg-blue-50 hover:bg-blue-100 rounded-lg text-blue-600 border border-blue-100 mr-1"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete("salon", salon.id)}
                            className="p-1.5 bg-red-50 hover:bg-red-100 rounded-lg text-red-600 border border-red-100"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "AllReservations" && isSuperAdmin && (
                <AllReservations reservations={allReservations} />
              )}
            </>
          )}
        </div>
      </main>

      {isModalOpen && (
        <EmployeeModal
          formData={empForm}
          salons={salons}
          equipment={equipment}
          branches={branches}
          services={services}
          employees={employees}
          isEditMode={!!editItem}
          employeeId={editItem?.id}
          onChange={(field, value) => setEmpForm((prev) => ({ ...prev, [field]: value }))}
          onSubmit={() => handleSave({ preventDefault: () => {} })}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}

















































































