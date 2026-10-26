import React from 'react';
import {
  ShieldCheck,
  Plane,
  Layers,
  Smartphone,
  Monitor,
  Cpu,
  Wifi,
  Radio,
  FileQuestion,
  Sparkles,
} from 'lucide-react';
import { CustomModelConfig } from '../types';

export type AppMode = 'WHEAT_GUARD' | 'WHEAT_FIELD' | 'DUAL_VIEW';
export type DeviceView = 'DESKTOP' | 'MOBILE_PHONE';

interface HeaderProps {
  appMode: AppMode;
  setAppMode: (mode: AppMode) => void;
  deviceView: DeviceView;
  setDeviceView: (view: DeviceView) => void;
  onOpenModelModal: () => void;
  onOpenTfliteModal: () => void;
  onOpenTransmissionModal: () => void;
  customModelConfig: CustomModelConfig;
  activeTfliteFile: { name: string; size: number } | null;
  activePacketCount: number;
  onOpenGuide: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  appMode,
  setAppMode,
  deviceView,
  setDeviceView,
  onOpenModelModal,
  onOpenTfliteModal,
  onOpenTransmissionModal,
  customModelConfig,
  activeTfliteFile,
  activePacketCount,
  onOpenGuide,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-2.5 transition-all">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Ecosystem Title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-gradient-to-br from-emerald-500/20 via-amber-500/10 to-blue-500/20 border border-slate-700/80">
            <span className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <span className="p-1 rounded-lg bg-amber-500/20 text-amber-400">
              <Plane className="w-5 h-5" />
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-base tracking-tight text-slate-100 flex items-center gap-1.5">
                <span className="text-emerald-400">WheatGuard</span>
                <span className="text-slate-500">×</span>
                <span className="text-amber-400">WheatField</span>
              </h1>
              <span className="hidden sm:inline-flex text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                منظومة القمح الذكية
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden md:block">
              تشخيص الأمراض بالذكاء الاصطناعي ومحاكاة الدرون الميداني والمستشعرات
            </p>
          </div>
        </div>

        {/* Center: Main App Switcher */}
        <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 shadow-inner">
          <button
            onClick={() => setAppMode('WHEAT_GUARD')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              appMode === 'WHEAT_GUARD'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>WheatGuard</span>
            <span className="text-[10px] opacity-80">(المراقبة والذكاء)</span>
          </button>

          <button
            onClick={() => setAppMode('WHEAT_FIELD')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              appMode === 'WHEAT_FIELD'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Plane className="w-4 h-4" />
            <span>WheatField</span>
            <span className="text-[10px] opacity-80">(محاكي الدرون)</span>
          </button>

          <button
            onClick={() => setAppMode('DUAL_VIEW')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              appMode === 'DUAL_VIEW'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            title="عرض التطبيقين جنباً إلى جنب مع مزامنة فورية"
          >
            <Layers className="w-4 h-4" />
            <span>العرض المزدوج</span>
          </button>
        </div>

        {/* Right: Device View & Model Settings */}
        <div className="flex items-center gap-2">
          {/* Real-time telemetry sync indicator (Clickable to open Transmission Monitor) */}
          <button
            onClick={onOpenTransmissionModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-[11px] text-emerald-300 transition-colors cursor-pointer"
            title="انقر لمعاينة كيف يرسل WheatField الصور وأحوال الطقس إلى WheatGuard"
          >
            <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
            <span className="hidden sm:inline">رابط البث والمستشعرات ({activePacketCount})</span>
            <span className="sm:hidden font-mono">بث IoT</span>
          </button>

          {/* TFLite Model Hub button */}
          <button
            onClick={onOpenTfliteModal}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              activeTfliteFile
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                : 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25'
            }`}
            title="إدارة وتنزيل ورفع نموذج TFLite للـ 15 صنفاً"
          >
            <Cpu className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-semibold">
              {activeTfliteFile ? 'TFLite مُحمل' : 'نموذج TFLite (15 صنف)'}
            </span>
          </button>

          {/* Trained AI Model selector button */}
          <button
            onClick={onOpenModelModal}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              customModelConfig.enabled
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-900 border-slate-700/80 text-slate-300 hover:border-slate-600'
            }`}
            title="نموذج كشف أمراض القمح المدرب المعتمد (640×640)"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline font-semibold">
              {customModelConfig.modelName || (activeTfliteFile ? activeTfliteFile.name : 'النموذج المدرب (15 صنف)')}
            </span>
          </button>

          {/* Device Mockup Toggle (Mobile vs Desktop) */}
          <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => setDeviceView('DESKTOP')}
              className={`p-1.5 rounded-md text-xs transition-colors ${
                deviceView === 'DESKTOP'
                  ? 'bg-slate-800 text-slate-100 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="عرض شاشة الويب والكمبيوتر"
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDeviceView('MOBILE_PHONE')}
              className={`p-1.5 rounded-md text-xs transition-colors ${
                deviceView === 'MOBILE_PHONE'
                  ? 'bg-slate-800 text-amber-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="عرض محاكاة تطبيق الهاتف الذكي"
            >
              <Smartphone className="w-4 h-4" />
            </button>
          </div>

          {/* Guide / Info */}
          <button
            onClick={onOpenGuide}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title="دليل المنظومة وكيفية الربط"
          >
            <FileQuestion className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
