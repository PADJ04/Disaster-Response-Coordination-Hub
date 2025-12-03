export default function VolunteerDashboard({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-start px-6 md:px-12 pt-12 animate-fade-in">
      <div className="w-full max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Volunteer Dashboard</h1>
            <p className="text-sm text-white/70">Tasks, missions and quick reporting</p>
          </div>
          <div>
            <button onClick={onLogout} className="px-4 py-2 bg-white/5 border border-white/10 rounded-md">Logout</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-6 bg-white/4 rounded-xl border border-white/10">
            <h3 className="font-semibold mb-2">Active Tasks</h3>
            <p className="text-sm text-white/70">No active tasks yet.</p>
          </div>

          <div className="p-6 bg-white/4 rounded-xl border border-white/10">
            <h3 className="font-semibold mb-2">Nearby Missions</h3>
            <p className="text-sm text-white/70">No missions near your area.</p>
          </div>

          <div className="p-6 bg-white/4 rounded-xl border border-white/10">
            <h3 className="font-semibold mb-2">Quick Report</h3>
            <p className="text-sm text-white/70">Create a new observation or incident report.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
