import React, { useState } from 'react';
import { MapPin, Phone, Building2, Plus, Edit2, Trash2, X } from 'lucide-react';

const BranchManagement = ({ branches = [], salons = [], onCreate, onUpdate, onDelete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    salonId: ''
  });

  const handleOpenModal = (branch = null) => {
    if (branch) {
      setEditingBranch(branch);
      setFormData({
        name: branch.name || '',
        address: branch.address || '',
        phone: branch.phoneNumber || '',
        salonId: branch.salonId || ''
      });
    } else {
      setEditingBranch(null);
      setFormData({ name: '', address: '', phone: '', salonId: salons.length > 0 ? salons[0].id : '' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingBranch(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingBranch) {
      onUpdate(editingBranch.id, {
        name: formData.name,
        address: formData.address,
        phoneNumber: formData.phone
      });
    } else {
      onCreate({
        name: formData.name,
        address: formData.address,
        phoneNumber: formData.phone,
        salonId: Number(formData.salonId)
      });
    }
    handleCloseModal();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-serif font-bold text-[#1A1714] flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#C9A227]" strokeWidth={1.5} />
            Filialların İdarəedilməsi
          </h3>
          <p className="text-sm text-gray-500 mt-1 font-light">SalonHub sistemindəki filialları asanlıqla idarə edin.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-[#1A1714] hover:bg-[#2c2823] text-white px-5 py-2.5 rounded-md transition-colors duration-300 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm tracking-wide">Yeni Filial</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {branches.map(branch => (
          <div key={branch.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300 relative group">
            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <button
                onClick={() => handleOpenModal(branch)}
                className="p-1.5 bg-[#FAF6F0] text-[#B8935A] rounded hover:bg-[#C9A227] hover:text-white transition-colors"
                title="Redaktə et"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(branch.id)}
                className="p-1.5 bg-[#FAF6F0] text-red-400 rounded hover:bg-red-50 hover:text-red-500 transition-colors"
                title="Sil"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <h3 className="text-lg font-medium text-[#1A1714] mb-4 pr-16">{branch.name}</h3>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-[#C9A227] mt-0.5 shrink-0" />
                <span className="text-sm text-gray-600 leading-relaxed">{branch.address}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-[#C9A227] shrink-0" />
                <span className="text-sm text-gray-600">{branch.phoneNumber}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {branches.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-dashed border-[#C9A227]/30">
          <Building2 className="w-12 h-12 text-[#C9A227]/50 mb-4" strokeWidth={1} />
          <p className="text-gray-500 font-light">Hələ heç bir filial əlavə edilməyib.</p>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-[#1A1714]/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-medium text-[#1A1714]">
                {editingBranch ? 'Filialı Redaktə Et' : 'Yeni Filial Əlavə Et'}
              </h2>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-[#1A1714] transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Filialın Adı</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 bg-[#FAF6F0] border border-transparent focus:border-[#C9A227] focus:bg-white rounded-lg outline-none transition-all text-sm text-[#1A1714]"
                  placeholder="Məs: Şəhər Mərkəzi Filialı"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Ünvan</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 bg-[#FAF6F0] border border-transparent focus:border-[#C9A227] focus:bg-white rounded-lg outline-none transition-all text-sm text-[#1A1714]"
                  placeholder="Məs: Nizami küç, 42"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Telefon</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 bg-[#FAF6F0] border border-transparent focus:border-[#C9A227] focus:bg-white rounded-lg outline-none transition-all text-sm text-[#1A1714]"
                  placeholder="+994 50 000 00 00"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Aid olduğu Salon</label>
                <select
                  name="salonId"
                  value={formData.salonId}
                  onChange={handleChange}
                  disabled={!!editingBranch}
                  required
                  className="w-full px-4 py-2.5 bg-[#FAF6F0] border border-transparent focus:border-[#C9A227] focus:bg-white rounded-lg outline-none transition-all text-sm text-[#1A1714] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <option value="" disabled>Salon seçin</option>
                  {salons.map(salon => (
                    <option key={salon.id} value={salon.id}>{salon.name}</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                >
                  Ləğv et
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-[#C9A227] text-white rounded-lg hover:bg-[#B8935A] transition-colors text-sm font-medium"
                >
                  {editingBranch ? 'Yadda saxla' : 'Əlavə et'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BranchManagement;
