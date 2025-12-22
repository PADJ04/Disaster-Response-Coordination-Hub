import { useState, useRef } from 'react';
import { ArrowRight, AlertTriangle, Camera, MapPin, X } from 'lucide-react';
import type { BackProps } from '../types';
import api from '../api';

export default function ReportPage({ onBack }: BackProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    severity: '50',
  });
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setIsCameraOpen(true);
      // Wait for the video element to be rendered
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Could not access camera. Please ensure you have granted permission.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d')?.drawImage(video, 0, 0);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
          if (images.length >= 5) {
             setError("Maximum 5 images allowed.");
             stopCamera();
             return;
          }
          setImages([...images, file]);
          stopCamera();
        }
      }, 'image/jpeg');
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleGetLocation = () => {
    setLocationLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setLocationLoading(false);
        },
        (err) => {
          console.error(err);
          alert("Could not get location. Please enable location services.");
          setLocationLoading(false);
        }
      );
    } else {
      alert("Geolocation is not supported by this browser.");
      setLocationLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.description || !location) {
      setError("Please fill in all fields and capture location.");
      return;
    }

    setLoading(true);
    const data = new FormData();
    data.append('title', formData.title);
    data.append('description', formData.description);
    data.append('severity', formData.severity);
    data.append('latitude', location.lat.toString());
    data.append('longitude', location.lng.toString());
    
    // Use stored user_id or a default for anonymous reports if allowed
    const userId = localStorage.getItem('user_id') || 'anonymous'; 
    data.append('user_id', userId);

    images.forEach((img) => {
      data.append('images', img);
    });

    try {
      await api.post('/reports/', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert("Report submitted successfully!");
      onBack();
    } catch (err: any) {
      console.error(err);
      setError("Failed to submit report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto w-full px-6 animate-slide-up pb-24">
      <button onClick={onBack} className="text-white/50 hover:text-white mb-8 flex items-center gap-2 transition-colors">
        <ArrowRight className="rotate-180 w-4 h-4" /> Back to Monitor
      </button>

      <div className="bg-black/40 backdrop-blur-xl border border-red-500/30 rounded-3xl p-8 md:p-12 shadow-[0_0_50px_rgba(239,68,68,0.1)]">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-4 bg-red-500/20 rounded-2xl">
            <AlertTriangle className="w-10 h-10 text-red-400" />
          </div>
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-white">Report Incident</h2>
            <p className="text-red-200/60">Upload data on environmental hazards.</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-red-200/80 uppercase tracking-wider">Incident Title</label>
            <input 
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-red-500/50 transition-colors"
              placeholder="e.g. Oil Spill Sector 7"
            />
          </div>
          
          <div className="space-y-3">
            <label className="text-xs font-bold text-red-200/80 uppercase tracking-wider">Severity Level</label>
            <input 
              type="range" 
              min="0" max="100"
              value={formData.severity}
              onChange={(e) => setFormData({...formData, severity: e.target.value})}
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-red-500" 
            />
            <div className="flex justify-between text-xs text-white/40 font-mono">
              <span>Low</span>
              <span>Critical</span>
            </div>
          </div>

          <div className="space-y-3">
             <label className="text-xs font-bold text-red-200/80 uppercase tracking-wider">Description</label>
             <textarea 
               value={formData.description}
               onChange={(e) => setFormData({...formData, description: e.target.value})}
               className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-red-500/50 min-h-[120px]" 
               placeholder="Describe the environmental impact observed..."
             ></textarea>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button 
              onClick={handleGetLocation}
              disabled={locationLoading}
              className={`flex items-center justify-center gap-2 p-4 rounded-xl border border-white/10 hover:bg-white/5 transition-colors ${location ? 'text-green-400 border-green-500/30' : 'text-white/60'}`}
            >
              {locationLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <MapPin className="w-5 h-5" />
              )}
              {locationLoading ? 'Locating...' : (location ? 'Location Captured' : 'Capture Location')}
            </button>

          <div className="space-y-2">
            <label className="text-xs font-bold text-red-200/80 uppercase tracking-wider">Evidence (Max 5)</label>
            
            {isCameraOpen ? (
              <div className="relative w-full h-64 bg-black rounded-xl overflow-hidden border border-white/10">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                <canvas ref={canvasRef} className="hidden" />
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                  <button onClick={capturePhoto} className="p-3 bg-white rounded-full shadow-lg hover:scale-110 transition-transform">
                    <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                  </button>
                  <button onClick={stopCamera} className="p-3 bg-black/50 text-white rounded-full backdrop-blur-md border border-white/20">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-4">
                <button 
                  onClick={startCamera}
                  className="flex flex-col items-center justify-center w-24 h-24 bg-white/5 border border-white/10 rounded-xl cursor-pointer hover:bg-white/10 transition-colors"
                >
                  <Camera className="w-6 h-6 text-white/50 mb-2" />
                  <span className="text-xs text-white/50">Capture</span>
                </button>
                {images.map((img, index) => (
                  <div key={index} className="relative w-24 h-24 bg-white/5 rounded-xl overflow-hidden border border-white/10">
                    <img src={URL.createObjectURL(img)} alt="Preview" className="w-full h-full object-cover" />
                    <button 
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-black/50 p-1 rounded-full hover:bg-red-500/50 transition-colors"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
              {error}
            </div>
          )}

          <button 
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-orange-600 to-red-600 rounded-xl font-bold text-white hover:scale-[1.02] transition-transform shadow-lg shadow-red-500/20 disabled:opacity-50"
          >
            {loading ? 'Transmitting...' : 'Transmit Report'}
          </button>
        </div>
      </div>
    </div>
    </div>
  );
}
