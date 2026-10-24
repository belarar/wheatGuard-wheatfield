import React from 'react';
import { WeatherTelemetry } from '../../types';
import {
  Thermometer,
  Droplets,
  Wind,
  Sun,
  CloudRain,
  Compass,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  RefreshCw,
} from 'lucide-react';

interface SensorControlDeckProps {
  weather: WeatherTelemetry;
  onChangeWeather: (newWeather: WeatherTelemetry) => void;
  onSimulateAdverseWeather: () => void;
  onSimulateOptimalWeather: () => void;
}

export const SensorControlDeck: React.FC<SensorControlDeckProps> = ({
  weather,
  onChangeWeather,
  onSimulateAdverseWeather,
  onSimulateOptimalWeather,
}) => {
  // Determine agronomical spraying condition
  const isHighWind = weather.windSpeedKmh > 15;
  const isHighHumidity = weather.ambientHumidityPercent > 80;
  const isHighFungalRisk = weather.ambientHumidityPercent >= 80 && weather.leafWetnessHours >= 4;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-400">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">
              محطة المستشعرات البيئية والإنترنت الزراعي (IoT Sensors)
            </h3>
            <p className="text-[11px] text-slate-400">
              قراءات فورية للرطوبة، الحرارة، الرياح، وبلل أوراق القمح
            </p>
          </div>
        </div>

        {/* Quick Weather Presets */}
        <div className="flex items-center gap-2">
          <button
            onClick={onSimulateOptimalWeather}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs border border-slate-700 transition-colors"
            title="محاكاة طقس ربيعي معتدل ومثالي للرش"
          >
            طقس مثالي للرش
          </button>
          <button
            onClick={onSimulateAdverseWeather}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-400 text-xs border border-slate-700 transition-colors"
            title="محاكاة رطوبة عالية ومحفزة للأمراض الفطرية"
          >
            طقس محفز للفطريات
          </button>
        </div>
      </div>

      {/* Main Sensor Meters Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Temperature */}
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="flex items-center gap-1">
              <Thermometer className="w-3.5 h-3.5 text-rose-400" />
              الحرارة
            </span>
            <span className="font-mono text-[10px]">°C</span>
          </div>
          <div className="text-xl font-black text-rose-400">{weather.temperatureC}°C</div>
          <input
            type="range"
            min="10"
            max="42"
            step="0.5"
            value={weather.temperatureC}
            onChange={(e) =>
              onChangeWeather({ ...weather, temperatureC: parseFloat(e.target.value) })
            }
            className="w-full mt-2 accent-rose-500 cursor-pointer h-1 bg-slate-800 rounded-lg"
          />
        </div>

        {/* Ambient Humidity */}
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="flex items-center gap-1">
              <Droplets className="w-3.5 h-3.5 text-sky-400" />
              رطوبة الجو
            </span>
            <span className="font-mono text-[10px]">%</span>
          </div>
          <div className="text-xl font-black text-sky-400">{weather.ambientHumidityPercent}%</div>
          <input
            type="range"
            min="20"
            max="98"
            step="1"
            value={weather.ambientHumidityPercent}
            onChange={(e) =>
              onChangeWeather({ ...weather, ambientHumidityPercent: parseInt(e.target.value) })
            }
            className="w-full mt-2 accent-sky-500 cursor-pointer h-1 bg-slate-800 rounded-lg"
          />
        </div>

        {/* Soil Moisture */}
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="flex items-center gap-1">
              <CloudRain className="w-3.5 h-3.5 text-emerald-400" />
              رطوبة التربة
            </span>
            <span className="font-mono text-[10px]">% VWC</span>
          </div>
          <div className="text-xl font-black text-emerald-400">{weather.soilMoisturePercent}%</div>
          <input
            type="range"
            min="10"
            max="90"
            step="1"
            value={weather.soilMoisturePercent}
            onChange={(e) =>
              onChangeWeather({ ...weather, soilMoisturePercent: parseInt(e.target.value) })
            }
            className="w-full mt-2 accent-emerald-500 cursor-pointer h-1 bg-slate-800 rounded-lg"
          />
        </div>

        {/* Wind Speed */}
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="flex items-center gap-1">
              <Wind className="w-3.5 h-3.5 text-amber-400" />
              سرعة الرياح
            </span>
            <span className="font-mono text-[10px]">كم/س</span>
          </div>
          <div className="text-xl font-black text-amber-400">{weather.windSpeedKmh}</div>
          <input
            type="range"
            min="2"
            max="35"
            step="0.5"
            value={weather.windSpeedKmh}
            onChange={(e) =>
              onChangeWeather({ ...weather, windSpeedKmh: parseFloat(e.target.value) })
            }
            className="w-full mt-2 accent-amber-500 cursor-pointer h-1 bg-slate-800 rounded-lg"
          />
        </div>

        {/* Leaf Wetness Duration (LWD) */}
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="flex items-center gap-1">
              <Droplets className="w-3.5 h-3.5 text-teal-400" />
              بلل الأوراق
            </span>
            <span className="font-mono text-[10px]">ساعات</span>
          </div>
          <div className="text-xl font-black text-teal-400">{weather.leafWetnessHours}h</div>
          <input
            type="range"
            min="0"
            max="14"
            step="0.5"
            value={weather.leafWetnessHours}
            onChange={(e) =>
              onChangeWeather({ ...weather, leafWetnessHours: parseFloat(e.target.value) })
            }
            className="w-full mt-2 accent-teal-500 cursor-pointer h-1 bg-slate-800 rounded-lg"
          />
        </div>

        {/* Wind Direction & UV */}
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-indigo-400" />
              الاتجاه
            </span>
            <span className="font-mono text-[10px]">UV {weather.uvIndex}</span>
          </div>
          <div className="text-sm font-bold text-indigo-300 mt-1">{weather.windDirection}</div>
          <span className="text-[10px] text-slate-500 mt-2 block">مستشعر الأنيموميتر</span>
        </div>
      </div>

      {/* Agronomic Risk & Spray Suitability Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
        {/* Fungal Infection Risk Meter */}
        <div
          className={`p-3.5 rounded-xl border flex items-start gap-3 ${
            isHighFungalRisk
              ? 'bg-rose-950/30 border-rose-500/40 text-rose-300'
              : 'bg-slate-950 border-slate-800 text-slate-300'
          }`}
        >
          {isHighFungalRisk ? (
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          )}
          <div>
            <h5 className="font-bold text-xs text-slate-100">
              {isHighFungalRisk
                ? 'تحذير وبائي: بيئة مثالية لإنبات جراثيم الصدأ والفيوزاريوم'
                : 'مؤشر خطر العدوى الفطرية: منخفض إلى معتدل'}
            </h5>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              {isHighFungalRisk
                ? `رطوبة الهواء (${weather.ambientHumidityPercent}%) وبلل أوراق القمح (${weather.leafWetnessHours} ساعات) تزيد احتمال تكاثر فطر الصدأ الأصفر وتفشي البياض الدقيقي.`
                : 'الظروف الرطوبية الحالية لا تشكل خطراً عاجلاً لإنبات الأبواغ الفطرية.'}
            </p>
          </div>
        </div>

        {/* Drone Spray Feasibility */}
        <div
          className={`p-3.5 rounded-xl border flex items-start gap-3 ${
            isHighWind
              ? 'bg-amber-950/30 border-amber-500/40 text-amber-300'
              : 'bg-slate-950 border-slate-800 text-slate-300'
          }`}
        >
          {isHighWind ? (
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          )}
          <div>
            <h5 className="font-bold text-xs text-slate-100">
              {isHighWind
                ? 'تحذير سرعة الرياح: غير ملائم للرش الجوي بالدرون'
                : 'ملاءمة الرش بالدرون: ظروف نموذجية ومستقرة'}
            </h5>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              {isHighWind
                ? `سرعة الرياح (${weather.windSpeedKmh} كم/س) تتجاوز الحد الآمن (15 كم/س) مما قد يسبب تطاير رذاذ المبيد وانجرافه خارج الحقل.`
                : `سرعة الرياح (${weather.windSpeedKmh} كم/س) ملائمة جداً لنزول قطرات المبيد عمودياً وتغطية أوراق وسنابل القمح بكفاءة.`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
