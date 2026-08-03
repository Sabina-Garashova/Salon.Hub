import React from 'react';
export default function HomeSectionWrapper({
  id,
  icon,
  title,
  subtitle,
  children
}) {
  return (
    <section id={id} className="relative w-full bg-[#FAF6F0] pt-4 pb-10 md:pb-14 overflow-hidden">

      <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-[#C9A227] opacity-[0.04] rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#B8935A] opacity-[0.03] rounded-full blur-[120px] translate-x-1/3 translate-y-1/3 pointer-events-none" />

      <div
        className="absolute inset-0 opacity-[0.015] pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(#1A1714 1px, transparent 1px)', backgroundSize: '32px 32px' }}
      />
      <div className="relative z-10 max-w-7xl mx-auto px-6">

        <div className="mb-4">
          <h3 className="text-2xl font-serif font-bold text-[#1A1714] mb-4 flex items-center gap-2">
            {icon}
            {title}
          </h3>
          {subtitle && (
            <p className="text-[#1A1714]/60 max-w-2xl text-sm font-light">
              {subtitle}
            </p>
          )}
        </div>
        <div className="w-full">
          {children}
        </div>

      </div>
    </section>
  );
}





