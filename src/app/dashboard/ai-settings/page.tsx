export default function AISettingsPage() {
  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">AI Voice Settings</h2>
        <p className="text-slate-400 mt-1">Configure your AI agent's voice, prompt, and behavior for calls.</p>
      </div>

      <div className="p-6 rounded-2xl bg-slate-900 border border-white/5 space-y-6">
        <div>
          <label className="text-sm font-medium">Agent Persona (System Prompt)</label>
          <textarea 
            className="mt-2 w-full h-48 bg-slate-950 border border-white/10 rounded-xl p-4 text-sm text-slate-300"
            placeholder="Identity: You are an expert property consultant..."
            defaultValue={`IDENTITY: Tum "Arjun" ho — ek experienced property consultant. Phone call pe buyer se baat kar rahe ho. Hindi mein bolo.`}
          />
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium">Text-to-Speech Voice</label>
            <select className="mt-2 w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-slate-200">
              <optgroup label="ElevenLabs (Premium)">
                <option>Male - Natural Hindi (npCz...)</option>
              </optgroup>
              <optgroup label="Sarvam AI (Standard)">
                <option>Male - Rahul</option>
                <option>Female - Priya</option>
              </optgroup>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Speaking Speed</label>
            <input type="range" className="mt-3 w-full accent-indigo-500" min="0.5" max="1.5" step="0.1" defaultValue="1.0" />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>Slower</span><span>1.0x</span><span>Faster</span>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-white/5">
          <button className="bg-indigo-500 hover:bg-indigo-600 px-6 py-2.5 rounded-xl font-medium transition-colors text-white">
            Save AI Configuration
          </button>
        </div>
      </div>
    </div>
  );
}
