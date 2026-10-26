import { TelemetryPacket, CapturedSample } from '../../types';
import { AlertCircle, CheckCircle2, Clock, MapPin, Plane, Radio, ArrowUpRight, Video } from 'lucide-react';
import { formatLatinTime, formatLatinDate, formatLatinDateTime } from '../../utils/dateFormatter';

interface DiseaseAlertsFeedProps {
  packets: TelemetryPacket[];
  onSelectPacket: (packet: TelemetryPacket) => void;
  selectedPacketId?: string;
}

export const DiseaseAlertsFeed: React.FC<DiseaseAlertsFeedProps> = ({
  packets,
  onSelectPacket,
  selectedPacketId,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col h-full shadow-lg">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <h3 className="text-sm font-bold text-slate-100">سجل إرساليات الدرون والتنبيهات المباشرة</h3>
        </div>
        <span className="text-[11px] text-slate-400 font-mono">
          {packets.length} عينة واردة
        </span>
      </div>

      {packets.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-500">
          <Radio className="w-8 h-8 text-slate-600 mb-2 animate-pulse" />
          <p className="text-xs">في انتظار استقبال أول عينة أو فحص من درون WheatField...</p>
          <p className="text-[10px] text-slate-600 mt-1">
            يمكنك التقاط صورة من محاكي الدرون أو اختيار عينة اختبار للبدء
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
          {packets.map((pkt) => {
            const isSelected = selectedPacketId === pkt.id;
            const hasDiagnosis = !!pkt.diagnosis;
            const isCritical =
              pkt.diagnosis?.severityLevel?.includes('شديد') ||
              pkt.diagnosis?.severityLevel?.includes('خطر');
            const isHealthy = pkt.diagnosis?.isHealthy;

            return (
              <div
                key={pkt.id}
                onClick={() => onSelectPacket(pkt)}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-slate-800/90 border-emerald-500/60 shadow-md ring-1 ring-emerald-500/30'
                    : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/40 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {hasDiagnosis ? (
                      isHealthy ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <AlertCircle
                          className={`w-4 h-4 shrink-0 ${isCritical ? 'text-rose-400 animate-pulse' : 'text-amber-400'}`}
                        />
                      )
                    ) : pkt.capturedMedia?.type === 'video' ? (
                      <Video className="w-4 h-4 text-rose-400 shrink-0" />
                    ) : (
                      <Plane className="w-4 h-4 text-blue-400 shrink-0" />
                    )}
                    <span className="text-xs font-bold text-slate-200 truncate">
                      {pkt.diagnosis ? pkt.diagnosis.diseaseNameAr : pkt.capturedMedia?.label || 'لقطة كاميرا الدرون'}
                    </span>
                    {pkt.capturedMedia?.type === 'video' && (
                      <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 font-bold text-[9px] border border-rose-500/30 shrink-0">
                        فيديو
                      </span>
                    )}
                  </div>

                  {/* Strictly Latin date & time display (0-9) */}
                  <span
                    className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 bg-slate-900/90 px-1.5 py-0.5 rounded border border-slate-800 shrink-0"
                    title={`تاريخ ووقت الإرسال (Latin): ${pkt.formattedTimestampLatin || formatLatinDateTime(pkt.timestamp)}`}
                  >
                    <Clock className="w-3 h-3 text-emerald-400" />
                    <span>{formatLatinTime(pkt.timestamp)}</span>
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-500" />
                      <span className="font-mono text-[10px]">
                        {pkt.coordinates.lat.toFixed(4)}, {pkt.coordinates.lng.toFixed(4)}
                      </span>
                    </div>
                    <span className="text-slate-600">&bull;</span>
                    <span className="font-mono text-[10px] text-slate-400">
                      {formatLatinDate(pkt.timestamp)}
                    </span>
                  </div>

                  {pkt.diagnosis && (
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                        isHealthy
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : isCritical
                          ? 'bg-rose-500/20 text-rose-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {pkt.diagnosis.severityLevel || 'تم التشخيص'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
