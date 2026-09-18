import { Search, Bell, Calendar } from 'lucide-react';

export default function Header() {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6">
      <div className="relative w-[320px] max-w-full">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search anything..."
          className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-10 pr-4 text-sm text-slate-700 placeholder:text-gray-400 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition"
        />
      </div>

      <div className="flex items-center gap-2">
        <button className="relative rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700">
          <Bell size={20} />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
        </button>
        <button className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700">
          <Calendar size={20} />
        </button>
      </div>
    </header>
  );
}