import React from 'react';

const DashboardStatsSection = ({ stats = [] }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const IconComponent = stat.icon;
        return (
          <div
            key={stat.id}
            className="group bg-gradient-to-br from-[#F6EAD3] via-[#F1E2C5] to-[#E9D5A8] border border-amber-300/30 rounded-2xl p-5 shadow-md hover:-translate-y-1 hover:shadow-lg transition-all duration-300 flex items-center gap-4"
          >
            <div
              className="w-11 h-11 shrink-0 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300"
              style={{ background: `linear-gradient(135deg, ${stat.color}, ${stat.color}CC)` }}
            >
              <IconComponent className="w-5 h-5 text-white" strokeWidth={1.5} />
            </div>

            <div className="min-w-0">
              <div className="text-xl font-bold text-[#1A1714] tracking-tight leading-tight truncate">
                {stat.value}
              </div>
              <div className="text-[11px] font-medium text-gray-400 tracking-wide uppercase truncate">
                {stat.name}
              </div>
              {stat.change && (
                <span className="mt-1 inline-block text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                  {stat.change}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DashboardStatsSection;
