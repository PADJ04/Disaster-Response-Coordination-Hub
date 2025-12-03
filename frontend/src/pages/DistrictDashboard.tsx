import { useState } from 'react';
import Modal from '../components/Modal';

type RescueCenter = {
  id: string;
  name: string;
  address: string;
  capacity?: number;
  contact?: string;
};

type Volunteer = {
  id: string;
  name: string;
  phone?: string;
  area?: string;
};

type IncidentReport = {
  id: string;
  title: string;
  description: string;
  reportedAt: string;
  status: 'new' | 'in-progress' | 'resolved';
};

export default function DistrictDashboard({ onLogout }: { onLogout: () => void }) {
  const [rescueCenters, setRescueCenters] = useState<RescueCenter[]>([
    { id: 'rc-1', name: 'Central Shelter', address: '12 Main St', capacity: 250, contact: '555-0101' },
  ]);

  const [volunteers] = useState<Volunteer[]>([
    { id: 'v-1', name: 'Asha Kumar', phone: '555-0111', area: 'North' },
    { id: 'v-2', name: 'Ravi Singh', phone: '555-0112', area: 'East' },
  ]);

  const [reports] = useState<IncidentReport[]>([
    { id: 'r-1', title: 'Flooded Road', description: 'Water levels high on River Road', reportedAt: '2025-12-02 14:23', status: 'new' },
    { id: 'r-2', title: 'Collapsed Wall', description: 'Partial wall collapse near Market', reportedAt: '2025-12-01 09:12', status: 'in-progress' },
  ]);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isVolOpen, setIsVolOpen] = useState(false);
  const [isReportsOpen, setIsReportsOpen] = useState(false);

  // form state for new rescue centre
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [capacity, setCapacity] = useState<number | ''>('');
  const [contact, setContact] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const addRescueCenter = () => {
    setFormError(null);
    if (!name.trim() || !address.trim()) {
      setFormError('Name and address are required');
      return;
    }
    const newCenter: RescueCenter = {
      id: `rc-${Date.now()}`,
      name: name.trim(),
      address: address.trim(),
      capacity: typeof capacity === 'number' ? capacity : undefined,
      contact: contact.trim() || undefined,
    };
    setRescueCenters((s) => [newCenter, ...s]);
    // reset
    setName('');
    setAddress('');
    setCapacity('');
    setContact('');
    setIsAddOpen(false);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-start px-6 md:px-12 pt-12 animate-fade-in">
      <div className="w-full max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">District Authority Dashboard</h1>
            <p className="text-sm text-white/70">Overview of district reports and management tools</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onLogout} className="px-4 py-2 bg-white/5 border border-white/10 rounded-md">Logout</button>
            <button onClick={() => setIsAddOpen(true)} className="px-4 py-2 bg-blue-600 rounded-md">Add Rescue Centre</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-6 bg-white/4 rounded-xl border border-white/10">
            <h3 className="font-semibold mb-2">Rescue Centres</h3>
            <p className="text-sm text-white/70">{rescueCenters.length} centres registered</p>
            <div className="mt-3">
              <button onClick={() => setIsAddOpen(true)} className="text-sm px-3 py-1 bg-white/5 rounded">Manage</button>
            </div>
          </div>

          <div className="p-6 bg-white/4 rounded-xl border border-white/10">
            <h3 className="font-semibold mb-2">Volunteers</h3>
            <p className="text-sm text-white/70">{volunteers.length} volunteers registered</p>
            <div className="mt-3">
              <button onClick={() => setIsVolOpen(true)} className="text-sm px-3 py-1 bg-white/5 rounded">View</button>
            </div>
          </div>

          <div className="p-6 bg-white/4 rounded-xl border border-white/10">
            <h3 className="font-semibold mb-2">Reports</h3>
            <p className="text-sm text-white/70">{reports.length} recent reports</p>
            <div className="mt-3">
              <button onClick={() => setIsReportsOpen(true)} className="text-sm px-3 py-1 bg-white/5 rounded">View</button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {rescueCenters.map((c) => (
            <div key={c.id} className="p-4 bg-white/3 rounded-lg border border-white/8 flex justify-between items-center">
              <div>
                <div className="font-semibold">{c.name}</div>
                <div className="text-sm text-white/70">{c.address} {c.capacity ? `· Capacity: ${c.capacity}` : ''}</div>
              </div>
              <div className="text-sm text-white/80">{c.contact || '—'}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Rescue Centre Modal */}
      <Modal open={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add Rescue Centre">
        <div className="space-y-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="w-full p-3 rounded bg-white/5 border border-white/10" />
          <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address" className="w-full p-3 rounded bg-white/5 border border-white/10" />
          <input value={capacity as any} onChange={(e) => setCapacity(e.target.value === '' ? '' : Number(e.target.value))} placeholder="Capacity (optional)" className="w-full p-3 rounded bg-white/5 border border-white/10" />
          <input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Contact (optional)" className="w-full p-3 rounded bg-white/5 border border-white/10" />
          {formError && <div className="text-sm text-red-400">{formError}</div>}
          <div className="flex items-center gap-3 mt-2">
            <button onClick={addRescueCenter} className="px-4 py-2 bg-blue-500 rounded">Add Centre</button>
            <button onClick={() => setIsAddOpen(false)} className="px-4 py-2 bg-transparent border border-white/10 rounded">Cancel</button>
          </div>
        </div>
      </Modal>

      {/* Volunteers Modal */}
      <Modal open={isVolOpen} onClose={() => setIsVolOpen(false)} title={`Volunteers (${volunteers.length})`}>
        <div className="space-y-2">
          {volunteers.map((v) => (
            <div key={v.id} className="p-3 bg-white/3 rounded flex justify-between items-center">
              <div>
                <div className="font-medium">{v.name}</div>
                <div className="text-sm text-white/70">{v.area} · {v.phone}</div>
              </div>
              <div>
                <button className="px-3 py-1 bg-white/5 rounded">Details</button>
              </div>
            </div>
          ))}
        </div>
      </Modal>

      {/* Reports Modal */}
      <Modal open={isReportsOpen} onClose={() => setIsReportsOpen(false)} title={`Reports (${reports.length})`}>
        <div className="space-y-3">
          {reports.map((r) => (
            <div key={r.id} className="p-3 bg-white/3 rounded">
              <div className="flex items-center justify-between">
                <div className="font-semibold">{r.title}</div>
                <div className="text-sm text-white/70">{r.reportedAt}</div>
              </div>
              <div className="text-sm text-white/70 mt-1">{r.description}</div>
              <div className="mt-2">
                <span className="text-xs px-2 py-1 rounded bg-white/5">{r.status}</span>
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
