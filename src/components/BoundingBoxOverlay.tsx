import React from 'react';
import { BoundingBox } from '../types';

interface BoundingBoxOverlayProps {
  boxes?: BoundingBox[];
  showLabels?: boolean;
  activeHoverId?: number | null;
  onSelectBox?: (box: BoundingBox) => void;
}

export const BoundingBoxOverlay: React.FC<BoundingBoxOverlayProps> = ({
  boxes = [],
  showLabels = true,
  activeHoverId,
  onSelectBox,
}) => {
  if (!boxes || boxes.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-20 select-none">
      {boxes.map((b, idx) => {
        // box_2d is [ymin, xmin, ymax, xmax] normalized to 0-1000
        const [ymin, xmin, ymax, xmax] = b.box_2d;
        const top = Math.max(0, Math.min(95, ymin / 10)); // convert 0-1000 to %
        const left = Math.max(0, Math.min(95, xmin / 10));
        const width = Math.max(10, Math.min(100 - left, (xmax - xmin) / 10));
        const height = Math.max(10, Math.min(100 - top, (ymax - ymin) / 10));

        const isHealthy = b.classId === 13 || b.labelEn?.toLowerCase().includes('healthy');
        const isParasite = b.classId === 0 || b.classId === 8 || b.classId === 11;
        const isCritical = [1, 2, 5, 10, 14].includes(b.classId);

        // Color theme
        const strokeColor = isHealthy
          ? '#22c55e'
          : isParasite
          ? '#eab308'
          : isCritical
          ? '#f43f5e'
          : '#f97316';

        const bgBadge = isHealthy
          ? 'bg-emerald-600/95 text-emerald-100 border-emerald-400/60'
          : isParasite
          ? 'bg-amber-600/95 text-amber-100 border-amber-400/60'
          : isCritical
          ? 'bg-rose-600/95 text-rose-100 border-rose-400/60'
          : 'bg-orange-600/95 text-orange-100 border-orange-400/60';

        const isTagNearTop = top < 12;

        return (
          <div
            key={idx}
            onClick={() => onSelectBox && onSelectBox(b)}
            className="absolute transition-all duration-300 pointer-events-auto cursor-pointer group"
            style={{
              top: `${top}%`,
              left: `${left}%`,
              width: `${width}%`,
              height: `${height}%`,
            }}
          >
            {/* Main Bounding Rectangle with high-contrast glowing border */}
            <div
              className="w-full h-full border-2 rounded-lg relative"
              style={{
                borderColor: strokeColor,
                boxShadow: `0 0 16px ${strokeColor}88, inset 0 0 10px ${strokeColor}33`,
                backgroundColor: `${strokeColor}18`,
              }}
            >
              {/* Corner Reticles for Military/Agricultural Targeting HUD feel */}
              <div
                className="absolute -top-1 -left-1 w-3.5 h-3.5 border-t-2 border-l-2"
                style={{ borderColor: '#ffffff' }}
              />
              <div
                className="absolute -top-1 -right-1 w-3.5 h-3.5 border-t-2 border-r-2"
                style={{ borderColor: '#ffffff' }}
              />
              <div
                className="absolute -bottom-1 -left-1 w-3.5 h-3.5 border-b-2 border-l-2"
                style={{ borderColor: '#ffffff' }}
              />
              <div
                className="absolute -bottom-1 -right-1 w-3.5 h-3.5 border-b-2 border-r-2"
                style={{ borderColor: '#ffffff' }}
              />

              {/* Pulsing Target Dot in Center */}
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full animate-ping opacity-75"
                style={{ backgroundColor: strokeColor }}
              />
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: '#ffffff' }}
              />
            </div>

            {/* Disease Name Tag: Inverted if near top to avoid clipping */}
            {showLabels && (
              <div
                className={`absolute ${
                  isTagNearTop ? 'top-1 right-1' : '-top-7.5 right-0'
                } font-bold text-[10px] sm:text-xs px-2.5 py-1 rounded-md shadow-2xl flex items-center gap-2 whitespace-nowrap z-30 border backdrop-blur-md ${bgBadge}`}
                dir="rtl"
              >
                <span className="w-2 h-2 rounded-full bg-white animate-pulse shrink-0" />
                <span className="text-white drop-shadow-sm font-black">
                  {b.labelAr}
                </span>
                {b.labelEn && (
                  <span className="opacity-90 font-mono text-[9px] hidden sm:inline">
                    ({b.labelEn})
                  </span>
                )}
                <span className="px-1.5 py-0.5 rounded bg-black/60 text-amber-300 font-mono text-[10px] border border-amber-400/30">
                  ID: {b.classId}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-black/75 text-emerald-300 font-mono font-bold text-[10px]">
                  {b.confidence}%
                </span>
                <span className="px-1 py-0.5 rounded bg-slate-900/90 text-cyan-300 font-mono text-[9px] border border-cyan-500/30 hidden sm:inline" title="إحداثيات المربع على شبكة تدريب 640×640 بكسل">
                  640p: [{Math.round((xmin / 1000) * 640)},{Math.round((ymin / 1000) * 640)},{Math.round((xmax / 1000) * 640)},{Math.round((ymax / 1000) * 640)}]
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
