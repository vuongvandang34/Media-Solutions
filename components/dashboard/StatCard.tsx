import React, { ElementType } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: ElementType;
  iconColor?: string;
  bgGlowClass?: string;
}

export default function StatCard({
  title,
  value,
  description,
  icon: Icon,
  iconColor = 'text-indigo-400',
  bgGlowClass = 'group-hover:from-indigo-500/5',
}: StatCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow-md transition duration-300 hover:border-slate-700 hover:shadow-indigo-500/2">
      {/* Dynamic glow overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br from-transparent to-transparent opacity-50 transition duration-300 ${bgGlowClass}`} />

      <div className="relative z-10 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {title}
        </span>
        <div className={`rounded-xl border border-slate-800 bg-slate-900/60 p-2.5 shadow-inner transition duration-300 group-hover:scale-105 ${iconColor}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="relative z-10 mt-4">
        <span className="text-3xl font-extrabold tracking-tight text-white">{value}</span>
        {description && <p className="mt-1.5 text-xs text-slate-400 leading-normal">{description}</p>}
      </div>
    </div>
  );
}
