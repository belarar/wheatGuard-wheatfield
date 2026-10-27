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
import { formatLatinDateTime, formatLatinTime } from '../../utils/dateFormatter';

interface DroneFPVCockpitProps {
  droneState: DroneState;
  activeSample: CapturedSample;
  onCapturePhoto: (capturedDataUrl: string, label?: string) => void;
  onRecordVideo: (capturedDataUrl: string, label?: string) => void;
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
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [isCameraStarting, setIsCameraStarting] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [permissionState, setPermissionState] = useState<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown');
  const [recordedVideoClip, setRecordedVideoClip] = useState<string | null>(null);
  const [isPlayingRecorded, setIsPlayingRecorded] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const nativeCameraPhotoRef = useRef<HTMLInputElement>(null);
  const nativeCameraVideoRef = useRef<HTMLInputElement>(null);
  const liveVideoRef = useRef<HTMLVideoElement>(null);
  const customVideoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Video recording timer & live Latin OSD clock
  const [hudTimestamp, setHudTimestamp] = useState<string>(formatLatinDateTime());
  const [recordedAtLatin, setRecordedAtLatin] = useState<string | null>(null);

  // Check Permissions API for camera access on mount and listen to status changes
  useEffect(() => {
    let permObj: PermissionStatus | null = null;
    if (typeof navigator !== 'undefined' && navigator.permissions && navigator.permissions.query) {
      navigator.permissions
        .query({ name: 'camera' as any })
        .then((perm) => {
          permObj = perm;
          setPermissionState(perm.state as any);
          perm.onchange = () => {
            setPermissionState(perm.state as any);
            if (perm.state === 'granted') {
              setCameraError(null);
            } else if (perm.state === 'denied') {
              setCameraError(
                'تم رفض صلاحية الكاميرا من إعدادات المتصفح. يرجى الضغط على أيقونة القفل 🔒 في شريط عنوان المتصفح والسماح بالوصول للكاميرا (Camera: Allow).'
              );
            }
          };
        })
        .catch(() => {
          setPermissionState('unknown');
        });
    }

    return () => {
      if (permObj) {
        permObj.onchange = null;
      }
    };
  }, []);

  useEffect(() => {
    const clockInterval = setInterval(() => {
      setHudTimestamp(formatLatinDateTime());
    }, 1000);
    return () => clearInterval(clockInterval);
  }, []);

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

  // Safely stop live camera stream
  const stopLiveCameraStream = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (_) {}
      });
      mediaStreamRef.current = null;
    }
    if (liveVideoRef.current) {
      liveVideoRef.current.srcObject = null;
    }
    setIsUsingLiveCamera(false);
    setIsCameraStarting(false);
  };

  // Start live camera stream with Permissions API check & robust multi-tier fallback for mobile devices
  const startLiveCameraStream = async (facing: 'environment' | 'user' = cameraFacing): Promise<MediaStream | null> => {
    setCameraError(null);
    setIsCameraStarting(true);

    // Stop existing stream if any
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => {
        try {
          t.stop();
        } catch (_) {}
      });
      mediaStreamRef.current = null;
    }

    // 1. Explicit Permissions API verification
    if (typeof navigator !== 'undefined' && navigator.permissions && navigator.permissions.query) {
      try {
        const perm = await navigator.permissions.query({ name: 'camera' as any });
        setPermissionState(perm.state as any);
        if (perm.state === 'denied') {
          setIsCameraStarting(false);
          setCameraError(
            'تم حظر صلاحية الكاميرا من إعدادات المتصفح. يرجى الضغط على أيقونة القفل 🔒 في شريط عنوان المتصفح وتغيير إذن الكاميرا إلى "السماح (Allow)"، أو استخدام زر "التقاط صورة بالكاميرا" لفتح تطبيق الهاتف مباشرة.'
          );
          return null;
        }
      } catch (_) {
        // Permissions query not supported on some engines, continue to getUserMedia
      }
    }

    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setIsCameraStarting(false);
      setCameraError(
        'المتصفح أو بيئة الإطار الحالي لا تتيح تشغيل WebRTC المباشر (navigator.mediaDevices.getUserMedia غير متوفر). يمكنك استخدام زر "التقاط صورة بالكاميرا" بالأسفل لفتح تطبيق كاميرا هاتفك فوراً.'
      );
      return null;
    }

    let stream: MediaStream | null = null;
    try {
      // Tier 1: Prefer rear environment camera with ideal resolution
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
    } catch (e1) {
      console.warn('Camera Tier 1 failed, attempting Tier 2 (facingMode ideal)...', e1);
      try {
        // Tier 2: facingMode without resolution requirements
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: facing } },
          audio: false,
        });
      } catch (e2) {
        console.warn('Camera Tier 2 failed, attempting Tier 3 (any video stream)...', e2);
        try {
          // Tier 3: any available video device
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        } catch (e3: any) {
          console.error('All camera attempts failed:', e3);
          setIsCameraStarting(false);
          let errText = 'تعذر تشغيل كاميرا الجهاز.';
          if (e3.name === 'NotAllowedError' || e3.name === 'PermissionDeniedError') {
            setPermissionState('denied');
            errText =
              'تم رفض صلاحية الكاميرا من قِبل المستخدم أو تم حظر الإذن في المتصفح. يرجى الضغط على أيقونة القفل 🔒 في شريط العنوان واختيار "سماح (Allow)" للوصول للكاميرا، أو اضغط زر "التقاط صورة بالكاميرا" لفتح تطبيق الهاتف مباشرة.';
          } else if (e3.name === 'NotFoundError' || e3.name === 'DevicesNotFoundError') {
            errText = 'لم يتم العثور على أي كاميرا متصلة بالجهاز. يرجى التأكد من توفر الكاميرا أو رفع صورة من المعرض.';
          } else if (e3.name === 'NotReadableError' || e3.name === 'TrackStartError') {
            errText =
              'الكاميرا قيد الاستخدام حالياً بواسطة تطبيق آخر على جهازك (يرجى إغلاق التطبيقات الأخرى والمحاولة مجدداً).';
          } else if (e3.name === 'OverconstrainedError') {
            errText = 'إعدادات دقة الكاميرا المطلوبة غير مدعومة من هذا الهاتف.';
          } else if (e3.name === 'SecurityError') {
            errText = 'تم حظر الوصول إلى الكاميرا لأسباب أمنية (يتطلب بروتوكول HTTPS).';
          } else if (e3.message) {
            errText += ` (${e3.message})`;
          }
          setCameraError(errText);
          return null;
        }
      }
    }

    if (stream) {
      mediaStreamRef.current = stream;
      setCustomVideoUrl(null);
      setCustomImageUrl(null);
      setIsUsingLiveCamera(true);
      setIsCameraStarting(false);
      setCameraError(null);
      setPermissionState('granted');

      if (liveVideoRef.current) {
        const video = liveVideoRef.current;
        video.srcObject = stream;
        video.muted = true;
        video.playsInline = true;
        video.setAttribute('playsinline', 'true');
        video.setAttribute('webkit-playsinline', 'true');
        video.play().catch((playErr) => {
          console.warn('Video element play() caught:', playErr);
        });
      }
      return stream;
    }

    setIsCameraStarting(false);
    return null;
  };

  // Toggle live camera on/off
  const toggleLiveCamera = async () => {
    if (isUsingLiveCamera) {
      stopLiveCameraStream();
    } else {
      await startLiveCameraStream(cameraFacing);
    }
  };

  // Switch between back and front camera
  const flipCameraFacing = async () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(nextFacing);
    if (isUsingLiveCamera) {
      await startLiveCameraStream(nextFacing);
    }
  };

  // Ensure stream stays bound whenever isUsingLiveCamera is active
  useEffect(() => {
    if (isUsingLiveCamera && liveVideoRef.current && mediaStreamRef.current) {
      const video = liveVideoRef.current;
      if (video.srcObject !== mediaStreamRef.current) {
        video.srcObject = mediaStreamRef.current;
      }
      video.muted = true;
      video.playsInline = true;
      video.setAttribute('playsinline', 'true');
      video.setAttribute('webkit-playsinline', 'true');
      video.play().catch((err) => {
        console.warn('Live video auto-start catch:', err);
      });
    }
  }, [isUsingLiveCamera]);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => {
          try {
            t.stop();
          } catch (_) {}
        });
      }
    };
  }, []);

  // Handle uploading or capturing user custom image or video
  const handleUserFileUpload = (file?: File, forcedType?: 'image' | 'video') => {
    if (!file) return;

    const isVideo = forcedType === 'video' || file.type.startsWith('video/');
    const reader = new FileReader();

    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      stopLiveCameraStream();

      if (isVideo) {
        setCustomVideoUrl(dataUrl);
        setCustomImageUrl(null);
        if (onCustomMediaLoaded) {
          onCustomMediaLoaded(dataUrl, 'video', `فيديو ميداني بالكاميرا: ${file.name || 'حقل القمح'}`);
        }
      } else {
        setCustomImageUrl(dataUrl);
        setCustomVideoUrl(null);
        if (onCustomMediaLoaded) {
          onCustomMediaLoaded(dataUrl, 'image', `صورة ميدانية بالكاميرا: ${file.name || 'نبات القمح'}`);
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

  const handleSnapPhoto = async () => {
    setCameraError(null);

    // If live camera is not running and no custom user media is loaded:
    // The user pressed the photo shutter to take a picture of the wheat crop with their device camera.
    // Proactively verify permissions and request getUserMedia stream!
    if (!isUsingLiveCamera || !mediaStreamRef.current) {
      if (typeof navigator !== 'undefined' && navigator.permissions && navigator.permissions.query) {
        try {
          const perm = await navigator.permissions.query({ name: 'camera' as any });
          setPermissionState(perm.state as any);
          if (perm.state === 'denied') {
            setCameraError(
              'تم رفض صلاحية الكاميرا في إعدادات المتصفح. يرجى تفعيل إذن الكاميرا (Camera: Allow) من شريط العنوان 🔒 أو استخدم زر "التقاط صورة بالكاميرا" بالأسفل لفتح تطبيق كاميرا هاتفك مباشرة.'
            );
            return;
          }
        } catch (_) {}
      }

      // Request camera permissions and start stream
      const stream = await startLiveCameraStream();
      if (!stream) {
        // Stream failed or was denied; cameraError state already contains detailed guidance for the user
        return;
      }
      // Give camera auto-focus & exposure a moment to settle
      await new Promise((resolve) => setTimeout(resolve, 350));
    }

    setShowShutterFlash(true);
    setTimeout(() => setShowShutterFlash(false), 200);

    const frameUrl = getActiveFrameDataUrl();
    const latinNow = formatLatinDateTime();
    const label = isUsingLiveCamera
      ? `لقطة حية من كاميرا الجهاز [${latinNow}]`
      : customImageUrl
      ? `صورة ميدانية ملتقطة [${latinNow}]`
      : `لقطة فورية: ${activeSample.title}`;

    onCapturePhoto(frameUrl, label);
  };

  const handleToggleRecord = async () => {
    if (!isRecording) {
      setCameraError(null);
      // If live camera is not running and no custom user media is loaded, activate camera for recording
      if (!isUsingLiveCamera || !mediaStreamRef.current) {
        if (typeof navigator !== 'undefined' && navigator.permissions && navigator.permissions.query) {
          try {
            const perm = await navigator.permissions.query({ name: 'camera' as any });
            setPermissionState(perm.state as any);
            if (perm.state === 'denied') {
              setCameraError(
                'تم رفض صلاحية الكاميرا في إعدادات المتصفح. يرجى تفعيل إذن الكاميرا (Camera: Allow) من شريط العنوان 🔒 لتسجيل الفيديو.'
              );
              return;
            }
          } catch (_) {}
        }

        const stream = await startLiveCameraStream();
        if (!stream) {
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, 350));
      }

      setIsRecording(true);
      setRecordedVideoClip(null);
    } else {
      setIsRecording(false);
      const frameUrl = getActiveFrameDataUrl();
      const latinNow = formatLatinDateTime();
      setRecordedAtLatin(latinNow);
      setRecordedVideoClip(frameUrl);
      const label = isUsingLiveCamera
        ? `مقطع مسح جوي حي من كاميرا الجهاز [${latinNow}]`
        : customVideoUrl
        ? `فيديو ميداني مسجل [${latinNow}]`
        : `مقطع مسح جوي: ${activeSample.title}`;

      onRecordVideo(frameUrl, label);
    }
  };

  const handleSend = () => {
    onTransmitToWheatGuard();
    setTransmissionSuccess(true);
    setTimeout(() => setTransmissionSuccess(false), 3000);
  };

  return (
    <div className="space-y-3">
      {/* 3-Step Quick Testing Bar with Direct Camera & Upload Triggers */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <strong className="text-amber-300">خيارات الكاميرا الميدانية:</strong>
          <span className="text-slate-300 hidden sm:inline">
            بث حي &bull; التقاط صورة بالكاميرا &bull; تسجيل فيديو بالكاميرا &bull; رفع ملف
          </span>
        </div>

        {/* Hidden inputs for native camera capture & gallery files */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => handleUserFileUpload(e.target.files?.[0])}
          accept="image/*,video/*"
          className="hidden"
        />
        <input
          type="file"
          ref={nativeCameraPhotoRef}
          onChange={(e) => handleUserFileUpload(e.target.files?.[0], 'image')}
          accept="image/*"
          capture="environment"
          className="hidden"
        />
        <input
          type="file"
          ref={nativeCameraVideoRef}
          onChange={(e) => handleUserFileUpload(e.target.files?.[0], 'video')}
          accept="video/*"
          capture="environment"
          className="hidden"
        />

        {/* Camera action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* 1. Live Camera Stream */}
          <button
            onClick={toggleLiveCamera}
            disabled={isCameraStarting}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              isUsingLiveCamera
                ? 'bg-rose-600 hover:bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-600/30'
                : 'bg-sky-600 hover:bg-sky-500 text-white border-sky-500 shadow-md shadow-sky-600/20'
            }`}
            title="تشغيل بث كاميرا هاتفك مباشرة داخل قمرة الدرون"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>
              {isCameraStarting
                ? 'جاري تشغيل الكاميرا...'
                : isUsingLiveCamera
                ? 'إيقاف الكاميرا الحية'
                : 'بث الكاميرا الحية'}
            </span>
          </button>

          {/* Flip between Front and Rear Camera when live */}
          {isUsingLiveCamera && (
            <button
              onClick={flipCameraFacing}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs transition-colors"
              title="تبديل الكاميرا الخلفية / الأمامية"
            >
              <RotateCcw className="w-3 h-3 text-sky-400" />
              <span>{cameraFacing === 'environment' ? 'الخلفية' : 'الأمامية'}</span>
            </button>
          )}

          {/* 2. Direct Smartphone Photo Capture */}
          <button
            onClick={() => nativeCameraPhotoRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500 text-xs font-semibold shadow-md shadow-emerald-600/20 transition-colors"
            title="فتح تطبيق كاميرا الهاتف مباشرة لالتقاط صورة عالية الدقة لنبات القمح في الحقل"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>التقاط صورة بالكاميرا</span>
          </button>

          {/* 3. Direct Smartphone Video Record */}
          <button
            onClick={() => nativeCameraVideoRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-600 text-white border border-rose-600 text-xs font-semibold shadow-md shadow-rose-700/20 transition-colors"
            title="فتح تطبيق كاميرا الهاتف مباشرة لتسجيل فيديو لنبات القمح في الحقل"
          >
            <Video className="w-3.5 h-3.5" />
            <span>تسجيل فيديو بالكاميرا</span>
          </button>

          {/* 4. Upload existing photo/video */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-semibold transition-colors"
            title="رفع صورة أو فيديو قمح مخزن على جهازك لتجربته داخل الدرون"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>رفع ملف</span>
          </button>
        </div>
      </div>

      {/* Camera Error / Permission Notice with clear user actions and diagnostics */}
      {cameraError && (
        <div className="p-3.5 bg-rose-950/90 border-2 border-rose-500/80 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-rose-200 shadow-xl animate-fade-in">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-rose-100 text-sm">تنبيه صلاحيات الكاميرا</span>
                {permissionState !== 'unknown' && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                      permissionState === 'denied'
                        ? 'bg-rose-900 text-rose-200 border border-rose-600'
                        : permissionState === 'granted'
                        ? 'bg-emerald-900 text-emerald-200 border border-emerald-600'
                        : 'bg-amber-900 text-amber-200 border border-amber-600'
                    }`}
                  >
                    حالة الإذن: {permissionState === 'denied' ? 'مرفوض 🔒' : permissionState === 'granted' ? 'مقبول ✅' : 'قيد الطلب ⏳'}
                  </span>
                )}
              </div>
              <p className="text-rose-200 leading-relaxed font-medium">{cameraError}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto shrink-0 justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-rose-800/60">
            <button
              onClick={() => startLiveCameraStream()}
              className="px-3 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-600 text-white font-bold text-xs shadow-md transition-all active:scale-95"
            >
              إعادة طلب الصلاحية
            </button>
            <button
              onClick={() => nativeCameraPhotoRef.current?.click()}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all active:scale-95 flex items-center gap-1"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>كاميرا الهاتف البديلة</span>
            </button>
            <button
              onClick={() => setCameraError(null)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}

      {/* Main FPV Drone Cockpit Screen */}
      <div className="relative w-full aspect-video sm:aspect-[16/10] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col justify-between select-none">
        {/* Background Viewport: Live Camera OR Custom Video OR Custom Image OR Preset Sample */}
        <div className="absolute inset-0 overflow-hidden flex items-center justify-center bg-black">
          {/* 1. Live Camera Stream - ALWAYS in DOM to guarantee ref presence & immediate playback */}
          <video
            ref={liveVideoRef}
            autoPlay
            playsInline
            muted
            onLoadedMetadata={() => {
              if (liveVideoRef.current) {
                liveVideoRef.current.play().catch(console.warn);
              }
            }}
            className={`w-full h-full object-cover transition-transform duration-300 ${
              !isUsingLiveCamera ? 'hidden' : ''
            } ${ndviMode ? 'filter contrast-150 saturate-200 hue-rotate-90' : ''}`}
            style={{ transform: `scale(${zoomLevel})` }}
          />

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
          {/* Top/Bottom HUD OSD Time Tag in Latin Digits */}
          <div className="absolute bottom-2 left-3 z-10 pointer-events-none bg-slate-950/70 border border-slate-800/80 px-2 py-0.5 rounded text-[10px] font-mono text-emerald-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-slate-400">OSD TIME:</span>
            <span className="font-bold text-slate-100">{hudTimestamp}</span>
            <span className="text-[9px] text-amber-400">UTC</span>
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
        <div className="p-3 bg-slate-900 border border-emerald-500/40 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs animate-fade-in">
          <div className="flex flex-wrap items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <strong className="text-slate-100">تم تسجيل مقطع جوي بنجاح!</strong>
            <span className="font-mono text-emerald-300 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30 text-[11px]">
              توقيت التسجيل: {recordedAtLatin || hudTimestamp}
            </span>
            <span className="text-slate-400 hidden sm:inline">جاهز للإرسال والتحليل في WheatGuard</span>
          </div>
          <button
            onClick={handleSend}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold shadow-md shadow-emerald-600/30"
          >
            <Send className="w-3.5 h-3.5" />
            <span>إرسال الفيديو إلى WheatGuard</span>
          </button>
        </div>
      )}
    </div>
  );
};
