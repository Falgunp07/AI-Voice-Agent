export default function DialerPage() {
  return (
    <div className="max-w-5xl space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Auto Dialer Campaigns</h2>
          <p className="text-slate-400 mt-1">Upload contact lists and have the AI agent call them automatically.</p>
        </div>
        <button className="bg-indigo-500 hover:bg-indigo-600 px-6 py-2.5 rounded-xl font-medium transition-colors text-white">
          + New Campaign
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-slate-900 border border-white/5">
          <h3 className="text-slate-400 text-sm font-medium mb-2">Calls Dispatched Today</h3>
          <p className="text-3xl font-semibold">0</p>
        </div>
        <div className="p-6 rounded-2xl bg-slate-900 border border-white/5">
          <h3 className="text-slate-400 text-sm font-medium mb-2">Answer Rate</h3>
          <p className="text-3xl font-semibold">0%</p>
        </div>
        <div className="p-6 rounded-2xl bg-slate-900 border border-white/5">
          <h3 className="text-slate-400 text-sm font-medium mb-2">Bookings Generated</h3>
          <p className="text-3xl font-semibold text-emerald-400">0</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden p-12 text-center">
        <p className="text-slate-400 font-medium">No active campaigns</p>
        <p className="text-slate-500 text-sm mt-1">Upload a contact list to start auto-dialing your leads.</p>
      </div>
    </div>
  );
}
