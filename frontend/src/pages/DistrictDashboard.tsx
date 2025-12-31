import { useState, useEffect } from 'react';
import { Trash2, Plus, LogOut, CheckCircle, XCircle } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import Modal from '../components/Modal';
import api, { createTask, getTasks, updateTaskStatus, deleteTask } from '../api';
import type { Task, RescueCenter, Report } from '../types';
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

type Volunteer = {
  id: string;
  name: string;
  phone: string;
  email: string;
  address?: string;
};

export default function DistrictDashboard({ onLogout }: { onLogout: () => void }) {
  const [rescueCenters, setRescueCenters] = useState<RescueCenter[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  // const [loading, setLoading] = useState(true);

  const [isRescueModalOpen, setIsRescueModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  // const [isVolunteerViewOpen, setIsVolunteerViewOpen] = useState(false);
  // const [editingRescue, setEditingRescue] = useState<RescueCenter | null>(null);
  const [editingReport, setEditingReport] = useState<Report | null>(null);

  // Task Assignment
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedVolunteer, setSelectedVolunteer] = useState<Volunteer | null>(null);
  const [viewingVolunteer, setViewingVolunteer] = useState<Volunteer | null>(null);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskPriority, setTaskPriority] = useState('medium');
  const [taskLocation, setTaskLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [zoneFilter, setZoneFilter] = useState('');

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
        const [volRes, repRes, resRes, tasksData] = await Promise.all([
          api.get('/auth/volunteers', { headers }),
          api.get('/reports/', { headers }),
          api.get('/resources/rescue-centers/', { headers }),
          getTasks(token!)
        ]);
        setVolunteers(volRes.data || []);
        console.debug('Fetched reports:', repRes.data);
        setReports(repRes.data || []);
        setRescueCenters(resRes.data || []);
        setTasks(tasksData || []);
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      } finally {
        // setLoading(false);
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

  const handleDeleteRescueCenter = async (id: string) => {
    if (!confirm("Are you sure you want to delete this rescue center?")) return;
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await api.delete(`/resources/rescue-centers/${id}`, { headers });
      setRescueCenters(rescueCenters.filter(r => r.id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete rescue center");
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

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    try {
      const token = localStorage.getItem('token');
      if (!token) return alert('Not authenticated');
      // find task to know if it was linked to a report
      const task = tasks.find(t => String(t.id) === String(taskId));
      await deleteTask(taskId, token);
      setTasks(tasks.filter(t => String(t.id) !== String(taskId)));
      // if task was linked to a report, refresh reports to reflect changes
      if (task?.report_id) {
        const repRes = await api.get('/reports/', { headers: { Authorization: `Bearer ${token}` } });
        setReports(repRes.data);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to delete task');
    }
  };

  const resetRescueForm = () => {
    setRescueName('');
    setRescueAddress('');
    setRescueCapacity('');
    setRescueContact('');
    setRescueLocation(null);
    // setEditingRescue(null);
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
      
        if (editingReport) {
          payload.report_id = editingReport.id;
        } else {
          // Manual task
          if (!taskLocation) return alert('Please select a location on the map for manual task');
          payload.latitude = taskLocation.lat;
          payload.longitude = taskLocation.lng;
      }

      await createTask(payload, token);
      alert('Task assigned successfully');
      setIsTaskModalOpen(false);
      setTaskTitle('');
      setTaskDescription('');
      setTaskLocation(null);
      setSelectedVolunteer(null);
      setEditingReport(null);
      
      // Refresh tasks
      const tasksData = await getTasks(token);
      setTasks(tasksData);
      // Refresh reports to reflect zone cleared when task assigned
      const repRes = await api.get('/reports/', { headers: { Authorization: `Bearer ${token}` } });
      setReports(repRes.data);
    } catch (err) {
      console.error(err);
      alert('Failed to assign task');
    }
  };

  const openAssignTaskModal = (volunteer?: Volunteer, report?: Report) => {
    if (volunteer) setSelectedVolunteer(volunteer);
    if (report) {
        setEditingReport(report);
    } else {
        setEditingReport(null);
        setTaskLocation(null);
    }
    setIsTaskModalOpen(true);
  };
  

  const handleVerifyTask = async (taskId: string, approved: boolean) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const status = approved ? 'verified' : 'rejected';
      const updatedTask = await updateTaskStatus(taskId, status, token);
      setTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t));
      
      // Refresh reports to update status
      if (approved) {
        const repRes = await api.get('/reports/', { headers: { Authorization: `Bearer ${token}` } });
        setReports(repRes.data);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to update task status");
    }
  };

  const getTaskForReport = (reportId?: string) => {
    if (!reportId) return undefined;
    return tasks.find(t => String(t.report_id) === String(reportId));
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-0 bg-blue-900/20 p-6 rounded-2xl border border-blue-500/30">
          <div>
            <h1 className="text-3xl font-bold text-blue-400">Authority Dashboard</h1>
            <p className="text-blue-200/60">Overview of resources and incidents</p>
          </div>
          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            <button onClick={() => openAssignTaskModal()} className="flex-1 md:flex-none justify-center flex items-center gap-2 px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors">
              <Plus className="w-4 h-4" /> Create Manual Task
            </button>
            <button onClick={() => setIsRescueModalOpen(true)} className="flex-1 md:flex-none justify-center flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors">
              <Plus className="w-4 h-4" /> Add Rescue Center
            </button>
            <button onClick={onLogout} className="flex-1 md:flex-none justify-center flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-900/50 p-6 rounded-2xl border border-white/10">
            <h3 className="text-gray-400 text-sm uppercase tracking-wider">Active Incidents</h3>
            <p className="text-4xl font-bold text-white mt-2">{reports.filter(r => r.status !== 'resolved').length}</p>
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

        {/* Zones List */}
        {Array.from(new Set(reports.map(r => r.zone).filter(Boolean))).length > 0 && (
          <div className="bg-gray-900/30 p-4 rounded-2xl border border-white/5">
            <h4 className="text-sm text-gray-300 mb-2">Zones</h4>
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setZoneFilter('')} className={`px-3 py-1 rounded ${zoneFilter === '' ? 'bg-blue-600/30' : 'bg-white/5'}`}>
                All
              </button>
              {Array.from(new Set(reports.map(r => r.zone).filter(Boolean))).map(z => (
                <button key={z} onClick={() => setZoneFilter(z as string)} className={`px-3 py-1 rounded ${zoneFilter === z ? 'bg-blue-600/30' : 'bg-white/5'}`}>
                  {z} ({reports.filter(r => r.zone === z).length})
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Pending Verification Tasks */}
        {tasks.some(t => t.status === 'completed') && (
          <div className="bg-orange-900/20 rounded-2xl border border-orange-500/30 overflow-hidden">
            <div className="p-6 border-b border-orange-500/30 flex justify-between items-center">
              <h2 className="text-xl font-bold text-orange-400">Tasks Pending Verification</h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tasks.filter(t => t.status === 'completed').map(task => (
                <div key={task.id} className="bg-black/40 p-4 rounded-xl border border-orange-500/20">
                  <h3 className="font-bold text-white mb-1">{task.title}</h3>
                  <p className="text-sm text-gray-400 mb-3">{task.description}</p>
                  {task.completed_at && <p className="text-xs text-orange-300/70 mb-3">Completed: {new Date(task.completed_at).toLocaleString()}</p>}
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleVerifyTask(task.id, true)}
                      className="flex-1 py-2 bg-green-600/20 text-green-400 border border-green-600/30 rounded-lg hover:bg-green-600/30 transition flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" /> Approve
                    </button>
                    <button 
                      onClick={() => handleVerifyTask(task.id, false)}
                      className="flex-1 py-2 bg-red-600/20 text-red-400 border border-red-600/30 rounded-lg hover:bg-red-600/30 transition flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-4 h-4" /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Zones and Tasks two-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Zones Column */}
            <div className="bg-gray-900/50 rounded-2xl border border-white/10 overflow-hidden">
              <div className="p-6 border-b border-white/10 flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">Zones</h2>
              </div>
              <div className="p-6 space-y-4 max-h-[600px] overflow-y-auto">
                {/* Existing zones */}
                {Array.from(new Set(reports.map(r => r.zone).filter(Boolean))).filter(z => !zoneFilter || z === zoneFilter).map(zoneName => (
                  <div key={zoneName} className="mb-4">
                    <h3 className="text-lg font-semibold text-blue-300">{zoneName} <span className="text-sm text-gray-400">({reports.filter(r => r.zone === zoneName).length})</span></h3>
                    <div className="mt-2 space-y-2">
                      {reports.filter(r => r.zone === zoneName).map(r => (
                        <div key={r.id} className="bg-black/40 p-3 rounded-lg flex justify-between items-center">
                          <div>
                            <div className="font-bold text-white">{r.title}</div>
                            <div className="text-xs text-gray-400">{new Date(r.created_at).toLocaleString()}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => { setEditingReport(r); setIsReportModalOpen(true); }} className="text-xs px-2 py-1 bg-white/5 rounded text-white/70 border border-white/10">View</button>
                            <button onClick={() => handleDeleteReport(String(r.id))} className="text-xs px-2 py-1 bg-red-600/20 text-red-300 rounded border border-red-600/30 hover:bg-red-600/30 transition"> 
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Unassigned reports (no zone and no active task) */}
                <div>
                  <h3 className="text-lg font-semibold text-white">Unassigned Reports</h3>
                  <div className="mt-2 space-y-2">
                    {reports.filter(r => !r.zone && !tasks.some(t => String(t.report_id) === String(r.id))).map(r => (
                      <div key={r.id} className="bg-black/40 p-3 rounded-lg flex justify-between items-center">
                        <div>
                          <div className="font-bold text-white">{r.title}</div>
                          <div className="text-xs text-gray-400">{new Date(r.created_at).toLocaleString()}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => { setEditingReport(r); setIsReportModalOpen(true); }} className="text-xs px-2 py-1 bg-white/5 rounded text-white/70 border border-white/10">View</button>
                          <button onClick={() => { setEditingReport(r); openAssignTaskModal(undefined, r); }} className="text-xs px-2 py-1 bg-blue-500/20 text-blue-300 rounded border border-blue-500/30">Create Task</button>
                          <button onClick={() => handleDeleteReport(String(r.id))} className="text-xs px-2 py-1 bg-red-600/20 text-red-300 rounded border border-red-600/30 hover:bg-red-600/30 transition"> 
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {reports.filter(r => !r.zone && !tasks.some(t => String(t.report_id) === String(r.id))).length === 0 && (
                      <p className="text-gray-500">No unassigned reports</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Tasks Column */}
            <div className="bg-gray-900/50 rounded-2xl border border-white/10 overflow-hidden">
              <div className="p-6 border-b border-white/10 flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">Tasks</h2>
                <div className="flex items-center gap-2">
                  <button onClick={() => openAssignTaskModal()} className="flex items-center gap-2 px-3 py-1 bg-blue-600/20 text-blue-300 rounded">Create Manual Task</button>
                </div>
              </div>
              <div className="p-6 space-y-4 max-h-[600px] overflow-y-auto">
                {tasks.filter(t => t.status !== 'rejected' && t.status !== 'verified').map(task => (
                  <div key={task.id} className="bg-black/40 p-4 rounded-xl border border-white/5 hover:border-white/20 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-bold text-white">{task.title}</h3>
                        <div className="text-xs text-gray-400">{task.description}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded">{task.status}</span>
                        <button onClick={() => {
                          if (task.report_id) {
                            const r = reports.find(rr => String(rr.id) === String(task.report_id));
                            if (r) { setEditingReport(r); setIsReportModalOpen(true); return; }
                          }
                          // Manual task or missing report: open task details modal
                          setViewingTask(task);
                        }} className="text-xs px-2 py-1 bg-white/5 rounded text-white/70 border border-white/10">View</button>
                        <button onClick={() => handleDeleteTask(String(task.id))} className="text-xs px-2 py-1 bg-red-600/20 text-red-300 rounded border border-red-600/30 hover:bg-red-600/30 transition"> 
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">Volunteer: {volunteers.find(v => v.id === task.volunteer_id)?.name || 'Unassigned'}</div>
                  </div>
                ))}
                {tasks.filter(t => t.status !== 'rejected' && t.status !== 'verified').length === 0 && <p className="text-gray-500">No active tasks</p>}
                {/* Rejected Tasks */}
                {tasks.filter(t => t.status === 'rejected').length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm text-red-300 mb-2">Rejected Tasks</h4>
                    <div className="space-y-3">
                      {tasks.filter(t => t.status === 'rejected').map(task => (
                        <div key={task.id} className="bg-black/30 p-3 rounded-xl border border-red-500/10">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-bold text-white">{task.title}</h3>
                              <div className="text-xs text-gray-400">{task.description}</div>
                              <div className="text-xs text-red-300 mt-1">Rejected</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button onClick={() => {
                                if (task.report_id) {
                                  const r = reports.find(rr => String(rr.id) === String(task.report_id));
                                  if (r) { setEditingReport(r); setIsReportModalOpen(true); return; }
                                }
                                setViewingTask(task);
                              }} className="text-xs px-2 py-1 bg-white/5 rounded text-white/70 border border-white/10">View</button>
                              <button onClick={() => handleDeleteTask(String(task.id))} className="text-xs px-2 py-1 bg-red-600/20 text-red-300 rounded border border-red-600/30 hover:bg-red-600/30 transition"> 
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Volunteers */}
          <div className="bg-gray-900/50 rounded-2xl border border-white/10 overflow-hidden">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Volunteers</h2>
            </div>
            <div className="p-6 space-y-4 max-h-[400px] overflow-y-auto">
              {volunteers.map(vol => (
                <div key={vol.id} className="flex items-center justify-between bg-black/40 p-4 rounded-xl border border-white/5">
                  <div>
                    <h3 className="font-bold text-white">{vol.name}</h3>
                    <p className="text-gray-400 text-sm">{vol.phone}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setViewingVolunteer(vol)} className="text-xs px-3 py-1 bg-blue-500/20 text-blue-300 rounded border border-blue-500/30 hover:bg-blue-500/30 transition">View</button>
                  </div>
                </div>
              ))}
              {volunteers.length === 0 && <p className="text-gray-500 text-center py-4">No volunteers registered</p>}
            </div>
          </div>

          {/* Rescue Centers List */}
          <div className="bg-gray-900/50 rounded-2xl border border-white/10 overflow-hidden col-span-1 lg:col-span-2">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Rescue Centers</h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rescueCenters.map(center => (
                <div key={center.id} className="bg-black/40 p-4 rounded-xl border border-white/5 hover:border-white/20 transition-colors relative group">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-white">{center.name}</h3>
                    <button 
                      onClick={() => handleDeleteRescueCenter(center.id)}
                      className="text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-gray-400 text-sm mb-1">{center.address}</p>
                  <div className="flex justify-between items-center text-xs text-gray-500 mt-2">
                    <span>Capacity: {center.capacity}</span>
                    <span>{center.contact}</span>
                  </div>
                </div>
              ))}
              {rescueCenters.length === 0 && <p className="text-gray-500 text-center py-4 col-span-full">No rescue centers added</p>}
            </div>
            </div>

            {/* Completed Tasks History (placed inside grid to match Rescue Centers width) */}
            <div className="bg-green-900/10 rounded-2xl border border-green-500/20 overflow-hidden col-span-1 lg:col-span-2">
            <div className="p-6 border-b border-green-500/20 flex justify-between items-center">
              <h2 className="text-xl font-bold text-green-400">Completed Tasks</h2>
            </div>
            <div className="p-6">
               {tasks.filter(t => t.status === 'completed' || t.status === 'verified').length === 0 ? (
                 <p className="text-gray-500">No completed tasks yet.</p>
               ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                   {tasks.filter(t => t.status === 'completed' || t.status === 'verified').map(task => {
                     const vol = volunteers.find(v => v.id === task.volunteer_id);
                     return (
                       <div key={task.id} className="bg-black/40 p-4 rounded-xl border border-green-500/10">
                         <div className="flex justify-between items-start mb-2">
                           <h3 className="font-bold text-white">{task.title}</h3>
                          <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded">{task.status === 'verified' ? 'Verified' : 'Completed'}</span>
                         </div>
                         <p className="text-sm text-gray-400 mb-2">{task.description}</p>
                         <div className="text-xs text-gray-500">
                           <p>Volunteer: <span className="text-white">{vol?.name || 'Unknown'}</span></p>
                           <p>Date: {new Date(task.created_at).toLocaleDateString()}</p>
                         </div>
                       </div>
                     );
                   })}
                 </div>
               )}
            </div>
            </div>

          </div>
        </div>
      {/* Rescue Center Modal */}
      <Modal open={isRescueModalOpen} onClose={() => setIsRescueModalOpen(false)} title="Add Rescue Center" className="resize overflow-auto max-w-none w-[90vw] h-[90vh]">
        <div className="relative w-full h-full rounded-lg overflow-hidden border border-white/10">
           <MapContainer center={[20.5937, 78.9629]} zoom={5} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <LocationMarker position={rescueLocation} setPosition={setRescueLocation} />
           </MapContainer>
           
           {/* Floating Form Overlay */}
           <div className="absolute top-4 right-4 w-80 bg-black/80 backdrop-blur-md p-4 rounded-xl border border-white/20 shadow-2xl z-[1000]">
              <h3 className="text-lg font-bold text-white mb-3">Center Details</h3>
              <div className="space-y-3">
                <input 
                  type="text" 
                  value={rescueName}
                  onChange={(e) => setRescueName(e.target.value)}
                  className="w-full bg-white/10 border border-white/10 rounded-lg p-2 text-white text-sm focus:border-blue-500 focus:outline-none"
                  placeholder="Center Name"
                />
                <input 
                  type="text" 
                  value={rescueAddress}
                  onChange={(e) => setRescueAddress(e.target.value)}
                  className="w-full bg-white/10 border border-white/10 rounded-lg p-2 text-white text-sm focus:border-blue-500 focus:outline-none"
                  placeholder="Address"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input 
                    type="number" 
                    value={rescueCapacity}
                    onChange={(e) => setRescueCapacity(e.target.value)}
                    className="w-full bg-white/10 border border-white/10 rounded-lg p-2 text-white text-sm focus:border-blue-500 focus:outline-none"
                    placeholder="Capacity"
                  />
                  <input 
                    type="text" 
                    value={rescueContact}
                    onChange={(e) => setRescueContact(e.target.value)}
                    className="w-full bg-white/10 border border-white/10 rounded-lg p-2 text-white text-sm focus:border-blue-500 focus:outline-none"
                    placeholder="Contact"
                  />
                </div>
                {rescueLocation ? (
                   <p className="text-xs text-green-400">Location: {rescueLocation.lat.toFixed(4)}, {rescueLocation.lng.toFixed(4)}</p>
                ) : (
                   <p className="text-xs text-yellow-400">Click map to set location</p>
                )}
                <button 
                  onClick={handleAddRescueCenter}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold text-white text-sm transition-colors"
                >
                  Add Center
                </button>
              </div>
           </div>
        </div>
      </Modal>

      {/* Task Details Modal (for manual tasks or when task has no report) */}
      <Modal open={!!viewingTask} onClose={() => setViewingTask(null)} title={viewingTask?.title || 'Task Details'}>
        {viewingTask && (
          <div className="space-y-4">
            <div className="text-sm text-gray-300">{viewingTask.description}</div>
            <div className="text-xs text-gray-400">Status: <span className="text-white font-semibold">{viewingTask.status}</span></div>
            <div className="text-xs text-gray-400">Priority: <span className="text-white">{viewingTask.priority}</span></div>
            <div className="text-xs text-gray-400">Volunteer: <span className="text-white">{volunteers.find(v => v.id === viewingTask.volunteer_id)?.name || 'Unassigned'}</span></div>
            {viewingTask.created_at && <div className="text-xs text-gray-400">Created: <span className="text-white">{new Date(viewingTask.created_at).toLocaleString()}</span></div>}
            {viewingTask.completed_at && <div className="text-xs text-green-300">Completed: {new Date(viewingTask.completed_at).toLocaleString()}</div>}
            {viewingTask.latitude && viewingTask.longitude && (
              <div className="text-xs text-gray-400">Location: <span className="text-white">{viewingTask.latitude.toFixed(4)}, {viewingTask.longitude.toFixed(4)}</span></div>
            )}
            {viewingTask.report_id && (
              <div>
                <button onClick={() => { const r = reports.find(rr => String(rr.id) === String(viewingTask.report_id)); if (r) { setViewingTask(null); setEditingReport(r); setIsReportModalOpen(true); } }} className="py-2 px-3 bg-blue-600 rounded text-white">View Linked Report</button>
              </div>
            )}
            <div className="flex gap-2 mt-4">
              <button onClick={() => setViewingTask(null)} className="flex-1 py-2 border border-white/10 rounded text-white/70">Close</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Volunteer Details Modal */}
      <Modal open={!!viewingVolunteer} onClose={() => setViewingVolunteer(null)} title="Volunteer Details">
        {viewingVolunteer && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 uppercase">Name</label>
                <p className="font-bold text-white">{viewingVolunteer.name}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase">Phone</label>
                <p className="text-white">{viewingVolunteer.phone}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase">Email</label>
                <p className="text-white">{viewingVolunteer.email}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase">Address</label>
                <p className="text-white">{viewingVolunteer.address || 'N/A'}</p>
              </div>
            </div>
            <button onClick={() => { setViewingVolunteer(null); openAssignTaskModal(viewingVolunteer); }} className="w-full mt-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold text-white transition-colors">
              Assign Task
            </button>
          </div>
        )}
      </Modal>

      {/* Volunteers Modal (Legacy - can be removed or kept if needed, but user asked to remove View All) */}
      {/* <Modal open={isVolunteerViewOpen} ... /> */}

      {/* Report Details Modal */}
      <Modal open={isReportModalOpen} onClose={() => { setIsReportModalOpen(false); setEditingReport(null); }} title={editingReport?.title}>
        <div className="space-y-4">
          <p className="text-sm text-gray-300">{editingReport?.description}</p>
          <div className="text-xs text-gray-400">Severity: {editingReport?.severity}</div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-400">Location</label>
              <div className="text-sm text-white">{editingReport ? `${editingReport.latitude.toFixed(4)}, ${editingReport.longitude.toFixed(4)}` : ''}</div>
            </div>
          </div>
          {editingReport?.images && editingReport.images.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mt-3">
              {editingReport.images.map(img => (
                <img key={img.id} src={`http://localhost:8000${img.image_url}`} alt="evidence" className="w-full h-40 object-cover rounded-lg" />
              ))}
            </div>
          )}
          <div className="flex gap-2">
            {(() => {
              const relatedTask = getTaskForReport(editingReport?.id);
              if (relatedTask) {
                const volunteer = volunteers.find(v => v.id === relatedTask.volunteer_id);
                return (
                  <div className="flex-1 bg-black/30 p-3 rounded-lg">
                    <div className="text-sm text-gray-300 mb-2">Task Details</div>
                    <div className="font-bold text-white">{relatedTask.title}</div>
                    <div className="text-xs text-gray-400">{relatedTask.description}</div>
                    <div className="mt-2 text-xs text-gray-300">Status: <span className="font-semibold text-white">{relatedTask.status}</span></div>
                    <div className="text-xs text-gray-300">Volunteer: <span className="text-white">{volunteer?.name || 'Unassigned'}</span></div>
                    {relatedTask.completed_at && <div className="text-xs text-green-300">Completed: {new Date(relatedTask.completed_at).toLocaleString()}</div>}
                    <div className="mt-3 flex gap-2">
                      <button onClick={() => { setIsReportModalOpen(false); setEditingReport(null); }} className="flex-1 py-2 border border-white/10 rounded text-white/70">Close</button>
                    </div>
                  </div>
                );
              }
              return (
                <>
                  <button onClick={() => { setIsReportModalOpen(false); openAssignTaskModal(undefined, editingReport || undefined); }} className="flex-1 py-2 bg-blue-600 rounded text-white">Assign Task</button>
                  <button onClick={() => { setIsReportModalOpen(false); setEditingReport(null); }} className="flex-1 py-2 border border-white/10 rounded text-white/70">Close</button>
                </>
              );
            })()}
          </div>
        </div>
      </Modal>

      {/* Assign Task Modal */}
      <Modal open={isTaskModalOpen} onClose={() => { setIsTaskModalOpen(false); setSelectedVolunteer(null); setEditingReport(null); }} title={selectedVolunteer ? `Assign Task to ${selectedVolunteer.name}` : 'Assign Task'} className={!editingReport ? "resize overflow-auto max-w-none w-[90vw] h-[90vh]" : ""}>
        <div className={!editingReport ? "flex flex-col md:flex-row gap-4 h-full" : "space-y-4"}>
          
          {/* Map for Manual Task */}
          {!editingReport && (
             <div className="flex-1 h-[300px] md:h-full rounded-lg overflow-hidden border border-white/10 relative">
                <MapContainer center={[20.5937, 78.9629]} zoom={5} style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    <LocationMarker position={taskLocation} setPosition={setTaskLocation} />
                </MapContainer>
                {!taskLocation && <div className="absolute top-2 left-2 bg-black/70 text-yellow-400 px-2 py-1 rounded text-xs z-[1000]">Click map to set location</div>}
             </div>
          )}

          <div className={!editingReport ? "w-full md:w-96 space-y-4 overflow-y-auto p-1" : "space-y-4"}>
            {editingReport && (
                <div className="bg-blue-900/20 p-3 rounded border border-blue-500/30 mb-4">
                    <p className="text-xs text-blue-300 uppercase font-bold">Related Incident</p>
                    <p className="text-white font-medium">{editingReport.title}</p>
                </div>
            )}

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
                placeholder="e.g. Deliver supplies"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                <textarea 
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none h-24"
                placeholder="Task details..."
                />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Priority</label>
              <select value={taskPriority} onChange={(e) => setTaskPriority(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              </select>
            </div>

            <button onClick={handleAssignTask} className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold text-white transition-colors mt-4">
                Assign Task
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
