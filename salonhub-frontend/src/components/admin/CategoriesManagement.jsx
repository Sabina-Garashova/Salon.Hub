import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Layers, AlertTriangle, FileText, Scissors, ChevronDown, ChevronUp } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';

export default function CategoriesManagement({
  categories = [],
  services = [],
  salons = [],
  onCreate,
  onEdit,
  onDelete,
  onMoveService,
  onCreateServiceForCategory
}) {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [expandedCat, setExpandedCat] = useState({});
  const toggleExpand = (id) => setExpandedCat(prev => ({ ...prev, [id]: !prev[id] }));

  const [addServiceCatId, setAddServiceCatId] = useState(null);
  const [svcName, setSvcName] = useState('');
  const [svcPrice, setSvcPrice] = useState('');
  const [svcDuration, setSvcDuration] = useState('');
  const [svcSalonIds, setSvcSalonIds] = useState([]);

  const openAddService = (categoryId) => {
    setAddServiceCatId(categoryId);
    setSvcName('');
    setSvcPrice('');
    setSvcDuration('');
    setSvcSalonIds([]);
  };

  const handleAddServiceSubmit = (e) => {
    e.preventDefault();
    if (svcSalonIds.length === 0) { showToast(t("admin_select_at_least_one_salon"), "warning"); return; }
    onCreateServiceForCategory?.(
      { name: svcName, price: parseFloat(svcPrice), durationMinutes: parseInt(svcDuration), categoryId: addServiceCatId },
      svcSalonIds
    );
    setAddServiceCatId(null);
  };

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [selectedCategory, setSelectedCategory] = useState(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleCreateOpen = () => {
    setName('');
    setDescription('');
    setIsCreateModalOpen(true);
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    onCreate({ name, description });
    setIsCreateModalOpen(false);
  };

  const handleEditOpen = (category) => {
    setSelectedCategory(category);
    setName(category.name);
    setDescription(category.description || '');
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    onEdit(selectedCategory.id, { name, description });
    setIsEditModalOpen(false);
  };

  const handleDeleteOpen = (category) => {
    setSelectedCategory(category);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = () => {
    onDelete(selectedCategory.id);
    setIsDeleteModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#FAF6F0] p-6 font-sans text-[#1A1714] -m-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 border-b border-[#B8935A]/20 pb-5">
        <div>
          <h1 className="text-3xl font-serif font-bold text-[#1A1714] tracking-wide">Kateqoriyalarin Idare Edilmesi</h1>
          <p className="text-sm text-[#1A1714]/60 mt-1">SalonHub xidmetlerini qruplasdirmaq ucun kateqoriyalari burada idare edin.</p>
        </div>
        <button
          onClick={handleCreateOpen}
          className="mt-4 sm:mt-0 flex items-center gap-2 bg-[#1A1714] text-[#FAF6F0] hover:bg-[#C9A227] hover:text-[#1A1714] transition-all duration-300 px-5 py-3 rounded-lg font-medium shadow-md border border-[#B8935A]/30"
        >
          <Plus size={18} className="text-[#C9A227]" />
          <span>Yeni Kateqoriya</span>
        </button>
      </div>

      {categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center bg-white border border-[#B8935A]/20 rounded-2xl p-16 text-center shadow-sm max-w-xl mx-auto mt-12">
          <div className="w-16 h-16 bg-[#FAF6F0] rounded-full flex items-center justify-center border border-[#B8935A]/40 mb-4 shadow-inner">
            <Layers size={28} className="text-[#C9A227]" />
          </div>
          <h3 className="text-xl font-serif font-semibold text-[#1A1714] mb-2">Hele kateqoriya yoxdur</h3>
          <p className="text-[#1A1714]/60 text-sm max-w-sm mb-6">Xidmetleri qruplasdirmaq ucun her hansi bir struktur teyin edilmeyib.</p>
          <button
            onClick={handleCreateOpen}
            className="flex items-center gap-2 bg-[#1A1714] text-[#FAF6F0] hover:bg-[#C9A227] hover:text-[#1A1714] px-5 py-2.5 rounded-lg text-sm font-medium transition-colors border border-[#B8935A]/30"
          >
            <Plus size={16} /> Ilk Kateqoriyani Yarat
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <div 
              key={category.id}
              className="bg-white border border-[#B8935A]/20 rounded-xl p-5 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:border-[#C9A227]/50 relative group shadow-sm overflow-hidden"
            >
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#C9A227] to-[#B8935A] opacity-0 group-hover:opacity-100 transition-opacity" />

              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-[#FAF6F0] border border-[#B8935A]/30 flex items-center justify-center shadow-sm">
                    <Layers size={18} className="text-[#C9A227]" />
                  </div>
                  <h3 className="text-lg font-serif font-bold text-[#1A1714] group-hover:text-[#B8935A] transition-colors">
                    {category.name}
                  </h3>
                </div>

                <p className="text-sm text-[#1A1714]/60 line-clamp-3 mb-6 font-normal min-h-[3rem] bg-[#FAF6F0]/20 p-2.5 rounded-md border border-dashed border-gray-100">
                  {category.description || (
                    <span className="italic text-[#1A1714]/40 flex items-center gap-1">
                      <FileText size={12} /> Tesvir elave edilmeyib.
                    </span>
                  )}
                </p>
              </div>

              {(() => {
                const relatedServices = services.filter((s) => s.categoryId === category.id);
                const groupedByName = Object.values(
                  relatedServices.reduce((acc, s) => {
                    if (!acc[s.name]) acc[s.name] = { name: s.name, ids: [] };
                    acc[s.name].ids.push(s.id);
                    return acc;
                  }, {})
                );
                const isOpen = !!expandedCat[category.id];
                return (
                  <div className="mb-3">
                    <button
                      onClick={() => toggleExpand(category.id)}
                      className="flex items-center justify-between w-full text-xs text-[#1A1714]/60 hover:text-[#C9A227] transition-colors py-1"
                    >
                      <span className="flex items-center gap-1.5">
                        <Scissors size={12} /> {groupedByName.length} xidmet novu
                      </span>
                      {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                    {isOpen && (
                      <div className="mt-2 space-y-1.5 bg-[#FAF6F0]/40 rounded-lg p-2 border border-gray-100">
                        {groupedByName.length === 0 ? (
                          <p className="text-[10px] text-[#1A1714]/40 italic px-1">Bu kateqoriyaya bagli xidmet yoxdur.</p>
                        ) : (
                          groupedByName.map((g) => (
                            <div key={g.name} className="flex items-center justify-between gap-2 bg-white rounded-md px-2 py-1.5 border border-gray-100">
                              <span className="text-xs text-[#1A1714] truncate">{g.name}</span>
                              <select
                                value={category.id}
                                onChange={(e) => onMoveService?.(g.ids, Number(e.target.value))}
                                className="text-[10px] border border-gray-200 rounded px-1 py-0.5 bg-white"
                              >
                                {categories.map((c) => (
                                  <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                              </select>
                            </div>
                          ))
                        )}
                        <button
                          type="button"
                          onClick={() => openAddService(category.id)}
                          className="w-full flex items-center justify-center gap-1.5 text-xs text-[#B8935A] hover:text-[#C9A227] font-medium py-2 border border-dashed border-[#B8935A]/30 rounded-md hover:bg-white transition-colors mt-1.5"
                        >
                          <Plus size={12} /> Bu kateqoriyaya xidmet elave et
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}
              <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-3 mt-auto">
                <button
                  onClick={() => handleEditOpen(category)}
                  className="flex items-center gap-1 text-xs px-3 py-1.5 text-[#1A1714]/70 hover:text-[#C9A227] hover:bg-[#FAF6F0] rounded-md transition-all border border-transparent hover:border-[#B8935A]/20 font-medium"
                >
                  <Edit2 size={12} /> Redakte
                </button>
                <button
                  onClick={() => handleDeleteOpen(category)}
                  className="flex items-center gap-1 text-xs px-3 py-1.5 text-[#1A1714]/70 hover:text-red-600 hover:bg-red-50 rounded-md transition-all border border-transparent hover:border-red-200 font-medium"
                >
                  <Trash2 size={12} /> Sil
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#1A1714]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-[#B8935A]/30 w-full max-w-md overflow-hidden">
            <div className="bg-[#1A1714] p-5 border-b border-[#B8935A]/20 flex justify-between items-center">
              <h2 className="text-xl font-serif font-bold text-[#FAF6F0]">Yeni Kateqoriya</h2>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-[#FAF6F0]/70 hover:text-[#F0D68A] text-sm">Bagla</button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#1A1714]/70 mb-1">Kateqoriya Adi *</label>
                <input 
                  type="text" required value={name} onChange={e => setName(e.target.value)}
                  placeholder="Mes. Sac Qullugu, Kosmetologiya"
                  className="w-full text-sm p-2.5 rounded-lg border border-[#B8935A]/30 focus:outline-none focus:border-[#C9A227] bg-[#FAF6F0]/30"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1A1714]/70 mb-1">Tesvir (Konullu)</label>
                <textarea 
                  value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="Kateqoriya haqqinda qisa melumat yazin..."
                  rows={4}
                  className="w-full text-sm p-2.5 rounded-lg border border-[#B8935A]/30 focus:outline-none focus:border-[#C9A227] bg-[#FAF6F0]/30 resize-none"
                />
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button 
                  type="button" onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-[#1A1714]/70 hover:bg-gray-50 font-medium"
                >
                  Legv et
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2.5 bg-[#1A1714] text-[#FAF6F0] hover:bg-[#C9A227] hover:text-[#1A1714] rounded-lg text-sm font-medium transition-colors border border-[#B8935A]/30 shadow-md"
                >
                  Elave et
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditModalOpen && selectedCategory && (
        <div className="fixed inset-0 z-50 bg-[#1A1714]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-[#B8935A]/30 w-full max-w-md overflow-hidden">
            <div className="bg-[#1A1714] p-5 border-b border-[#B8935A]/20 flex justify-between items-center">
              <h2 className="text-xl font-serif font-bold text-[#FAF6F0]">Kateqoriyani Redakte Et</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-[#FAF6F0]/70 hover:text-[#F0D68A] text-sm">Bagla</button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#1A1714]/70 mb-1">Kateqoriya Adi *</label>
                <input 
                  type="text" required value={name} onChange={e => setName(e.target.value)}
                  className="w-full text-sm p-2.5 rounded-lg border border-[#B8935A]/30 focus:outline-none focus:border-[#C9A227]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1A1714]/70 mb-1">Tesvir (Konullu)</label>
                <textarea 
                  value={description} onChange={e => setDescription(e.target.value)}
                  rows={4}
                  className="w-full text-sm p-2.5 rounded-lg border border-[#B8935A]/30 focus:outline-none focus:border-[#C9A227] resize-none"
                />
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button 
                  type="button" onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-[#1A1714]/70 hover:bg-gray-50 font-medium"
                >
                  Legv et
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2.5 bg-[#1A1714] text-[#FAF6F0] hover:bg-[#C9A227] hover:text-[#1A1714] rounded-lg text-sm font-medium transition-colors border border-[#B8935A]/30 shadow-md"
                >
                  Yenile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDeleteModalOpen && selectedCategory && (
        <div className="fixed inset-0 z-50 bg-[#1A1714]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-red-100 w-full max-w-md overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-200">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-lg font-serif font-bold text-[#1A1714] mb-2">Kateqoriyani silmek</h3>
              <p className="text-sm text-[#1A1714]/60 mb-6">
                Bu kateqoriyani silmek istediyinizden eminsiniz? 
                <span className="block text-xs text-red-500 font-medium mt-1">
                  Qeyd: Bu kateqoriyaya bagli xidmetler kateqoriyasiz qala biler.
                </span>
              </p>
              
              <div className="flex justify-center gap-3">
                <button 
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-[#1A1714]/70 hover:bg-gray-50 font-medium transition-colors"
                >
                  Legv et
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
      {addServiceCatId !== null && (
        <div className="fixed inset-0 z-50 bg-[#1A1714]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-[#B8935A]/30 w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-[#1A1714] p-5 border-b border-[#B8935A]/20 flex justify-between items-center">
              <h2 className="text-xl font-serif font-bold text-[#FAF6F0]">Yeni Xidmet Elave Et</h2>
              <button onClick={() => setAddServiceCatId(null)} className="text-[#FAF6F0]/70 hover:text-[#F0D68A] text-sm">Bagla</button>
            </div>
            <form onSubmit={handleAddServiceSubmit} className="overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#1A1714]/70 mb-1">Xidmetin Adi</label>
                <input type="text" required value={svcName} onChange={e => setSvcName(e.target.value)} className="w-full text-sm p-2.5 rounded-lg border border-[#B8935A]/30 focus:outline-none focus:border-[#C9A227] bg-[#FAF6F0]/30" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#1A1714]/70 mb-1">Qiymet (AZN)</label>
                  <input type="number" step="0.01" required value={svcPrice} onChange={e => setSvcPrice(e.target.value)} className="w-full text-sm p-2.5 rounded-lg border border-[#B8935A]/30 focus:outline-none focus:border-[#C9A227] bg-[#FAF6F0]/30" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1A1714]/70 mb-1">Muddet (Deq)</label>
                  <input type="number" required value={svcDuration} onChange={e => setSvcDuration(e.target.value)} className="w-full text-sm p-2.5 rounded-lg border border-[#B8935A]/30 focus:outline-none focus:border-[#C9A227] bg-[#FAF6F0]/30" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#1A1714]/70 mb-2">Hansi salon(lar) ucun?</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-[#FAF6F0]/40 p-3 rounded-lg border border-[#B8935A]/10 max-h-40 overflow-y-auto">
                  {salons.map((salon) => {
                    const isChecked = svcSalonIds.includes(salon.id);
                    const labelClass = isChecked
                      ? "flex items-center gap-2 p-2 rounded-md border text-xs cursor-pointer bg-white border-[#C9A227] font-medium"
                      : "flex items-center gap-2 p-2 rounded-md border text-xs cursor-pointer bg-white/50 border-gray-200 text-gray-500";
                    return (
                      <label key={salon.id} className={labelClass}>
                        <input type="checkbox" checked={isChecked} onChange={(e) => setSvcSalonIds((prev) => e.target.checked ? [...prev, salon.id] : prev.filter((id) => id !== salon.id))} />
                        {salon.name}
                      </label>
                    );
                  })}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button type="button" onClick={() => setAddServiceCatId(null)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-[#1A1714]/70 hover:bg-gray-50">Legv et</button>
                <button type="submit" className="px-5 py-2 bg-[#1A1714] text-[#FAF6F0] hover:bg-[#C9A227] hover:text-[#1A1714] rounded-lg text-sm font-medium border border-[#B8935A]/30">Elave et</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

}



