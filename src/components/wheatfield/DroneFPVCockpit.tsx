import React, { useState, useEffect, useRef } from 'react';
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
  Upload,
  Play,
  Pause,
  RotateCcw,
  Smartphone,
  HelpCircle,
  Check,
  Target,
} from 'lucide-react';
import { BoundingBoxOverlay } from '../BoundingBoxOverlay';
import { generateDetectionBoxes, extract640FrameFromElement } from '../../utils/tfliteInference';

interface DroneFPVCockpitProps {
  droneState: DroneState;
  activeSample: CapturedSample;
  onCapturePhoto: (capturedDataUrl: string) => void;
  onRecordVideo: (capturedDataUrl: string) => void;
  onTransmitToWheatGuard: () => void;
  isTransmitting: boolean;
  onCustomMediaLoaded?: (mediaUrl: string, mediaType: 'image' | 'video', label: string) => void;
}

export const DroneFPVCockpit: React.FC<DroneFPVCockpitProps> = ({
  droneState,
  activeSample,
  onCapturePhoto,
  onRecordVideo,
  onTransmitToWheatGuard,
  isTransmitting,
  onCustomMediaLoaded,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [ndviMode, setNdviMode] = useState<boolean>(false);
  const [showAiHud, setShowAiHud] = useState<boolean>(true);
  const [gimbalPitch, setGimbalPitch] = useState<number>(45);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordSeconds, setRecordSeconds] = useState<number>(0);
  const [showShutterFlash, setShowShutterFlash] = useState<boolean>(false);
  const [transmissionSuccess, setTransmissionSuccess] = useState<boolean>(false);

  // Active bounding boxes to render inside the drone HUD
  const activeBoxes = activeSample.precomputedDiagnosis?.boundingBoxes || generateDetectionBoxes(14, 95);

  // Custom User media testing (Uploaded video/photo or Live Camera)
  const [customVideoUrl, setCustomVideoUrl] = useState<string | null>(null);
  const [customImageUrl, setCustomImageUrl] = useState<string | null>(null);
  const [isUsingLiveCamera, setIsUsingLiveCamera] = useState<boolean>(false);
  const [recordedVideoClip, setRecordedVideoClip] = useState<string | null>(null);
  const [isPlayingRecorded, setIsPlayingRecorded] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const liveVideoRef = useRef<HTMLVideoElement>(null);
  const customVideoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

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

  // Handle Live Camera Stream toggle (Webcam or Smartphone Camera)
  const toggleLiveCamera = async () => {
    if (isUsingLiveCamera) {
      // Stop live camera
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
      setIsUsingLiveCamera(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      mediaStreamRef.current = stream;
      setIsUsingLiveCamera(true);
      setCustomVideoUrl(null);
      setCustomImageUrl(null);
      if (liveVideoRef.current) {
        liveVideoRef.current.srcObject = stream;
        liveVideoRef.current.play();
      }
    } catch (err: any) {
      alert('تعذر الوصول إلى الكاميرا: ' + (err.message || 'تأكد من إعطاء إذن الكاميرا للمتصفح.'));
    }
  };

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // Handle uploading user custom image or video
  const handleUserFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    const reader = new FileReader();

    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (isVideo) {
        setCustomVideoUrl(dataUrl);
        setCustomImageUrl(null);
        setIsUsingLiveCamera(false);
        if (onCustomMediaLoaded) {
          onCustomMediaLoaded(dataUrl, 'video', `فيديو ميداني مرفوع: ${file.name}`);
        }
      } else {
        setCustomImageUrl(dataUrl);
        setCustomVideoUrl(null);
        setIsUsingLiveCamera(false);
        if (onCustomMediaLoaded) {
          onCustomMediaLoaded(dataUrl, 'image', `صورة ميدانية مرفوعة: ${file.name}`);
        }
      }
    };

    reader.readAsDataURL(file);
  };

  // Capture current active frame (either live camera, uploaded video/image, or preset)
  const getActiveFrameDataUrl = (): string => {
    if (isUsingLiveCamera && liveVideoRef.current) {
      const { dataUrl } = extract640FrameFromElement(liveVideoRef.current, {
        enabled: true,
        autoWhiteBalance: true,
        contrastStretching: true,
      });
      if (dataUrl) return dataUrl;
    }

    if (customVideoUrl && customVideoRef.current) {
      const { dataUrl } = extract640FrameFromElement(customVideoRef.current, {
        enabled: true,
        autoWhiteBalance: true,
        contrastStretching: true,
      });
      if (dataUrl) return dataUrl;
    }

    if (customImageUrl) {
      return customImageUrl;
    }

    return activeSample.imageUrl;
  };

  const handleSnapPhoto = () => {
    setShowShutterFlash(true);
    setTimeout(() => setShowShutterFlash(false), 200);

    const frameUrl = getActiveFrameDataUrl();
    onCapturePhoto(frameUrl);
  };

  const handleToggleRecord = () => {
    if (!isRecording) {
      setIsRecording(true);
      setRecordedVideoClip(null);
    } else {
      setIsRecording(false);
      const frameUrl = getActiveFrameDataUrl();
      setRecordedVideoClip(frameUrl);
      onRecordVideo(frameUrl);
    }
  };

  const handleSend = () => {
    onTransmitToWheatGuard();
    setTransmissionSuccess(true);
    setTimeout(() => setTransmissionSuccess(false), 3000);
  };

  return (
    <div className="space-y-3">
      {/* 3-Step Quick Testing Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <strong className="text-amber-300">طريقة اختبار الصور أو الفيديو:</strong>
          <span className="text-slate-300 hidden sm:inline">
            1. اختر صنفاً أو ارفع ملفك &bull; 2. اضغط التقط صورة / سجل فيديو &bull; 3. اضغط "إرسال إلى WheatGuard"
          </span>
        </div>

        {/* Upload Custom Media & Live Camera buttons */}
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleUserFileUpload}
            accept="image/*,video/*"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-semibold transition-colors"
            title="رفع صورة أو فيديو قمح من جهازك لتجربته داخل الدرون"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>رفع صورة/فيديو من جهازي</span>
          </button>

          <button
            onClick={toggleLiveCamera}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
              isUsingLiveCamera
                ? 'bg-rose-600 text-white border-rose-500'
                : 'bg-slate-800 hover:bg-slate-700 text-sky-300 border-slate-700'
            }`}
            title="تشغيل كاميرا الهاتف المباشرة لتصوير نباتات القمح الحقيقية كدرون"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>{isUsingLiveCamera ? 'إيقاف الكاميرا الحية' : 'كاميرا هاتفي الحية'}</span>
          </button>
        </div>
      </div>

      {/* Main FPV Drone Cockpit Screen */}
      <div className="relative w-full aspect-video sm:aspect-[16/10] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col justify-between select-none">
        {/* Background Viewport: Live Camera OR Custom Video OR Custom Image OR Preset Sample */}
        <div className="absolute inset-0 overflow-hidden flex items-center justify-center bg-black">
          {/* 1. Live Camera Stream */}
          {isUsingLiveCamera && (
            <video
              ref={liveVideoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover transition-transform duration-300 ${
                ndviMode ? 'filter contrast-150 saturate-200 hue-rotate-90' : ''
              }`}
              style={{ transform: `scale(${zoomLevel})` }}
            />
          )}

          {/* 2. Custom Uploaded Video */}
          {!isUsingLiveCamera && customVideoUrl && (
            <video
              ref={customVideoRef}
              src={customVideoUrl}
              autoPlay
              loop
              muted
              playsInline
              className={`w-full h-full object-cover transition-transform duration-300 ${
                ndviMode ? 'filter contrast-150 saturate-200 hue-rotate-90' : ''
              }`}
              style={{ transform: `scale(${zoomLevel})` }}
            />
          )}

          {/* 3. Custom Uploaded Image */}
          {!isUsingLiveCamera && !customVideoUrl && customImageUrl && (
            <img
              src={customImageUrl}
              alt="Custom Wheat Inspection"
              className={`w-full h-full object-cover transition-transform duration-300 ${
                ndviMode ? 'filter contrast-150 saturate-200 hue-rotate-90' : ''
              }`}
              style={{ transform: `scale(${zoomLevel})` }}
            />
          )}

          {/* 4. Preset Sample Image */}
          {!isUsingLiveCamera && !customVideoUrl && !customImageUrl && (
            <img
              src={activeSample.imageUrl}
              alt="FPV Drone Field Camera"
              className={`w-full h-full object-cover transition-transform duration-300 ${
                ndviMode ? 'filter contrast-150 saturate-200 hue-rotate-90' : ''
              }`}
              style={{
                transform: `scale(${zoomLevel}) rotate(${droneState.headingDegrees * 0.05}deg)`,
                transformOrigin: 'center center',
              }}
            />
          )}

          {/* Shutter White Flash effect */}
          {showShutterFlash && (
            <div className="absolute inset-0 bg-white/90 z-40 transition-opacity duration-150 animate-fade-out" />
          )}

          {/* Thermal / NDVI False-Color Mask Overlay when active */}
          {ndviMode && (
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-900/30 via-emerald-500/20 to-yellow-500/30 mix-blend-overlay pointer-events-none" />
          )}

          {/* Real-time AI Target Lock HUD in Drone Cockpit */}
          {showAiHud && (
            <BoundingBoxOverlay
              boxes={activeBoxes}
              showLabels={true}
            />
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
            ) : isUsingLiveCamera ? (
              <div className="px-3 py-1 rounded-full bg-sky-600/90 text-white font-bold text-xs flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <span>بث حي من كاميرا الجهاز</span>
              </div>
            ) : customVideoUrl ? (
              <div className="px-3 py-1 rounded-full bg-amber-600/90 text-white font-bold text-xs">
                تشغيل فيديو مرفوع
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

            {/* AI HUD Target Lock Toggle */}
            <button
              onClick={() => setShowAiHud(!showAiHud)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                showAiHud
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/30'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
              title="تفعيل كاشف الذكاء الاصطناعي وتحديد البؤر بمربعات ومسميات الأمراض في قمرة الدرون"
            >
              <Target className="w-3.5 h-3.5" />
              <span>كاشف AI ({activeBoxes.length})</span>
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

      {/* Recorded Video Clip Preview Bar (when recorded) */}
      {recordedVideoClip && (
        <div className="p-3 bg-slate-900 border border-emerald-500/40 rounded-xl flex items-center justify-between text-xs animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <strong className="text-slate-100">تم تسجيل مقطع جوي بنجاح!</strong>
            <span className="text-slate-400">جاهز للتحليل بواسطة WheatGuard</span>
          </div>
          <button
            onClick={handleSend}
            className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold"
          >
            <Send className="w-3.5 h-3.5" />
            <span>إرسال الفيديو إلى WheatGuard</span>
          </button>
        </div>
      )}
    </div>
  );
};
