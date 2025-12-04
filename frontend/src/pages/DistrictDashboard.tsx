import { useState } from 'react';
import { Trash2, Edit2, Plus, Eye } from 'lucide-react';
import Modal from '../components/Modal';

type RescueCenter = {
  id: string;
  name: string;
  address: string;
  capacity?: number;
  contact?: string;
};

type IncidentReport = {
  id: string;
  title: string;
  description: string;
  reportedAt: string;
  status: 'new' | 'in-progress' | 'resolved';
};

type Volunteer = {
  id: string;
  name: string;
  phone?: string;
  area?: string;
};

export default function DistrictDashboard({ onLogout }: { onLogout: () => void }) {
  const [rescueCenters, setRescueCenters] = useState<RescueCenter[]>([
    { id: 'rc-1', name: 'Central Shelter', address: '12 Main St', capacity: 250, contact: '555-0101' },
  ]);

  const [reports, setReports] = useState<IncidentReport[]>([
    { id: 'r-1', title: 'Flooded Road', description: 'Water levels high on River Road', reportedAt: '2025-12-02 14:23', status: 'new' },
    { id: 'r-2', title: 'Collapsed Wall', description: 'Partial wall collapse near Market', reportedAt: '2025-12-01 09:12', status: 'in-progress' },
  ]);

  const [volunteers] = useState<Volunteer[]>([
    { id: 'v-1', name: 'Asha Kumar', phone: '555-0111', area: 'North' },
    { id: 'v-2', name: 'Ravi Singh', phone: '555-0112', area: 'East' },
  ]);

  const [isRescueModalOpen, setIsRescueModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isVolunteerViewOpen, setIsVolunteerViewOpen] = useState(false);
  const [editingRescue, setEditingRescue] = useState<RescueCenter | null>(null);
  const [editingReport, setEditingReport] = useState<IncidentReport | null>(null);

  // Rescue Center form
  const [rescueName, setRescueName] = useState('');
  const [rescueAddress, setRescueAddress] = useState('');
  const [rescueCapacity, setRescueCapacity] = useState<number | ''>('');
  const [rescueContact, setRescueContact] = useState('');
  const [rescueError, setRescueError] = useState<string | null>(null);

  // Report form
  const [reportTitle, setReportTitle] = useState('');
  const [reportDesc, setReportDesc] = useState('');
  const [reportStatus, setReportStatus] = useState<'new' | 'in-progress' | 'resolved'>('new');
  const [reportError, setReportError] = useState<string | null>(null);

  // Rescue Center CRUD
  const openRescueModal = (center?: RescueCenter) => {
    if (center) {
      setEditingRescue(center);
      setRescueName(center.name);
      setRescueAddress(center.address);
      setRescueCapacity(center.capacity || '');
      setRescueContact(center.contact || '');
    } else {
      setEditingRescue(null);
      setRescueName('');
      setRescueAddress('');
      setRescueCapacity('');
      setRescueContact('');
    }
    setRescueError(null);
    setIsRescueModalOpen(true);
  };

  const saveRescueCenter = () => {
    setRescueError(null);
    if (!rescueName.trim() || !rescueAddress.trim()) {
      setRescueError('Name and address are required');
      return;
    }

    if (editingRescue) {
      setRescueCenters(rescueCenters.map(c => c.id === editingRescue.id ? {
        id: c.id,
        name: rescueName.trim(),
        address: rescueAddress.trim(),
        capacity: rescueCapacity ? Number(rescueCapacity) : undefined,
        contact: rescueContact.trim() || undefined,
      } : c));
    } else {
      const newCenter: RescueCenter = {
        id: `rc-${Date.now()}`,
        name: rescueName.trim(),
        address: rescueAddress.trim(),
        capacity: rescueCapacity ? Number(rescueCapacity) : undefined,
        contact: rescueContact.trim() || undefined,
      };
      setRescueCenters([newCenter, ...rescueCenters]);
    }
    setIsRescueModalOpen(false);
  };

  const deleteRescueCenter = (id: string) => {
    setRescueCenters(rescueCenters.filter(c => c.id !== id));
  };

  // Report CRUD
  const openReportModal = (report?: IncidentReport) => {
    if (report) {
      setEditingReport(report);
      setReportTitle(report.title);
      setReportDesc(report.description);
      setReportStatus(report.status);
    } else {
      setEditingReport(null);
      setReportTitle('');
      setReportDesc('');
      setReportStatus('new');
    }
    setReportError(null);
    setIsReportModalOpen(true);
  };

  const saveReport = () => {
    setReportError(null);
    if (!reportTitle.trim() || !reportDesc.trim()) {
      setReportError('Title and description are required');
      return;
    }

    if (editingReport) {
      setReports(reports.map(r => r.id === editingReport.id ? {
        id: r.id,
        title: reportTitle.trim(),
        description: reportDesc.trim(),
        reportedAt: r.reportedAt,
        status: reportStatus,
      } : r));
    } else {
      const newReport: IncidentReport = {
        id: `r-${Date.now()}`,
        title: reportTitle.trim(),
        description: reportDesc.trim(),
        reportedAt: new Date().toLocaleString(),
        status: reportStatus,
      };
      setReports([newReport, ...reports]);
    }
    setIsReportModalOpen(false);
  };

  const deleteReport = (id: string) => {
    setReports(reports.filter(r => r.id !== id));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'in-progress': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'resolved': return 'bg-green-500/20 text-green-300 border-green-500/30';
      default: return 'bg-white/10 text-white/70';
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-start px-6 md:px-12 pt-12 animate-fade-in pb-24">
      <div className="w-full max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">District Authority Dashboard</h1>
            <p className="text-white/60">Manage rescue centers, volunteers and incident reports</p>
          </div>
          <button onClick={onLogout} className="px-4 py-2 bg-red-600/20 border border-red-500/30 rounded-lg text-red-300 hover:bg-red-600/30 transition">
            Logout
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="p-6 bg-blue-500/10 border border-blue-500/30 rounded-2xl">
            <h3 className="text-sm font-bold text-blue-300 uppercase tracking-wider mb-2">Rescue Centers</h3>
            <p className="text-3xl font-bold text-white mb-4">{rescueCenters.length}</p>
            <button onClick={() => openRescueModal()} className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg text-white font-medium hover:scale-[1.02] transition-transform flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Center
            </button>
          </div>

          <div className="p-6 bg-teal-500/10 border border-teal-500/30 rounded-2xl">
            <h3 className="text-sm font-bold text-teal-300 uppercase tracking-wider mb-2">Volunteers</h3>
            <p className="text-3xl font-bold text-white mb-4">{volunteers.length}</p>
            <button onClick={() => setIsVolunteerViewOpen(true)} className="px-4 py-2 bg-gradient-to-r from-teal-500 to-teal-600 rounded-lg text-white font-medium hover:scale-[1.02] transition-transform flex items-center gap-2">
              <Eye className="w-4 h-4" /> View All
            </button>
          </div>

          <div className="p-6 bg-orange-500/10 border border-orange-500/30 rounded-2xl">
            <h3 className="text-sm font-bold text-orange-300 uppercase tracking-wider mb-2">Incident Reports</h3>
            <p className="text-3xl font-bold text-white mb-4">{reports.length}</p>
            <button onClick={() => openReportModal()} className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg text-white font-medium hover:scale-[1.02] transition-transform flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Report
            </button>
          </div>
        </div>

        {/* Rescue Centers Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Rescue Centers</h2>
          <div className="space-y-3">
            {rescueCenters.length === 0 ? (
              <div className="p-6 text-center text-white/60 bg-white/5 border border-white/10 rounded-lg">No rescue centers yet</div>
            ) : (
              rescueCenters.map((center) => (
                <div key={center.id} className="p-4 bg-black/40 border border-blue-500/20 rounded-lg hover:border-blue-500/40 transition">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold text-white text-lg">{center.name}</h3>
                      <p className="text-sm text-white/70 mt-1">{center.address}</p>
                      <div className="flex gap-4 mt-2 text-sm text-white/60">
                        {center.capacity && <span>Capacity: {center.capacity}</span>}
                        {center.contact && <span>Contact: {center.contact}</span>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => openRescueModal(center)} className="p-2 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-300 hover:bg-blue-500/30 transition">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteRescueCenter(center.id)} className="p-2 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 hover:bg-red-500/30 transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Reports Section */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">Incident Reports</h2>
          <div className="space-y-3">
            {reports.length === 0 ? (
              <div className="p-6 text-center text-white/60 bg-white/5 border border-white/10 rounded-lg">No reports yet</div>
            ) : (
              reports.map((report) => (
                <div key={report.id} className="p-4 bg-black/40 border border-orange-500/20 rounded-lg hover:border-orange-500/40 transition">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-white text-lg">{report.title}</h3>
                        <span className={`text-xs px-3 py-1 rounded-full border font-medium ${getStatusColor(report.status)}`}>
                          {report.status}
                        </span>
                      </div>
                      <p className="text-sm text-white/70">{report.description}</p>
                      <p className="text-xs text-white/50 mt-2">{report.reportedAt}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => openReportModal(report)} className="p-2 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-300 hover:bg-blue-500/30 transition">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteReport(report.id)} className="p-2 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 hover:bg-red-500/30 transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Rescue Center Modal */}
      <Modal open={isRescueModalOpen} onClose={() => setIsRescueModalOpen(false)} title={editingRescue ? 'Edit Rescue Center' : 'Add Rescue Center'}>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-white/60 uppercase tracking-wider mb-2 block">Center Name</label>
            <input value={rescueName} onChange={(e) => setRescueName(e.target.value)} placeholder="e.g. Central Shelter" className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:border-white/30 focus:outline-none transition" />
          </div>
          <div>
            <label className="text-xs font-bold text-white/60 uppercase tracking-wider mb-2 block">Address</label>
            <input value={rescueAddress} onChange={(e) => setRescueAddress(e.target.value)} placeholder="e.g. 12 Main St" className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:border-white/30 focus:outline-none transition" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-white/60 uppercase tracking-wider mb-2 block">Capacity</label>
              <input value={rescueCapacity} onChange={(e) => setRescueCapacity(e.target.value === '' ? '' : Number(e.target.value))} placeholder="e.g. 250" type="number" className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:border-white/30 focus:outline-none transition" />
            </div>
            <div>
              <label className="text-xs font-bold text-white/60 uppercase tracking-wider mb-2 block">Contact</label>
              <input value={rescueContact} onChange={(e) => setRescueContact(e.target.value)} placeholder="e.g. 555-0101" className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:border-white/30 focus:outline-none transition" />
            </div>
          </div>
          {rescueError && <div className="text-sm text-red-400 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">{rescueError}</div>}
          <div className="flex gap-3 mt-6">
            <button onClick={saveRescueCenter} className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg font-bold text-white hover:scale-[1.02] transition-transform">
              {editingRescue ? 'Update' : 'Add'} Center
            </button>
            <button onClick={() => setIsRescueModalOpen(false)} className="flex-1 py-3 bg-transparent border border-white/10 rounded-lg font-bold text-white/80 hover:bg-white/5 transition">
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Volunteers View Modal */}
      <Modal open={isVolunteerViewOpen} onClose={() => setIsVolunteerViewOpen(false)} title={`Volunteers (${volunteers.length})`}>
        <div className="space-y-3">
          {volunteers.length === 0 ? (
            <div className="p-6 text-center text-white/60">No volunteers yet</div>
          ) : (
            volunteers.map((volunteer) => (
              <div key={volunteer.id} className="p-4 bg-black/40 border border-teal-500/20 rounded-lg">
                <h3 className="font-bold text-white text-lg">{volunteer.name}</h3>
                <div className="flex gap-4 mt-2 text-sm text-white/60">
                  {volunteer.area && <span>Area: {volunteer.area}</span>}
                  {volunteer.phone && <span>Phone: {volunteer.phone}</span>}
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>

      {/* Report Modal */}
      <Modal open={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} title={editingReport ? 'Edit Report' : 'Add Report'}>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-white/60 uppercase tracking-wider mb-2 block">Title</label>
            <input value={reportTitle} onChange={(e) => setReportTitle(e.target.value)} placeholder="e.g. Flooded Road" className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:border-white/30 focus:outline-none transition" />
          </div>
          <div>
            <label className="text-xs font-bold text-white/60 uppercase tracking-wider mb-2 block">Description</label>
            <textarea value={reportDesc} onChange={(e) => setReportDesc(e.target.value)} placeholder="Describe the incident..." rows={4} className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:border-white/30 focus:outline-none transition resize-none" />
          </div>
          <div>
            <label className="text-xs font-bold text-white/60 uppercase tracking-wider mb-2 block">Status</label>
            <select value={reportStatus} onChange={(e) => setReportStatus(e.target.value as any)} className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white focus:border-white/30 focus:outline-none transition">
              <option value="new">New</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
          {reportError && <div className="text-sm text-red-400 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">{reportError}</div>}
          <div className="flex gap-3 mt-6">
            <button onClick={saveReport} className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg font-bold text-white hover:scale-[1.02] transition-transform">
              {editingReport ? 'Update' : 'Add'} Report
            </button>
            <button onClick={() => setIsReportModalOpen(false)} className="flex-1 py-3 bg-transparent border border-white/10 rounded-lg font-bold text-white/80 hover:bg-white/5 transition">
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
