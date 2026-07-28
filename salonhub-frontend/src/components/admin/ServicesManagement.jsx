import React, { useState, useMemo } from 'react';
import {
  Plus, Edit2, Trash2, ChevronDown, ChevronUp,
  Clock, DollarSign, MapPin, Layers, Scissors,
  AlertTriangle, HelpCircle, CheckSquare, Square
} from 'lucide-react';

export default function ServicesManagement({
  services = [],
  salons = [],
  categories = [],
  equipment = [],
  branches = [],
  tags = [],
  onCreateForSalons,
  onEdit,
  onDelete
}) {
  const [expandedGroups, setExpandedGroups] = useState({});
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [selectedService, setSelectedService] = useState(null);
  const [selectedSalonIds, setSelectedSalonIds] = useState([]);

  // Create modal states
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newDuration, setNewDuration] = useState('');
  const [newCategoryId, setNewCategoryId] = useState('');
  const [newOriginalPrice, setNewOriginalPrice] = useState('');
  const [newTagIds, setNewTagIds] = useState([]);
  const [newRequiredEquipmentId, setNewRequiredEquipmentId] = useState('');

  // Edit modal states
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editDuration, setEditDuration] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [editOriginalPrice, setEditOriginalPrice] = useState('');
  const [editTagIds, setEditTagIds] = useState([]);
  const [editRequiredEquipmentId, setEditRequiredEquipmentId] = useState('');

  const groupedServices = useMemo(() => {
    const groups = {};
    services.forEach(service => {
      if (!groups[service.name]) {
        groups[service.name] = {
          name: service.name,
          categoryId: service.categoryId,
          items: []
        };
      }
      groups[service.name].items.push(service);
    });
    return Object.values(groups);
  }, [services]);

  const toggleGroup = (name) => {
    setExpandedGroups(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const handleSelectAllSalons = (e) => {
    if (e.target.checked) {
      setSelectedSalonIds(salons.map(s => s.id));
    } else {
      setSelectedSalonIds([]);
    }
  };

  const handleToggleSalon = (salonId) => {
    setSelectedSalonIds(prev =>
      prev.includes(salonId) ? prev.filter(id => id !== salonId) : [...prev, salonId]
    );
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (selectedSalonIds.length === 0) return alert('En azi bir salon secmelisiniz!');

    const currentPrice = parseFloat(newPrice);
    const origPrice = newOriginalPrice ? parseFloat(newOriginalPrice) : null;
    const calcDiscount = (origPrice && currentPrice && origPrice > currentPrice)
      ? Math.round(((origPrice - currentPrice) / origPrice) * 100)
      : null;

    const payload = {
      name: newName,
      price: currentPrice,
      originalPrice: origPrice,
      oldPrice: origPrice,
      durationMinutes: parseInt(newDuration),
      categoryId: newCategoryId,
      tagIds: newTagIds,
      requiredEquipmentId: newRequiredEquipmentId ? Number(newRequiredEquipmentId) : null,
      discountPercent: calcDiscount,
    };

    if (onCreateForSalons) {
      onCreateForSalons(payload, selectedSalonIds);
    }

    setNewName('');
    setNewPrice('');
    setNewDuration('');
    setNewCategoryId('');
    setNewOriginalPrice('');
    setNewTagIds([]);
    setNewRequiredEquipmentId('');
    setSelectedSalonIds([]);
    setIsCreateModalOpen(false);
  };

  const handleEditOpen = (service) => {
    setSelectedService(service);
    setEditName(service.name || '');
    const currentPriceStr = service.price != null ? service.price.toString() : '';
    setEditPrice(currentPriceStr);
    setEditDuration(service.durationMinutes ? service.durationMinutes.toString() : '');
    setEditCategoryId(service.categoryId || '');

    // Dəqiq İlkin Qiymət hesablama mentiqi
    let calculatedOrig = '';
    const p = parseFloat(service.price);
    const d = parseFloat(service.discountPercent);

    if (service.originalPrice != null && service.originalPrice !== '' && Number(service.originalPrice) > 0) {
      calculatedOrig = service.originalPrice.toString();
    } else if (service.oldPrice != null && service.oldPrice !== '' && Number(service.oldPrice) > 0) {
      calculatedOrig = service.oldPrice.toString();
    } else if (!isNaN(p) && !isNaN(d) && d > 0 && d < 100) {
      // Endirim faizinden ilkin qiymeti geri hesablayiriq: Original = Price / (1 - d/100)
      calculatedOrig = Math.round(p / (1 - (d / 100))).toString();
    }

    setEditOriginalPrice(calculatedOrig);
    setEditTagIds(service.tagIds || []);
    setEditRequiredEquipmentId(service.requiredEquipmentId ? service.requiredEquipmentId.toString() : '');

    setIsEditModalOpen(true);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!selectedService) return;

    const currentPrice = parseFloat(editPrice);
    const origPrice = editOriginalPrice ? parseFloat(editOriginalPrice) : null;
    const calcDiscount = (origPrice && currentPrice && origPrice > currentPrice)
      ? Math.round(((origPrice - currentPrice) / origPrice) * 100)
      : null;

    const payload = {
      name: editName,
      price: currentPrice,
      originalPrice: origPrice,
      oldPrice: origPrice,
      categoryId: editCategoryId,
      durationMinutes: parseInt(editDuration),
      tagIds: editTagIds,
      requiredEquipmentId: editRequiredEquipmentId ? Number(editRequiredEquipmentId) : null,
      discountPercent: calcDiscount,
    };

    if (onEdit) {
      onEdit(selectedService.id, payload);
    }
    setIsEditModalOpen(false);
  };

  const handleDeleteOpen = (service) => {
    setSelectedService(service);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedService && onDelete) {
      onDelete(selectedService.id);
    }
    setIsDeleteModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#FAF6F0] p-6 font-sans text-[#1A1714] -m-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 border-b border-[#B8935A]/20 pb-5">
        <div>
          <h1 className="text-3xl font-serif font-bold text-[#1A1714] tracking-wide">Xidmetlerin Idare Edilmesi</h1>
          <p className="text-sm text-[#1A1714]/60 mt-1">SalonHub sebekenizdeki butun xidmetleri qruplasdirilmis sekilde idare edin.</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="mt-4 sm:mt-0 flex items-center gap-2 bg-[#1A1714] text-[#FAF6F0] hover:bg-[#C9A227] hover:text-[#1A1714] transition-all duration-300 px-5 py-3 rounded-lg font-medium shadow-md shadow-[#1A1714]/10 border border-[#B8935A]/30"
        >
          <Plus size={18} className="text-[#C9A227]" />
          <span>Yeni Xidmet</span>
        </button>
      </div>

      {groupedServices.length === 0 ? (
        <div className="flex flex-col items-center justify-center bg-white border border-[#B8935A]/20 rounded-2xl p-16 text-center shadow-sm max-w-xl mx-auto mt-12">
          <div className="w-16 h-16 bg-[#FAF6F0] rounded-full flex items-center justify-center border border-[#B8935A]/40 mb-4 shadow-inner">
            <Scissors size={28} className="text-[#C9A227]" />
          </div>
          <h3 className="text-xl font-serif font-semibold text-[#1A1714] mb-2">Hele hec bir xidmet yoxdur</h3>
          <p className="text-[#1A1714]/60 text-sm max-w-sm mb-6">Sistemde hec bir xidmet tapilmadi. Ilk xidmetinizi yaratmaqla baslayin.</p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 bg-[#1A1714] text-[#FAF6F0] hover:bg-[#C9A227] hover:text-[#1A1714] px-5 py-2.5 rounded-lg text-sm font-medium transition-colors border border-[#B8935A]/30"
          >
            <Plus size={16} /> Ilk Xidmeti Yarat
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {groupedServices.map((group) => {
            const isExpanded = !!expandedGroups[group.name];
            const salonCount = group.items.length;
            const prices = group.items.map(i => i.price);
            const minPrice = Math.min(...prices);
            const maxPrice = Math.max(...prices);
            const categoryObj = categories.find(c => c.id === group.categoryId);

            return (
              <div
                key={group.name}
                className="bg-white border border-[#B8935A]/20 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-[#C9A227]/40 shadow-sm"
              >
                <div
                  onClick={() => toggleGroup(group.name)}
                  className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer select-none bg-gradient-to-r from-white to-[#FAF6F0]/30 hover:bg-[#FAF6F0]/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-[#1A1714] flex items-center justify-center shadow-md">
                      <Scissors size={20} className="text-[#F0D68A]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-serif font-bold text-[#1A1714]">{group.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-[#FAF6F0] text-[#B8935A] border border-[#B8935A]/25 font-medium">
                          <Layers size={12} />
                          {categoryObj ? categoryObj.name : 'Kateqoriyasiz'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 ml-auto md:ml-0">
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#1A1714]/5 text-[#1A1714]/80 border border-[#1A1714]/10">
                      {salonCount} Salon
                    </span>

                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#C9A227]/10 text-[#B8935A] border border-[#C9A227]/30">
                      {minPrice === maxPrice ? `${minPrice} AZN` : `${minPrice} - ${maxPrice} AZN`}
                    </span>

                    <div className="text-[#1A1714]/40 p-1">
                      {isExpanded ? <ChevronUp size={20} className="text-[#C9A227]" /> : <ChevronDown size={20} />}
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-[#B8935A]/10 bg-[#FAF6F0]/20 divide-y divide-[#B8935A]/10 transition-all duration-300">
                    {group.items.map((item) => {
                      const currentSalon = salons.find(s => s.id === item.salonId);
                      return (
                        <div key={item.id} className="p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:bg-white/60 transition-colors pl-6 md:pl-16">
                          <div className="flex items-center gap-3">
                            <MapPin size={16} className="text-[#B8935A]" />
                            <span className="font-medium text-sm text-[#1A1714]">{currentSalon ? currentSalon.name : 'Namelum Salon'}</span>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-6">
                            <div className="flex items-center gap-4 text-sm text-[#1A1714]/70">
                              <div className="flex items-center gap-1">
                                <Clock size={14} className="text-[#1A1714]/50" />
                                <span>{item.durationMinutes} deq</span>
                              </div>
                              <div className="font-bold text-[#C9A227]">
                                {item.price} AZN
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEditOpen(item)}
                                className="p-1.5 text-[#1A1714]/60 hover:text-[#C9A227] hover:bg-white rounded-md transition-colors border border-transparent hover:border-[#B8935A]/20"
                                title="Xidmeti redakte et"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteOpen(item)}
                                className="p-1.5 text-[#1A1714]/60 hover:text-red-600 hover:bg-white rounded-md transition-colors border border-transparent hover:border-red-200"
                                title="Xidmeti sil"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* YENİ XİDMƏT MODALI */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#1A1714]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-[#B8935A]/30 w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-[#1A1714] p-5 border-b border-[#B8935A]/20 flex justify-between items-center">
              <h2 className="text-xl font-serif font-bold text-[#FAF6F0]">Yeni Xidmet Elave Et</h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-[#FAF6F0]/70 hover:text-[#F0D68A] transition-colors text-sm"
              >
                Bagla
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="overflow-y-auto p-6 space-y-6 flex-1">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#B8935A] mb-3">1. Esas Melumatlar</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#1A1714]/70 mb-1">Xidmetin Adi</label>
                    <input
                      type="text" required value={newName} onChange={e => setNewName(e.target.value)}
                      placeholder="Mes. Manikur, Sac kesimi"
                      className="w-full text-sm p-2.5 rounded-lg border border-[#B8935A]/30 focus:outline-none focus:border-[#C9A227] bg-[#FAF6F0]/30"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#1A1714]/70 mb-1">Kateqoriya</label>
                    <select
                      required value={newCategoryId} onChange={e => setNewCategoryId(e.target.value)}
                      className="w-full text-sm p-2.5 rounded-lg border border-[#B8935A]/30 focus:outline-none focus:border-[#C9A227] bg-[#FAF6F0]/30"
                    >
                      <option value="">Kateqoriya secin</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#1A1714]/70 mb-1">Qiymet (AZN)</label>
                    <input
                      type="number" step="0.01" required value={newPrice} onChange={e => setNewPrice(e.target.value)}
                      placeholder="0.00"
                      className="w-full text-sm p-2.5 rounded-lg border border-[#B8935A]/30 focus:outline-none focus:border-[#C9A227] bg-[#FAF6F0]/30"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#1A1714]/70 mb-1">Muddet (Deqiqe)</label>
                    <input
                      type="number" required value={newDuration} onChange={e => setNewDuration(e.target.value)}
                      placeholder="30"
                      className="w-full text-sm p-2.5 rounded-lg border border-[#B8935A]/30 focus:outline-none focus:border-[#C9A227] bg-[#FAF6F0]/30"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-[#1A1714]/70 mb-1">Ilkin Qiymet (Konullu - Endirim ucun)</label>
                    <input
                      type="number" step="0.01" value={newOriginalPrice} onChange={e => setNewOriginalPrice(e.target.value)}
                      placeholder="Mes. 150"
                      className="w-full text-sm p-2.5 rounded-lg border border-[#B8935A]/30 focus:outline-none focus:border-[#C9A227] bg-[#FAF6F0]/30"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#B8935A] mb-3">2. Avadanliq ve Tag-lar</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#1A1714]/70 mb-1">Teleb Olunan Avadanliq (Konullu)</label>
                    <select
                      value={newRequiredEquipmentId} onChange={e => setNewRequiredEquipmentId(e.target.value)}
                      className="w-full text-sm p-2.5 rounded-lg border border-[#B8935A]/30 focus:outline-none focus:border-[#C9A227] bg-[#FAF6F0]/30"
                    >
                      <option value="">Avadanliq lazim deyil</option>
                      {equipment.map(eq => <option key={eq.id} value={eq.id}>{eq.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#1A1714]/70 mb-2">Tag-lar (Konullu)</label>
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => {
                        const isChecked = newTagIds.includes(tag.id);
                        return (
                          <button
                            key={tag.id}
                            type="button"
                            onClick={() => setNewTagIds((prev) => isChecked ? prev.filter((id) => id !== tag.id) : [...prev, tag.id])}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs cursor-pointer transition-all ${isChecked ? "bg-[#C9A227] text-white border-[#C9A227] font-semibold" : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"}`}
                          >
                            {tag.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#B8935A]">3. Salonlarin Secilmesi</h4>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-[#1A1714]/80">
                    <input
                      type="checkbox"
                      checked={selectedSalonIds.length === salons.length && salons.length > 0}
                      onChange={handleSelectAllSalons}
                      className="rounded border-[#B8935A]/40 text-[#C9A227] focus:ring-[#C9A227]"
                    />
                    <span>Hamisini Sec</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-3 bg-[#FAF6F0]/40 rounded-lg border border-[#B8935A]/20">
                  {salons.map(s => {
                    const isChecked = selectedSalonIds.includes(s.id);
                    return (
                      <label
                        key={s.id}
                        className={`flex items-center gap-2 p-2 rounded-md cursor-pointer text-xs transition-colors ${isChecked ? 'bg-[#C9A227]/10 text-[#1A1714] font-medium' : 'hover:bg-white text-[#1A1714]/70'}`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSalon(s.id)}
                          className="rounded border-[#B8935A]/40 text-[#C9A227] focus:ring-[#C9A227]"
                        />
                        <span className="truncate">{s.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button
                  type="button" onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-[#1A1714]/70 hover:bg-gray-50"
                >
                  Legv et
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#1A1714] text-[#FAF6F0] hover:bg-[#C9A227] hover:text-[#1A1714] rounded-lg text-sm font-medium transition-colors border border-[#B8935A]/30"
                >
                  Elave Et
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REDAKTƏ MODALI */}
      {isEditModalOpen && selectedService && (
        <div className="fixed inset-0 z-50 bg-[#1A1714]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-[#B8935A]/30 w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-[#1A1714] p-5 border-b border-[#B8935A]/20 flex justify-between items-center">
              <h2 className="text-xl font-serif font-bold text-[#FAF6F0]">Xidmeti Redakte Et</h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-[#FAF6F0]/70 hover:text-[#F0D68A] transition-colors text-sm"
              >
                Bagla
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="overflow-y-auto p-6 space-y-6 flex-1">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#B8935A] mb-3">1. Esas Melumatlar</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#1A1714]/70 mb-1">Xidmetin Adi</label>
                    <input
                      type="text" required value={editName} onChange={e => setEditName(e.target.value)}
                      placeholder="Mes. Manikur, Sac kesimi"
                      className="w-full text-sm p-2.5 rounded-lg border border-[#B8935A]/30 focus:outline-none focus:border-[#C9A227] bg-[#FAF6F0]/30"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#1A1714]/70 mb-1">Kateqoriya</label>
                    <select
                      required value={editCategoryId} onChange={e => setEditCategoryId(e.target.value)}
                      className="w-full text-sm p-2.5 rounded-lg border border-[#B8935A]/30 focus:outline-none focus:border-[#C9A227] bg-[#FAF6F0]/30"
                    >
                      <option value="">Kateqoriya secin</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#1A1714]/70 mb-1">Qiymet (AZN)</label>
                    <input
                      type="number" step="0.01" required value={editPrice} onChange={e => setEditPrice(e.target.value)}
                      placeholder="0.00"
                      className="w-full text-sm p-2.5 rounded-lg border border-[#B8935A]/30 focus:outline-none focus:border-[#C9A227] bg-[#FAF6F0]/30"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#1A1714]/70 mb-1">Muddet (Deqiqe)</label>
                    <input
                      type="number" required value={editDuration} onChange={e => setEditDuration(e.target.value)}
                      placeholder="30"
                      className="w-full text-sm p-2.5 rounded-lg border border-[#B8935A]/30 focus:outline-none focus:border-[#C9A227] bg-[#FAF6F0]/30"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-[#1A1714]/70 mb-1">Ilkin Qiymet (Konullu - Endirim ucun)</label>
                    <input
                      type="number" step="0.01" value={editOriginalPrice} onChange={e => setEditOriginalPrice(e.target.value)}
                      placeholder="Mes. 150"
                      className="w-full text-sm p-2.5 rounded-lg border border-[#B8935A]/30 focus:outline-none focus:border-[#C9A227] bg-[#FAF6F0]/30"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#B8935A] mb-3">2. Avadanliq ve Tag-lar</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#1A1714]/70 mb-1">Teleb Olunan Avadanliq (Konullu)</label>
                    <select
                      value={editRequiredEquipmentId} onChange={e => setEditRequiredEquipmentId(e.target.value)}
                      className="w-full text-sm p-2.5 rounded-lg border border-[#B8935A]/30 focus:outline-none focus:border-[#C9A227] bg-[#FAF6F0]/30"
                    >
                      <option value="">Avadanliq lazim deyil</option>
                      {equipment.filter((eq) => { const b = branches.find((br) => br.id === eq.branchId); return b && b.salonId === selectedService?.salonId; }).map(eq => <option key={eq.id} value={eq.id}>{eq.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#1A1714]/70 mb-2">Tag-lar (Konullu)</label>
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => {
                        const isChecked = editTagIds.includes(tag.id);
                        return (
                          <button
                            key={tag.id}
                            type="button"
                            onClick={() => setEditTagIds((prev) => isChecked ? prev.filter((id) => id !== tag.id) : [...prev, tag.id])}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs cursor-pointer transition-all ${isChecked ? "bg-[#C9A227] text-white border-[#C9A227] font-semibold" : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"}`}
                          >
                            {tag.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button
                  type="button" onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-[#1A1714]/70 hover:bg-gray-50"
                >
                  Legv et
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#1A1714] text-[#FAF6F0] hover:bg-[#C9A227] hover:text-[#1A1714] rounded-lg text-sm font-medium transition-colors border border-[#B8935A]/30"
                >
                  Yenile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SİL MODALI */}
      {isDeleteModalOpen && selectedService && (
        <div className="fixed inset-0 z-50 bg-[#1A1714]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-red-100 w-full max-w-md overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-200">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-lg font-serif font-bold text-[#1A1714] mb-2">Xidmeti silmek</h3>
              <p className="text-sm text-[#1A1714]/60 mb-6">
                <strong>{selectedService.name}</strong> xidmetini <strong>{salons.find(s => s.id === selectedService.salonId)?.name}</strong> salonundan silmek istediyinize eminsiniz? Bu emeliyyat geri qaytarila bilmez.
              </p>

              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-[#1A1714]/70 hover:bg-gray-50 font-medium transition-colors"
                >
                  Geri qayit
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="px-5 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg text-sm font-medium transition-colors shadow-md"
                >
                  Beli, Sil
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
