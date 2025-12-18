import { useState, useEffect } from 'react';
import { Edit2, MapPin } from 'lucide-react';
import Modal from '../components/Modal';
import { getTasks, updateTaskStatus as apiUpdateTaskStatus } from '../api';
import type { Task } from '../types';

type Mission = {
  id: string;
  title: string;
  location: string;
  distance: string;
  description: string;
  volunteers_needed: number;
};

export default function VolunteerDashboard({ onLogout }: { onLogout: () => void }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [missions] = useState<Mission[]>([
    { id: 'm-1', title: 'Emergency Medical Aid', location: 'North Sector', distance: '2.5 km', description: 'Provide medical assistance to affected residents', volunteers_needed: 5 },
    { id: 'm-2', title: 'Food Distribution', location: 'East Zone', distance: '4.2 km', description: 'Distribute food and water supplies', volunteers_needed: 8 },
    { id: 'm-3', title: 'Shelter Setup', location: 'Central Area', distance: '1.8 km', description: 'Help set up temporary shelters', volunteers_needed: 10 },
  ]);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskStatus, setTaskStatus] = useState<'assigned' | 'accepted' | 'rejected' | 'completed'>('assigned');

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const data = await getTasks(token);
        setTasks(data);
      } catch (err) {
        console.error("Failed to fetch tasks", err);
        setError("Failed to load tasks");
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, []);

  const openTaskModal = (task: Task) => {
    setEditingTask(task);
    setTaskStatus(task.status);
    setIsTaskModalOpen(true);
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
      case 'completed': return 'bg-green-500/20 text-green-300 border-green-500/30';
      default: return 'bg-white/10 text-white/70';
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-start px-6 md:px-12 pt-12 animate-fade-in pb-24">
      <div className="w-full max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
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
              <span className="px-2 py-1 bg-green-500/20 text-green-300 rounded">{tasks.filter(t => t.status === 'completed').length} Completed</span>
            </div>
          </div>

          <div className="p-6 bg-purple-500/10 border border-purple-500/30 rounded-2xl">
            <h3 className="text-sm font-bold text-purple-300 uppercase tracking-wider mb-2">Nearby Missions</h3>
            <p className="text-3xl font-bold text-white">{missions.length}</p>
            <p className="text-xs text-purple-200/60 mt-4">Active missions in your area</p>
          </div>
        </div>

        {/* Assigned Tasks Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Assigned Tasks</h2>
          <div className="space-y-3">
            {loading ? (
               <div className="p-6 text-center text-white/60 bg-white/5 border border-white/10 rounded-lg">Loading tasks...</div>
            ) : tasks.length === 0 ? (
              <div className="p-6 text-center text-white/60 bg-white/5 border border-white/10 rounded-lg">No assigned tasks yet</div>
            ) : (
              tasks.map((task) => (
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
                </div>
              ))
            )}
          </div>
        </div>

        {/* Nearby Missions Section */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">Nearby Missions</h2>
          <div className="space-y-3">
            {missions.length === 0 ? (
              <div className="p-6 text-center text-white/60 bg-white/5 border border-white/10 rounded-lg">No nearby missions available</div>
            ) : (
              missions.map((mission) => (
                <div key={mission.id} className="p-4 bg-black/40 border border-purple-500/20 rounded-lg hover:border-purple-500/40 transition">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold text-white text-lg mb-2">{mission.title}</h3>
                      <div className="flex items-center gap-2 text-sm text-white/70 mb-2">
                        <MapPin className="w-4 h-4 text-purple-400" />
                        <span>{mission.location} • {mission.distance}</span>
                      </div>
                      <p className="text-sm text-white/70 mb-3">{mission.description}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full border border-purple-500/30">
                          {mission.volunteers_needed} volunteers needed
                        </span>
                      </div>
                    </div>
                    <button className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg text-white font-medium hover:scale-[1.02] transition-transform">
                      Join
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Update Task Status Modal */}
      <Modal open={isTaskModalOpen} onClose={() => setIsTaskModalOpen(false)} title="Update Task Status">
        <div className="space-y-4">
          <div>
            <h3 className="font-bold text-white mb-2">{editingTask?.title}</h3>
            <p className="text-sm text-white/70">{editingTask?.description}</p>
          </div>
          <div>
            <label className="text-xs font-bold text-white/60 uppercase tracking-wider mb-2 block">Status</label>
            <select value={taskStatus} onChange={(e) => setTaskStatus(e.target.value as any)} className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white focus:border-white/30 focus:outline-none transition">
              <option value="assigned">Assigned</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={handleUpdateTaskStatus} className="flex-1 py-3 bg-gradient-to-r from-teal-500 to-teal-600 rounded-lg font-bold text-white hover:scale-[1.02] transition-transform">
              Update Status
            </button>
            <button onClick={() => setIsTaskModalOpen(false)} className="flex-1 py-3 bg-transparent border border-white/10 rounded-lg font-bold text-white/80 hover:bg-white/5 transition">
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
