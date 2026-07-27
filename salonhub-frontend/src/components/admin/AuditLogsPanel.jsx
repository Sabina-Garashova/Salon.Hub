import { useState } from "react";

export default function AuditLogsPanel({ logs = [], loading }) {
  const [expandedId, setExpandedId] = useState(null);
  const [filterType, setFilterType] = useState("");
  const [filterTable, setFilterTable] = useState("");

  const tables = [...new Set(logs.map((l) => l.tableName))].filter(Boolean);

  const filtered = logs.filter((l) => {
    if (filterType && l.type !== filterType) return false;
    if (filterTable && l.tableName !== filterTable) return false;
    return true;
  });

  const typeBadge = (type) => {
    const map = {
      Added: "bg-emerald-100 text-emerald-700",
      Modified: "bg-blue-100 text-blue-700",
      Deleted: "bg-rose-100 text-rose-700",
      Unchanged: "bg-gray-100 text-gray-500",
    };
    return map[type] || "bg-gray-100 text-gray-700";
  };

  if (loading) return <div className="p-6 text-sm text-[#1A1714]/50">Yuklenir...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-[#1A1714]">Audit Loglari</h1>
          <p className="text-sm text-[#1A1714]/50">Son 100 sistem deyisikliyi</p>
        </div>
        <div className="flex gap-2">
          <select
            value={filterType} onChange={(e) => setFilterType(e.target.value)}
            className="text-sm p-2 rounded-lg border border-[#B8935A]/30 bg-white"
          >
            <option value="">Butun tipler</option>
            <option value="Added">Added</option>
            <option value="Modified">Modified</option>
            <option value="Deleted">Deleted</option>
            <option value="Unchanged">Unchanged</option>
          </select>
          <select
            value={filterTable} onChange={(e) => setFilterTable(e.target.value)}
            className="text-sm p-2 rounded-lg border border-[#B8935A]/30 bg-white"
          >
            <option value="">Butun cedveller</option>
            {tables.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#B8935A]/20 overflow-hidden">
        <table className="w-full text-sm table-fixed">
          <thead className="bg-[#FAF6F0] text-xs uppercase text-[#1A1714]/60">
            <tr>
              <th className="text-left p-3 w-40">Tarix</th>
              <th className="text-left p-3 w-24">Tip</th>
              <th className="text-left p-3 w-28">Cedvel</th>
              <th className="text-left p-3 w-32">Setir ID</th>
              <th className="text-left p-3">Deyisdirilen Sutunlar</th>
              <th className="text-left p-3 w-24">Emeliyyat</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((log) => (
              <>
                <tr key={log.id} className="border-t border-[#B8935A]/10 hover:bg-[#FAF6F0]/40">
                  <td className="p-3 whitespace-nowrap text-xs">{new Date(log.dateTime).toLocaleString("az-AZ")}</td>
                  <td className="p-3"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${typeBadge(log.type)}`}>{log.type}</span></td>
                  <td className="p-3 font-medium truncate">{log.tableName}</td>
                  <td className="p-3 truncate text-xs">{log.primaryKey}</td>
                  <td className="p-3 text-[#1A1714]/60 truncate text-xs" title={log.affectedColumns}>{log.affectedColumns}</td>
                  <td className="p-3">
                    <button
                      onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                      className="text-xs text-[#B8935A] hover:underline"
                    >
                      {expandedId === log.id ? "Gizlet" : "Detallar"}
                    </button>
                  </td>
                </tr>
                {expandedId === log.id && (
                  <tr key={`${log.id}-detail`} className="bg-[#FAF6F0]/30 border-t border-[#B8935A]/10">
                    <td colSpan={6} className="p-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs font-semibold text-[#1A1714]/60 mb-1">Kohne Deyer</div>
                          <pre className="text-xs bg-white p-2 rounded border border-[#B8935A]/20 overflow-x-auto max-h-40">{log.oldValues || "-"}</pre>
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-[#1A1714]/60 mb-1">Yeni Deyer</div>
                          <pre className="text-xs bg-white p-2 rounded border border-[#B8935A]/20 overflow-x-auto max-h-40">{log.newValues || "-"}</pre>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="p-8 text-center text-sm text-[#1A1714]/40">Nemune tapilmadi</div>}
      </div>
    </div>
  );
}