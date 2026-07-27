import { useState } from "react";
import { Plus, Edit2, Trash2, Hash, AlertTriangle } from "lucide-react";

export default function TagsManagement({ tags = [], onCreate, onEdit, onDelete }) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState(null);
  const [name, setName] = useState("");

  const handleCreateOpen = () => {
    setName("");
    setIsCreateModalOpen(true);
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    onCreate({ name });
    setIsCreateModalOpen(false);
  };

  const handleEditOpen = (tag) => {
    setSelectedTag(tag);
    setName(tag.name);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    onEdit(selectedTag.id, { name });
    setIsEditModalOpen(false);
  };

  const handleDeleteOpen = (tag) => {
    setSelectedTag(tag);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = () => {
    onDelete(selectedTag.id);
    setIsDeleteModalOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-[#1A1714]">Tag-larin Idare Edilmesi</h1>
          <p className="text-sm text-[#1A1714]/50">Xidmetleri etiketlemek ucun tag-lari burada idare edin</p>
        </div>
        <button
          onClick={handleCreateOpen}
          className="flex items-center gap-2 bg-[#1A1714] text-[#FAF6F0] hover:bg-[#C9A227] hover:text-[#1A1714] transition-all duration-300 px-5 py-2.5 rounded-lg font-medium shadow-md border border-[#B8935A]/30"
        >
          <Plus size={16} className="text-[#C9A227]" />
          <span>Yeni Tag</span>
        </button>
      </div>

      {tags.length === 0 ? (
        <div className="flex flex-col items-center justify-center bg-white border border-[#B8935A]/20 rounded-2xl p-16 text-center shadow-sm">
          <div className="w-16 h-16 bg-[#FAF6F0] rounded-full flex items-center justify-center border border-[#B8935A]/40 mb-4">
            <Hash size={28} className="text-[#C9A227]" />
          </div>
          <h3 className="text-xl font-serif font-semibold text-[#1A1714] mb-2">Hele tag yoxdur</h3>
          <button
            onClick={handleCreateOpen}
            className="mt-4 flex items-center gap-2 bg-[#1A1714] text-[#FAF6F0] hover:bg-[#C9A227] hover:text-[#1A1714] px-5 py-2.5 rounded-lg text-sm font-medium transition-colors border border-[#B8935A]/30"
          >
            <Plus size={16} /> Ilk Tag-i Yarat
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          {tags.map((tag) => (
            <div
              key={tag.id}
              className="flex items-center gap-2 bg-white border border-[#B8935A]/20 rounded-full pl-4 pr-2 py-2 shadow-sm hover:border-[#C9A227]/50 transition-all group"
            >
              <Hash size={14} className="text-[#C9A227]" />
              <span className="text-sm font-medium text-[#1A1714]">{tag.name}</span>
              <button
                onClick={() => handleEditOpen(tag)}
                className="p-1.5 text-[#1A1714]/50 hover:text-[#C9A227] hover:bg-[#FAF6F0] rounded-full transition-all"
              >
                <Edit2 size={12} />
              </button>
              <button
                onClick={() => handleDeleteOpen(tag)}
                className="p-1.5 text-[#1A1714]/50 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#1A1714]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-[#B8935A]/30 w-full max-w-md overflow-hidden">
            <div className="bg-[#1A1714] p-5 border-b border-[#B8935A]/20 flex justify-between items-center">
              <h2 className="text-xl font-serif font-bold text-[#FAF6F0]">Yeni Tag</h2>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-[#FAF6F0]/70 hover:text-[#F0D68A] text-sm">Bagla</button>
            </div>
            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#1A1714]/70 mb-1">Tag Adi *</label>
                <input
                  type="text" required value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Mes. Premium, Yeni, Endirimli"
                  className="w-full text-sm p-2.5 rounded-lg border border-[#B8935A]/30 focus:outline-none focus:border-[#C9A227] bg-[#FAF6F0]/30"
                />
              </div>
              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-[#1A1714]/70 hover:bg-gray-50 font-medium">Legv et</button>
                <button type="submit" className="px-5 py-2.5 bg-[#1A1714] text-[#FAF6F0] hover:bg-[#C9A227] hover:text-[#1A1714] rounded-lg text-sm font-medium transition-colors border border-[#B8935A]/30 shadow-md">Elave et</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditModalOpen && selectedTag && (
        <div className="fixed inset-0 z-50 bg-[#1A1714]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-[#B8935A]/30 w-full max-w-md overflow-hidden">
            <div className="bg-[#1A1714] p-5 border-b border-[#B8935A]/20 flex justify-between items-center">
              <h2 className="text-xl font-serif font-bold text-[#FAF6F0]">Tag-i Redakte Et</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-[#FAF6F0]/70 hover:text-[#F0D68A] text-sm">Bagla</button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#1A1714]/70 mb-1">Tag Adi *</label>
                <input
                  type="text" required value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full text-sm p-2.5 rounded-lg border border-[#B8935A]/30 focus:outline-none focus:border-[#C9A227]"
                />
              </div>
              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-[#1A1714]/70 hover:bg-gray-50 font-medium">Legv et</button>
                <button type="submit" className="px-5 py-2.5 bg-[#1A1714] text-[#FAF6F0] hover:bg-[#C9A227] hover:text-[#1A1714] rounded-lg text-sm font-medium transition-colors border border-[#B8935A]/30 shadow-md">Yenile</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDeleteModalOpen && selectedTag && (
        <div className="fixed inset-0 z-50 bg-[#1A1714]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-red-100 w-full max-w-md overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-200">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-lg font-serif font-bold text-[#1A1714] mb-2">Tag-i silmek</h3>
              <p className="text-sm text-[#1A1714]/60 mb-6">Bu tag-i silmek istediyinizden eminsiniz?</p>
              <div className="flex justify-center gap-3">
                <button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-[#1A1714]/70 hover:bg-gray-50 font-medium transition-colors">Legv et</button>
                <button onClick={handleDeleteConfirm} className="px-5 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg text-sm font-medium transition-colors shadow-md">Beli, Sil</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}