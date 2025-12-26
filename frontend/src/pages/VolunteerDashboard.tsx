import { useState, useEffect } from 'react';
import { Edit2, MapPin } from 'lucide-react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Modal from '../components/Modal';
import api, { getTasks, updateTaskStatus as apiUpdateTaskStatus } from '../api';
import type { Task, Report } from '../types';

// Fix Leaflet Default Icon
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

export default function VolunteerDashboard({ onLogout }: { onLogout: () => void }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  // const [availableMissions, setAvailableMissions] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState<string | null>(null);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedTaskLocation, setSelectedTaskLocation] = useState<{lat: number, lng: number} | null>(null);
  const [taskStatus, setTaskStatus] = useState<'assigned' | 'accepted' | 'rejected' | 'completed' | 'pending_verification' | 'verified'>('assigned');

  const [filterMonth, setFilterMonth] = useState<string>('');
  const [filterYear, setFilterYear] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        const [tasksData, reportsRes] = await Promise.all([
            getTasks(token),
            api.get('/reports/', { headers: { Authorization: `Bearer ${token}` } })
        ]);
        setTasks(tasksData);
        setReports(reportsRes.data);
      } catch (err) {
        console.error("Failed to fetch data", err);
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredAssignedTasks = tasks.filter(t => {
    if (t.status !== 'assigned') return false;
    if (!filterMonth && !filterYear) return true;
    const date = new Date(t.created_at);
    if (filterMonth && (date.getMonth() + 1).toString() !== filterMonth) return false;
    if (filterYear && date.getFullYear().toString() !== filterYear) return false;
    return true;
  });

  const activeTasks = tasks.filter(t => t.status === 'accepted');

  const openTaskModal = (task: Task) => {
    setEditingTask(task);
    setTaskStatus(task.status);
    setIsTaskModalOpen(true);
  };

  const handleViewLocation = (task: Task) => {
    if (task.latitude && task.longitude) {
        setSelectedTaskLocation({ lat: task.latitude, lng: task.longitude });
        setIsMapModalOpen(true);
        return;
    }
    if (task.report_id) {
        const report = reports.find(r => r.id === task.report_id);
        if (report) {
            setSelectedTaskLocation({ lat: report.latitude, lng: report.longitude });
            setIsMapModalOpen(true);
        } else {
            alert("Report location not found");
        }
    } else {
        alert("No location data for this task");
    }
  };

  const handleUpdateTaskStatus = async () => {
    if (editingTask) {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const updatedTask = await apiUpdateTaskStatus(editingTask.id, taskStatus, token);
        setTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t));
        setIsTaskModalOpen(false);
      } catch (err) {
        console.error("Failed to update task", err);
        alert("Failed to update task status");
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'accepted': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'rejected': return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'completed': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'verified': return 'bg-green-500/20 text-green-300 border-green-500/30';
      default: return 'bg-white/10 text-white/70';
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-start px-6 md:px-12 pt-12 animate-fade-in pb-24">
      <div className="w-full max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4 md:gap-0">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Volunteer Dashboard</h1>
            <p className="text-white/60">View assigned tasks and nearby missions</p>
          </div>
          <button onClick={onLogout} className="px-4 py-2 bg-red-600/20 border border-red-500/30 rounded-lg text-red-300 hover:bg-red-600/30 transition">
            Logout
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="p-6 bg-teal-500/10 border border-teal-500/30 rounded-2xl">
            <h3 className="text-sm font-bold text-teal-300 uppercase tracking-wider mb-2">Assigned Tasks</h3>
            <p className="text-3xl font-bold text-white">{tasks.length}</p>
            <div className="mt-4 flex gap-2 text-xs">
              <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded">{tasks.filter(t => t.status === 'assigned').length} Assigned</span>
              <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded">{tasks.filter(t => t.status === 'accepted').length} Accepted</span>
              <span className="px-2 py-1 bg-green-500/20 text-green-300 rounded">{tasks.filter(t => t.status === 'completed' || t.status === 'verified').length} Completed</span>
            </div>
          </div>

          <div className="p-6 bg-purple-500/10 border border-purple-500/30 rounded-2xl">
            <h3 className="text-sm font-bold text-purple-300 uppercase tracking-wider mb-2">Active Incidents</h3>
            <p className="text-3xl font-bold text-white">{activeTasks.length}</p>
            <p className="text-xs text-purple-200/60 mt-4">Incidents you are working on</p>
          </div>
        </div>

        {/* Assigned Tasks Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-2 md:gap-0">
            <h2 className="text-2xl font-bold text-white">Assigned Tasks</h2>
            <div className="flex gap-2">
              <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="bg-black/40 border border-white/10 rounded-lg px-3 py-1 text-sm text-white focus:outline-none">
                <option value="">Month</option>
                {Array.from({length: 12}, (_, i) => i + 1).map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className="bg-black/40 border border-white/10 rounded-lg px-3 py-1 text-sm text-white focus:outline-none">
                <option value="">Year</option>
                <option value="2024">2024</option>
                <option value="2025">2025</option>
              </select>
            </div>
          </div>
          <div className="space-y-3">
            {loading ? (
               <div className="p-6 text-center text-white/60 bg-white/5 border border-white/10 rounded-lg">Loading tasks...</div>
            ) : filteredAssignedTasks.length === 0 ? (
              <div className="p-6 text-center text-white/60 bg-white/5 border border-white/10 rounded-lg">No assigned tasks found</div>
            ) : (
              filteredAssignedTasks.map((task) => (
                <div key={task.id} className="p-4 bg-black/40 border border-teal-500/20 rounded-lg hover:border-teal-500/40 transition">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-white text-lg">{task.title}</h3>
                        <span className={`text-xs px-3 py-1 rounded-full border font-medium ${getStatusColor(task.status)}`}>
                          {task.status}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded border border-white/10 text-white/50`}>
                          {task.priority}
                        </span>
                      </div>
                      <p className="text-sm text-white/70">{task.description}</p>
                      <p className="text-xs text-white/50 mt-2">Assigned: {new Date(task.created_at).toLocaleString()}</p>
                    </div>
                    <button onClick={() => openTaskModal(task)} className="p-2 bg-teal-500/20 border border-teal-500/30 rounded-lg text-teal-300 hover:bg-teal-500/30 transition">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="mt-2">
                     <button onClick={() => handleViewLocation(task)} className="text-xs px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full border border-blue-500/30 flex items-center gap-1 hover:bg-blue-500/30 transition">
                       <MapPin className="w-3 h-3" /> View Location
                     </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Active Incidents Section (Accepted Tasks) */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">Active Incidents (My Missions)</h2>
          <div className="space-y-3">
            {activeTasks.length === 0 ? (
              <div className="p-6 text-center text-white/60 bg-white/5 border border-white/10 rounded-lg">No active incidents</div>
            ) : (
              activeTasks.map((task) => (
                <div key={task.id} className="p-4 bg-black/40 border border-purple-500/20 rounded-lg hover:border-purple-500/40 transition">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-white text-lg">{task.title}</h3>
                        <span className={`text-xs px-3 py-1 rounded-full border font-medium ${getStatusColor(task.status)}`}>
                          {task.status}
                        </span>
                      </div>
                      <p className="text-sm text-white/70 mb-3">{task.description}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full border border-purple-500/30">
                          Priority: {task.priority}
                        </span>
                      </div>
                    </div>
                    <button onClick={() => openTaskModal(task)} className="p-2 bg-purple-500/20 border border-purple-500/30 rounded-lg text-purple-300 hover:bg-purple-500/30 transition">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="mt-2">
                     <button onClick={() => handleViewLocation(task)} className="text-xs px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full border border-blue-500/30 flex items-center gap-1 hover:bg-blue-500/30 transition">
                       <MapPin className="w-3 h-3" /> View Location
                     </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Completed Tasks Section */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-white mb-4">Completed Tasks</h2>
          <div className="space-y-3">
            {tasks.filter(t => t.status === 'completed' || t.status === 'verified').length === 0 ? (
              <div className="p-6 text-center text-white/60 bg-white/5 border border-white/10 rounded-lg">No completed tasks</div>
            ) : (
              tasks.filter(t => t.status === 'completed' || t.status === 'verified').map((task) => (
                <div key={task.id} className="p-4 bg-black/40 border border-green-500/20 rounded-lg hover:border-green-500/40 transition">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-white text-lg">{task.title}</h3>
                        <span className={`text-xs px-3 py-1 rounded-full border font-medium ${getStatusColor(task.status)}`}>
                          {task.status}
                        </span>
                      </div>
                      <p className="text-sm text-white/70 mb-3">{task.description}</p>
                      <div className="flex items-center gap-2">
                         <button onClick={() => handleViewLocation(task)} className="text-xs px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full border border-blue-500/30 flex items-center gap-1 hover:bg-blue-500/30 transition">
                           <MapPin className="w-3 h-3" /> View Location
                         </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        {/* Rejected Tasks Section */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-white mb-4">Rejected Tasks</h2>
          <div className="space-y-3">
            {tasks.filter(t => t.status === 'rejected').length === 0 ? (
              <div className="p-6 text-center text-white/60 bg-white/5 border border-white/10 rounded-lg">No rejected tasks</div>
            ) : (
              tasks.filter(t => t.status === 'rejected').map((task) => (
                <div key={task.id} className="p-4 bg-black/40 border border-red-500/20 rounded-lg hover:border-red-500/40 transition">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-white text-lg">{task.title}</h3>
                        <span className={`text-xs px-3 py-1 rounded-full border font-medium ${getStatusColor(task.status)}`}>
                          {task.status}
                        </span>
                      </div>
                      <p className="text-sm text-white/70 mb-3">{task.description}</p>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleViewLocation(task)} className="text-xs px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full border border-blue-500/30 flex items-center gap-1 hover:bg-blue-500/30 transition">
                          <MapPin className="w-3 h-3" /> View Location
                        </button>
                      </div>
                    </div>
                    <button onClick={() => openTaskModal(task)} className="p-2 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 hover:bg-red-500/30 transition">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Update Task Status Modal */}
      <Modal open={isTaskModalOpen} onClose={() => setIsTaskModalOpen(false)} title="Task Details & Status">
        <div className="space-y-6">
          {/* Task Info */}
          <div className="bg-white/5 p-4 rounded-lg border border-white/10">
            <h3 className="font-bold text-xl text-white mb-2">{editingTask?.title}</h3>
            <p className="text-white/80 mb-4">{editingTask?.description}</p>
            <div className="flex gap-4 text-sm text-white/60">
                <span>Priority: <span className="text-white">{editingTask?.priority}</span></span>
                <span>Date: <span className="text-white">{editingTask ? new Date(editingTask.created_at).toLocaleDateString() : ''}</span></span>
            </div>
          </div>

          {/* Associated Report Details */}
          {editingTask?.report_id && (() => {
              const report = reports.find(r => r.id === editingTask.report_id);
              if (!report) return null;
              return (
                  <div className="bg-blue-900/20 p-4 rounded-lg border border-blue-500/30">
                      <h4 className="font-bold text-blue-300 mb-2 text-sm uppercase tracking-wider">Incident Report</h4>
                      <p className="text-white font-medium mb-1">{report.title}</p>
                      <p className="text-white/70 text-sm mb-3">{report.description}</p>
                      <div className="flex gap-4 text-xs text-white/50 mb-3">
                          <span>Severity: <span className="text-white">{report.severity}</span></span>
                          <span>Status: <span className="text-white">{report.status}</span></span>
                      </div>
                      
                      {/* Images */}
                      {report.images && report.images.length > 0 && (
                          <div>
                              <p className="text-xs text-white/50 mb-2">Evidence:</p>
                              <div className="flex gap-2 overflow-x-auto pb-2">
                                  {report.images.map(img => (
                                      <img 
                                          key={img.id} 
                                          src={`http://localhost:8000${img.image_url}`} 
                                          alt="Evidence" 
                                          className="w-24 h-24 object-cover rounded-lg border border-white/10 cursor-pointer hover:opacity-80 transition"
                                          onClick={() => window.open(`http://localhost:8000${img.image_url}`, '_blank')}
                                      />
                                  ))}
                              </div>
                          </div>
                      )}
                  </div>
              );
          })()}

          {/* Status Update */}
          <div>
            <label className="text-xs font-bold text-white/60 uppercase tracking-wider mb-2 block">Update Status</label>
            <select value={taskStatus} onChange={(e) => setTaskStatus(e.target.value as any)} className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white focus:border-white/30 focus:outline-none transition">
              <option value="assigned">Assigned</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
              <option value="completed">Mark as Done (Request Verification)</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={handleUpdateTaskStatus} className="flex-1 py-3 bg-gradient-to-r from-teal-500 to-teal-600 rounded-lg font-bold text-white hover:scale-[1.02] transition-transform">
              Update Status
            </button>
            <button onClick={() => setIsTaskModalOpen(false)} className="flex-1 py-3 bg-transparent border border-white/10 rounded-lg font-bold text-white/80 hover:bg-white/5 transition">
              Close
            </button>
          </div>
        </div>
      </Modal>

      {/* Map Modal */}
      <Modal open={isMapModalOpen} onClose={() => setIsMapModalOpen(false)} title="Task Location">
        <div className="h-[400px] w-full rounded-lg overflow-hidden relative z-0">
            {selectedTaskLocation && (
                <MapContainer center={[selectedTaskLocation.lat, selectedTaskLocation.lng]} zoom={13} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker position={[selectedTaskLocation.lat, selectedTaskLocation.lng]} />
                </MapContainer>
            )}
        </div>
      </Modal>
    </div>
  );
}
