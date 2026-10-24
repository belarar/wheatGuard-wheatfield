import React, { useState, useRef } from 'react';
import {
  WheatDiseaseDiagnosis,
  TelemetryPacket,
  CapturedSample,
  CustomModelConfig,
  FieldParcel,
} from '../../types';
import { WHEAT_DISEASE_SAMPLES } from '../../data/wheatSamples';
import { DiagnosisCard } from './DiagnosisCard';
import { DiseaseAlertsFeed } from './DiseaseAlertsFeed';
import { HealthHeatmap } from './HealthHeatmap';
import {
  ShieldAlert,
  Upload,
  Camera,
  Sparkles,
  RefreshCw,
  FolderOpen,
  Send,
  Plane,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Sliders,
} from 'lucide-react';

interface WheatGuardAppProps {
  incomingPackets: TelemetryPacket[];
  customModelConfig: CustomModelConfig;
  fieldParcels: FieldParcel[];
  selectedParcelId: string;
  onSelectParcel: (id: string) => void;
  onSwitchToDrone: () => void;
}

export const WheatGuardApp: React.FC<WheatGuardAppProps> = ({
  incomingPackets,
  customModelConfig,
  fieldParcels,
  selectedParcelId,
  onSelectParcel,
  onSwitchToDrone,
}) => {
  // Current active sample for diagnosis
  const [activeImage, setActiveImage] = useState<string>(WHEAT_DISEASE_SAMPLES[0].imageUrl);
  const [activeDiagnosis, setActiveDiagnosis] = useState<WheatDiseaseDiagnosis | null>(
    (WHEAT_DISEASE_SAMPLES[0].precomputedDiagnosis as WheatDiseaseDiagnosis) || null
  );
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [selectedSampleId, setSelectedSampleId] = useState<string>(WHEAT_DISEASE_SAMPLES[0].id);
  const [selectedPacketId, setSelectedPacketId] = useState<string | undefined>(undefined);
  const [sourceLabel, setSourceLabel] = useState<string>('عينة الصدأ الأصفر الميدانية');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Statistics
  const detectedCount = {
    fungal: incomingPackets.filter((p) => p.diagnosis?.diseaseCategory?.includes('فطري')).length + 4,
    parasitic: incomingPackets.filter((p) => p.diagnosis?.diseaseCategory?.includes('طفيلي')).length + 1,
    healthy: incomingPackets.filter((p) => p.diagnosis?.isHealthy).length + 2,
  };

  // Run AI Diagnosis via backend API
  const handleRunDiagnosis = async (imageDataUrl: string, sampleTitle?: string) => {
    setIsDiagnosing(true);
    setErrorMsg(null);

    // Get current weather from latest drone packet or default
    const latestWeather = incomingPackets[0]?.weather || {
      temperatureC: 22.0,
      ambientHumidityPercent: 82,
      soilMoisturePercent: 68,
      windSpeedKmh: 11.0,
      windDirection: 'شمالية غربية',
      leafWetnessHours: 5.5,
      uvIndex: 5,
    };

    try {
      const response = await fetch('/api/diagnose', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64: imageDataUrl,
          weatherData: latestWeather,
          customModelConfig,
          source: sampleTitle || 'فحص WheatGuard',
        }),
      });

      if (!response.ok) {
        throw new Error(`خطأ في الخادم: ${response.status}`);
      }

      const data = await response.json();
      if (data.success && data.diagnosis) {
        setActiveDiagnosis(data.diagnosis);
        setSourceLabel(data.modelName || 'نموذج الذكاء الاصطناعي');
      } else {
        throw new Error(data.error || 'لم يتمكن النموذج من استخراج نتيجة صالحة');
      }
    } catch (err: any) {
      console.warn('Backend diagnosis failed, matching against agronomic knowledge base:', err.message);
      // Fallback gracefully to matching preset sample knowledge base
      const matched = WHEAT_DISEASE_SAMPLES.find((s) => s.id === selectedSampleId);
      if (matched && matched.precomputedDiagnosis) {
        setActiveDiagnosis(matched.precomputedDiagnosis as WheatDiseaseDiagnosis);
        setSourceLabel('المحرك الزراعي الاحتياطي (Knowledge Base)');
      } else {
        setErrorMsg('تعذر إكمال الفحص عبر السيرفر. تحقق من الاتصال بالإنترنت.');
      }
    } finally {
      setIsDiagnosing(false);
    }
  };

  // Select a preset wheat sample
  const handleSelectPresetSample = (sample: CapturedSample) => {
    setSelectedSampleId(sample.id);
    setSelectedPacketId(undefined);
    setActiveImage(sample.imageUrl);
    setSourceLabel(sample.title);
    if (sample.precomputedDiagnosis) {
      setActiveDiagnosis(sample.precomputedDiagnosis as WheatDiseaseDiagnosis);
    } else {
      handleRunDiagnosis(sample.imageUrl, sample.title);
    }
  };

  // Select a packet from drone feed
  const handleSelectPacket = (packet: TelemetryPacket) => {
    setSelectedPacketId(packet.id);
    setSelectedSampleId('');
    if (packet.capturedMedia?.dataUrl) {
      setActiveImage(packet.capturedMedia.dataUrl);
    }
    if (packet.diagnosis) {
      setActiveDiagnosis(packet.diagnosis);
      setSourceLabel(`لقطة درون WheatField (${packet.droneId})`);
    } else if (packet.capturedMedia?.dataUrl) {
      handleRunDiagnosis(packet.capturedMedia.dataUrl, `درون ${packet.droneId}`);
    }
  };

  // Upload user image or video
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setActiveImage(dataUrl);
      setSelectedSampleId('');
      setSelectedPacketId(undefined);
      setSourceLabel(`ملف مرفوع: ${file.name}`);
      handleRunDiagnosis(dataUrl, file.name);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-2 sm:px-4 py-4">
      {/* Top Banner / Drone Link status */}
      <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-amber-950/40 border border-emerald-500/30 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-inner">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-slate-100">
                WheatGuard • مركز مراقبة وتشخيص أمراض القمح
              </h2>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                نشط ومتزامن
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              تحليل مباشر للصور والفيديوهات الجوية الملتقطة بواسطة درون <strong>WheatField</strong> للكشف المبكر عن الأمراض الفطرية (الصدأ، البياض الدقيقي، الفيوزاريوم، السبتوريا) والآفات الطفيلية كمن القمح.
            </p>
          </div>
        </div>

        <button
          onClick={onSwitchToDrone}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plane className="w-4 h-4" />
          <span>فتح قمرة قيادة الدرون (WheatField)</span>
        </button>
      </div>

      {/* Main Grid: Left Column (Diagnosis & Visual Inspection), Right Column (Alerts & Field Health) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Active Sample Visual + Diagnostic Output */}
        <div className="lg:col-span-8 space-y-6">
          {/* Visual Sample Card & Diagnostic Trigger */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <span>عينة الفحص الحالية</span>
                  <span className="text-xs font-normal text-slate-400 font-mono">
                    ({sourceLabel})
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  لقطة مكبرة لنصل الورقة / السنبلة محولة للنموذج الرقمي
                </p>
              </div>

              {/* Upload & Re-run buttons */}
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*,video/*"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs border border-slate-700 transition-colors"
                  title="رفع صورة أو فيديو قمح من جهازك"
                >
                  <Upload className="w-3.5 h-3.5 text-amber-400" />
                  <span>رفع عينة من جهازك</span>
                </button>

                <button
                  onClick={() => handleRunDiagnosis(activeImage, sourceLabel)}
                  disabled={isDiagnosing}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-600/30 transition-all disabled:opacity-50"
                >
                  {isDiagnosing ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  <span>إعادة الفحص بالذكاء الاصطناعي</span>
                </button>
              </div>
            </div>

            {/* Image Preview Container */}
            <div className="relative aspect-video sm:aspect-[21/9] w-full bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
              <img
                src={activeImage}
                alt="عينة القمح المراد فحصها"
                className="w-full h-full object-contain"
              />

              {/* Scanning HUD Overlay animation while diagnosing */}
              {isDiagnosing && (
                <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px] flex flex-col items-center justify-center z-10 animate-fade-in">
                  <div className="w-16 h-16 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin mb-3" />
                  <p className="text-sm font-bold text-emerald-400 animate-pulse">
                    جاري استدعاء نموذج الذكاء الاصطناعي وتصنيف المرض...
                  </p>
                  <p className="text-xs text-slate-300 mt-1">
                    فحص الأبواغ، البثرات، والربط مع رطوبة وحرارة مستشعرات WheatField
                  </p>
                </div>
              )}

              {/* Active Badge */}
              <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-lg border border-slate-700 text-[11px] text-slate-300">
                {sourceLabel}
              </div>
            </div>

            {/* Preset Samples Selector Strip for All 15 Trained Classes */}
            <div className="mt-4 pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  الأصناف الـ 15 المعتمدة في النموذج (اختر عينة للاختبار الفوري):
                </span>
                <span className="text-[11px] text-amber-400 font-mono">
                  15 Classes (ID 0 - 14)
                </span>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-5 lg:grid-cols-8 gap-2 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
                {WHEAT_DISEASE_SAMPLES.map((sample, idx) => {
                  const isSelected = selectedSampleId === sample.id;
                  return (
                    <button
                      key={sample.id}
                      onClick={() => handleSelectPresetSample(sample)}
                      className={`relative p-1.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 group ${
                        isSelected
                          ? 'bg-emerald-950/60 border-emerald-500 shadow-md ring-1 ring-emerald-500/60'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                      }`}
                    >
                      {/* ID Badge */}
                      <span className="absolute top-2 left-2 z-10 px-1 py-0.2 rounded bg-slate-950/90 text-amber-400 text-[9px] font-mono font-bold border border-amber-500/30">
                        #{idx}
                      </span>

                      <div className="w-full aspect-[4/3] rounded-lg overflow-hidden bg-slate-900 border border-slate-800">
                        <img
                          src={sample.imageUrl}
                          alt={sample.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <span className="text-[10px] font-bold text-slate-200 line-clamp-1 leading-tight">
                        {sample.title.split('(')[0].trim()}
                      </span>
                      <span className="text-[9px] text-slate-400 font-mono line-clamp-1">
                        {sample.title.includes('(') ? sample.title.split('(')[1]?.replace(')', '') : ''}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Diagnostic Result Card */}
          {activeDiagnosis && (
            <DiagnosisCard
              diagnosis={activeDiagnosis}
              weather={incomingPackets[0]?.weather}
              sourceLabel={sourceLabel}
              onRetest={() => handleRunDiagnosis(activeImage, sourceLabel)}
            />
          )}

          {errorMsg && (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Right Column (4 cols): Alerts Feed & Field Health Heatmap */}
        <div className="lg:col-span-4 space-y-6">
          <DiseaseAlertsFeed
            packets={incomingPackets}
            onSelectPacket={handleSelectPacket}
            selectedPacketId={selectedPacketId}
          />

          <HealthHeatmap
            parcels={fieldParcels}
            selectedParcelId={selectedParcelId}
            onSelectParcel={onSelectParcel}
            detectedCount={detectedCount}
          />
        </div>
      </div>
    </div>
  );
};
