import React from 'react';
import { FieldParcel } from '../../types';
import { ShieldCheck, Activity, AlertTriangle, Layers } from 'lucide-react';

interface HealthHeatmapProps {
  parcels: FieldParcel[];
  selectedParcelId: string;
  onSelectParcel: (parcelId: string) => void;
  detectedCount: {
    fungal: number;
    parasitic: number;
    healthy: number;
  };
}

export const HealthHeatmap: React.FC<HealthHeatmapProps> = ({
  parcels,
  selectedParcelId,
  onSelectParcel,
  detectedCount,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col gap-4">
      {/* Overview Stat Badges */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
          <span className="text-[10px] text-slate-400 block">إصابات فطرية</span>
          <span className="text-lg font-black text-rose-400">{detectedCount.fungal}</span>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
          <span className="text-[10px] text-slate-400 block">آفات طفيلية</span>
          <span className="text-lg font-black text-amber-400">{detectedCount.parasitic}</span>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
          <span className="text-[10px] text-slate-400 block">عينات سليمة</span>
          <span className="text-lg font-black text-emerald-400">{detectedCount.healthy}</span>
        </div>
      </div>

      {/* Parcels list */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            حقول القمح المسجلة بالخريطة
          </h4>
          <span className="text-[10px] text-slate-500">مؤشر الصحة النباتية (NDVI)</span>
        </div>

        <div className="space-y-2">
          {parcels.map((parcel) => {
            const isSelected = selectedParcelId === parcel.id;
            return (
              <div
                key={parcel.id}
                onClick={() => onSelectParcel(parcel.id)}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-slate-800 border-emerald-500 shadow-md ring-1 ring-emerald-500/40'
                    : 'bg-slate-950/70 border-slate-800/80 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-slate-100">{parcel.name}</span>
                  <span
                    className={`font-mono font-bold ${
                      parcel.healthIndex > 80
                        ? 'text-emerald-400'
                        : parcel.healthIndex > 65
                        ? 'text-amber-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {parcel.healthIndex}% NDVI
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>{parcel.wheatVariety}</span>
                  <span>{parcel.areaHectares} هكتار</span>
                </div>

                {/* Health bar */}
                <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      parcel.healthIndex > 80
                        ? 'bg-emerald-500'
                        : parcel.healthIndex > 65
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${parcel.healthIndex}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
