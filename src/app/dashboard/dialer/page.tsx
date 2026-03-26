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
          <p className="text-3xl font-semibold">142</p>
        </div>
        <div className="p-6 rounded-2xl bg-slate-900 border border-white/5">
          <h3 className="text-slate-400 text-sm font-medium mb-2">Answer Rate</h3>
          <p className="text-3xl font-semibold">41%</p>
        </div>
        <div className="p-6 rounded-2xl bg-slate-900 border border-white/5">
          <h3 className="text-slate-400 text-sm font-medium mb-2">Bookings Generated</h3>
          <p className="text-3xl font-semibold text-emerald-400">12</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-800/50">
            <tr>
              <th className="px-6 py-4 font-medium text-slate-400">Campaign Name</th>
              <th className="px-6 py-4 font-medium text-slate-400">Status</th>
              <th className="px-6 py-4 font-medium text-slate-400">Progress</th>
              <th className="px-6 py-4 font-medium text-slate-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            <tr>
              <td className="px-6 py-4">Weekend Buyers Follow-up</td>
              <td className="px-6 py-4">
                <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg text-xs font-medium">Running</span>
              </td>
              <td className="px-6 py-4 text-slate-300">45 / 100 calls</td>
              <td className="px-6 py-4 text-indigo-400 cursor-pointer hover:text-indigo-300 font-medium">Pause</td>
            </tr>
            <tr>
              <td className="px-6 py-4">Cold Lead Re-engagement</td>
              <td className="px-6 py-4">
                <span className="px-2.5 py-1 bg-slate-500/10 text-slate-400 rounded-lg text-xs font-medium">Completed</span>
              </td>
              <td className="px-6 py-4 text-slate-300">500 / 500 calls</td>
              <td className="px-6 py-4 text-indigo-400 cursor-pointer hover:text-indigo-300 font-medium">View Results</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
