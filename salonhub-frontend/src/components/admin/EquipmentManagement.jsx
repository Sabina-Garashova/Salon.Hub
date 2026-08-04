import React, { useState } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Filter,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  User,
  Sparkles,
  Building2,
  X,
  Scissors,
  Layers,
  Search,
  Armchair
} from 'lucide-react';

export default function EquipmentManagement({
  equipment = [],
  branches = [],
  salons = [],
  employees = [],
  onCreate,
  onUpdate,
  onDelete
}) {
  const getSalonForBranch = (branchId) => {
    const branch = branches.find((b) => b.id === branchId);
    if (!branch) return null;
    return salons.find((s) => s.id === branch.salonId) || null;
  };
  const getBranchIdForSalon = (salonId) => {
    const branch = branches.find((b) => b.salonId === Number(salonId));
    return branch ? branch.id : null;
  };
  const [statusFilter, setStatusFilter] = useState('Hamisi');
  const STATUS_KEYS = { Hamisi: 'Hamisi', Active: 'Active', Busy: 'Busy', Faulty: 'Faulty', InRepair: 'InRepair' };
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const [createForm, setCreateForm] = useState({
    name: '',
    type: 'Lazer Cihazi',
    salonId: salons[0]?.id || 1
  });

  const [editForm, setEditForm] = useState({
    id: null,
    name: '',
    type: '',
    status: 'Active'
  });

  const STATUS_LABELS = { Active: 'Islek', Busy: 'Mesgul', Faulty: 'Xarab', InRepair: 'Temirde' };
  const normalizeStatus = (status) => STATUS_LABELS[status] || status;

  const totalCount = equipment.length;
  const workingCount = equipment.filter((item) => item.status === 'Active').length;
  const repairCount = equipment.filter((item) => item.status === 'InRepair').length;
  const discardedCount = equipment.filter((item) => item.status === 'Faulty' || item.status === 'Busy').length;

  const filteredEquipment = equipment.filter((item) => {
    const matchesStatus = statusFilter === 'Hamisi' || item.status === statusFilter;
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.type.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getTypeIcon = (type = '') => {
    const lower = type.toLowerCase();
    if (lower.includes('lazer')) return <Sparkles className="w-4 h-4 text-[#C9A227]" />;
    if (lower.includes('mebel') || lower.includes('carpayi') || lower.includes('kreslo') || lower.includes('stul') || lower.includes('kursu'))
      return <Armchair className="w-4 h-4 text-[#B8935A]" />;
    if (lower.includes('kosmetoloji'))
      return <Layers className="w-4 h-4 text-[#B8935A]" />;
    if (lower.includes('sac') || lower.includes('qurutucu') || lower.includes('fen'))
      return <Scissors className="w-4 h-4 text-[#B8935A]" />;
    return <Wrench className="w-4 h-4 text-[#B8935A]" />;
  };

  const getStatusBadge = (status) => {
    if (status === 'Active') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          Islek
        </span>
      );
    }
    if (status === 'InRepair') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          Temirde
        </span>
      );
    }
    if (status === 'Busy') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
          Mesgul
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
        Xarab
      </span>
    );
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!createForm.name) return;
    if (onCreate) {
      onCreate({
        name: createForm.name,
        type: createForm.type,
        salonId: Number(createForm.salonId)
      });
    }
    setCreateForm({ name: '', type: 'Lazer Cihazi', salonId: salons[0]?.id || 1 });
    setIsCreateOpen(false);
  };

  const handleOpenEdit = (item) => {
    setEditForm({
      id: item.id,
      name: item.name,
      type: item.type,
      status: item.status
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (onUpdate && editForm.id) {
      onUpdate(editForm.id, {
        name: editForm.name,
        type: editForm.type,
        status: editForm.status
      });
    }
    setIsEditOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (onDelete && deleteConfirmId) {
      onDelete(deleteConfirmId);
    }
    setDeleteConfirmId(null);
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 text-[#1A1714] font-sans bg-[#FAF6F0] -m-6">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#B8935A]/30 pb-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1A1714] font-serif">
              Avadanliq Idareetmesi
            </h1>
            <p className="text-sm text-[#1A1714]/70 mt-1">
              Salon sebekesinin texniki techizati, statuslari ve tehkim olunmus ustalar.
            </p>
          </div>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all shadow-md hover:shadow-lg bg-[#C9A227] hover:bg-[#B8935A] text-[#1A1714]"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Avadanliq Elave Et</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-xl bg-white border border-[#B8935A]/20 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-[#1A1714]/60 uppercase tracking-wider">
                Umumi Avadanliq
              </p>
              <h3 className="text-2xl font-bold text-[#1A1714] mt-1">{totalCount}</h3>
            </div>
            <div className="p-3 rounded-lg bg-[#FAF6F0] text-[#C9A227]">
              <Layers className="w-6 h-6" />
            </div>
          </div>

          <div className="p-5 rounded-xl bg-white border border-[#B8935A]/20 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-[#1A1714]/60 uppercase tracking-wider">
                Islek Veziyyetde
              </p>
              <h3 className="text-2xl font-bold text-emerald-700 mt-1">{workingCount}</h3>
            </div>
            <div className="p-3 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          <div className="p-5 rounded-xl bg-white border border-[#B8935A]/20 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-[#1A1714]/60 uppercase tracking-wider">
                Temirde Olanlar
              </p>
              <h3 className="text-2xl font-bold text-amber-700 mt-1">{repairCount}</h3>
            </div>
            <div className="p-3 rounded-lg bg-amber-50 text-amber-600">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>

          <div className="p-5 rounded-xl bg-white border border-[#B8935A]/20 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-[#1A1714]/60 uppercase tracking-wider">
                Xaric Edilmis
              </p>
              <h3 className="text-2xl font-bold text-rose-700 mt-1">{discardedCount}</h3>
            </div>
            <div className="p-3 rounded-lg bg-rose-50 text-rose-600">
              <XCircle className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#B8935A]/20 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#1A1714]/40" />
            <input
              type="text"
              placeholder="Avadanliq adi ve ya tipi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-[#FAF6F0] border border-[#B8935A]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A227] transition"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <Filter className="w-4 h-4 text-[#B8935A] shrink-0 mr-1" />
            {[
              { key: 'Hamisi', label: 'Hamisi' },
              { key: 'Active', label: 'Islek' },
              { key: 'Busy', label: 'Mesgul' },
              { key: 'InRepair', label: 'Temirde' },
              { key: 'Faulty', label: 'Xarab' }
            ].map((s) => {
              const active = statusFilter === s.key;
              return (
                <button
                  key={s.key}
                  onClick={() => setStatusFilter(s.key)}
                  className={"px-3 py-1.5 rounded-lg text-xs font-medium transition shrink-0 " + (active ? 'bg-[#1A1714] text-[#F0D68A] shadow-sm' : 'bg-[#FAF6F0] text-[#1A1714]/70 hover:bg-[#B8935A]/20')}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-8">
          {salons.map((branch) => {
            const branchIds = branches.filter((b) => b.salonId === branch.id).map((b) => b.id);
            const branchEquipment = filteredEquipment.filter(
              (eq) => branchIds.includes(eq.branchId)
            );

            return (
              <div
                key={branch.id}
                className="bg-white rounded-2xl border border-[#B8935A]/20 p-5 sm:p-6 shadow-sm"
              >
                <div className="flex items-center justify-between border-b border-[#FAF6F0] pb-4 mb-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-[#1A1714] text-[#C9A227]">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-[#1A1714] font-serif">
                        {branch.name}
                      </h2>
                      <p className="text-xs text-[#1A1714]/60">{branch.address}</p>
                    </div>
                  </div>

                  <span className="text-xs font-semibold px-3 py-1 bg-[#FAF6F0] text-[#B8935A] rounded-full border border-[#B8935A]/20">
                    {branchEquipment.length} Avadanliq
                  </span>
                </div>

                {branchEquipment.length === 0 ? (
                  <div className="text-center py-8 bg-[#FAF6F0]/50 rounded-xl border border-dashed border-[#B8935A]/30">
                    <Wrench className="w-8 h-8 text-[#B8935A]/40 mx-auto mb-2" />
                    <p className="text-sm text-[#1A1714]/60">
                      Bu filialda secilmis filtre uygun avadanliq tapilmadi.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {branchEquipment.map((item) => {
                      const assignedEmployee = employees.find(
                        (emp) => emp.assignedEquipmentId === item.id
                      );

                      return (
                        <div
                          key={item.id}
                          className="p-4 rounded-xl border border-[#B8935A]/20 bg-[#FAF6F0]/30 hover:border-[#C9A227] hover:shadow-md transition flex flex-col justify-between space-y-4"
                        >
                          <div className="space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <div className="p-2 rounded-md bg-white border border-[#B8935A]/20">
                                  {getTypeIcon(item.type)}
                                </div>
                                <div>
                                  <span className="text-[11px] uppercase tracking-wider text-[#B8935A] font-semibold">
                                    {item.type}
                                  </span>
                                  <h3 className="text-base font-bold text-[#1A1714] leading-snug">
                                    {item.name}
                                  </h3>
                                </div>
                              </div>
                            </div>

                            <div>{getStatusBadge(item.status)}</div>
                          </div>

                          <div className="pt-3 border-t border-[#B8935A]/15 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 overflow-hidden">
                              {assignedEmployee ? (
                                <>
                                  {assignedEmployee.profileImageUrl ? (
                                    <img
                                      src={assignedEmployee.profileImageUrl}
                                      alt={assignedEmployee.fullName}
                                      className="w-7 h-7 rounded-full object-cover border border-[#C9A227]"
                                    />
                                  ) : (
                                    <div className="w-7 h-7 rounded-full bg-[#1A1714] text-[#F0D68A] flex items-center justify-center text-xs font-bold shrink-0">
                                      <User className="w-4 h-4" />
                                    </div>
                                  )}
                                  <div className="truncate">
                                    <p className="text-[10px] text-[#1A1714]/50 leading-none">
                                      Istifade edir:
                                    </p>
                                    <p className="text-xs font-semibold text-[#1A1714] truncate mt-0.5">
                                      {assignedEmployee.fullName}
                                    </p>
                                  </div>
                                </>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-xs text-[#1A1714]/60 font-medium px-2 py-0.5 rounded bg-gray-200/60">
                                  Serbest
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => handleOpenEdit(item)}
                                className="p-1.5 rounded-lg text-[#1A1714]/70 hover:text-[#C9A227] hover:bg-white transition border border-transparent hover:border-[#B8935A]/20"
                                title="Redakte et"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(item.id)}
                                className="p-1.5 rounded-lg text-[#1A1714]/70 hover:text-rose-600 hover:bg-white transition border border-transparent hover:border-rose-200"
                                title="Sil"
                              >
                                <Trash2 className="w-4 h-4" />
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

        {isCreateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-md w-full border border-[#B8935A]/30 shadow-2xl overflow-hidden">
              <div className="bg-[#1A1714] p-5 text-white flex items-center justify-between">
                <h3 className="text-lg font-bold text-[#F0D68A] font-serif">
                  Yeni Avadanliq Elave Et
                </h3>
                <button
                  onClick={() => setIsCreateOpen(false)}
                  className="text-white/60 hover:text-white transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-[#1A1714]/70 mb-1">
                    Avadanliq Adi
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Mes: Candela GentleLase Pro"
                    value={createForm.name}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, name: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-[#FAF6F0] border border-[#B8935A]/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A227]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-[#1A1714]/70 mb-1">
                    Tip
                  </label>
                  <select
                    value={createForm.type}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, type: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-[#FAF6F0] border border-[#B8935A]/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A227]"
                  >
                    <option value="Lazer Cihazi">Lazer Cihazi</option>
                    <option value="Manikur ve Pedikur Avadanligi">Manikur ve Pedikur Avadanligi</option>
                    <option value="Elektrik Cihazlari">Elektrik Cihazlari (sac qurutucu, ütü ve s.)</option>
                    <option value="Mebel">Mebel (carpayi, kreslo, stul ve s.)</option>
                    <option value="Kosmetoloji Avadanligi">Kosmetoloji Avadanligi</option>
                    <option value="Diger">Diger</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-[#1A1714]/70 mb-1">
                    Salon
                  </label>
                  <select
                    value={createForm.salonId}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, salonId: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-[#FAF6F0] border border-[#B8935A]/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A227]"
                  >
                    {salons.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className="px-4 py-2 rounded-lg text-xs font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
                  >
                    Legv Et
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#C9A227] hover:bg-[#B8935A] text-[#1A1714] transition"
                  >
                    Elave Et
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {isEditOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-md w-full border border-[#B8935A]/30 shadow-2xl overflow-hidden">
              <div className="bg-[#1A1714] p-5 text-white flex items-center justify-between">
                <h3 className="text-lg font-bold text-[#F0D68A] font-serif">
                  Avadanligi Redakte Et
                </h3>
                <button
                  onClick={() => setIsEditOpen(false)}
                  className="text-white/60 hover:text-white transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-[#1A1714]/70 mb-1">
                    Avadanliq Adi
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, name: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-[#FAF6F0] border border-[#B8935A]/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A227]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-[#1A1714]/70 mb-1">
                    Tip
                  </label>
                  <select
                    required
                    value={editForm.type}
                    onChange={(e) =>
                      setEditForm({ ...editForm, type: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-[#FAF6F0] border border-[#B8935A]/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A227]"
                  >
                    {!['Lazer Cihazi', 'Manikur ve Pedikur Avadanligi', 'Elektrik Cihazlari', 'Mebel', 'Kosmetoloji Avadanligi', 'Diger'].includes(editForm.type) && editForm.type && (
                      <option value={editForm.type}>{editForm.type} (kohne deyer)</option>
                    )}
                    <option value="Lazer Cihazi">Lazer Cihazi</option>
                    <option value="Manikur ve Pedikur Avadanligi">Manikur ve Pedikur Avadanligi</option>
                    <option value="Elektrik Cihazlari">Elektrik Cihazlari (sac qurutucu, ütü ve s.)</option>
                    <option value="Mebel">Mebel (carpayi, kreslo, stul ve s.)</option>
                    <option value="Kosmetoloji Avadanligi">Kosmetoloji Avadanligi</option>
                    <option value="Diger">Diger</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-[#1A1714]/70 mb-1">
                    Status
                  </label>
                  <select
                    value={editForm.status}
                    onChange={(e) =>
                      setEditForm({ ...editForm, status: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-[#FAF6F0] border border-[#B8935A]/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A227]"
                  >
                    <option value="Active">Islek</option>
                    <option value="Busy">Mesgul</option>
                    <option value="InRepair">Temirde</option>
                    <option value="Faulty">Xarab</option>
                  </select>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsEditOpen(false)}
                    className="px-4 py-2 rounded-lg text-xs font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
                  >
                    Legv Et
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#C9A227] hover:bg-[#B8935A] text-[#1A1714] transition"
                  >
                    Yenile
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {deleteConfirmId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl border border-rose-200 space-y-4">
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-base font-bold text-[#1A1714]">
                  Avadanligi silmeye eminsiniz?
                </h3>
                <p className="text-xs text-[#1A1714]/60 mt-1">
                  Bu emeliyyat geri qaytarila bilmez.
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
                >
                  Legv Et
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition"
                >
                  Beli, Sil
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}













