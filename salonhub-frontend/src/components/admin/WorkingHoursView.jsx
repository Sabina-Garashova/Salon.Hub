import React from 'react';
import { Clock, Coffee, Calendar } from 'lucide-react';

const DAYS_AZ = [
  { name: 'Bazar ertəsi', dayOfWeek: 1 },
  { name: 'Çərşənbə axşamı', dayOfWeek: 2 },
  { name: 'Çərşənbə', dayOfWeek: 3 },
  { name: 'Cümə axşamı', dayOfWeek: 4 },
  { name: 'Cümə', dayOfWeek: 5 },
  { name: 'Şənbə', dayOfWeek: 6 },
  { name: 'Bazar', dayOfWeek: 0 },
];

export const WorkingHoursView = ({ workingHours = [] }) => {
  const schedule = DAYS_AZ.map((d) => {
    const dayData = workingHours.find((item) => item.dayOfWeek === d.dayOfWeek);
    return {
      dayName: d.name,
      isDayOff: dayData ? dayData.isDayOff : false,
      startTime: (dayData?.startTime || '09:00').toString().substring(0, 5),
      endTime: (dayData?.endTime || '18:00').toString().substring(0, 5),
    };
  });
  return (
    <div className="w-full max-w-sm mx-auto bg-[#FAF6F0] rounded-2xl p-4 border border-[#B8935A]/20 font-sans">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#B8935A]/15">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#C9A227]/10 flex items-center justify-center text-[#C9A227]">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-[#1A1714] uppercase tracking-wider">İş Saatları</h3>
            <p className="text-[10px] text-[#1A1714]/60">Həftəlik iş qrafiki göstəricisi</p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[10px] font-medium text-[#B8935A] bg-[#C9A227]/10 px-2 py-0.5 rounded-full border border-[#C9A227]/20">
          <Calendar className="w-3 h-3" />
          <span>Read-Only</span>
        </div>
      </div>
      <div className="space-y-1.5">
        {schedule.map((day, idx) => (
          <div
            key={idx}
            className={`flex items-center justify-between px-3 py-2 rounded-xl transition-all ${
              day.isDayOff
                ? 'bg-white/40 border border-transparent'
                : 'bg-white border border-[#B8935A]/15 shadow-sm'
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  day.isDayOff ? 'bg-[#1A1714]/20' : 'bg-[#C9A227]'
                }`}
              />
              <span className={`text-xs font-medium ${day.isDayOff ? 'text-[#1A1714]/50' : 'text-[#1A1714]'}`}>
                {day.dayName}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {day.isDayOff ? (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#1A1714]/5 text-[#1A1714]/50">
                  <Coffee className="w-3 h-3" />
                  <span className="text-[11px] font-medium">İstirahət Günü</span>
                </div>
              ) : (
                <>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#B8935A] bg-[#C9A227]/10 px-1.5 py-0.5 rounded">
                    İş Günü
                  </span>
                  <span className="text-xs font-semibold text-[#1A1714] tabular-nums">
                    {day.startTime} - {day.endTime}
                  </span>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default WorkingHoursView;
