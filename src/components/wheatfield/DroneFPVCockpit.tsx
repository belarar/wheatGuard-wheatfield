import React, { useState, useEffect } from 'react';
import { DroneState, CapturedSample } from '../../types';
import {
  Camera,
  Video,
  Radio,
  Eye,
  Crosshair,
  Battery,
  Wifi,
  Sparkles,
  Maximize2,
  Minimize2,
  ZoomIn,
  Send,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface DroneFPVCockpitProps {
  droneState: DroneState;
  activeSample: CapturedSample;
  onCapturePhoto: (capturedDataUrl: string) => void;
  onRecordVideo: (capturedDataUrl: string) => void;
  onTransmitToWheatGuard: () => void;
  isTransmitting: boolean;
}

export const DroneFPVCockpit: React.FC<DroneFPVCockpitProps> = ({
  droneState,
  activeSample,
  onCapturePhoto,
  onRecordVideo,
  onTransmitToWheatGuard,
  isTransmitting,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [ndviMode, setNdviMode] = useState<boolean>(false);
  const [gimbalPitch, setGimbalPitch] = useState<number>(45);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordSeconds, setRecordSeconds] = useState<number>(0);
  const [showShutterFlash, setShowShutterFlash] = useState<boolean>(false);
  const [transmissionSuccess, setTransmissionSuccess] = useState<boolean>(false);

  // Video recording timer
  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordSeconds((s) => s + 1);
      }, 1000);
    } else {
      setRecordSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const handleSnapPhoto = () => {
    setShowShutterFlash(true);
    setTimeout(() => setShowShutterFlash(false), 200);
    onCapturePhoto(activeSample.imageUrl);
  };

  const handleToggleRecord = () => {
    if (!isRecording) {
      setIsRecording(true);
    } else {
      setIsRecording(false);
      onRecordVideo(activeSample.imageUrl);
    }
  };

  const handleSend = () => {
    onTransmitToWheatGuard();
    setTransmissionSuccess(true);
    setTimeout(() => setTransmissionSuccess(false), 3000);
  };

  return (
    <div className="relative w-full aspect-video sm:aspect-[16/10] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col justify-between select-none">
      {/* Background simulated FPV Camera Feed */}
      <div className="absolute inset-0 overflow-hidden flex items-center justify-center">
        <div
          className={`w-full h-full transition-transform duration-300 ${
            ndviMode ? 'filter contrast-150 saturate-200 hue-rotate-90' : ''
          }`}
          style={{
            transform: `scale(${zoomLevel}) rotate(${droneState.headingDegrees * 0.05}deg)`,
            transformOrigin: 'center center',
          }}
        >
          <img
            src={activeSample.imageUrl}
            alt="FPV Drone Field Camera"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Shutter White Flash effect */}
        {showShutterFlash && (
          <div className="absolute inset-0 bg-white/90 z-40 transition-opacity duration-150 animate-fade-out" />
        )}

        {/* Thermal / NDVI False-Color Mask Overlay when active */}
        {ndviMode && (
          <div className="absolute inset-0 bg-gradient-to-tr from-purple-900/30 via-emerald-500/20 to-yellow-500/30 mix-blend-overlay pointer-events-none" />
        )}
      </div>

      {/* TOP HUD BAR */}
      <div className="relative z-20 bg-gradient-to-b from-slate-950/80 to-transparent p-3 sm:p-4 text-xs font-mono text-slate-100 flex items-center justify-between">
        {/* Left: Battery & Signal */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-emerald-400 bg-slate-950/60 px-2 py-1 rounded-md border border-slate-800">
            <Battery className="w-3.5 h-3.5" />
            <span className="font-bold">{droneState.batteryPercent}%</span>
          </div>

          <div className="flex items-center gap-1 text-sky-400 bg-slate-950/60 px-2 py-1 rounded-md border border-slate-800">
            <Wifi className="w-3.5 h-3.5" />
            <span>5.8GHz RTK</span>
          </div>

          <div className="hidden sm:flex items-center gap-1 text-amber-400 bg-slate-950/60 px-2 py-1 rounded-md border border-slate-800">
            <span>{droneState.satellites} SATS</span>
          </div>
        </div>

        {/* Center: Mission & Mode */}
        <div className="flex items-center gap-2">
          {isRecording ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-600/90 text-white font-bold text-xs animate-pulse">
              <span className="w-2 h-2 rounded-full bg-white" />
              <span>REC 00:{recordSeconds < 10 ? `0${recordSeconds}` : recordSeconds}</span>
            </div>
          ) : (
            <div className="px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700 text-[11px] text-slate-300">
              {droneState.status === 'PATROLLING'
                ? 'مسح شبكي آلي (Auto-Survey)'
                : 'تحليق حر ومراقبة (Active Scout)'}
            </div>
          )}
        </div>

        {/* Right: Gimbal & NDVI mode */}
        <div className="flex items-center gap-2">
          {ndviMode && (
            <span className="px-2 py-0.5 rounded bg-purple-600/80 text-white text-[10px] font-bold animate-pulse">
              NDVI Multispectral
            </span>
          )}
          <span className="bg-slate-950/60 px-2 py-1 rounded-md border border-slate-800 text-[11px] text-slate-300">
            Gimbal: -{gimbalPitch}°
          </span>
        </div>
      </div>

      {/* CENTER HUD: Reticle, Artificial Horizon & Flight Telemetry */}
      <div className="relative z-10 flex-1 flex items-center justify-center pointer-events-none">
        {/* Left Altitude Tape */}
        <div className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 bg-slate-950/60 backdrop-blur-sm px-2 py-3 rounded-lg border border-slate-800 text-xs font-mono text-amber-400 flex flex-col items-center gap-1">
          <span className="text-[10px] text-slate-400">ارتفاع ALT</span>
          <span className="text-sm font-black">{droneState.altitudeMeters.toFixed(1)}</span>
          <span className="text-[9px] text-slate-400">متر (m)</span>
        </div>

        {/* Right Speed Tape */}
        <div className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 bg-slate-950/60 backdrop-blur-sm px-2 py-3 rounded-lg border border-slate-800 text-xs font-mono text-sky-400 flex flex-col items-center gap-1">
          <span className="text-[10px] text-slate-400">سرعة SPD</span>
          <span className="text-sm font-black">{droneState.speedKmh.toFixed(1)}</span>
          <span className="text-[9px] text-slate-400">كم/ساعة</span>
        </div>

        {/* Crosshair & Pitch Reticle */}
        <div className="relative w-32 h-32 flex items-center justify-center">
          <div className="absolute w-24 h-24 rounded-full border border-emerald-500/50" />
          <div className="absolute w-12 h-12 rounded-full border border-dashed border-amber-400/60" />
          <div className="w-2 h-2 rounded-full bg-emerald-400" />
          <div className="absolute w-8 h-[1px] bg-emerald-400/80 -left-6" />
          <div className="absolute w-8 h-[1px] bg-emerald-400/80 -right-6" />
          <div className="absolute h-8 w-[1px] bg-emerald-400/80 -top-6" />
          <div className="absolute h-8 w-[1px] bg-emerald-400/80 -bottom-6" />
        </div>
      </div>

      {/* BOTTOM CONTROL DECK: Camera triggers, Zoom, Gimbal, Push to WheatGuard */}
      <div className="relative z-20 bg-gradient-to-t from-slate-950/90 via-slate-950/70 to-transparent p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/60">
        {/* Left: Lens & Zoom Controls */}
        <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
          {[1, 2, 4].map((z) => (
            <button
              key={z}
              onClick={() => setZoomLevel(z)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                zoomLevel === z
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              {z}x
            </button>
          ))}

          {/* NDVI Toggle */}
          <button
            onClick={() => setNdviMode(!ndviMode)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              ndviMode
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
            title="تفعيل فلتر NDVI الطيفي لرصد بؤر الأمراض والنيماتودا"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>NDVI</span>
          </button>
        </div>

        {/* Center: Camera Actions (Shutter & Video Record) */}
        <div className="flex items-center gap-2">
          {/* Photo Shutter */}
          <button
            onClick={handleSnapPhoto}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-white text-slate-950 font-bold text-xs shadow-lg shadow-white/10 active:scale-95 transition-all"
            title="التقاط صورة فوتوغرافية لنصل القمح"
          >
            <Camera className="w-4 h-4 text-emerald-600" />
            <span>التقاط صورة</span>
          </button>

          {/* Video Clip Record */}
          <button
            onClick={handleToggleRecord}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${
              isRecording
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/40 animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            <Video className="w-4 h-4 text-rose-400" />
            <span>{isRecording ? 'إيقاف التسجيل' : 'تسجيل فيديو'}</span>
          </button>
        </div>

        {/* Right: Transmit to WheatGuard */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSend}
            disabled={isTransmitting}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs shadow-lg transition-all active:scale-95 disabled:opacity-50 ${
              transmissionSuccess
                ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-emerald-500/20'
            }`}
            title="نقل اللقطة وقراءات المستشعرات مباشرة إلى تطبيق WheatGuard"
          >
            {isTransmitting ? (
              <Radio className="w-4 h-4 animate-spin text-slate-950" />
            ) : transmissionSuccess ? (
              <CheckCircle2 className="w-4 h-4 text-white" />
            ) : (
              <Send className="w-4 h-4 text-slate-950" />
            )}
            <span>{transmissionSuccess ? 'تم الإرسال لـ WheatGuard!' : 'إرسال إلى WheatGuard'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
