import React, { useState, useEffect, useRef } from 'react';
import {
  DroneState,
  WeatherTelemetry,
  CapturedSample,
  FieldParcel,
  TelemetryPacket,
} from '../../types';
import { WHEAT_DISEASE_SAMPLES } from '../../data/wheatSamples';
import { runEdgeInference } from '../../utils/tfliteInference';
import { formatLatinDateTime, formatLatinTime, formatTransmissionStamp } from '../../utils/dateFormatter';
import { DroneFPVCockpit } from './DroneFPVCockpit';
import { InteractiveFieldMap } from './InteractiveFieldMap';
import { SensorControlDeck } from './SensorControlDeck';
import {
  Plane,
  Play,
  Pause,
  RotateCcw,
  Navigation,
  Send,
  Compass,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Sliders,
  Eye,
} from 'lucide-react';

interface WheatFieldAppProps {
  currentParcel: FieldParcel;
  onTransmitPacket: (packet: TelemetryPacket) => void;
  onSwitchToWheatGuard: () => void;
  parcels: FieldParcel[];
  onSelectParcel: (parcelId: string) => void;
  onSaveNewParcel?: (newParcel: FieldParcel) => void;
}

export const WheatFieldApp: React.FC<WheatFieldAppProps> = ({
  currentParcel,
  onTransmitPacket,
  onSwitchToWheatGuard,
  parcels,
  onSelectParcel,
  onSaveNewParcel,
}) => {
  // Drone State
  const [droneState, setDroneState] = useState<DroneState>({
    droneId: 'AGRO-DRONE-X4',
    missionName: 'مسح القطاع الأوسط لحقل القمح',
    status: 'HOVERING',
    coordinates: { ...currentParcel.center },
    altitudeMeters: 22.5,
    speedKmh: 16.0,
    batteryPercent: 86,
    headingDegrees: 45,
    gimbalPitchDegrees: 45,
    satellites: 18,
    signalStrengthPercent: 98,
    flightTimeSeconds: 420,
  });

  // Drone flight trail history for map polyline
  const [droneTrail, setDroneTrail] = useState<Array<[number, number]>>([
    [currentParcel.center.lat, currentParcel.center.lng],
  ]);

  // Weather Telemetry
  const [weather, setWeather] = useState<WeatherTelemetry>({
    temperatureC: 21.5,
    ambientHumidityPercent: 82,
    soilMoisturePercent: 66,
    windSpeedKmh: 11.2,
    windDirection: 'شمالية غربية (NW)',
    leafWetnessHours: 5.5,
    uvIndex: 5,
    atmosphericPressureHpa: 1014,
    sprayCondition: 'OPTIMAL',
    sprayAdvice: 'سرعة الرياح ملائمة للرش الدقيق، مع مراقبة رطوبة الأوراق لتفادي غسل المبيد.',
  });

  // Current active visual sample the drone camera is pointing at
  const [activeSampleIndex, setActiveSampleIndex] = useState<number>(0);
  const activeSample = WHEAT_DISEASE_SAMPLES[activeSampleIndex] || WHEAT_DISEASE_SAMPLES[0];

  // Auto patrol mode
  const [isAutoPatrolling, setIsAutoPatrolling] = useState<boolean>(false);
  const [isTransmitting, setIsTransmitting] = useState<boolean>(false);
  const [lastSentTime, setLastSentTime] = useState<string | null>(null);

  // Auto patrol animation loop
  useEffect(() => {
    let interval: any;
    if (isAutoPatrolling) {
      interval = setInterval(() => {
        setDroneState((prev) => {
          // Circular / grid patrol drift
          const angle = (prev.headingDegrees + 8) % 360;
          const rad = (angle * Math.PI) / 180;
          const deltaLat = Math.sin(rad) * 0.00015;
          const deltaLng = Math.cos(rad) * 0.00015;

          const newLat = currentParcel.center.lat + deltaLat;
          const newLng = currentParcel.center.lng + deltaLng;

          setDroneTrail((trail) => {
            const next = [...trail, [newLat, newLng] as [number, number]];
            return next.slice(-40); // keep last 40 points
          });

          return {
            ...prev,
            headingDegrees: angle,
            coordinates: { lat: newLat, lng: newLng },
            altitudeMeters: Math.max(15, Math.min(35, prev.altitudeMeters + (Math.random() - 0.5) * 0.8)),
            speedKmh: Math.max(10, Math.min(25, prev.speedKmh + (Math.random() - 0.5) * 1.2)),
            batteryPercent: Math.max(10, prev.batteryPercent - 0.05),
            flightTimeSeconds: prev.flightTimeSeconds + 1,
            status: 'PATROLLING',
          };
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isAutoPatrolling, currentParcel.center]);

  // Custom user media
  const [activeCustomMedia, setActiveCustomMedia] = useState<{
    dataUrl: string;
    type: 'image' | 'video';
    label: string;
  } | null>(null);

  // Transmit current packet to WheatGuard
  const handleTransmit = (overrideMedia?: { dataUrl: string; type: 'image' | 'video'; label?: string }) => {
    setIsTransmitting(true);

    const now = Date.now();
    const latinDateTime = formatLatinDateTime(now);
    const latinTime = formatLatinTime(now);

    const defaultLabel = overrideMedia?.type === 'video' || activeCustomMedia?.type === 'video'
      ? `مقطع مسح جوي [${latinDateTime}]: ${activeSample.title}`
      : `لقطة درون [${latinDateTime}]: ${activeSample.title}`;

    const mediaToTransmit = overrideMedia || activeCustomMedia || {
      dataUrl: activeSample.imageUrl,
      type: 'image' as const,
      label: defaultLabel,
    };

    // Ensure the label explicitly carries the Latin date and time if it doesn't already have one
    const finalLabel = mediaToTransmit.label?.includes(latinTime)
      ? mediaToTransmit.label
      : `${mediaToTransmit.label || 'مقطع مسح جوي'} [${latinDateTime}]`;

    // For preset samples, use activeSampleIndex.
    // For custom uploaded media (images or videos), do NOT pass activeSampleIndex (which was 0)!
    // Let the inference engine inspect the label (e.g. wheat rust) and pixels to detect the true class.
    const isCustom = Boolean(overrideMedia || activeCustomMedia);
    const targetHint = isCustom ? undefined : activeSampleIndex;

    let diagnosis = (!isCustom && activeSample.precomputedDiagnosis) ? activeSample.precomputedDiagnosis as any : null;
    if (!diagnosis || !diagnosis?.boundingBoxes?.length) {
      diagnosis = runEdgeInference(
        mediaToTransmit.dataUrl,
        weather,
        'WheatField-TFLite-Edge-640',
        targetHint,
        finalLabel
      );
    }

    const packet: TelemetryPacket = {
      id: `pkt-${now}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: now,
      formattedTimestampLatin: latinDateTime,
      droneId: droneState.droneId,
      coordinates: { ...droneState.coordinates },
      altitudeMeters: droneState.altitudeMeters,
      speedKmh: droneState.speedKmh,
      weather: { ...weather },
      capturedMedia: {
        type: mediaToTransmit.type,
        dataUrl: mediaToTransmit.dataUrl,
        label: finalLabel,
      },
      diagnosis,
    };

    // Forward to parent ecosystem handler
    onTransmitPacket(packet);

    // Also push to server API in background
    fetch('/api/telemetry/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(packet),
    }).catch(() => {});

    setTimeout(() => {
      setIsTransmitting(false);
      setLastSentTime(latinDateTime);
    }, 600);
  };

  // Weather presets
  const handleSimulateOptimalWeather = () => {
    setWeather({
      ...weather,
      temperatureC: 20.0,
      ambientHumidityPercent: 65,
      soilMoisturePercent: 60,
      windSpeedKmh: 8.5,
      windDirection: 'شمالية',
      leafWetnessHours: 2.0,
    });
  };

  const handleSimulateAdverseWeather = () => {
    setWeather({
      ...weather,
      temperatureC: 17.0,
      ambientHumidityPercent: 92,
      soilMoisturePercent: 80,
      windSpeedKmh: 18.5,
      windDirection: 'جنوبية غربية',
      leafWetnessHours: 8.5,
    });
  };

  // Reposition drone on map click
  const handleMapClick = (coords: { lat: number; lng: number }) => {
    setDroneState((prev) => ({
      ...prev,
      coordinates: coords,
    }));
    setDroneTrail((trail) => [...trail, [coords.lat, coords.lng]]);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-2 sm:px-4 py-4">
      {/* Top Banner / Mission Controller */}
      <div className="bg-gradient-to-r from-amber-950/80 via-slate-900 to-emerald-950/40 border border-amber-500/30 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-inner">
            <Plane className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-slate-100">
                WheatField • محاكي الدرون الزراعي والمستشعرات
              </h2>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold font-mono">
                {droneState.droneId}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              محاكاة طيران الدرون فوق حقول القمح الحقيقية، التقاط الصور والفيديوهات، وبث قياسات الرطوبة والحرارة وسرعة الرياح عبر مستشعرات إنترنت الأشياء إلى تطبيق <strong>WheatGuard</strong>.
            </p>
          </div>
        </div>

        {/* Flight & Mission buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAutoPatrolling(!isAutoPatrolling)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all shadow-lg ${
              isAutoPatrolling
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
            }`}
          >
            {isAutoPatrolling ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isAutoPatrolling ? 'إيقاف المسح الآلي' : 'بدء المسح الشبكي الآلي'}</span>
          </button>

          <button
            onClick={onSwitchToWheatGuard}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs border border-slate-700 font-semibold transition-colors"
          >
            <span>الانتقال إلى WheatGuard</span>
          </button>
        </div>
      </div>

      {/* Parcel Selector Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 px-4 py-3 rounded-2xl">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
          <MapPin className="w-4 h-4 text-emerald-400" />
          <span>اختيار الحقل الزراعي المراد مسحه:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {parcels.map((parcel) => (
            <button
              key={parcel.id}
              onClick={() => onSelectParcel(parcel.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                currentParcel.id === parcel.id
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/20'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
              }`}
            >
              {parcel.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Row: Left (FPV Drone Cockpit) & Right (Interactive GIS Map) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Drone FPV Live Camera & Telemetry HUD */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Eye className="w-4 h-4 text-amber-400" />
              <span>كاميرا الدرون الميدانية (FPV Gimbal Camera)</span>
            </h3>

            {lastSentTime && (
              <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-mono">
                <CheckCircle2 className="w-3.5 h-3.5" />
                آخر إرسال إلى WheatGuard: {lastSentTime}
              </span>
            )}
          </div>

          <DroneFPVCockpit
            droneState={droneState}
            activeSample={activeSample}
            onCapturePhoto={(dataUrl) =>
              handleTransmit({ dataUrl, type: 'image', label: `لقطة فورية: ${activeSample.title}` })
            }
            onRecordVideo={(dataUrl) =>
              handleTransmit({ dataUrl, type: 'video', label: `مقطع مسح جوي: ${activeSample.title}` })
            }
            onTransmitToWheatGuard={() => handleTransmit()}
            isTransmitting={isTransmitting}
            onCustomMediaLoaded={(mediaUrl, mediaType, label) => {
              setActiveCustomMedia({ dataUrl: mediaUrl, type: mediaType, label });
            }}
          />

          {/* Hover Target Zone Selector (Wheat Condition beneath the drone) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold text-slate-300">
                توجيه كاميرا الدرون نحو أي من الأصناف الـ 15 المعتمدة:
              </span>
              <span className="text-[11px] text-amber-400 font-mono">
                15 Trained Target Zones
              </span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-5 gap-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
              {WHEAT_DISEASE_SAMPLES.map((sample, idx) => {
                const isSelected = activeSampleIndex === idx;
                return (
                  <button
                    key={sample.id}
                    onClick={() => setActiveSampleIndex(idx)}
                    className={`relative p-1.5 rounded-xl border text-center transition-all group ${
                      isSelected
                        ? 'bg-amber-950/60 border-amber-500 shadow-md ring-1 ring-amber-500/60'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    <span className="absolute top-2 left-2 z-10 px-1 py-0.2 rounded bg-slate-950/90 text-amber-400 text-[9px] font-mono font-bold border border-amber-500/30">
                      #{idx}
                    </span>
                    <div className="w-full aspect-square rounded-lg overflow-hidden bg-slate-900 border border-slate-800 mb-1">
                      <img
                        src={sample.imageUrl}
                        alt={sample.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <span className="text-[10px] font-bold text-slate-200 line-clamp-1">
                      {sample.title.split('(')[0].trim()}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Real-World GIS Field Map with Drone Position */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Navigation className="w-4 h-4 text-emerald-400" />
              <span>خريطة الحقل بالأقمار الصناعية (Satellite GIS)</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">
              {currentParcel.areaHectares} هكتار
            </span>
          </div>

          <div className="flex-1 min-h-[420px]">
            <InteractiveFieldMap
              parcel={currentParcel}
              droneState={droneState}
              onMapClickLocation={handleMapClick}
              droneTrail={droneTrail}
              onSaveNewParcel={onSaveNewParcel}
            />
          </div>
        </div>
      </div>

      {/* Bottom IoT Climate & Soil Sensor Control Deck */}
      <SensorControlDeck
        weather={weather}
        onChangeWeather={setWeather}
        onSimulateOptimalWeather={handleSimulateOptimalWeather}
        onSimulateAdverseWeather={handleSimulateAdverseWeather}
      />
    </div>
  );
};
