import React, { useState } from 'react';
import { WheatDiseaseDiagnosis, WeatherTelemetry } from '../../types';
import {
  AlertOctagon,
  CheckCircle2,
  AlertTriangle,
  Pill,
  Sprout,
  Wind,
  Droplets,
  Volume2,
  VolumeX,
  FileText,
  Share2,
  Thermometer,
  ShieldAlert,
  Info,
  Target,
} from 'lucide-react';

interface DiagnosisCardProps {
  diagnosis: WheatDiseaseDiagnosis;
  weather?: WeatherTelemetry;
  imageThumbnail?: string;
  sourceLabel?: string;
  onRetest?: () => void;
}

export const DiagnosisCard: React.FC<DiagnosisCardProps> = ({
  diagnosis,
  weather,
  imageThumbnail,
  sourceLabel = 'تم الفحص بنموذج الذكاء الاصطناعي',
  onRetest,
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [copied, setCopied] = useState(false);

  // Status colors & badge
  const isHealthy = diagnosis.isHealthy;
  const isCritical =
    diagnosis.severityLevel?.includes('شديد') ||
    diagnosis.severityLevel?.includes('Critical') ||
    diagnosis.severityLevel?.includes('خطر');

  // Text-to-Speech in Arabic
  const handleReadAloud = () => {
    if (!('speechSynthesis' in window)) return;

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    const textToRead = isHealthy
      ? `تقرير تشخيص القمح: المحصول سليم ومعافى بنسبة تأكد ${diagnosis.confidenceScore} بالمئة. ${diagnosis.fieldActionSummary}`
      : `تقرير تشخيص القمح: تم رصد ${diagnosis.diseaseNameAr}، بمستوى خطورة ${diagnosis.severityLevel}. توصية الرش: ${diagnosis.treatmentRecommendations.chemicalAction}. ${diagnosis.fieldActionSummary}`;

    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = 'ar-SA';
    utterance.rate = 0.95;

    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    window.speechSynthesis.speak(utterance);
    setIsPlayingAudio(true);
  };

  const handleShareReport = () => {
    const reportText = `[تقرير WheatGuard الميداني]
الحالة: ${diagnosis.diseaseNameAr} (${diagnosis.diseaseNameEn})
المسبب: ${diagnosis.pathogenScientificName}
الخطورة: ${diagnosis.severityLevel} (نسبة التأكد: ${diagnosis.confidenceScore}%)
المعاملة المقترحة: ${diagnosis.treatmentRecommendations.chemicalAction}
ملخص الإجراء: ${diagnosis.fieldActionSummary}`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(reportText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden transition-all animate-fade-in">
      {/* Top Banner */}
      <div
        className={`px-5 py-4 border-b flex flex-wrap items-center justify-between gap-3 ${
          isHealthy
            ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
            : isCritical
            ? 'bg-rose-950/40 border-rose-500/30 text-rose-300'
            : 'bg-amber-950/40 border-amber-500/30 text-amber-300'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-xl border ${
              isHealthy
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                : isCritical
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                : 'bg-amber-500/20 border-amber-500/40 text-amber-400'
            }`}
          >
            {isHealthy ? (
              <CheckCircle2 className="w-6 h-6" />
            ) : isCritical ? (
              <AlertOctagon className="w-6 h-6 animate-pulse" />
            ) : (
              <AlertTriangle className="w-6 h-6" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-900/60 border border-slate-700/60">
                {diagnosis.diseaseCategory || 'تصنيف نباتي'}
              </span>
              <span className="text-[11px] opacity-75">{sourceLabel}</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold mt-0.5 text-slate-100 flex items-center gap-2">
              {diagnosis.diseaseNameAr}
            </h2>
            <p className="text-xs text-slate-400 font-mono italic">
              {diagnosis.diseaseNameEn} • {diagnosis.pathogenScientificName}
            </p>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleReadAloud}
            className={`p-2 rounded-lg border text-xs flex items-center gap-1.5 transition-colors ${
              isPlayingAudio
                ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
            title="قراءة التقرير صوتياً بالعربية"
          >
            {isPlayingAudio ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            <span className="hidden sm:inline">استماع صوتي</span>
          </button>

          <button
            onClick={handleShareReport}
            className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 transition-colors text-xs flex items-center gap-1.5"
            title="نسخ التقرير الطبي ومشاركته"
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">{copied ? 'تم النسخ!' : 'مشاركة'}</span>
          </button>
        </div>
      </div>

      {/* Main body */}
      <div className="p-5 space-y-5">
        {/* Key Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-1">نسبة التأكد (AI Confidence)</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black text-emerald-400">{diagnosis.confidenceScore}%</span>
              <span className="text-[10px] text-slate-500">دقة تصنيف</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-1000"
                style={{ width: `${diagnosis.confidenceScore}%` }}
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-1">مستوى الخطورة</span>
            <div className="text-base font-bold text-slate-200">{diagnosis.severityLevel || 'عادي'}</div>
            <span
              className={`inline-block text-[10px] mt-1 px-1.5 py-0.5 rounded ${
                isCritical
                  ? 'bg-rose-500/20 text-rose-300'
                  : isHealthy
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-amber-500/20 text-amber-300'
              }`}
            >
              {diagnosis.sprayGuidance?.urgency || 'متابعة'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-1">الجزء المصاب من النبات</span>
            <div className="text-sm font-semibold text-slate-200 mt-0.5">
              {diagnosis.affectedPlantPart || 'كامل النبات'}
            </div>
            <span className="text-[10px] text-slate-500 block mt-1">حسب تحليل الرؤية</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-1">ملاءمة الرش الجوي</span>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-300">
              <Wind className="w-3.5 h-3.5" />
              <span>{weather ? `${weather.windSpeedKmh} كم/س` : '11 كم/س'}</span>
            </div>
            <span className="text-[10px] text-emerald-400 block mt-1">
              {weather && weather.windSpeedKmh > 15 ? 'تحذير انجراف الرياح' : 'رياح مواتية للتطبيق'}
            </span>
          </div>
        </div>

        {/* Bounding Boxes Targets List */}
        {diagnosis.boundingBoxes && diagnosis.boundingBoxes.length > 0 && (
          <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800">
            <div className="flex items-center justify-between mb-2.5">
              <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-400" />
                <span>مربعات الإحاطة وتحديد البؤر المرصودة ({diagnosis.boundingBoxes.length} بؤرة):</span>
              </h4>
              <span className="text-[11px] text-amber-300 font-mono">
                {diagnosis.boundingBoxes.length} Targets Locked
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {diagnosis.boundingBoxes.map((b, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-3 h-3 rounded-full shrink-0 ${
                        b.classId === 13 ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'
                      }`}
                    />
                    <div>
                      <div className="font-bold text-slate-100 flex items-center gap-1.5">
                        <span>{b.labelAr}</span>
                        <span className="text-[10px] text-slate-400 font-mono">({b.labelEn})</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex flex-wrap items-center gap-1.5">
                        <span className="text-amber-400 font-bold">صنف ID: {b.classId}</span>
                        <span>&bull;</span>
                        <span className="text-cyan-300 font-bold bg-cyan-950/50 px-1 rounded border border-cyan-500/30">
                          640p: [{Math.round((b.box_2d[1] / 1000) * 640)}, {Math.round((b.box_2d[0] / 1000) * 640)}, {Math.round((b.box_2d[3] / 1000) * 640)}, {Math.round((b.box_2d[2] / 1000) * 640)}]
                        </span>
                        <span className="text-slate-500 hidden sm:inline">
                          (معياري: [{b.box_2d.join(', ')}])
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="px-2 py-1 rounded bg-black/70 text-amber-300 font-mono font-bold text-xs border border-amber-400/20">
                      {b.confidence}%
                    </span>
                    <span className="text-[9px] text-cyan-400 font-mono">640×640</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Symptoms & Evidence Box */}
        {diagnosis.symptomsIdentified && diagnosis.symptomsIdentified.length > 0 && (
          <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/80">
            <h4 className="text-xs font-bold text-slate-300 flex items-center gap-2 mb-2.5">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              الأعراض والعلامات المرضية المرصودة بواسطة الرؤية الحاسوبية:
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {diagnosis.symptomsIdentified.map((symptom, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 text-xs text-slate-300 bg-slate-900/60 p-2 rounded-lg border border-slate-800"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                  <span>{symptom}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Microclimate Correlation Analysis */}
        {diagnosis.microclimateRiskAnalysis && (
          <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-500/20 text-xs leading-relaxed text-blue-200 flex gap-3">
            <Droplets className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-blue-300 block mb-1">
                تحليل ارتباط المناخ الدقيق (بيانات مستشعرات WheatField):
              </span>
              <p className="text-slate-300 text-xs leading-relaxed">
                {diagnosis.microclimateRiskAnalysis}
              </p>
            </div>
          </div>
        )}

        {/* Actionable Treatment Prescription (Medical/Agronomic) */}
        {!isHealthy && diagnosis.treatmentRecommendations && (
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Pill className="w-4 h-4 text-emerald-400" />
              خطة التدخل والعلاج الزراعي المتكامل (Integrated Pest Management - IPM):
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Chemical Fungicide */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-rose-400 text-xs font-bold mb-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    المكافحة الكيميائية المستهدفة
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {diagnosis.treatmentRecommendations.chemicalAction}
                  </p>
                </div>
                <span className="text-[10px] text-slate-500 mt-3 pt-2 border-t border-slate-900 block">
                  يراعى الالتزام بفترة الأمان قبل الحصاد (PHI)
                </span>
              </div>

              {/* Biological Control */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold mb-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    المكافحة الحيوية والطبيعية
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {diagnosis.treatmentRecommendations.biologicalAction}
                  </p>
                </div>
                <span className="text-[10px] text-slate-500 mt-3 pt-2 border-t border-slate-900 block">
                  آمنة بيئياً وصديقة للمفترسات النافعة
                </span>
              </div>

              {/* Cultural / Agricultural Practices */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-bold mb-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    الإجراءات الحقلية والوقائية
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {diagnosis.treatmentRecommendations.culturalPractices}
                  </p>
                </div>
                <span className="text-[10px] text-slate-500 mt-3 pt-2 border-t border-slate-900 block">
                  تنظيم الري وضبط مستويات النيتروجين
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Field Summary */}
        <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60 text-xs text-slate-300 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-slate-100">إرشادات مهندس الحقل: </strong>
            {diagnosis.fieldActionSummary}
          </div>
        </div>
      </div>
    </div>
  );
};
