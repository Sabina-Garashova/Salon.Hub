import React, { useMemo } from 'react';
import NewsSection from '../NewsSection';
import { 
  UserPlus, 
  Users, 
  Scissors, 
  Store, 
  ArrowRight, 
  CalendarDays, 
  TrendingUp,
  Star
} from 'lucide-react';

const DashboardOverview = ({
  adminName = "Admin",
  salonName = "Merkezi Filial",
  pendingApplicationsCount = 0,
  employeeCount = 0,
  uniqueServiceCount = 0,
  salonCount = 0,
  recentApplications = [],
  topServices = [],
  todaysAppointments = []
}) => {

  const currentDate = useMemo(() => {
    const now = new Date();
    return now.toLocaleDateString('az-AZ', { day: 'numeric', month: 'long', year: 'numeric' });
  }, []);

  const statsData = [
    { 
      id: 1, 
      title: "Gozleyen Muracietler", 
      value: pendingApplicationsCount, 
      icon: UserPlus, 
      change: "Baxilmali",
      color: "from-[#C9A227] to-[#F0D68A]",
      textColor: "text-[#1A1714]"
    },
    { 
      id: 2, 
      title: "Umumi Isci Sayi", 
      value: employeeCount, 
      icon: Users, 
      change: "Aktiv", 
      color: "from-[#1A1714] to-[#3D3831]",
      textColor: "text-[#F0D68A]"
    },
    { 
      id: 3, 
      title: "Unikal Xidmetler", 
      value: uniqueServiceCount, 
      icon: Scissors, 
      change: "Butun salonlarda", 
      color: "from-[#FAF6F0] to-[#EAE0D1]",
      textColor: "text-[#B8935A]",
      border: "border border-[#EAE0D1]"
    },
    { 
      id: 4, 
      title: "Idare Olunan Salonlar", 
      value: salonCount, 
      icon: Store, 
      change: "Aktiv sebeke", 
      color: "from-[#B8935A] to-[#C9A227]",
      textColor: "text-white"
    },
  ];

  const maxServiceCount = useMemo(() => {
    if (!topServices || topServices.length === 0) return 1;
    return Math.max(...topServices.map(s => s.count));
  }, [topServices]);

  return (
    <div className="min-h-screen bg-[#FAF6F0] p-4 md:p-8 font-sans text-[#1A1714] -m-6">
      
      <header className="mb-10 bg-[#1A1714] p-6 md:p-8 rounded-3xl shadow-2xl shadow-[#1A1714]/10 relative overflow-hidden border border-[#B8935A]/20">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#C9A227] rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-[#F0D68A] rounded-full opacity-5 blur-2xl"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[#B8935A] mb-2 border border-[#B8935A]/30 w-fit px-3 py-1 rounded-full bg-[#1A1714]">
              <CalendarDays size={16} />
              <span className="text-xs font-medium tracking-wide uppercase">{currentDate}</span>
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-[#FAF6F0] leading-tight">
              Xos geldiniz, <span className="text-[#F0D68A]">{adminName}</span>!
            </h1>
            <p className="text-[#FAF6F0]/70 mt-2 text-base max-w-xl">
              <span className="font-semibold text-[#B8935A]">{salonName}</span> uzre bugunku salon fealiyyetlerine ve muhum statistikalara qisa nezer salin.
            </p>
          </div>
        </div>
      </header>

      <section className="mb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {statsData.map((stat) => {
            const Icon = stat.icon;
            return (
              <div 
                key={stat.id} 
                className={`bg-gradient-to-br ${stat.color} p-6 rounded-2xl ${stat.textColor} ${stat.border || ''} shadow-xl shadow-[#1A1714]/5 transform transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-[#B8935A]/10 group overflow-hidden relative`}
              >
                <Icon className="absolute -right-4 -bottom-4 w-24 h-24 opacity-10 group-hover:scale-110 transition-transform duration-500" strokeWidth={1} />
                
                <div className="flex justify-between items-start relative z-10 mb-4">
                  <h3 className="font-sans text-sm font-medium opacity-80 uppercase tracking-wider">{stat.title}</h3>
                  <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
                    <Icon size={20} strokeWidth={2} />
                  </div>
                </div>
                
                <div className="relative z-10">
                  <p className="font-serif text-5xl font-bold leading-none">{stat.value.toLocaleString('az-AZ')}</p>
                  <div className="flex items-center gap-1.5 mt-3 text-xs font-medium bg-white/10 w-fit px-2.5 py-1 rounded-full backdrop-blur-sm border border-white/5">
                    {stat.id === 1 && <TrendingUp size={14} className="text-red-400" />}
                    {stat.change}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

        <NewsSection limit={3} title="Son Xeberler" />
      <section className="mb-8 bg-white p-7 rounded-3xl shadow-xl shadow-[#1A1714]/5 border border-gray-100">
        <h2 className="font-serif text-2xl font-bold text-[#1A1714] mb-5">Bugunku Gorusler</h2>
        {todaysAppointments.length === 0 ? (
          <div className="text-center py-10 bg-[#FAF6F0] rounded-xl border border-dashed border-[#B8935A]/30">
            <p className="text-[#1A1714]/60 text-sm font-medium">Bu gun ucun rezervasiya yoxdur.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-gray-400 text-xs uppercase tracking-wider border-b border-gray-100">
                  <th className="py-3 font-medium">Musteri</th>
                  <th className="py-3 font-medium">Usta</th>
                  <th className="py-3 font-medium">Xidmet</th>
                  <th className="py-3 font-medium">Saat</th>
                  <th className="py-3 font-medium">Qiymet</th>
                  <th className="py-3 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {todaysAppointments.map((appt) => (
                  <tr key={appt.id} className="hover:bg-[#FAF6F0]/40 transition">
                    <td className="py-3.5 font-medium text-[#1A1714]">{appt.customerFullName || "Musteri"}</td>
                    <td className="py-3.5 text-gray-600">{appt.employeeName}</td>
                    <td className="py-3.5 text-gray-600">{appt.serviceName}</td>
                    <td className="py-3.5 font-mono text-gray-500">{appt.startTime?.slice(0,5)}</td>
                    <td className="py-3.5 font-bold text-[#1A1714]">{appt.price} AZN</td>
                    <td className="py-3.5 text-right">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#FAF6F0] text-[#B8935A]">{appt.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <section className="lg:col-span-2 bg-white p-7 rounded-3xl shadow-xl shadow-[#1A1714]/5 border border-gray-100">
          <div className="flex items-center justify-between mb-7">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-[#FAF6F0] text-[#B8935A] border border-[#B8935A]/20">
                <Star size={20} className="fill-[#B8935A]"/>
              </div>
              <h2 className="font-serif text-2xl font-bold text-[#1A1714]">Top Xidmetler</h2>
            </div>
            <span className="text-xs font-medium text-[#FAF6F0] bg-[#3D3831] px-3 py-1 rounded-full uppercase tracking-wider">Umumi</span>
          </div>
          
          {topServices && topServices.length > 0 ? (
            <div className="space-y-6">
              {topServices.slice(0, 5).map((service, index) => {
                const percentage = (service.count / maxServiceCount) * 100;
                return (
                  <div key={service.id || index} className="group">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="font-serif text-xl font-bold text-[#B8935A]/50 group-hover:text-[#C9A227] transition-colors">0{index + 1}</span>
                        <p className="font-sans text-base font-semibold text-[#1A1714] group-hover:text-[#C9A227] transition-colors">{service.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-sans text-sm font-bold text-[#1A1714]">{service.count} rezervasiya</p>
                        {service.price && <p className="text-xs text-[#B8935A] font-medium">{service.price} AZN</p>}
                      </div>
                    </div>
                    <div className="w-full h-2.5 bg-[#FAF6F0] rounded-full overflow-hidden border border-gray-100">
                      <div 
                        className="h-full bg-gradient-to-r from-[#B8935A] to-[#C9A227] rounded-full group-hover:from-[#1A1714] group-hover:to-[#3D3831] transition-all duration-500 ease-out"
                        style={{ width: percentage + '%' }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-[#FAF6F0] rounded-xl border border-dashed border-[#B8935A]/30">
              <Scissors size={40} className="mx-auto text-[#B8935A]/50 mb-4" strokeWidth={1}/>
              <p className="text-[#1A1714]/60 font-medium">Hele ki, rezervasiya datasi yoxdur.</p>
            </div>
          )}
        </section>

        <section className="bg-white p-7 rounded-3xl shadow-xl shadow-[#1A1714]/5 border border-gray-100 flex flex-col">
          <div className="flex items-center gap-3 mb-7">
            <div className="p-3 rounded-xl bg-[#FAF6F0] text-[#B8935A] border border-[#B8935A]/20">
              <UserPlus size={20}/>
            </div>
            <h2 className="font-serif text-2xl font-bold text-[#1A1714]">Son Muracietler</h2>
          </div>

          {recentApplications && recentApplications.length > 0 ? (
            <div className="space-y-5 flex-grow">
              {recentApplications.slice(0, 5).map((app) => (
                <div key={app.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-[#FAF6F0] transition-colors border border-transparent hover:border-gray-100">
                  <div className="w-12 h-12 rounded-full bg-[#1A1714] flex items-center justify-center text-[#F0D68A] font-bold border-2 border-[#C9A227]/30 text-lg shadow-inner">
                    {app.name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2)}
                  </div>
                  <div className="flex-grow">
                    <p className="font-semibold text-sm text-[#1A1714]">{app.name}</p>
                    <p className="text-xs text-[#B8935A] font-medium">{app.role || 'Usta'}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{app.date}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-[#FAF6F0] rounded-xl border border-dashed border-[#B8935A]/30 flex-grow flex flex-col justify-center items-center">
              <UserPlus size={36} className="mx-auto text-[#B8935A]/40 mb-3" strokeWidth={1}/>
              <p className="text-[#1A1714]/60 text-sm font-medium">Yeni muraciet yoxdur.</p>
            </div>
          )}
        </section>

      </div>
    </div>
  );
};

export default DashboardOverview;


