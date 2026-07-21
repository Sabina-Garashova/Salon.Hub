import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  ChevronLeft, 
  ChevronRight, 
  TrendingUp, 
  Users, 
  Scissors, 
  DollarSign,
  SlidersHorizontal
} from 'lucide-react';

export default function AllReservations({ reservations = [] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortByDate, setSortByDate] = useState('newest');
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const stats = useMemo(() => {
    const total = reservations.length;
    const completed = reservations.filter(r => r.status === 'Completed').length;
    const cancelled = reservations.filter(r => r.status === 'Cancelled').length;
    const completedList = reservations.filter(r => r.status === 'Completed');
    const totalRevenue = completedList.reduce((sum, r) => sum + (r.price || 0), 0);
    const cardRevenue = completedList.filter(r => r.paymentMethod !== 'LoyaltyPoints').reduce((sum, r) => sum + (r.price || 0), 0);
    const loyaltyRevenue = completedList.filter(r => r.paymentMethod === 'LoyaltyPoints').reduce((sum, r) => sum + (r.price || 0), 0);

    return { total, completed, cancelled, totalRevenue, cardRevenue, loyaltyRevenue };
  }, [reservations]);

  const filteredAndSortedReservations = useMemo(() => {
    return reservations
      .filter(res => {
        const customer = res.customerFullName || 'Musteri';
        const employee = res.employeeName || '';
        const service = res.serviceName || '';
        
        const matchesSearch = 
          customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
          employee.toLowerCase().includes(searchTerm.toLowerCase()) ||
          service.toLowerCase().includes(searchTerm.toLowerCase());
          
        const matchesStatus = statusFilter === 'All' || res.status === statusFilter;
        
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        const dateA = new Date(a.reservationDate.split('T')[0] + 'T' + a.startTime);
        const dateB = new Date(b.reservationDate.split('T')[0] + 'T' + b.startTime);
        
        return sortByDate === 'newest' ? dateB - dateA : dateA - dateB;
      });
  }, [reservations, searchTerm, statusFilter, sortByDate]);

  const totalPages = Math.ceil(filteredAndSortedReservations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedReservations = filteredAndSortedReservations.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-3.5 h-3.5" /> Gozlemede
          </span>
        );
      case 'Confirmed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-800 border border-blue-200">
            <CheckCircle className="w-3.5 h-3.5" /> Tesdiqlenib
          </span>
        );
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle className="w-3.5 h-3.5" /> Tamamlanib
          </span>
        );
      case 'Cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-800 border border-red-200">
            <XCircle className="w-3.5 h-3.5" /> Legv edilib
          </span>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('az-AZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    return timeString.substring(0, 5);
  };

  return (
    <div className="min-h-screen bg-[#FAF6F0] p-4 md:p-8 font-sans text-[#1A1714] -m-6">
      
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#B8935A]/20 pb-5">
        <div>
          <h1 className="text-3xl font-bold font-serif tracking-wide text-[#1A1714]">
            Butun Rezervasiyalar
          </h1>
          <p className="text-sm text-gray-500 mt-1">SalonHub sistemindeki butun rezervasiyalarin idare edilmesi (SuperAdmin)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-xl border border-[#B8935A]/20 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Umumi Rezervasiya</p>
            <h3 className="text-2xl font-bold mt-1 text-[#1A1714] font-serif">{stats.total}</h3>
          </div>
          <div className="p-3 rounded-lg bg-[#1A1714] text-[#F0D68A]">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#B8935A]/20 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Tamamlanmis</p>
            <h3 className="text-2xl font-bold mt-1 text-emerald-600 font-serif">{stats.completed}</h3>
          </div>
          <div className="p-3 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#B8935A]/20 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Legv Edilmis</p>
            <h3 className="text-2xl font-bold mt-1 text-red-600 font-serif">{stats.cancelled}</h3>
          </div>
          <div className="p-3 rounded-lg bg-red-50 text-red-600 border border-red-100">
            <XCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#C9A227]/30 bg-gradient-to-br from-white to-[#FAF6F0] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Umumi Gelir (Tamamlanan)</p>
            <h3 className="text-2xl font-bold mt-1 text-[#C9A227] font-serif">
              {stats.totalRevenue.toFixed(2)} AZN
            </h3>
            <div className="flex items-center gap-1.5 mt-1.5 text-[10px]">
              <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">Kartla: {stats.cardRevenue.toFixed(2)} AZN</span>
              <span className="bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded">Bal ile: {stats.loyaltyRevenue.toFixed(2)} AZN</span>
            </div>
          </div>
          <div className="p-3 rounded-lg bg-[#C9A227] text-white">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-[#B8935A]/20 shadow-sm mb-6 flex flex-col lg:flex-row items-center justify-between gap-4">
        
        <div className="relative w-full lg:max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            className="w-full pl-9 pr-4 py-2 bg-[#FAF6F0]/50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A227] focus:border-transparent transition-all"
            placeholder="Musteri, usta ve ya xidmet adi ile axtar..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          />
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto justify-end">
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <SlidersHorizontal className="w-4 h-4 text-gray-400 hidden sm:inline" />
            <select
              className="w-full sm:w-44 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A227]"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="All">Butun Statuslar</option>
              <option value="Pending">Gozlemede</option>
              <option value="Confirmed">Tesdiqlenib</option>
              <option value="Completed">Tamamlanib</option>
              <option value="Cancelled">Legv edilib</option>
            </select>
          </div>

          <select
            className="w-full sm:w-44 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A227]"
            value={sortByDate}
            onChange={(e) => setSortByDate(e.target.value)}
          >
            <option value="newest">Evvelce Yeniler</option>
            <option value="oldest">Evvelce Kohneler</option>
          </select>

        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#B8935A]/20 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#1A1714] text-[#F0D68A] text-xs uppercase tracking-wider font-semibold">
                <th className="py-4 px-6 border-b border-[#B8935A]/20">ID</th>
                <th className="py-4 px-6 border-b border-[#B8935A]/20">Musteri</th>
                <th className="py-4 px-6 border-b border-[#B8935A]/20">Usta</th>
                <th className="py-4 px-6 border-b border-[#B8935A]/20">Xidmet</th>
                <th className="py-4 px-6 border-b border-[#B8935A]/20">Tarix ve Saat</th>
                <th className="py-4 px-6 border-b border-[#B8935A]/20">Qiymet</th>
                <th className="py-4 px-6 border-b border-[#B8935A]/20">Status</th>
                <th className="py-4 px-6 border-b border-[#B8935A]/20">Odenis</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {paginatedReservations.length > 0 ? (
                paginatedReservations.map((res) => (
                  <tr 
                    key={res.id} 
                    className="hover:bg-[#FAF6F0]/60 transition-colors duration-200 group"
                  >
                    <td className="py-4 px-6 font-medium text-gray-400 group-hover:text-[#C9A227] transition-colors">
                      #{res.id}
                    </td>

                    <td className="py-4 px-6 font-medium">
                      {res.customerFullName ? (
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-[#B8935A]/10 text-[#B8935A] rounded-full flex items-center justify-center text-xs font-bold">
                            {res.customerFullName.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-gray-800">{res.customerFullName}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic font-normal">Musteri</span>
                      )}
                    </td>

                    <td className="py-4 px-6 text-gray-700">
                      {res.employeeName ? (
                        <span className="inline-flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-[#B8935A]" /> {res.employeeName}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic text-xs">Teyin edilmeyib</span>
                      )}
                    </td>

                    <td className="py-4 px-6 font-medium text-gray-800">
                      <span className="bg-[#FAF6F0] px-2 py-1 rounded text-xs border border-gray-200">
                        {res.serviceName}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-gray-600">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium text-gray-800 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" /> {formatDate(res.reservationDate)}
                        </span>
                        <span className="text-xs text-gray-400 flex items-center gap-1 pl-4">
                          <Clock className="w-3 h-3" /> {formatTime(res.startTime)}
                        </span>
                      </div>
                    </td>

                    <td className="py-4 px-6 font-bold text-gray-900">
                      {res.price ? res.price.toFixed(2) + ' AZN' : '0.00 AZN'}
                    </td>

                    <td className="py-4 px-6">
                      {renderStatusBadge(res.status)}
                    </td>
                    <td className="py-4 px-6">
                      <span className={"px-2.5 py-1 rounded-full text-[10px] font-bold " + (res.paymentMethod === "LoyaltyPoints" ? "bg-purple-50 text-purple-700 border border-purple-200" : "bg-gray-100 text-gray-600 border border-gray-200")}>
                        {res.paymentMethod === "LoyaltyPoints" ? "Bal ile" : "Kartla"}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <AlertCircle className="w-10 h-10 text-[#B8935A] mb-3 stroke-1" />
                      <p className="text-base font-medium text-gray-600">Uygun rezervasiya tapilmadi</p>
                      <p className="text-xs text-gray-400 mt-1">Zehmet olmasa axtaris parametrlerini ve ya filtrleri deyisin.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="bg-white px-6 py-4 border-t border-gray-100 flex items-center justify-between flex-col sm:flex-row gap-4">
            <div className="text-xs text-gray-500">
              Toplam <span className="font-semibold text-gray-700">{filteredAndSortedReservations.length}</span> neticeden 
              <span className="font-semibold text-gray-700"> {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredAndSortedReservations.length)}</span> arasi gosterilir.
            </div>
            
            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={currentPage === 1 ? "p-2 rounded-lg border text-gray-600 transition-colors bg-gray-50 border-gray-200 text-gray-300 cursor-not-allowed" : "p-2 rounded-lg border text-gray-600 transition-colors bg-white border-gray-200 hover:bg-[#FAF6F0] hover:text-[#C9A227]"}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {[...Array(totalPages)].map((_, index) => {
                const pageNum = index + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={currentPage === pageNum ? "px-3 py-1.5 text-xs font-medium rounded-lg transition-all bg-[#1A1714] text-[#F0D68A] shadow-sm" : "px-3 py-1.5 text-xs font-medium rounded-lg transition-all bg-white border border-gray-200 text-gray-600 hover:bg-[#FAF6F0]"}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={currentPage === totalPages ? "p-2 rounded-lg border text-gray-600 transition-colors bg-gray-50 border-gray-200 text-gray-300 cursor-not-allowed" : "p-2 rounded-lg border text-gray-600 transition-colors bg-white border-gray-200 hover:bg-[#FAF6F0] hover:text-[#C9A227]"}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}



