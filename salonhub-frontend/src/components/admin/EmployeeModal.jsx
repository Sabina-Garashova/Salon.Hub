import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  User,
  Phone,
  Hash,
  Mail,
  Search,
  Building2,
  Wrench,
  AlignLeft,
  Banknote,
  Camera,
  Loader2
} from 'lucide-react';
import api from '../../services/api';
import WorkingHoursView from './WorkingHoursView';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';

export default function EmployeeModal({
  formData = {
    fullName: '',
    phoneNumber: '',
    applicationUserId: '',
    salonId: '',
    bio: '',
    assignedEquipmentId: ''
  },
  salons = [],
  branches = [],
  equipment = [],
  services = [],
  employees = [],
  isEditMode = false,
  onChange = () => {},
  onSubmit = () => {},
  onClose = () => {},
  employeeId = null
}) {
  const { t } = useLanguage();
  const { showToast } = useToast();

  const [uploading, setUploading] = useState(false);
  const [workingHours, setWorkingHours] = useState([]);

  useEffect(() => {
    if (!formData.phoneNumber) {
      onChange('phoneNumber', '+994 ');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePhoneChange = (raw) => {
    let value = raw;
    if (!value.startsWith('+994')) {
      const digitsOnly = value.replace(/\D/g, '');
      value = '+994 ' + digitsOnly;
    }
    onChange('phoneNumber', value);
  };

  const takenEquipmentIds = new Set(
    employees
      .filter((e) => e.assignedEquipmentId != null && String(e.id) !== String(employeeId))
      .map((e) => Number(e.assignedEquipmentId))
  );

  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [userSearching, setUserSearching] = useState(false);
  const [userSearchAttempted, setUserSearchAttempted] = useState(false);
  const userSearchDebounceRef = useRef(null);
  const userSearchInitializedRef = useRef(false);

  useEffect(() => {
    if (!userSearchInitializedRef.current) {
      setUserSearchQuery(formData.fullName || '');
      userSearchInitializedRef.current = true;
    }
  }, [formData.fullName]);

  const handleUserSearchChange = (value) => {
    setUserSearchQuery(value);
    onChange('applicationUserId', '');
    if (userSearchDebounceRef.current) clearTimeout(userSearchDebounceRef.current);
    if (!value || value.trim().length < 2) {
      setUserSearchResults([]);
      setShowUserDropdown(false);
      setUserSearchAttempted(false);
      return;
    }
    userSearchDebounceRef.current = setTimeout(async () => {
      setUserSearching(true);
      try {
        const res = await api.get('/Auth/search-users', { params: { name: value.trim() } });
        const list = Array.isArray(res.data) ? res.data : (res.data?.$values || []);
        setUserSearchResults(list);
        setShowUserDropdown(true);
        setUserSearchAttempted(true);
      } catch (err) {
        console.error('Istifadeci axtarisi ugursuz oldu:', err.response?.status, err.response?.data || err.message);
        setUserSearchResults([]);
        setShowUserDropdown(true);
        setUserSearchAttempted(true);
      } finally {
        setUserSearching(false);
      }
    }, 350);
  };

  const handleSelectUser = (user) => {
    onChange('applicationUserId', user.id);
    onChange('email', user.email || '');
    setUserSearchQuery(user.fullName);
    setShowUserDropdown(false);
    setUserSearchResults([]);
  };

  useEffect(() => {
    if (employeeId) {
      api.get('/WorkingHour').then((res) => {
        const all = Array.isArray(res.data) ? res.data : (res.data?.$values || []);
        setWorkingHours(all.filter((h) => h && String(h.employeeId) === String(employeeId)));
      }).catch(() => setWorkingHours([]));
    } else {
      setWorkingHours([]);
    }
  }, [employeeId]);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.post("/Upload/image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onChange("profileImageUrl", res.data.url);
    } catch (err) {
      showToast(t("admin_image_upload_error") + ": " + (err.response?.data?.message || err.message), "error");
    } finally {
      setUploading(false);
    }
  };

  const selectedEquipment = equipment.find(
    (e) => String(e.id) === String(formData.assignedEquipmentId)
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'bg-green-500';
      case 'Busy': return 'bg-blue-500';
      case 'InRepair': return 'bg-yellow-500';
      case 'Faulty': return 'bg-red-500';
      default: return 'bg-gray-300';
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-sans">
      
      <div className="bg-[#FAF6F0] w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        <div className="bg-[#1A1714] px-6 py-5 flex items-center justify-between shrink-0">
          <h2 className="text-xl md:text-2xl font-serif font-bold text-[#C9A227]">
            {isEditMode ? 'Ustani Redakte Et' : 'Yeni Usta Elave Et'}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <form id="employeeForm" onSubmit={handleSubmit} className="space-y-6">

            <div className="flex flex-col items-center gap-3 pb-2">
              <div className="relative">
                {formData.profileImageUrl ? (
                  <img src={formData.profileImageUrl} alt="Profil" className="w-24 h-24 rounded-full object-cover border-2 border-[#C9A227]" />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#F0D68A] to-[#B8935A] flex items-center justify-center text-[#1A1714] font-bold text-2xl">
                    <User className="w-10 h-10" />
                  </div>
                )}
                <label className="absolute bottom-0 right-0 w-8 h-8 bg-[#1A1714] rounded-full flex items-center justify-center cursor-pointer border-2 border-white hover:bg-[#C9A227] transition-colors">
                  {uploading ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Camera className="w-4 h-4 text-white" />}
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoUpload} className="hidden" disabled={uploading} />
                </label>
              </div>
              <span className="text-xs text-gray-400">Profil sekli (JPG, PNG, WEBP - max 5MB)</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Ad Soyad
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => onChange('fullName', e.target.value)}
                  placeholder="Mes: Aygun Memmedova"
                  className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#C9A227] focus:ring-1 focus:ring-[#C9A227] transition-all"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Telefon
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="+994 (XX) XXX XX XX"
                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#C9A227] focus:ring-1 focus:ring-[#C9A227] transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Istifadeci
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={userSearchQuery}
                    onChange={(e) => handleUserSearchChange(e.target.value)}
                    onFocus={() => { if (userSearchResults.length > 0) setShowUserDropdown(true); }}
                    onBlur={() => setTimeout(() => setShowUserDropdown(false), 150)}
                    placeholder="Ada gore axtar..."
                    autoComplete="off"
                    className="w-full pl-10 pr-9 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#C9A227] focus:ring-1 focus:ring-[#C9A227] transition-all"
                  />
                  {userSearching && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
                  )}
                  {showUserDropdown && (userSearchResults.length > 0 || (userSearchAttempted && !userSearching)) && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                      {userSearchResults.length > 0 ? (
                        userSearchResults.map((u) => (
                          <button
                            type="button"
                            key={u.id}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => handleSelectUser(u)}
                            className="w-full text-left px-4 py-2 hover:bg-[#FAF6F0] text-sm border-b border-gray-100 last:border-b-0"
                          >
                            <div className="font-medium text-gray-800">{u.fullName}</div>
                            <div className="text-xs text-gray-400">{u.email}</div>
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-xs text-gray-400">Nəticə tapılmadı (konsolu yoxlayın — icazə/şəbəkə xətası ola bilər)</div>
                      )}
                    </div>
                  )}
                </div>
                {formData.applicationUserId ? (
                  <div className="mt-1 space-y-0.5">
                    <p className="text-[11px] text-gray-400 flex items-center gap-1">
                      <Hash className="w-3 h-3" /> Secilmis ID: {formData.applicationUserId}
                    </p>
                    {formData.email && (
                      <p className="text-[11px] text-gray-500 flex items-center gap-1">
                        <Mail className="w-3 h-3" /> {formData.email}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="mt-1 text-[11px] text-amber-600">Zehmet olmasa istifadecini axtarib siyahidan secin</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Salon
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={formData.salonId}
                  onChange={(e) => {
                    onChange('salonId', e.target.value);
                    onChange('assignedEquipmentId', '');
                    onChange('serviceIds', []);
                  }}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl appearance-none focus:outline-none focus:border-[#C9A227] focus:ring-1 focus:ring-[#C9A227] transition-all cursor-pointer"
                  required
                >
                  <option value="" disabled>Salon secin...</option>
                  {salons.map(salon => (
                    <option key={salon.id} value={salon.id}>{salon.name}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Tehkim Olunmus Avadanliq
              </label>
              <div className="relative">
                <Wrench className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                
                {selectedEquipment && (
                  <div 
                    className={"absolute right-10 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full shadow-sm " + getStatusColor(selectedEquipment.status)}
                    title={"Status: " + selectedEquipment.status}
                  />
                )}

                <select
                  value={formData.assignedEquipmentId}
                  onChange={(e) => onChange('assignedEquipmentId', e.target.value)}
                  className="w-full pl-10 pr-14 py-3 bg-white border border-gray-200 rounded-xl appearance-none focus:outline-none focus:border-[#C9A227] focus:ring-1 focus:ring-[#C9A227] transition-all cursor-pointer"
                >
                  <option value="">Avadanliq secilmeyib</option>
                  {equipment.filter((eq) => {
                    const eqBranch = branches.find((b) => b.id === eq.branchId);
                    const branchMatches = eqBranch && eqBranch.salonId === Number(formData.salonId);
                    const isTakenByOther = takenEquipmentIds.has(Number(eq.id));
                    return branchMatches && !isTakenByOther;
                  }).map(eq => (
                    <option key={eq.id} value={eq.id}>
                      {eq.name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Xidmetler
              </label>
              <div className="grid grid-cols-2 gap-2 p-3 bg-white border border-gray-200 rounded-xl max-h-40 overflow-y-auto">
                {services.filter((s) => s.salonId === Number(formData.salonId)).map((s) => (
                  <label key={s.id} className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(formData.serviceIds || []).includes(s.id)}
                      onChange={(e) => {
                        const current = formData.serviceIds || [];
                        const updated = e.target.checked ? [...current, s.id] : current.filter((id) => id !== s.id);
                        onChange('serviceIds', updated);
                      }}
                      className="rounded border-gray-300 text-[#C9A227] focus:ring-[#C9A227]"
                    />
                    {s.name}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Maas (AZN)
              </label>
              <div className="relative">
                <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.salary ?? ''}
                  onChange={(e) => onChange('salary', e.target.value)}
                  placeholder="Mes: 800"
                  className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#C9A227] focus:ring-1 focus:ring-[#C9A227] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Qisa Bio
              </label>
              <div className="relative">
                <AlignLeft className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <textarea
                  value={formData.bio}
                  onChange={(e) => onChange('bio', e.target.value)}
                  placeholder="Bu usta haqqinda qisa melumat..."
                  rows={4}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#C9A227] focus:ring-1 focus:ring-[#C9A227] transition-all resize-none"
                />
              </div>
            </div>

          </form>

          {employeeId && (
            <div className="px-6 pb-6">
              <WorkingHoursView workingHours={workingHours} />
            </div>
          )}
        </div>

        <div className="bg-white border-t border-gray-200 px-6 py-5 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Imtina
          </button>
          <button
            type="submit"
            form="employeeForm"
            className="px-6 py-2.5 rounded-xl bg-[#C9A227] text-white font-medium hover:bg-[#B8935A] transition-colors shadow-sm"
          >
            Yadda Saxla
          </button>
        </div>

      </div>
    </div>
  );
}












