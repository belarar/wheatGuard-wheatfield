import React, { useState, useEffect } from 'react';
import {
  CustomModelConfig,
  FieldParcel,
  TelemetryPacket,
} from './types';
import { FIELD_PARCELS } from './data/fieldParcels';
import { WHEAT_DISEASE_SAMPLES } from './data/wheatSamples';
import { Header, AppMode, DeviceView } from './components/Header';
import { WheatGuardApp } from './components/wheatguard/WheatGuardApp';
import { WheatFieldApp } from './components/wheatfield/WheatFieldApp';
import { CustomModelModal } from './components/CustomModelModal';
import { TFLiteModelManagerModal } from './components/TFLiteModelManagerModal';
import { GuideModal } from './components/GuideModal';
import { TransmissionMonitorModal } from './components/TransmissionMonitorModal';
import { MobileFrame } from './components/MobileFrame';
import { CheckCircle2, ShieldCheck, Plane, Radio } from 'lucide-react';
import { formatLatinDateTime } from './utils/dateFormatter';

export default function App() {
  const [appMode, setAppMode] = useState<AppMode>('WHEAT_GUARD');
  const [deviceView, setDeviceView] = useState<DeviceView>('DESKTOP');

  // Custom AI Model settings
  const [customModelConfig, setCustomModelConfig] = useState<CustomModelConfig>({
    enabled: false,
    modelName: 'Gemini 3.8 Flash Plant Pathologist',
    endpointUrl: '',
    framework: 'REST API',
  });

  const [activeTfliteFile, setActiveTfliteFile] = useState<{
    name: string;
    size: number;
    lastModified: number;
  } | null>(null);

  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  const [isTfliteModalOpen, setIsTfliteModalOpen] = useState(false);
  const [isTransmissionModalOpen, setIsTransmissionModalOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // Field Parcels
  const [parcels, setParcels] = useState<FieldParcel[]>(FIELD_PARCELS);
  const [selectedParcelId, setSelectedParcelId] = useState<string>(FIELD_PARCELS[0].id);
  const currentParcel = parcels.find((p) => p.id === selectedParcelId) || parcels[0];

  const handleSaveNewParcel = (newParcel: FieldParcel) => {
    setParcels((prev) => [newParcel, ...prev]);
    setSelectedParcelId(newParcel.id);
  };

  // Inter-app Telemetry Packets sent from WheatField to WheatGuard
  const [incomingPackets, setIncomingPackets] = useState<TelemetryPacket[]>([
    {
      id: 'pkt-init-01',
      timestamp: Date.now() - 1000 * 60 * 12,
      formattedTimestampLatin: formatLatinDateTime(Date.now() - 1000 * 60 * 12),
      droneId: 'AGRO-DRONE-X4',
      coordinates: { lat: 31.8984, lng: -6.5872 },
      altitudeMeters: 22.0,
      speedKmh: 14.5,
      weather: {
        temperatureC: 16.5,
        ambientHumidityPercent: 88,
        soilMoisturePercent: 72,
        windSpeedKmh: 9.5,
        windDirection: 'شمالية غربية',
        leafWetnessHours: 7.2,
        uvIndex: 4,
        atmosphericPressureHpa: 1012,
        sprayCondition: 'OPTIMAL',
        sprayAdvice: 'رياح ملائمة للرش مع مراقبة رطوبة الأوراق',
      },
      capturedMedia: {
        type: 'image',
        dataUrl: WHEAT_DISEASE_SAMPLES[0].imageUrl,
        label: `لقطة فحص جوي [${formatLatinDateTime(Date.now() - 1000 * 60 * 12)}]: الصدأ الأصفر`,
      },
      diagnosis: WHEAT_DISEASE_SAMPLES[0].precomputedDiagnosis as any,
    },
    {
      id: 'pkt-init-02',
      timestamp: Date.now() - 1000 * 60 * 45,
      formattedTimestampLatin: formatLatinDateTime(Date.now() - 1000 * 60 * 45),
      droneId: 'AGRO-DRONE-X4',
      coordinates: { lat: 31.897, lng: -6.589 },
      altitudeMeters: 28.0,
      speedKmh: 18.0,
      weather: {
        temperatureC: 21.0,
        ambientHumidityPercent: 68,
        soilMoisturePercent: 65,
        windSpeedKmh: 11.0,
        windDirection: 'شمالية',
        leafWetnessHours: 3.0,
        uvIndex: 5,
        atmosphericPressureHpa: 1015,
        sprayCondition: 'OPTIMAL',
        sprayAdvice: 'ظروف مثالية ومستقرة للرش والمراقبة',
      },
      capturedMedia: {
        type: 'image',
        dataUrl: WHEAT_DISEASE_SAMPLES[6].imageUrl,
        label: `لقطة مسح [${formatLatinDateTime(Date.now() - 1000 * 60 * 45)}]: قطاع قمح سليم`,
      },
      diagnosis: WHEAT_DISEASE_SAMPLES[6].precomputedDiagnosis as any,
    },
  ]);

  // Transmission notification toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleTransmitPacket = (packet: TelemetryPacket) => {
    setIncomingPackets((prev) => [packet, ...prev]);

    const timeLabel = packet.formattedTimestampLatin || formatLatinDateTime(packet.timestamp);
    const mediaTypeLabel = packet.capturedMedia?.type === 'video' ? 'مقطع فيديو جوي' : 'لقطة درون';
    setToastMessage(`تم إرسال ${mediaTypeLabel} (${packet.droneId}) [${timeLabel}] وبيانات المستشعرات بنجاح إلى WheatGuard!`);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Top Application Header */}
      <Header
        appMode={appMode}
        setAppMode={setAppMode}
        deviceView={deviceView}
        setDeviceView={setDeviceView}
        onOpenModelModal={() => setIsModelModalOpen(true)}
        onOpenTfliteModal={() => setIsTfliteModalOpen(true)}
        onOpenTransmissionModal={() => setIsTransmissionModalOpen(true)}
        customModelConfig={customModelConfig}
        activeTfliteFile={activeTfliteFile}
        activePacketCount={incomingPackets.length}
        onOpenGuide={() => setIsGuideOpen(true)}
      />

      {/* Real-time Broadcast Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-5 py-2.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-emerald-400 text-xs sm:text-sm font-semibold animate-bounce">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{toastMessage}</span>
          {appMode !== 'WHEAT_GUARD' && (
            <button
              onClick={() => setAppMode('WHEAT_GUARD')}
              className="mr-2 underline text-emerald-100 hover:text-white"
            >
              عرض في WheatGuard
            </button>
          )}
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 w-full pb-10">
        {deviceView === 'MOBILE_PHONE' ? (
          /* Mobile Phone Simulation View */
          <MobileFrame
            appName={
              appMode === 'WHEAT_GUARD'
                ? 'WheatGuard • كاشف الأمراض'
                : appMode === 'WHEAT_FIELD'
                ? 'WheatField • قمرة الدرون'
                : 'WheatGuard & Field'
            }
            badge="مُحاكاة هاتف ذكي"
          >
            {appMode === 'WHEAT_GUARD' && (
              <WheatGuardApp
                incomingPackets={incomingPackets}
                customModelConfig={customModelConfig}
                fieldParcels={parcels}
                selectedParcelId={selectedParcelId}
                onSelectParcel={setSelectedParcelId}
                onSwitchToDrone={() => setAppMode('WHEAT_FIELD')}
              />
            )}
            {appMode === 'WHEAT_FIELD' && (
              <WheatFieldApp
                currentParcel={currentParcel}
                onTransmitPacket={handleTransmitPacket}
                onSwitchToWheatGuard={() => setAppMode('WHEAT_GUARD')}
                parcels={parcels}
                onSelectParcel={setSelectedParcelId}
                onSaveNewParcel={handleSaveNewParcel}
              />
            )}
            {appMode === 'DUAL_VIEW' && (
              <div className="space-y-6">
                <WheatGuardApp
                  incomingPackets={incomingPackets}
                  customModelConfig={customModelConfig}
                  fieldParcels={parcels}
                  selectedParcelId={selectedParcelId}
                  onSelectParcel={setSelectedParcelId}
                  onSwitchToDrone={() => setAppMode('WHEAT_FIELD')}
                />
                <hr className="border-slate-800" />
                <WheatFieldApp
                  currentParcel={currentParcel}
                  onTransmitPacket={handleTransmitPacket}
                  onSwitchToWheatGuard={() => setAppMode('WHEAT_GUARD')}
                  parcels={parcels}
                  onSelectParcel={setSelectedParcelId}
                  onSaveNewParcel={handleSaveNewParcel}
                />
              </div>
            )}
          </MobileFrame>
        ) : (
          /* Web Desktop / Full View */
          <>
            {appMode === 'WHEAT_GUARD' && (
              <WheatGuardApp
                incomingPackets={incomingPackets}
                customModelConfig={customModelConfig}
                fieldParcels={parcels}
                selectedParcelId={selectedParcelId}
                onSelectParcel={setSelectedParcelId}
                onSwitchToDrone={() => setAppMode('WHEAT_FIELD')}
              />
            )}

            {appMode === 'WHEAT_FIELD' && (
              <WheatFieldApp
                currentParcel={currentParcel}
                onTransmitPacket={handleTransmitPacket}
                onSwitchToWheatGuard={() => setAppMode('WHEAT_GUARD')}
                parcels={parcels}
                onSelectParcel={setSelectedParcelId}
                onSaveNewParcel={handleSaveNewParcel}
              />
            )}

            {appMode === 'DUAL_VIEW' && (
              <div className="max-w-[1700px] mx-auto px-2 sm:px-4 py-4 space-y-4">
                <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl flex items-center justify-between text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                    <strong>العرض المزدوج المتزامن:</strong>
                    <span>
                      شاهد طيران الدرون ومستشعراته في <strong>WheatField</strong> بالجانب الأيسر، واستقبل لقطات التشخيص بالذكاء الاصطناعي في <strong>WheatGuard</strong> بالجانب الأيمن!
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                    Live Broadcast Synced
                  </span>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {/* Left Column: WheatField (Drone & Sensors) */}
                  <div className="border border-amber-500/30 rounded-3xl p-3 bg-slate-950/60 shadow-2xl">
                    <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800 mb-3 text-xs font-bold text-amber-400">
                      <span className="flex items-center gap-2">
                        <Plane className="w-4 h-4" />
                        تطبيق WheatField (محاكي الدرون والمستشعرات)
                      </span>
                      <span className="text-[10px] text-slate-500">الجهاز الأول</span>
                    </div>
                    <WheatFieldApp
                      currentParcel={currentParcel}
                      onTransmitPacket={handleTransmitPacket}
                      onSwitchToWheatGuard={() => setAppMode('WHEAT_GUARD')}
                      parcels={parcels}
                      onSelectParcel={setSelectedParcelId}
                      onSaveNewParcel={handleSaveNewParcel}
                    />
                  </div>

                  {/* Right Column: WheatGuard (AI Diagnosis & Field Monitoring) */}
                  <div className="border border-emerald-500/30 rounded-3xl p-3 bg-slate-950/60 shadow-2xl">
                    <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800 mb-3 text-xs font-bold text-emerald-400">
                      <span className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4" />
                        تطبيق WheatGuard (المراقبة وتشخيص الذكاء الاصطناعي)
                      </span>
                      <span className="text-[10px] text-slate-500">الجهاز الثاني</span>
                    </div>
                    <WheatGuardApp
                      incomingPackets={incomingPackets}
                      customModelConfig={customModelConfig}
                      fieldParcels={parcels}
                      selectedParcelId={selectedParcelId}
                      onSelectParcel={setSelectedParcelId}
                      onSwitchToDrone={() => setAppMode('WHEAT_FIELD')}
                    />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Custom AI Model Integration Modal */}
      <CustomModelModal
        isOpen={isModelModalOpen}
        onClose={() => setIsModelModalOpen(false)}
        config={customModelConfig}
        onSave={(newConfig) => setCustomModelConfig(newConfig)}
      />

      {/* TFLite Model Manager Modal */}
      <TFLiteModelManagerModal
        isOpen={isTfliteModalOpen}
        onClose={() => setIsTfliteModalOpen(false)}
        activeTfliteFile={activeTfliteFile}
        onLoadTfliteFile={(info) => {
          setActiveTfliteFile({
            name: info.name,
            size: info.size,
            lastModified: info.lastModified,
          });
          setCustomModelConfig((prev) => ({
            ...prev,
            enabled: true,
            modelName: info.name,
            framework: 'Custom',
          }));
          setToastMessage(`تم تحميل وتفعيل نموذج [${info.name}] بنجاح لكشف ورسم مربعات الإصابة!`);
          setTimeout(() => setToastMessage(null), 5000);
        }}
      />

      {/* Transmission Protocol & Packet Monitor Modal */}
      <TransmissionMonitorModal
        isOpen={isTransmissionModalOpen}
        onClose={() => setIsTransmissionModalOpen(false)}
        latestPacket={incomingPackets[0]}
      />

      {/* Guide Modal */}
      <GuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        onOpenModelModal={() => setIsModelModalOpen(true)}
      />
    </div>
  );
}
