import React, { useState } from 'react';
import { Plus, Edit2, Trash2, X, UploadCloud, FileText, Calendar, MapPin } from 'lucide-react';
import api from '../../services/api';

const NewsManagement = ({ news = [], salons = [], onCreate, onEdit, onDelete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedNews, setSelectedNews] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    imageUrl: '',
    salonId: '',
  });

  const resetForm = () => {
    setFormData({ title: '', content: '', imageUrl: '', salonId: '' });
    setSelectedNews(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setSelectedNews(item);
    setFormData({
      title: item.title,
      content: item.content,
      imageUrl: item.imageUrl || '',
      salonId: item.salonId || '',
    });
    setIsModalOpen(true);
  };

  const handleOpenDelete = (item) => {
    setSelectedNews(item);
    setIsDeleteModalOpen(true);
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const uploadData = new FormData();
      uploadData.append('file', file);
      const res = await api.post('/Upload/image', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = res.data.url || res.data.imageUrl || res.data;
      setFormData((prev) => ({ ...prev, imageUrl: url }));
    } catch (err) {
      alert('Sekil yuklenmedi');
    }
    setUploading(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      titleAz: formData.title,
      contentAz: formData.content,
      imageUrl: formData.imageUrl || null,
      salonId: formData.salonId ? Number(formData.salonId) : null,
    };
    if (selectedNews) {
      onEdit(selectedNews.id, payload);
    } else {
      onCreate(payload);
    }
    setIsModalOpen(false);
  };

  const confirmDelete = () => {
    if (selectedNews) onDelete(selectedNews.id);
    setIsDeleteModalOpen(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-[#1A1714]">Xəbərlər və Yeniliklər</h1>
          <p className="text-[#1A1714]/70 mt-2 font-medium">Salon xəbərlərini və bloq yazılarını idarə edin</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 bg-[#C9A227] hover:bg-[#B8935A] text-white px-6 py-3 rounded-lg font-semibold transition-colors shadow-lg shadow-[#C9A227]/20"
        >
          <Plus size={20} />
          <span>Yeni Xəbər</span>
        </button>
      </div>

      {news.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 border-2 border-dashed border-[#C9A227]/30 rounded-2xl bg-white/50">
          <div className="bg-[#FAF6F0] p-5 rounded-full mb-4 text-[#C9A227] shadow-sm">
            <FileText size={48} strokeWidth={1.5} />
          </div>
          <h3 className="font-serif text-2xl font-semibold mb-2">Hələ heç bir xəbər yoxdur</h3>
          <p className="text-[#1A1714]/60 text-center max-w-md mb-6">
            Salonunuzdakı yenilikləri müştərilərinizlə paylaşmaq üçün ilk xəbərinizi yaradın.
          </p>
          <button
            onClick={handleOpenCreate}
            className="text-[#C9A227] font-semibold hover:text-[#B8935A] flex items-center gap-1 transition-colors"
          >
            <Plus size={18} /> İlk xəbəri əlavə et
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {news.map((item, index) => {
            const isFeatured = index === 0;
            return (
              <div
                key={item.id}
                className={`group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden border border-[#1A1714]/5 hover:-translate-y-1 ${
                  isFeatured ? 'md:col-span-2' : 'col-span-1'
                }`}
              >
                <div className={`relative w-full overflow-hidden bg-[#1A1714] ${isFeatured ? 'h-[300px] lg:h-[400px]' : 'h-[220px]'}`}>
                  <img
                    src={item.imageUrl || 'https://placehold.co/800x600/1A1714/FAF6F0?text=SalonHub'}
                    alt={item.title}
                    className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button onClick={() => handleOpenEdit(item)} className="p-2 bg-white/90 hover:bg-white backdrop-blur-md rounded-full text-[#1A1714] shadow-sm transition-colors" title="Redakte et">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleOpenDelete(item)} className="p-2 bg-white/90 hover:bg-red-50 hover:text-red-500 backdrop-blur-md rounded-full text-[#1A1714] shadow-sm transition-colors" title="Sil">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className={`flex flex-col flex-1 bg-white ${isFeatured ? 'p-6 lg:p-8' : 'p-6'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-[#FAF6F0] text-[#C9A227] px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 border border-[#C9A227]/20">
                      <Calendar size={14} />
                      {item.publishedDate ? new Date(item.publishedDate).toLocaleDateString('az-AZ', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                    </div>
                    {item.salonId && (
                      <span className="flex items-center gap-1 text-xs font-semibold text-[#1A1714]/50 uppercase tracking-wide">
                        <MapPin size={12} />
                        {salons.find((s) => s.id === item.salonId)?.name || 'Umumi'}
                      </span>
                    )}
                    {item.authorEmployeeName && (
                      <span className="flex items-center gap-1 text-xs font-semibold text-[#C9A227]">
                        {item.authorEmployeeName}
                      </span>
                    )}
                  </div>

                  <h2 className={`font-serif text-[#1A1714] font-bold mb-3 leading-snug group-hover:text-[#C9A227] transition-colors ${isFeatured ? 'text-2xl lg:text-3xl' : 'text-xl'}`}>
                    {item.title}
                  </h2>

                  <p className={`text-[#1A1714]/70 ${isFeatured ? 'text-base lg:text-lg line-clamp-3' : 'text-sm line-clamp-3'}`}>
                    {item.content}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1A1714]/60 backdrop-blur-sm">
          <div className="bg-[#FAF6F0] w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-[#1A1714]/10 bg-white">
              <h2 className="text-2xl font-serif font-bold text-[#1A1714]">
                {selectedNews ? 'Xəbəri Redaktə Et' : 'Yeni Xəbər Yarat'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-[#1A1714]/50 hover:text-[#1A1714]">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <form id="newsForm" onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-[#1A1714] mb-2">Başlıq</label>
                  <input
                    type="text" required value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-[#1A1714]/20 bg-white focus:outline-none focus:ring-2 focus:ring-[#C9A227] focus:border-transparent transition-all"
                    placeholder="Mes: Yeni Yay Endirimlerimiz Basladi!"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#1A1714] mb-2">Aid Oldugu Salon</label>
                  <select
                    value={formData.salonId}
                    onChange={(e) => setFormData({ ...formData, salonId: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-[#1A1714]/20 bg-white focus:outline-none focus:ring-2 focus:ring-[#C9A227] focus:border-transparent transition-all appearance-none"
                  >
                    <option value="">Umumi (Butun salonlar)</option>
                    {salons.map((salon) => (
                      <option key={salon.id} value={salon.id}>{salon.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#1A1714] mb-2">Sekil</label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-[#1A1714]/20 border-dashed rounded-lg bg-white relative hover:bg-gray-50 transition-colors">
                    {formData.imageUrl ? (
                      <div className="relative w-full h-48 rounded-lg overflow-hidden group">
                        <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <label className="cursor-pointer bg-white text-[#1A1714] px-4 py-2 rounded-lg font-semibold flex items-center gap-2">
                            <UploadCloud size={18} /> {uploading ? 'Yuklenir...' : 'Deyisdir'}
                            <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                          </label>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1 text-center">
                        <UploadCloud className="mx-auto h-12 w-12 text-[#C9A227]" />
                        <div className="flex text-sm text-[#1A1714]/70 justify-center">
                          <label className="relative cursor-pointer rounded-md font-semibold text-[#C9A227] hover:text-[#B8935A] focus-within:outline-none">
                            <span>{uploading ? 'Yuklenir...' : 'Sekil yukle'}</span>
                            <input type="file" className="sr-only" accept="image/*" onChange={handleImageChange} />
                          </label>
                          <p className="pl-1">ve ya bura suruklə</p>
                        </div>
                        <p className="text-xs text-[#1A1714]/50">PNG, JPG (Max 5MB)</p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#1A1714] mb-2">Məzmun</label>
                  <textarea
                    required rows={6} value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-[#1A1714]/20 bg-white focus:outline-none focus:ring-2 focus:ring-[#C9A227] focus:border-transparent transition-all resize-none"
                    placeholder="Xeberin detallarini bura yazin..."
                  ></textarea>
                </div>
              </form>
            </div>

            <div className="p-6 border-t border-[#1A1714]/10 bg-white flex justify-end gap-3 rounded-b-2xl">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 rounded-lg font-semibold text-[#1A1714] hover:bg-[#1A1714]/5 transition-colors">
                Legv et
              </button>
              <button type="submit" form="newsForm" className="px-6 py-2.5 rounded-lg font-semibold bg-[#C9A227] text-white hover:bg-[#B8935A] shadow-md transition-colors">
                {selectedNews ? 'Yadda Saxla' : 'Nesr Et'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1A1714]/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 text-center">
            <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={32} />
            </div>
            <h3 className="text-xl font-serif font-bold text-[#1A1714] mb-2">Silmek isteyirsiniz?</h3>
            <p className="text-[#1A1714]/60 mb-6">
              "<span className="font-semibold text-[#1A1714]">{selectedNews?.title}</span>" xeberi hemiselik silinecek.
            </p>
            <div className="flex justify-center gap-3">
              <button onClick={() => setIsDeleteModalOpen(false)} className="px-5 py-2.5 rounded-lg font-semibold bg-[#FAF6F0] text-[#1A1714] hover:bg-gray-200 transition-colors">
                Legv et
              </button>
              <button onClick={confirmDelete} className="px-5 py-2.5 rounded-lg font-semibold bg-red-500 text-white hover:bg-red-600 shadow-md transition-colors">
                Beli, Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewsManagement;


