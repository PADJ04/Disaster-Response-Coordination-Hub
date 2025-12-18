import { useState, useEffect } from 'react';
import { Trash2, Edit2, Plus, Eye, LogOut, ClipboardList, MapPin } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import Modal from '../components/Modal';
import api, { createTask } from '../api';
import L from 'leaflet';

// Fix for default marker icon
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

function LocationMarker({ position, setPosition }: { position: { lat: number, lng: number } | null, setPosition: (pos: { lat: number, lng: number }) => void }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  return position === null ? null : (
    <Marker position={position}></Marker>
  );
}

type RescueCenter = {
  id: string;
  name: string;
  address: string;
  capacity?: number;
  contact?: string;
  latitude?: number;
  longitude?: number;
};

type IncidentReport = {
  id: string;
  title: string;
  description: string;
  created_at: string;
  status: 'new' | 'in-progress' | 'resolved';
  severity: string;
  latitude: number;
  longitude: number;
  images: { id: string; image_url: string }[];
};

type Volunteer = {
  id: string;
  name: string;
  phone: string;
  email: string;
  address?: string;
};

export default function DistrictDashboard({ onLogout }: { onLogout: () => void }) {
  const [rescueCenters, setRescueCenters] = useState<RescueCenter[]>([]);
  const [reports, setReports] = useState<IncidentReport[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);

  const [isRescueModalOpen, setIsRescueModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isVolunteerViewOpen, setIsVolunteerViewOpen] = useState(false);
  const [editingRescue, setEditingRescue] = useState<RescueCenter | null>(null);
  const [editingReport, setEditingReport] = useState<IncidentReport | null>(null);

  // Task Assignment
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedVolunteer, setSelectedVolunteer] = useState<Volunteer | null>(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskPriority, setTaskPriority] = useState('medium');

  // Rescue Center form
  const [rescueName, setRescueName] = useState('');
  const [rescueAddress, setRescueAddress] = useState('');
  const [rescueCapacity, setRescueCapacity] = useState('');
  const [rescueContact, setRescueContact] = useState('');
  const [rescueLocation, setRescueLocation] = useState<{ lat: number, lng: number } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const [volRes, repRes, resRes] = await Promise.all([
          api.get('/auth/volunteers', { headers }),
          api.get('/reports/', { headers }),
          api.get('/resources/rescue-centers/', { headers })
        ]);
        setVolunteers(volRes.data || []);
        setReports(repRes.data || []);
        setRescueCenters(resRes.data || []);
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAddRescueCenter = async () => {
    if (!rescueName || !rescueAddress || !rescueLocation) {
      alert("Please fill in all fields and select a location on the map.");
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const payload = {
        name: rescueName,
        address: rescueAddress,
        capacity: parseInt(rescueCapacity) || 0,
        contact: rescueContact,
        latitude: rescueLocation.lat,
        longitude: rescueLocation.lng
      };
      
      const res = await api.post('/resources/rescue-centers/', payload, { headers });
      setRescueCenters([...rescueCenters, res.data]);
      setIsRescueModalOpen(false);
      resetRescueForm();
    } catch (err) {
      console.error(err);
      alert("Failed to add rescue center");
    }
  };

  const handleDeleteReport = async (id: string) => {
    if (!confirm("Are you sure you want to delete this report?")) return;
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await api.delete(`/reports/${id}`, { headers });
      setReports(reports.filter(r => r.id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete report");
    }
  };

  const resetRescueForm = () => {
    setRescueName('');
    setRescueAddress('');
    setRescueCapacity('');
    setRescueContact('');
    setRescueLocation(null);
    setEditingRescue(null);
  };

  const handleAssignTask = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return alert('Not authenticated');

      const volunteerId = selectedVolunteer?.id;
      if (!volunteerId) return alert('Select a volunteer');

      const payload: any = {
        title: taskTitle,
        description: taskDescription,
        priority: taskPriority,
        volunteer_id: volunteerId,
      };
      if (editingReport) payload.report_id = editingReport.id;

      await createTask(payload, token);
      alert('Task assigned successfully');
      setIsTaskModalOpen(false);
      setTaskTitle('');
      setTaskDescription('');
      setSelectedVolunteer(null);
    } catch (err) {
      console.error(err);
      alert('Failed to assign task');
    }
  };

  const openAssignTaskModal = (volunteer?: Volunteer, report?: IncidentReport) => {
    if (volunteer) setSelectedVolunteer(volunteer);
    if (report) setEditingReport(report);
    setIsTaskModalOpen(true);
  };
  

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex justify-between items-center bg-blue-900/20 p-6 rounded-2xl border border-blue-500/30">
          <div>
            <h1 className="text-3xl font-bold text-blue-400">District Command Center</h1>
            <p className="text-blue-200/60">Overview of resources and incidents</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setIsRescueModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors">
              <Plus className="w-4 h-4" /> Add Rescue Center
            </button>
            <button onClick={onLogout} className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-900/50 p-6 rounded-2xl border border-white/10">
            <h3 className="text-gray-400 text-sm uppercase tracking-wider">Active Incidents</h3>
            <p className="text-4xl font-bold text-white mt-2">{reports.length}</p>
          </div>
          <div className="bg-gray-900/50 p-6 rounded-2xl border border-white/10">
            <h3 className="text-gray-400 text-sm uppercase tracking-wider">Rescue Centers</h3>
            <p className="text-4xl font-bold text-white mt-2">{rescueCenters.length}</p>
          </div>
          <div className="bg-gray-900/50 p-6 rounded-2xl border border-white/10">
            <h3 className="text-gray-400 text-sm uppercase tracking-wider">Volunteers</h3>
            <p className="text-4xl font-bold text-white mt-2">{volunteers.length}</p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Incident Reports */}
          <div className="bg-gray-900/50 rounded-2xl border border-white/10 overflow-hidden">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Incident Reports</h2>
            </div>
            <div className="p-6 space-y-4 max-h-[400px] overflow-y-auto">
              {reports.map(report => (
                <div key={report.id} className="bg-black/40 p-4 rounded-xl border border-white/5 hover:border-white/20 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-white">{report.title}</h3>
                      <div className="text-xs text-gray-400">{new Date(report.created_at).toLocaleString()}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        report.status === 'new' ? 'bg-red-500/20 text-red-400' :
                        report.status === 'in-progress' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>
                        {report.status.toUpperCase()}
                      </span>
                      <button onClick={() => { setEditingReport(report); setIsReportModalOpen(true); }} className="text-xs px-2 py-1 bg-white/5 rounded text-white/70 border border-white/10">View</button>
                      <button onClick={() => { setEditingReport(report); openAssignTaskModal(undefined, report); }} className="text-xs px-2 py-1 bg-blue-500/20 text-blue-300 rounded border border-blue-500/30">Assign Task</button>
                      <button onClick={() => handleDeleteReport(report.id)} className="text-xs px-2 py-1 bg-red-500/20 text-red-300 rounded border border-red-500/30"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm mb-3">{report.description}</p>
                  <div className="flex justify-between items-center text-xs text-gray-500 mt-2">
                    <span>Severity: {report.severity}</span>
                  </div>
                  {report.images && report.images.length > 0 && (
                    <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
                      {report.images.map((img) => (
                        <img 
                          key={img.id} 
                          src={`http://localhost:8000${img.image_url}`} 
                          alt="Evidence" 
                          className="w-16 h-16 object-cover rounded-lg border border-white/10"
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {reports.length === 0 && <p className="text-gray-500 text-center py-4">No active reports</p>}
            </div>
          </div>

          {/* Volunteers */}
          <div className="bg-gray-900/50 rounded-2xl border border-white/10 overflow-hidden">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Volunteers</h2>
              <button onClick={() => setIsVolunteerViewOpen(true)} className="text-blue-400 hover:text-blue-300 text-sm font-bold">View All</button>
            </div>
            <div className="p-6 space-y-4 max-h-[400px] overflow-y-auto">
              {volunteers.slice(0, 5).map(vol => (
                <div key={vol.id} className="flex items-center justify-between bg-black/40 p-4 rounded-xl border border-white/5">
                  <div>
                    <h3 className="font-bold text-white">{vol.name}</h3>
                    <p className="text-gray-400 text-sm">{vol.phone}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-500 text-xs">{vol.address || 'No address'}</p>
                  </div>
                </div>
              ))}
              {volunteers.length === 0 && <p className="text-gray-500 text-center py-4">No volunteers registered</p>}
            </div>
          </div>

        </div>
      </div>

      {/* Rescue Center Modal */}
      <Modal open={isRescueModalOpen} onClose={() => setIsRescueModalOpen(false)} title="Add Rescue Center">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Name</label>
            <input 
              type="text" 
              value={rescueName}
              onChange={(e) => setRescueName(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none"
              placeholder="Center Name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Address</label>
            <input 
              type="text" 
              value={rescueAddress}
              onChange={(e) => setRescueAddress(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none"
              placeholder="Address"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Capacity</label>
              <input 
                type="number" 
                value={rescueCapacity}
                onChange={(e) => setRescueCapacity(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none"
                placeholder="Capacity"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Contact</label>
              <input 
                type="text" 
                value={rescueContact}
                onChange={(e) => setRescueContact(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none"
                placeholder="Phone/Email"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Location (Click on map)</label>
            <div className="h-64 w-full rounded-lg overflow-hidden border border-white/10">
               <MapContainer center={[20.5937, 78.9629]} zoom={5} style={{ height: '100%', width: '100%' }}>
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  <LocationMarker position={rescueLocation} setPosition={setRescueLocation} />
               </MapContainer>
            </div>
            {rescueLocation && <p className="text-xs text-green-400 mt-1">Location selected: {rescueLocation.lat.toFixed(4)}, {rescueLocation.lng.toFixed(4)}</p>}
          </div>

          <button 
            onClick={handleAddRescueCenter}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold text-white transition-colors mt-4"
          >
            Add Rescue Center
          </button>
        </div>
      </Modal>

      {/* Volunteers Modal */}
      <Modal open={isVolunteerViewOpen} onClose={() => setIsVolunteerViewOpen(false)} title="All Volunteers">
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {volunteers.map(vol => (
            <div key={vol.id} className="bg-white/5 p-4 rounded-xl border border-white/10">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 uppercase">Name</label>
                  <p className="font-bold">{vol.name}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase">Phone</label>
                  <p>{vol.phone}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase">Email</label>
                  <p>{vol.email}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase">Address</label>
                  <p>{vol.address || 'N/A'}</p>
                </div>
              </div>
              <button onClick={() => { setIsVolunteerViewOpen(false); openAssignTaskModal(vol); }} className="w-full mt-4 py-2 bg-blue-600/20 border border-blue-500/30 text-blue-300 rounded-lg hover:bg-blue-600/30 transition font-bold">
                Assign Task
              </button>
            </div>
          ))}
        </div>
      </Modal>

      {/* Report Details Modal */}
      <Modal open={isReportModalOpen} onClose={() => { setIsReportModalOpen(false); setEditingReport(null); }} title={editingReport?.title}>
        <div className="space-y-4">
          <p className="text-sm text-gray-300">{editingReport?.description}</p>
          <div className="text-xs text-gray-400">Severity: {editingReport?.severity}</div>
          {editingReport?.images && editingReport.images.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mt-3">
              {editingReport.images.map(img => (
                <img key={img.id} src={`http://localhost:8000${img.image_url}`} alt="evidence" className="w-full h-40 object-cover rounded-lg" />
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <button onClick={() => { setIsReportModalOpen(false); openAssignTaskModal(undefined, editingReport || undefined); }} className="flex-1 py-2 bg-blue-600 rounded text-white">Assign Task</button>
            <button onClick={() => { setIsReportModalOpen(false); setEditingReport(null); }} className="flex-1 py-2 border border-white/10 rounded text-white/70">Close</button>
          </div>
        </div>
      </Modal>

      {/* Assign Task Modal */}
      <Modal open={isTaskModalOpen} onClose={() => { setIsTaskModalOpen(false); setSelectedVolunteer(null); setEditingReport(null); }} title={selectedVolunteer ? `Assign Task to ${selectedVolunteer.name}` : 'Assign Task'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Volunteer</label>
            <select value={selectedVolunteer?.id || ''} onChange={(e) => {
              const v = volunteers.find(x => x.id === e.target.value) || null;
              setSelectedVolunteer(v);
            }} className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none">
              <option value="">-- select volunteer --</option>
              {volunteers.map(v => (
                <option key={v.id} value={v.id}>{v.name} • {v.phone}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Task Title</label>
            <input 
              type="text" 
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none"
              placeholder="e.g., Distribute Food"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
            <textarea 
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none h-24"
              placeholder="Detailed instructions..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Priority</label>
            <select 
              value={taskPriority}
              onChange={(e) => setTaskPriority(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <button 
            onClick={handleAssignTask}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold text-white transition-colors mt-4"
          >
            Assign Task
          </button>
        </div>
      </Modal>

    </div>
  );
}
