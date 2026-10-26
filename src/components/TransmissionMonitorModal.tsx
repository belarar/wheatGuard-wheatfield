import React, { useState } from 'react';
import { TelemetryPacket } from '../types';
import {
  Radio,
  Wifi,
  Send,
  Thermometer,
  Droplets,
  Wind,
  Camera,
  MapPin,
  CheckCircle2,
  X,
  Code2,
  Cpu,
  Layers,
  ArrowRight,
  Plane,
  ShieldCheck,
  Compass,
  Crosshair,
  Clock,
} from 'lucide-react';
import { formatLatinDateTime } from '../utils/dateFormatter';

interface TransmissionMonitorModalProps {
  isOpen: boolean;
  onClose: () => void;
  latestPacket?: TelemetryPacket;
}

export const TransmissionMonitorModal: React.FC<TransmissionMonitorModalProps> = ({
  isOpen,
  onClose,
  latestPacket,
}) => {
  const [activeTab, setActiveTab] = useState<'architecture' | 'packet_inspector' | 'field_demarcation'>('architecture');

  if (!isOpen) return null;

  // Sample packet structure with strictly Latin date and time
  const sampleNow = latestPacket?.timestamp || Date.now();
  const displayPacket = latestPacket || {
    id: 'pkt-live-98214',
    timestamp: sampleNow,
    formattedTimestampLatin: formatLatinDateTime(sampleNow),
    droneId: 'AGRO-DRONE-X4',
    coordinates: { lat: 31.8972, lng: -6.5891 },
    altitudeMeters: 24.5,
    speedKmh: 16.2,
    weather: {
      temperatureC: 22.0,
      ambientHumidityPercent: 82,
      soilMoisturePercent: 68,
      windSpeedKmh: 11.0,
      windDirection: 'شمالية غربية',
      leafWetnessHours: 5.5,
      uvIndex: 5,
      atmosphericPressureHpa: 1014,
      sprayCondition: 'OPTIMAL',
      sprayAdvice: 'رياح نموذجية ومواتية للرش الدقيق بالدرون',
    },
    capturedMedia: {
      type: 'video',
      dataUrl: 'data:video/mp4;base64,...[HD Wheat Aerial Video Stream]',
      label: `مقطع مسح جوي [${formatLatinDateTime(sampleNow)}]`,
    },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Radio className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                <span>كيف يتصل ويرسل WheatField البيانات إلى WheatGuard؟</span>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                  Telemetry Link Protocol
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                شرح بروتوكول نقل الصور، الفيديوهات، أحوال الرطوبة والحرارة، وكيفية تحديد المزارع لحقله
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-800 bg-slate-950/40 overflow-x-auto">
          <button
            onClick={() => setActiveTab('architecture')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'architecture'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>1. آلية إرسال الصور والفيديوهات والمستشعرات</span>
          </button>

          <button
            onClick={() => setActiveTab('field_demarcation')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'field_demarcation'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>2. كيف يحدد المزارع حقله بدقة؟</span>
          </button>

          <button
            onClick={() => setActiveTab('packet_inspector')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'packet_inspector'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>3. فحص حزمة البيانات الحية (Live Packet JSON)</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar text-xs sm:text-sm">
          {/* TAB 1: ARCHITECTURE (How images, video & weather are sent) */}
          {activeTab === 'architecture' && (
            <div className="space-y-6 animate-fade-in text-slate-300 leading-relaxed">
              {/* Visual Flow diagram */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-center">
                <div className="flex flex-col items-center p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 w-full md:w-1/3">
                  <Plane className="w-8 h-8 text-amber-400 mb-2" />
                  <strong className="text-amber-300 text-sm">WheatField (المحاكي / الدرون)</strong>
                  <span className="text-[11px] text-slate-400 mt-1">
                    كاميرا 4K + مستشعرات رطوبة وحرارة ورياح
                  </span>
                </div>

                <div className="flex flex-col items-center text-emerald-400 animate-pulse">
                  <div className="flex items-center gap-1 text-xs font-mono font-bold">
                    <span>بث 4G / LTE / REST API</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] text-slate-500">حزمة TelemetryPacket</span>
                </div>

                <div className="flex flex-col items-center p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 w-full md:w-1/3">
                  <ShieldCheck className="w-8 h-8 text-emerald-400 mb-2" />
                  <strong className="text-emerald-300 text-sm">WheatGuard (مركز الرقابة)</strong>
                  <span className="text-[11px] text-slate-400 mt-1">
                    تشخيص فوري بنموذج الذكاء الاصطناعي (TFLite/Gemini)
                  </span>
                </div>
              </div>

              {/* Detailed Explanation: Images & Videos */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                <h4 className="font-bold text-slate-100 flex items-center gap-2 text-sm sm:text-base text-amber-300">
                  <Camera className="w-4 h-4 text-amber-400" />
                  أ) كيف يرسل WheatField الصور والفيديوهات إلى WheatGuard؟
                </h4>
                <ul className="list-disc list-inside space-y-2 text-slate-300 text-xs sm:text-sm mr-2 leading-relaxed">
                  <li>
                    <strong>التقاط الصورة الفوتوغرافية:</strong> عند نقر زر <em>"التقاط صورة"</em> أو مرور الدرون فوق بؤرة مصابة أثناء المسح الآلي، تقوم كاميرا الجيمبال بحفظ لقطة عالية الدقة وتحويلها لصيغة <code className="text-amber-300 font-mono">Base64 DataURL</code>.
                  </li>
                  <li>
                    <strong>تسجيل الفيديو:</strong> عند الضغط على <em>"تسجيل فيديو"</em>، يتم تسجيل مقطع الفحص الجوي مع توثيق إحداثيات خط الطيران، ويتم ضغط المقطع وإرسال الإطارات المفتاحية (Keyframes) المشبوهة.
                  </li>
                  <li>
                    <strong>النقل الفوري:</strong> عند الضغط على <strong>"إرسال إلى WheatGuard"</strong>، يتم إرسال الصورة/الفيديو إما عبر الرابط السحابي <code className="text-emerald-300 font-mono">POST /api/telemetry/push</code>، أو عبر قناة المزامنة اللحظية داخل المتصفح، لتظهر الصورة فوراً في واجهة WheatGuard ويبدأ الذكاء الاصطناعي بتحليلها تلقائياً.
                  </li>
                  <li className="text-emerald-300">
                    <strong>توثيق التاريخ والوقت بالأرقام اللاتينية (Latin Numerals 0-9):</strong> عند بث أو إرسال مقطع فيديو أو صورة إلى WheatGuard، يتم توليد التاريخ والوقت حصراً بالأرقام اللاتينية (مثل <code className="font-mono text-white bg-slate-900 px-1 py-0.5 rounded border border-slate-700">2026-10-26 14:25:08</code>) في حزمة البيانات ووسوم شاشة الدرون HUD وشريط التنبيهات لتفادي الأرقام المشرقية وضمان الوضوح التام.
                  </li>
                </ul>
              </div>

              {/* Detailed Explanation: Weather & Sensors */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                <h4 className="font-bold text-slate-100 flex items-center gap-2 text-sm sm:text-base text-sky-300">
                  <Droplets className="w-4 h-4 text-sky-400" />
                  ب) كيف يرسل أحوال الرطوبة والحرارة وسرعة الرياح؟
                </h4>
                <p className="text-xs sm:text-sm text-slate-300">
                  يحتوي محاكي WheatField على محطة مستشعرات متكاملة ترسل قراءات قياسية كل ثانية مدمجة مع كل لقطة:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <strong className="text-sky-300 text-xs block mb-1">1. الرطوبة والحرارة:</strong>
                    <p className="text-[11px] text-slate-400">
                      تقاس رطوبة الجو (النسبية %) وحرارة الهواء (°C) ورطوبة التربة ومدة بلل الأوراق (Leaf Wetness). يستقبلها WheatGuard لحساب ما إذا كانت الظروف مهيأة لإنبات جراثيم الصدأ الأصفر والفيوزاريوم.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <strong className="text-amber-300 text-xs block mb-1">2. سرعة واتجاه الرياح:</strong>
                    <p className="text-[11px] text-slate-400">
                      يرسل المستشعر سرعة الرياح (كم/ساعة)، ويستخدمها WheatGuard لحساب <strong>"مؤشر أمان الرش بالدرون"</strong> وتنبيه المزارع إذا كانت الرياح قوية تفوق 15 كم/س لتجنب تطاير المبيد.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FIELD DEMARCATION (How the farmer defines his field) */}
          {activeTab === 'field_demarcation' && (
            <div className="space-y-5 animate-fade-in text-slate-300 leading-relaxed">
              <h4 className="font-bold text-emerald-300 text-base">
                كيف يحدد المزارع حقله على الخريطة؟ (3 طرق ميسرة)
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Method 1: GPS */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-sky-400 font-bold text-sm mb-2">
                      <Crosshair className="w-5 h-5" />
                      <span>1. بموقعه الفعلي (GPS)</span>
                    </div>
                    <p className="text-xs text-slate-300">
                      بمجرد وقوف المزارع في حقله، يضغط على زر <strong>"موقعي الحالي (GPS)"</strong> في الخريطة، ليقوم التطبيق بالاتصال بالقمر الصناعي ونقل الخريطة فورياً إلى قطعة الأرض التي يقف فيها بدقة أمتار قليلة.
                    </p>
                  </div>
                  <span className="text-[10px] text-sky-400 font-mono mt-3">
                    Geolocate Me • WGS84
                  </span>
                </div>

                {/* Method 2: Draw Polygon */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm mb-2">
                      <MapPin className="w-5 h-5" />
                      <span>2. رسم حدود الحقل (Polygon)</span>
                    </div>
                    <p className="text-xs text-slate-300">
                      يضغط المزارع على زر <strong>"تحديد حدود حقلي (رسم)"</strong> في أعلى الخريطة، ثم ينقر على أركان وزوايا حقله على صور القمر الصناعي. يقوم التطبيق تلقائياً برسم المضلع وحساب المساحة بالهكتار وحفظ الحقل باسم مخصص.
                    </p>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-mono mt-3">
                    Auto Area Calculator (هكتار)
                  </span>
                </div>

                {/* Method 3: Preset Agricultural Basins */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-amber-400 font-bold text-sm mb-2">
                      <Layers className="w-5 h-5" />
                      <span>3. اختيار من الأحواض الزراعية</span>
                    </div>
                    <p className="text-xs text-slate-300">
                      يستطيع المزارع التبديل بنقرة واحدة بين أحواض زراعة القمح الحقيقية المعدة مسبقاً (سهل تادلة بالمغرب، حوض دلتا النيل بمصر، والمحاور الحديثة بالقصيم بالسعودية).
                    </p>
                  </div>
                  <span className="text-[10px] text-amber-400 font-mono mt-3">
                    GIS Satellite Parcels
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: LIVE JSON PACKET INSPECTOR */}
          {activeTab === 'packet_inspector' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-100 text-sm">
                    هيكل حزمة البيانات اللاسلكية المنقولة لحظياً (Packet Structure):
                  </h4>
                  <p className="text-xs text-slate-400">
                    هذه الحزمة ترسل وتستقبل تلقائياً بين WheatField و WheatGuard عبر شبكة الـ IoT
                  </p>
                </div>
                <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                  JSON Telemetry Payload
                </span>
              </div>

              <div
                className="relative rounded-2xl bg-slate-950 border border-slate-800 p-4 font-mono text-xs text-emerald-300 overflow-x-auto max-h-80"
                dir="ltr"
              >
                <pre>{JSON.stringify(displayPacket, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/90">
          <span className="text-xs text-slate-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>نظام النقل اللاسلكي متزامن ونشط بنسبة 100% بين التطبيقين</span>
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-all shadow-md shadow-emerald-500/20"
          >
            إغلاق النافذة
          </button>
        </div>
      </div>
    </div>
  );
};
