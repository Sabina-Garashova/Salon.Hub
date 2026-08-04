import React from 'react';
export function PageBackgroundLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#FAF6F0] relative overflow-hidden selection:bg-[#C9A227]/20 selection:text-[#1A1714]">

      <div
        className="fixed inset-0 pointer-events-none bg-cover bg-center opacity-60"
        style={{ backgroundImage: "url('/page-bg-tools.webp')" }}
      />

      <div className="absolute -top-[20%] -left-[10%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-br from-[#C9A227]/[0.05] to-transparent blur-[120px] pointer-events-none" />

      <div className="absolute -bottom-[20%] -right-[10%] w-[70vw] h-[70vw] rounded-full bg-gradient-to-tl from-[#B8935A]/[0.06] to-transparent blur-[150px] pointer-events-none" />
      <div className="absolute top-[40%] -left-[10%] w-[40vw] h-[40vw] rounded-full bg-[#C9A227]/[0.02] blur-[100px] pointer-events-none" />
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage: 'radial-gradient(#1A1714 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      />
      <div className="relative z-10 w-full h-full flex flex-col">
        {children}
      </div>

    </div>
  );
}
