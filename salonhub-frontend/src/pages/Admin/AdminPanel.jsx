import { useState, useEffect } from "react";
import {
  LayoutDashboard, Inbox, Users, Scissors, Tag, Store, Wrench, Clock,
  Calendar, Image, Star, BarChart3, Building2, UserCog, Award, Newspaper,
  FileClock, Settings, Menu, X, Plus, Search, Edit2, Trash2, Check,
  AlertCircle, TrendingUp, ChevronRight, User, Mail, DollarSign
} from "lucide-react";
import api from "../../services/api";

function decodeToken(token) {
  try {
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(payload));
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

  const [activeTab, setActiveTab] = useState("Dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [applications, setApplications] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [salons, setSalons] = useState([]);
  const [rejectReason, setRejectReason] = useState({});
  const [agreedSalary, setAgreedSalary] = useState({});

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState("");
  const [editItem, setEditItem] = useState(null);

  const [empForm, setEmpForm] = useState({ fullName: "", phoneNumber: "", bio: "", applicationUserId: "", salonId: "", branchId: "" });
  const [serForm, setSerForm] = useState({ nameAz: "", price: "", durationMinutes: "", categoryId: "", salonId: "" });

  const salonAdminTabs = [
    { id: "Dashboard", name: "Ana Sehife", icon: LayoutDashboard },
    { id: "Applications", name: "Muracietler", icon: Inbox, badge: applications.length || null },
    { id: "Employees", name: "Iscilerim", icon: Users },
    { id: "Services", name: "Xidmetlerim", icon: Scissors },
    { id: "Categories", name: "Kateqoriyalar", icon: Tag },
  ];

  const superAdminTabs = [
    { id: "Dashboard", name: "Ana Sehife", icon: LayoutDashboard },
    { id: "Applications", name: "Muracietler", icon: Inbox, badge: applications.length || null },
    { id: "AllSalons", name: "Butun Salonlar", icon: Building2 },
    { id: "Employees", name: "Iscilerim", icon: Users },
    { id: "Services", name: "Xidmetlerim", icon: Scissors },
    { id: "Categories", name: "Kateqoriyalar", icon: Tag },
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
        }
        if (activeTab === "Employees") {
          const res = await api.get("/Employee");
          setEmployees(res.data);
        }
        if (activeTab === "Services" || activeTab === "Categories") {
          const [servRes, catRes] = await Promise.all([api.get("/Service"), api.get("/Category")]);
          setServices(servRes.data);
          setCategories(catRes.data);
        }
        if (activeTab === "AllSalons" || activeTab === "Employees" || activeTab === "Services") {
          const salonRes = await api.get("/salon");
          setSalons(salonRes.data);
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
    if (type === "employee") setEmpForm({ fullName: "", phoneNumber: "", bio: "", applicationUserId: "", salonId: "", branchId: "" });
    if (type === "service") setSerForm({ nameAz: "", price: "", durationMinutes: "", categoryId: "", salonId: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (type, item) => {
    setModalType(type);
    setEditItem(item);
    if (type === "employee") setEmpForm({ fullName: item.fullName, phoneNumber: item.phoneNumber, bio: item.bio || "", applicationUserId: "", salonId: item.salonId, branchId: item.branchId || "" });
    if (type === "service") setSerForm({ nameAz: item.name, price: item.price, durationMinutes: item.durationMinutes, categoryId: item.categoryId, salonId: item.salonId });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (modalType === "employee") {
        const payload = {
          fullName: empForm.fullName,
          phoneNumber: empForm.phoneNumber,
          bio: empForm.bio,
          profileImageUrl: null,
          applicationUserId: empForm.applicationUserId,
          salonId: Number(empForm.salonId),
          branchId: empForm.branchId ? Number(empForm.branchId) : null,
          assignedEquipmentId: null,
        };
        if (editItem) {
          await api.put(`/Employee/${editItem.id}`, payload);
        } else {
          await api.post("/Employee", payload);
        }
        const res = await api.get("/Employee");
        setEmployees(res.data);
      } else if (modalType === "service") {
        const payload = {
          nameAz: serForm.nameAz,
          price: Number(serForm.price),
          durationMinutes: Number(serForm.durationMinutes),
          categoryId: Number(serForm.categoryId),
          salonId: Number(serForm.salonId),
        };
        if (editItem) {
          await api.put(`/Service/${editItem.id}`, payload);
        } else {
          await api.post("/Service", payload);
        }
        const res = await api.get("/Service");
        setServices(res.data);
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
      if (type === "service") {
        await api.delete(`/Service/${id}`);
        setServices(services.filter((s) => s.id !== id));
      }
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
              {activeTab === "Dashboard" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { title: "Gozleyen Muracietler", value: applications.length.toString(), icon: Inbox },
                      { title: "Isci Sayi", value: employees.length.toString(), icon: Users },
                      { title: "Xidmet Sayi", value: services.length.toString(), icon: Scissors },
                    ].map((card, i) => {
                      const CardIcon = card.icon;
                      return (
                        <div key={i} className="bg-white p-5 rounded-2xl border border-gray-200/70 shadow-sm">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{card.title}</p>
                              <h3 className="text-2xl font-serif font-bold text-[#1A1714] mt-2">{card.value}</h3>
                            </div>
                            <div className="p-3 bg-[#FAF6F0] rounded-xl border border-gray-100 text-[#B8935A]">
                              <CardIcon className="w-4 h-4" />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

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
                          <div className="flex items-center justify-between">
                            <h4 className="font-serif font-bold text-base text-[#1A1714]">{emp.fullName}</h4>
                            <div className="flex items-center gap-1 text-amber-500 font-bold text-xs bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                              <Star className="w-3 h-3 fill-amber-500" /> {emp.averageRating}
                            </div>
                          </div>
                          <p className="text-xs text-gray-400 font-mono">{emp.phoneNumber}</p>
                          <p className="text-xs text-gray-600 line-clamp-2">{emp.bio}</p>
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

              {activeTab === "Services" && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-serif text-lg font-bold text-[#1A1714]">Xidmet Menyusu</h3>
                    <button onClick={() => openAddModal("service")} className="bg-gradient-to-r from-[#B8935A] to-[#C9A227] text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5">
                      <Plus className="w-4 h-4" /> Yeni Xidmet
                    </button>
                  </div>
                  <div className="bg-white rounded-2xl border border-gray-200/70 overflow-hidden shadow-sm">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-[#1A1714] text-[#FAF6F0] font-serif tracking-wider uppercase text-[10px]">
                          <th className="p-4">Xidmet Adi</th>
                          <th className="p-4">Muddet</th>
                          <th className="p-4">Qiymet</th>
                          <th className="p-4 text-right">Emeliyyatlar</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-gray-700">
                        {services.map((ser) => (
                          <tr key={ser.id} className="hover:bg-[#FAF6F0]/40 transition">
                            <td className="p-4 font-semibold text-[#1A1714]">{ser.name}</td>
                            <td className="p-4 font-medium text-gray-500">{ser.durationMinutes} deqiqe</td>
                            <td className="p-4 font-bold text-[#1A1714]">{ser.price} AZN</td>
                            <td className="p-4 text-right space-x-1 whitespace-nowrap">
                              <button onClick={() => openEditModal("service", ser)} className="p-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-600 border border-gray-200 inline-block"><Edit2 className="w-3 h-3" /></button>
                              <button onClick={() => handleDelete("service", ser.id)} className="p-1.5 bg-red-50 hover:bg-red-100 rounded-lg text-red-600 border border-red-100 inline-block"><Trash2 className="w-3 h-3" /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === "Categories" && (
                <div className="space-y-4">
                  <h3 className="font-serif text-lg font-bold text-[#1A1714]">Kateqoriyalar</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {categories.map((cat) => (
                      <div key={cat.id} className="bg-white rounded-xl border border-gray-200 p-4 text-center text-sm font-medium text-[#1A1714]">
                        {cat.name}
                      </div>
                    ))}
                  </div>
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
                        <div className="flex items-center gap-1 text-[#C9A227] font-bold text-xs pt-2 border-t border-gray-100">
                          <Star className="w-3.5 h-3.5 fill-current" /> {salon.averageRating.toFixed(1)} ({salon.reviewCount} rey)
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl border border-gray-100 shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="font-serif text-base font-bold text-[#1A1714]">
                {editItem ? "Redakte Et" : "Yeni Elave Et"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-full hover:bg-gray-100 text-gray-400"><X className="w-4 h-4" /></button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              {modalType === "employee" && (
                <>
                  <div className="space-y-1">
                    <label className="font-bold text-gray-700">Ad Soyad</label>
                    <input type="text" required value={empForm.fullName} onChange={(e) => setEmpForm({ ...empForm, fullName: e.target.value })} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl" />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-gray-700">Telefon</label>
                    <input type="text" required value={empForm.phoneNumber} onChange={(e) => setEmpForm({ ...empForm, phoneNumber: e.target.value })} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl" />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-gray-700">Istifadeci ID (ApplicationUserId)</label>
                    <input type="text" required value={empForm.applicationUserId} onChange={(e) => setEmpForm({ ...empForm, applicationUserId: e.target.value })} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl" placeholder="Qeydiyyatdan kecmis istifadecinin ID-si" />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-gray-700">Salon</label>
                    <select required value={empForm.salonId} onChange={(e) => setEmpForm({ ...empForm, salonId: e.target.value })} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl">
                      <option value="">Salon secin</option>
                      {salons.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-gray-700">Qisa Bio</label>
                    <textarea rows={2} value={empForm.bio} onChange={(e) => setEmpForm({ ...empForm, bio: e.target.value })} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl resize-none" />
                  </div>
                </>
              )}

              {modalType === "service" && (
                <>
                  <div className="space-y-1">
                    <label className="font-bold text-gray-700">Xidmet Adi</label>
                    <input type="text" required value={serForm.nameAz} onChange={(e) => setSerForm({ ...serForm, nameAz: e.target.value })} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="font-bold text-gray-700">Qiymet (AZN)</label>
                      <input type="number" required value={serForm.price} onChange={(e) => setSerForm({ ...serForm, price: e.target.value })} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl" />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-gray-700">Muddet (deqiqe)</label>
                      <input type="number" required value={serForm.durationMinutes} onChange={(e) => setSerForm({ ...serForm, durationMinutes: e.target.value })} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-gray-700">Kateqoriya</label>
                    <select required value={serForm.categoryId} onChange={(e) => setSerForm({ ...serForm, categoryId: e.target.value })} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl">
                      <option value="">Kateqoriya secin</option>
                      {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-gray-700">Salon</label>
                    <select required value={serForm.salonId} onChange={(e) => setSerForm({ ...serForm, salonId: e.target.value })} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl">
                      <option value="">Salon secin</option>
                      {salons.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                </>
              )}

              <div className="pt-3 border-t border-gray-100 flex justify-end gap-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold">Imtina</button>
                <button type="submit" className="px-4 py-2 bg-[#1A1714] text-white hover:bg-[#C9A227] hover:text-[#1A1714] font-bold rounded-xl">Yadda Saxla</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}





