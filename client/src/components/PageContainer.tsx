import React from "react";

export function PageContainer({ title, description, children }: { title: string, description?: string, children: React.ReactNode }) {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{title}</h1>
        {description && <p className="text-slate-600 dark:text-slate-400 mt-1">{description}</p>}
      </div>
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-xl shadow p-6">
        {children}
      </div>
    </div>
  );
} 