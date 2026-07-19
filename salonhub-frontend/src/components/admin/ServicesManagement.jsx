import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  Layers, 
  Clock, 
  DollarSign, 
  Home, 
  CheckSquare, 
  Square,
  X
} from 'lucide-react';

export default function ServicesManagement({ 
  services = [], 
  salons = [], 
  categories = [], 
  onCreateForSalons, 
  onEdit, 
  onDelete 
}) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState({});

  const [createForm, setCreateForm] = useState({
    name: '',
    price: '',
    durationMinutes: '',
    categoryId: '',
    selectedSalonIds: []
  });

  const [editForm, setEditForm] = useState({
    id: null,
    name: '',
    price: '',
    durationMinutes: '',
    categoryId: '',
    salonId: ''
  });

  const categoryMap = useMemo(() => new Map(categories.map(c => [c.id, c.name])), [categories]);
  const salonMap = useMemo(() => new Map(salons.map(s => [s.id, s.name])), [salons]);

  const groupedServices = useMemo(() => {
    return services.reduce((acc, service) => {
      const name = service.name;
      if (!acc[name]) {
        acc[name] = [];
      }
      acc[name].push(service);
      return acc;
    }, {});
  }, [services]);

  const toggleGroup = (name) => {
    setExpandedGroups(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const handleMasterCheckboxChange = (e) => {
    if (e.target.checked) {
      setCreateForm(prev => ({
        ...prev,
        selectedSalonIds: salons.map(s => s.id)
      }));
    } else {
      setCreateForm(prev => ({ ...prev, selectedSalonIds: [] }));
    }
  };

  const handleSalonCheckboxChange = (salonId, checked) => {
    setCreateForm(prev => {
      const updated = checked 
        ? [...prev.selectedSalonIds, salonId]
        : prev.selectedSalonIds.filter(id => id !== salonId);
      return { ...prev, selectedSalonIds: updated };
    });
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (createForm.selectedSalonIds.length === 0) {
      alert('Zehmet olmasa en azi bir salon secin.');
      return;
    }

    const payload = {
      name: createForm.name,
      price: parseFloat(createForm.price),
      durationMinutes: parseInt(createForm.durationMinutes, 10),
      categoryId: parseInt(createForm.categoryId, 10)
    };

    try {
      await onCreateForSalons(payload, createForm.selectedSalonIds);
      setIsCreateModalOpen(false);
      setCreateForm({ name: '', price: '', durationMinutes: '', categoryId: '', selectedSalonIds: [] });
    } catch (error) {
      console.error("Xidmet yaradilanda xeta bas verdi:", error);
    }
  };

  const openEditModal = (service) => {
    setEditingService(service);
    setEditForm({
      id: service.id,
      name: service.name,
      price: service.price.toString(),
      durationMinutes: service.durationMinutes.toString(),
      categoryId: service.categoryId.toString(),
      salonId: service.salonId
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name: editForm.name,
      price: parseFloat(editForm.price),
      durationMinutes: parseInt(editForm.durationMinutes, 10),
      categoryId: parseInt(editForm.categoryId, 10),
      salonId: editForm.salonId
    };

    try {
      await onEdit(editForm.id, payload);
      setEditingService(null);
    } catch (error) {
      console.error("Xidmet redakte edilende xeta bas verdi:", error);
    }
  };

  const isAllSalonsSelected = createForm.selectedSalonIds.length === salons.length && salons.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-xl font-serif font-bold text-[#1A1714]">
            Xidmetler Paneli
          </h3>
          <p className="text-gray-400 text-xs mt-1">SalonHub sebekesindeki butun xidmetlerin unikal qruplasdirilmis idareetmesi.</p>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-[#C9A227] to-[#B8935A] hover:from-[#B8935A] hover:to-[#C9A227] text-[#1A1714] font-bold py-3 px-6 rounded-xl transition duration-300 shadow-lg text-sm"
        >
          <Plus className="w-4 h-4" /> Yeni Xidmet Elave Et
        </button>
      </div>

      <div>
        {Object.keys(groupedServices).length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center text-gray-400">
            Sistemde hec bir xidmet tapilmadi. Yeni xidmet yaradaraq baslayin.
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedServices).map(([name, instances]) => {
              const isOpen = !!expandedGroups[name];
              const uniqueSalonsList = instances.map(i => salonMap.get(i.salonId) || `Salon #${i.salonId}`);
              const baseInstance = instances[0];
              const catName = categoryMap.get(baseInstance.categoryId) || 'Kateqoriyasiz';

              return (
                <div 
                  key={name}
                  className="bg-white border border-gray-200 rounded-2xl overflow-hidden transition-all duration-300 hover:border-[#C9A227]/40 shadow-sm"
                >
                  <div 
                    onClick={() => toggleGroup(name)}
                    className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 cursor-pointer select-none"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-bold text-[#1A1714]">{name}</h3>
                        <span className="bg-[#C9A227]/10 text-[#B8935A] border border-[#C9A227]/20 text-xs px-2.5 py-0.5 rounded-full font-medium">
                          {catName}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        <span className="text-[#B8935A] font-medium">Bu xidmeti teklif eden salonlar:</span> {uniqueSalonsList.join(', ')}
                      </p>
                    </div>

                    <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end border-t border-gray-100 md:border-0 pt-3 md:pt-0">
                      <div className="text-right font-mono text-xs text-gray-400 space-y-0.5">
                        <div>{instances.length} Salon nusxesi</div>
                        <div className="text-[#C9A227] font-semibold text-sm">{baseInstance.price} AZN / {baseInstance.durationMinutes} deq</div>
                      </div>
                      <div className="text-[#B8935A]">
                        {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </div>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="bg-[#FAF6F0]/60 border-t border-gray-100 p-4 transition-all duration-300">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead>
                            <tr className="text-gray-400 text-xs uppercase tracking-wider border-b border-gray-200">
                              <th className="pb-3 pt-1 px-4">Salon Mekani</th>
                              <th className="pb-3 pt-1 px-4">Qiymet</th>
                              <th className="pb-3 pt-1 px-4">Muddet</th>
                              <th className="pb-3 pt-1 px-4 text-right">Emeliyyatlar</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 text-gray-700">
                            {instances.map((serviceInstance) => (
                              <tr key={serviceInstance.id} className="hover:bg-white transition">
                                <td className="py-3 px-4 font-medium text-[#1A1714]">
                                  {salonMap.get(serviceInstance.salonId) || `Salon #${serviceInstance.salonId}`}
                                </td>
                                <td className="py-3 px-4 font-mono text-[#C9A227] font-medium">
                                  {serviceInstance.price} AZN
                                </td>
                                <td className="py-3 px-4 font-mono text-gray-500">
                                  {serviceInstance.durationMinutes} deq
                                </td>
                                <td className="py-3 px-4 text-right space-x-2">
                                  <button 
                                    onClick={() => openEditModal(serviceInstance)}
                                    className="inline-flex items-center gap-1.5 text-xs text-[#B8935A] hover:text-white border border-[#C9A227]/20 bg-[#C9A227]/5 hover:bg-[#C9A227] px-2.5 py-1.5 rounded-lg transition"
                                  >
                                    <Edit2 className="w-3 h-3" /> Redakte
                                  </button>
                                  <button 
                                    onClick={() => {
                                      if(confirm('Bu salondaki xidmet nusxesini silmek isteyirsiniz?')) {
                                        onDelete(serviceInstance.id);
                                      }
                                    }}
                                    className="inline-flex items-center gap-1.5 text-xs text-red-500 hover:text-white border border-red-200 bg-red-50 hover:bg-red-500 px-2.5 py-1.5 rounded-lg transition"
                                  >
                                    <Trash2 className="w-3 h-3" /> Sil
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-gray-100 pb-4">
              <h3 className="text-xl font-bold text-[#1A1714]">Yeni Xidmet Yarat</h3>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="text-gray-400 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Xidmet Adi</label>
                  <input 
                    type="text" 
                    required
                    value={createForm.name}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl text-[#1A1714] px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#C9A227]"
                    placeholder="Mes: Manikur & Nail Art" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Kateqoriya</label>
                  <select 
                    required
                    value={createForm.categoryId}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, categoryId: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl text-[#1A1714] px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#C9A227]"
                  >
                    <option value="">Kateqoriya secin</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Qiymet (AZN)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-sm">AZN</span>
                    <input 
                      type="number" 
                      step="0.01"
                      required
                      value={createForm.price}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, price: e.target.value }))}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl text-[#1A1714] pl-14 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#C9A227] font-mono"
                      placeholder="0.00" 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Muddet (Deqiqe)</label>
                  <input 
                    type="number" 
                    required
                    value={createForm.durationMinutes}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, durationMinutes: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl text-[#1A1714] px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#C9A227] font-mono"
                    placeholder="Mes: 45" 
                  />
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4 space-y-3">
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">Hansi salon(lar) ucun tetbiq edilsin?</label>
                  <label className="flex items-center gap-2 text-xs font-bold text-[#C9A227] cursor-pointer select-none">
                    <input 
                      type="checkbox"
                      checked={isAllSalonsSelected}
                      onChange={handleMasterCheckboxChange}
                      className="rounded border-gray-300 text-[#C9A227] focus:ring-0 focus:ring-offset-0"
                    />
                    Butun salonlara tetbiq et
                  </label>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-40 overflow-y-auto">
                  {salons.map((salon) => {
                    const isChecked = createForm.selectedSalonIds.includes(salon.id);
                    return (
                      <label 
                        key={salon.id} 
                        className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition select-none ${
                          isChecked 
                            ? 'bg-[#C9A227]/5 border-[#C9A227]/30 text-[#1A1714]' 
                            : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                        }`}
                      >
                        <input 
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => handleSalonCheckboxChange(salon.id, e.target.checked)}
                          className="rounded border-gray-300 text-[#C9A227] focus:ring-0"
                        />
                        <div className="text-sm font-medium truncate">{salon.name}</div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => setIsCreateModalOpen(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium py-2.5 px-5 rounded-xl transition"
                >
                  Imtina
                </button>
                <button 
                  type="submit" 
                  className="bg-gradient-to-r from-[#C9A227] to-[#B8935A] hover:from-[#B8935A] hover:to-[#C9A227] text-[#1A1714] font-bold py-2.5 px-6 rounded-xl transition shadow-lg"
                >
                  Yadda Saxla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingService && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-xl font-bold text-[#1A1714]">Xidmeti Redakte Et</h3>
                <p className="text-xs text-amber-600 mt-0.5 font-medium">
                  Yalniz secilmis salon mekandaki nusxe deyisdirilir.
                </p>
              </div>
              <button 
                onClick={() => setEditingService(null)}
                className="text-gray-400 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Salon Mekani (Deyisdirile bilmez)</label>
                <input 
                  type="text" 
                  disabled
                  value={salonMap.get(editingService.salonId) || `Salon #${editingService.salonId}`}
                  className="w-full bg-gray-100 border border-gray-200 rounded-xl text-gray-500 px-4 py-2.5 cursor-not-allowed font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Xidmet Adi</label>
                <input 
                  type="text" 
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl text-[#1A1714] px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#C9A227]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Kateqoriya</label>
                <select 
                  required
                  value={editForm.categoryId}
                  onChange={(e) => setEditForm(prev => ({ ...prev, categoryId: e.target.value }))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl text-[#1A1714] px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#C9A227]"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Qiymet (AZN)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    required
                    value={editForm.price}
                    onChange={(e) => setEditForm(prev => ({ ...prev, price: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl text-[#1A1714] px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#C9A227] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Muddet (Deq)</label>
                  <input 
                    type="number" 
                    required
                    value={editForm.durationMinutes}
                    onChange={(e) => setEditForm(prev => ({ ...prev, durationMinutes: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl text-[#1A1714] px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#C9A227] font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => setEditingService(null)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium py-2.5 px-5 rounded-xl transition"
                >
                  Imtina
                </button>
                <button 
                  type="submit" 
                  className="bg-gradient-to-r from-[#C9A227] to-[#B8935A] text-[#1A1714] font-bold py-2.5 px-6 rounded-xl transition hover:opacity-90 shadow-lg"
                >
                  Deyisiklikleri Saxla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
