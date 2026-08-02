import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  Clock,
  Edit2,
  MoreHorizontal,
  Plus,
  Scissors,
  Store,
  Tag,
  Trash2,
  X,
} from "lucide-react";

function getSalonName(salons, salonId) {
  return salons.find((s) => s.id === salonId)?.name ?? `Salon #${salonId}`;
}

function groupServicesByName(services) {
  const map = new Map();

  for (const service of services) {
    const key = (service.name ?? "").trim();
    if (!map.has(key)) {
      map.set(key, { name: key, items: [] });
    }
    map.get(key).items.push(service);
  }

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, "az"));
}

function formatGroupedValue(items, field) {
  const values = [...new Set(items.map((item) => item[field]))];
  if (values.length === 1) return values[0];
  return null;
}

const emptyForm = {
  nameAz: "",
  price: "",
  durationMinutes: "",
  categoryId: "",
};

export default function AdminServicesSection({
  services = [],
  salons = [],
  categories = [],
  loading = false,
  onCreateForSalons,
  onEdit,
  onDelete,
}) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [selectedSalonIds, setSelectedSalonIds] = useState([]);
  const [applyToAll, setApplyToAll] = useState(false);
  const [openActionsKey, setOpenActionsKey] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const groupedServices = useMemo(() => groupServicesByName(services), [services]);
  const allSalonIds = useMemo(() => salons.map((s) => s.id), [salons]);

  useEffect(() => {
    if (applyToAll) {
      setSelectedSalonIds(allSalonIds);
    }
  }, [applyToAll, allSalonIds]);

  useEffect(() => {
    if (
      allSalonIds.length > 0 &&
      selectedSalonIds.length === allSalonIds.length &&
      !applyToAll
    ) {
      setApplyToAll(true);
    } else if (applyToAll && selectedSalonIds.length !== allSalonIds.length) {
      setApplyToAll(false);
    }
  }, [selectedSalonIds, allSalonIds, applyToAll]);

  const resetCreateForm = () => {
    setForm(emptyForm);
    if (salons.length === 1) {
      setSelectedSalonIds([salons[0].id]);
      setApplyToAll(false);
    } else {
      setSelectedSalonIds([]);
      setApplyToAll(false);
    }
  };

  const openCreate = () => {
    resetCreateForm();
    setEditItem(null);
    setIsCreateOpen(true);
  };

  const openEdit = (service) => {
    setEditItem(service);
    setForm({
      nameAz: service.name ?? "",
      price: String(service.price ?? ""),
      durationMinutes: String(service.durationMinutes ?? ""),
      categoryId: String(service.categoryId ?? ""),
    });
    setIsCreateOpen(false);
    setOpenActionsKey(null);
  };

  const closeModals = () => {
    setIsCreateOpen(false);
    setEditItem(null);
    resetCreateForm();
  };

  const toggleSalon = (salonId) => {
    setSelectedSalonIds((prev) =>
      prev.includes(salonId) ? prev.filter((id) => id !== salonId) : [...prev, salonId]
    );
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (selectedSalonIds.length === 0) {
      alert("En az bir salon secin.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onCreateForSalons?.({
        nameAz: form.nameAz,
        price: Number(form.price),
        durationMinutes: Number(form.durationMinutes),
        categoryId: Number(form.categoryId),
        salonIds: selectedSalonIds,
      });
      closeModals();
    } catch (err) {
      alert(err?.message || "Xeta bas verdi");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editItem) return;

    setIsSubmitting(true);
    try {
      await onEdit?.({
        id: editItem.id,
        nameAz: form.nameAz,
        price: Number(form.price),
        durationMinutes: Number(form.durationMinutes),
        categoryId: Number(form.categoryId),
        salonId: editItem.salonId,
      });
      closeModals();
    } catch (err) {
      alert(err?.message || "Xeta bas verdi");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (service) => {
    if (!window.confirm(`"${service.name}" xidmetini ${getSalonName(salons, service.salonId)} salonundan silmek isteyirsiniz?`)) {
      return;
    }

    try {
      await onDelete?.(service.id);
      setOpenActionsKey(null);
    } catch (err) {
      alert(err?.message || "Xeta bas verdi");
    }
  };

  const getCategoryName = (categoryId) =>
    categories.find((c) => c.id === categoryId)?.name ?? "—";

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="font-serif text-lg font-bold text-[#1A1714]">Xidmet Menyusu</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Eyni adli xidmetler qruplasdirilir; her salon ucun ayri nusxe yaradilir.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="bg-gradient-to-r from-[#B8935A] to-[#C9A227] text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Yeni Xidmet
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-200/70 p-12 flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#B8935A]/20 border-t-[#C9A227] rounded-full animate-spin" />
          <p className="text-xs text-gray-400">Xidmetler yuklenir...</p>
        </div>
      ) : groupedServices.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-10 text-center">
          <Scissors className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-400">Hele xidmet elave edilmeyib.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200/70 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[640px]">
              <thead>
                <tr className="bg-[#1A1714] text-[#FAF6F0] font-serif tracking-wider uppercase text-[10px]">
                  <th className="p-4">Xidmet Adi</th>
                  <th className="p-4">Kateqoriya</th>
                  <th className="p-4">Muddet</th>
                  <th className="p-4">Qiymet</th>
                  <th className="p-4 text-right">Emeliyyatlar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {groupedServices.map((group) => {
                  const duration = formatGroupedValue(group.items, "durationMinutes");
                  const price = formatGroupedValue(group.items, "price");
                  const categoryId = formatGroupedValue(group.items, "categoryId");
                  const salonNames = group.items
                    .map((item) => getSalonName(salons, item.salonId))
                    .join(", ");
                  const actionsKey = group.name;

                  return (
                    <tr key={group.name} className="hover:bg-[#FAF6F0]/40 transition align-top">
                      <td className="p-4">
                        <p className="font-semibold text-[#1A1714]">{group.name}</p>
                        <p className="text-[10px] text-gray-400 mt-1.5 leading-relaxed max-w-xs">
                          Bu xidmeti teklif eden salonlar:{" "}
                          <span className="text-[#B8935A] font-medium">{salonNames}</span>
                        </p>
                      </td>
                      <td className="p-4 text-gray-500">
                        {categoryId != null ? getCategoryName(categoryId) : "Mixtalif"}
                      </td>
                      <td className="p-4 font-medium text-gray-500">
                        {duration != null ? (
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {duration} deq
                          </span>
                        ) : (
                          "Mixtalif"
                        )}
                      </td>
                      <td className="p-4 font-bold text-[#1A1714]">
                        {price != null ? `${price} AZN` : "Mixtalif"}
                      </td>
                      <td className="p-4 text-right relative">
                        <button
                          type="button"
                          onClick={() =>
                            setOpenActionsKey(openActionsKey === actionsKey ? null : actionsKey)
                          }
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-600 border border-gray-200 font-medium"
                        >
                          <MoreHorizontal className="w-3.5 h-3.5" />
                          Sec
                          <ChevronDown
                            className={`w-3 h-3 transition-transform ${
                              openActionsKey === actionsKey ? "rotate-180" : ""
                            }`}
                          />
                        </button>

                        {openActionsKey === actionsKey && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setOpenActionsKey(null)}
                            />
                            <div className="absolute right-4 top-full mt-1 z-20 w-64 bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden text-left">
                              <div className="px-3 py-2 bg-[#FAF6F0] border-b border-gray-100">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                  Salon nusxeleri
                                </p>
                              </div>
                              <ul className="max-h-56 overflow-y-auto divide-y divide-gray-50">
                                {group.items.map((item) => (
                                  <li
                                    key={item.id}
                                    className="px-3 py-2.5 flex items-center justify-between gap-2 hover:bg-[#FAF6F0]/60"
                                  >
                                    <div className="min-w-0">
                                      <p className="font-medium text-[#1A1714] truncate flex items-center gap-1">
                                        <Store className="w-3 h-3 text-[#C9A227] shrink-0" />
                                        {getSalonName(salons, item.salonId)}
                                      </p>
                                      <p className="text-[10px] text-gray-400 mt-0.5">
                                        {item.durationMinutes} deq · {item.price} AZN
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => openEdit(item)}
                                        className="p-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-600 border border-gray-200"
                                        title="Redakte et"
                                      >
                                        <Edit2 className="w-3 h-3" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDelete(item)}
                                        className="p-1.5 bg-red-50 hover:bg-red-100 rounded-lg text-red-600 border border-red-100"
                                        title="Sil"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl border border-gray-100 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-gray-100 px-6 py-4 shrink-0">
              <h3 className="font-serif text-base font-bold text-[#1A1714]">Yeni Xidmet</h3>
              <button
                type="button"
                onClick={closeModals}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 text-xs overflow-y-auto">
              <div className="space-y-1">
                <label className="font-bold text-gray-700">Xidmet Adi</label>
                <input
                  type="text"
                  required
                  value={form.nameAz}
                  onChange={(e) => setForm({ ...form, nameAz: e.target.value })}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C9A227]/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Qiymet (AZN)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C9A227]/40"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Muddet (deqiqe)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={form.durationMinutes}
                    onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C9A227]/40"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-[#C9A227]" />
                  Kateqoriya
                </label>
                <select
                  required
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C9A227]/40"
                >
                  <option value="">Kateqoriya secin</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 pt-1">
                <label className="font-bold text-gray-700 flex items-center gap-1">
                  <Store className="w-3.5 h-3.5 text-[#C9A227]" />
                  Hansi salon(lar) ucun?
                </label>

                {salons.length === 1 ? (
                  <div className="flex items-center gap-2 p-3 bg-[#FAF6F0] border border-[#C9A227]/30 rounded-xl">
                    <span className="font-semibold text-[#1A1714]">{salons[0].name}</span>
                    <span className="text-xs text-gray-500">(avtomatik teyin edilib)</span>
                  </div>
                ) : (
                  <>
                    <label className="flex items-center gap-2 p-3 bg-[#FAF6F0] border border-[#C9A227]/30 rounded-xl cursor-pointer">
                      <input
                        type="checkbox"
                        checked={applyToAll}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setApplyToAll(checked);
                          if (checked) setSelectedSalonIds(allSalonIds);
                          else setSelectedSalonIds([]);
                        }}
                        className="rounded border-gray-300 text-[#C9A227] focus:ring-[#C9A227]"
                      />
                      <span className="font-semibold text-[#1A1714]">Butun salonlara tetbiq et</span>
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1">
                      {salons.map((salon) => (
                        <label
                          key={salon.id}
                          className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition ${
                            selectedSalonIds.includes(salon.id)
                              ? "border-[#C9A227]/50 bg-[#C9A227]/5"
                              : "border-gray-200 bg-gray-50 hover:border-gray-300"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedSalonIds.includes(salon.id)}
                            onChange={() => toggleSalon(salon.id)}
                            className="rounded border-gray-300 text-[#C9A227] focus:ring-[#C9A227]"
                          />
                          <span className="font-medium text-[#1A1714] truncate">{salon.name}</span>
                        </label>
                      ))}
                    </div>
                  </>
                )}

                {salons.length === 0 && (
                  <p className="text-gray-400 text-center py-2">Salon siyahisi bosdur.</p>
                )}
              </div>

              <div className="pt-3 border-t border-gray-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeModals}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold"
                >
                  Imtina
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || selectedSalonIds.length === 0}
                  className="px-4 py-2 bg-[#1A1714] text-white hover:bg-[#C9A227] hover:text-[#1A1714] font-bold rounded-xl disabled:opacity-50"
                >
                  {isSubmitting ? "Yaradilir..." : `Yarat (${selectedSalonIds.length} salon)`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl border border-gray-100 shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center border-b border-gray-100 px-6 py-4">
              <div>
                <h3 className="font-serif text-base font-bold text-[#1A1714]">Xidmeti Redakte Et</h3>
                <p className="text-[10px] text-[#B8935A] mt-0.5 flex items-center gap-1">
                  <Store className="w-3 h-3" />
                  {getSalonName(salons, editItem.salonId)}
                </p>
              </div>
              <button
                type="button"
                onClick={closeModals}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-gray-700">Xidmet Adi</label>
                <input
                  type="text"
                  required
                  value={form.nameAz}
                  onChange={(e) => setForm({ ...form, nameAz: e.target.value })}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C9A227]/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Qiymet (AZN)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C9A227]/40"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Muddet (deqiqe)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={form.durationMinutes}
                    onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C9A227]/40"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">Kateqoriya</label>
                <select
                  required
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C9A227]/40"
                >
                  <option value="">Kateqoriya secin</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <p className="text-[10px] text-gray-400 bg-[#FAF6F0] p-2.5 rounded-lg border border-gray-100">
                Yalniz bu salon nusxesi yenilenecek. Digar salonlardaki eyni adli xidmetlere toxunulmur.
              </p>

              <div className="pt-3 border-t border-gray-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeModals}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold"
                >
                  Imtina
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[#1A1714] text-white hover:bg-[#C9A227] hover:text-[#1A1714] font-bold rounded-xl disabled:opacity-50"
                >
                  {isSubmitting ? "Saxlanilir..." : "Yadda Saxla"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
