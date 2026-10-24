import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { DroneState, FieldParcel } from '../../types';
import {
  Layers,
  MapPin,
  Navigation,
  Compass,
  Crosshair,
  Pencil,
  Check,
  RotateCcw,
  Plus,
  HelpCircle,
  Save,
} from 'lucide-react';

interface InteractiveFieldMapProps {
  parcel: FieldParcel;
  droneState: DroneState;
  onMapClickLocation?: (coords: { lat: number; lng: number }) => void;
  waypoints?: Array<{ lat: number; lng: number; label: string }>;
  droneTrail?: Array<[number, number]>;
  onSaveNewParcel?: (newParcel: FieldParcel) => void;
}

// Helper to calculate approximate area in Hectares from GPS polygon coordinates
function calculatePolygonAreaHectares(coords: [number, number][]): number {
  if (coords.length < 3) return 0;
  const R = 6378137; // Earth radius in meters
  let area = 0;
  const len = coords.length;

  for (let i = 0; i < len; i++) {
    const p1 = coords[i];
    const p2 = coords[(i + 1) % len];
    const lat1 = (p1[0] * Math.PI) / 180;
    const lat2 = (p2[0] * Math.PI) / 180;
    const dLng = ((p2[1] - p1[1]) * Math.PI) / 180;
    area += dLng * (2 + Math.sin(lat1) + Math.sin(lat2));
  }
  area = Math.abs((area * R * R) / 4);
  const hectares = area / 10000;
  return Math.round(hectares * 10) / 10;
}

export const InteractiveFieldMap: React.FC<InteractiveFieldMapProps> = ({
  parcel,
  droneState,
  onMapClickLocation,
  waypoints = [],
  droneTrail = [],
  onSaveNewParcel,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const droneMarkerRef = useRef<L.Marker | null>(null);
  const polygonRef = useRef<L.Polygon | null>(null);
  const drawingPolygonRef = useRef<L.Polygon | null>(null);
  const drawingMarkersRef = useRef<L.Marker[]>([]);
  const trailPolylineRef = useRef<L.Polyline | null>(null);

  // Field drawing mode state
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [drawnPoints, setDrawnPoints] = useState<[number, number][]>([]);
  const [newFieldName, setNewFieldName] = useState('حقل القمح المخصص');
  const [newWheatVariety, setNewWheatVariety] = useState('قمح صلب - صنف محلي');
  const [calculatedArea, setCalculatedArea] = useState<number>(0);
  const [locatingUser, setLocatingUser] = useState(false);
  const [gpsMessage, setGpsMessage] = useState<string | null>(null);

  // Keep a ref of drawing state for event handlers
  const isDrawingModeRef = useRef(isDrawingMode);
  isDrawingModeRef.current = isDrawingMode;
  const drawnPointsRef = useRef(drawnPoints);
  drawnPointsRef.current = drawnPoints;

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Create map
      const map = L.map(mapContainerRef.current, {
        center: [parcel.center.lat, parcel.center.lng],
        zoom: 16,
        zoomControl: false,
      });

      // Add High-Resolution Satellite imagery tiles (Esri World Imagery)
      L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: 'Tiles &copy; Esri &mdash; WheatField GIS Satellite',
          maxZoom: 19,
        }
      ).addTo(map);

      // Add OpenStreetMap Labels overlay for boundary and village context
      L.tileLayer(
        'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 19 }
      ).addTo(map);

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Handle Map Clicks: If drawing mode, append polygon vertex; otherwise fly drone
      map.on('click', (e: L.LeafletMouseEvent) => {
        if (isDrawingModeRef.current) {
          const newPt: [number, number] = [e.latlng.lat, e.latlng.lng];
          const updated = [...drawnPointsRef.current, newPt];
          setDrawnPoints(updated);
          setCalculatedArea(calculatePolygonAreaHectares(updated));
        } else if (onMapClickLocation) {
          onMapClickLocation({ lat: e.latlng.lat, lng: e.latlng.lng });
        }
      });

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Update active field boundary polygon
    if (polygonRef.current) {
      polygonRef.current.remove();
    }

    if (parcel.bounds && parcel.bounds.length > 0 && !isDrawingMode) {
      polygonRef.current = L.polygon(parcel.bounds, {
        color: '#22c55e',
        fillColor: '#84cc16',
        fillOpacity: 0.28,
        weight: 3,
        dashArray: '5, 5',
      }).addTo(map);

      polygonRef.current.bindPopup(
        `<div style="font-family: Cairo, sans-serif; text-align: right; color: #0f172a; padding: 4px;">
          <h4 style="font-weight: bold; margin: 0 0 4px; color: #15803d;">${parcel.name}</h4>
          <p style="margin: 0; font-size: 11px;">الصنف: ${parcel.wheatVariety}</p>
          <p style="margin: 0; font-size: 11px;">المساحة: ${parcel.areaHectares} هكتار</p>
          <p style="margin: 4px 0 0; font-size: 10px; color: #64748b;">انقر لتوجيه الدرون إلى مركز الحقل</p>
        </div>`
      );
    }

    map.setView([parcel.center.lat, parcel.center.lng], 16);
  }, [parcel.id, isDrawingMode]);

  // Update Drawing Polygon and Vertex Markers when drawing mode points change
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    // Clear previous drawing markers & polygon
    drawingMarkersRef.current.forEach((m) => m.remove());
    drawingMarkersRef.current = [];
    if (drawingPolygonRef.current) {
      drawingPolygonRef.current.remove();
      drawingPolygonRef.current = null;
    }

    if (!isDrawingMode || drawnPoints.length === 0) return;

    // Add glowing vertex markers for each point
    drawnPoints.forEach((pt, idx) => {
      const vertexIcon = L.divIcon({
        html: `<div style="
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #f59e0b;
          border: 2px solid #ffffff;
          box-shadow: 0 0 10px #f59e0b;
        "></div>`,
        className: 'field-vertex-marker',
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });

      const marker = L.marker(pt, { icon: vertexIcon }).addTo(map);
      drawingMarkersRef.current.push(marker);
    });

    // Draw connecting polygon
    if (drawnPoints.length >= 2) {
      drawingPolygonRef.current = L.polygon(drawnPoints, {
        color: '#f59e0b',
        fillColor: '#fbbf24',
        fillOpacity: 0.35,
        weight: 3,
        dashArray: '4, 4',
      }).addTo(map);
    }
  }, [drawnPoints, isDrawingMode]);

  // Update Drone Marker Position & Orientation
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    const droneIconHtml = `
      <div style="
        position: relative;
        width: 44px;
        height: 44px;
        transform: rotate(${droneState.headingDegrees}deg);
        transition: transform 0.3s ease;
      ">
        <svg viewBox="0 0 48 48" width="44" height="44" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Drone Quadcopter Body -->
          <circle cx="24" cy="24" r="8" fill="#0f172a" stroke="#f59e0b" stroke-width="2.5"/>
          <!-- Forward Camera / Gimbal Indicator -->
          <path d="M 24,10 L 28,18 L 20,18 Z" fill="#22c55e"/>
          <!-- 4 Rotor Arms -->
          <line x1="8" y1="8" x2="40" y2="40" stroke="#f59e0b" stroke-width="3"/>
          <line x1="8" y1="40" x2="40" y2="8" stroke="#f59e0b" stroke-width="3"/>
          <!-- 4 Propellers -->
          <circle cx="8" cy="8" r="5" fill="#38bdf8" opacity="0.8"/>
          <circle cx="40" cy="8" r="5" fill="#38bdf8" opacity="0.8"/>
          <circle cx="8" cy="40" r="5" fill="#38bdf8" opacity="0.8"/>
          <circle cx="40" cy="40" r="5" fill="#38bdf8" opacity="0.8"/>
        </svg>
        <div style="
          position: absolute;
          top: -8px;
          right: -8px;
          background: #0f172a;
          color: #f59e0b;
          border: 1px solid #f59e0b;
          border-radius: 4px;
          padding: 1px 4px;
          font-size: 9px;
          font-family: monospace;
          white-space: nowrap;
        ">
          ${droneState.altitudeMeters.toFixed(0)}m
        </div>
      </div>
    `;

    const customDroneIcon = L.divIcon({
      html: droneIconHtml,
      className: 'drone-map-marker',
      iconSize: [44, 44],
      iconAnchor: [22, 22],
    });

    if (!droneMarkerRef.current) {
      droneMarkerRef.current = L.marker([droneState.coordinates.lat, droneState.coordinates.lng], {
        icon: customDroneIcon,
      }).addTo(map);
    } else {
      droneMarkerRef.current.setLatLng([droneState.coordinates.lat, droneState.coordinates.lng]);
      droneMarkerRef.current.setIcon(customDroneIcon);
    }

    // Update flight path trail
    if (trailPolylineRef.current) {
      trailPolylineRef.current.remove();
    }
    if (droneTrail && droneTrail.length > 1) {
      trailPolylineRef.current = L.polyline(droneTrail, {
        color: '#f59e0b',
        weight: 2,
        opacity: 0.7,
        dashArray: '4, 4',
      }).addTo(map);
    }
  }, [
    droneState.coordinates.lat,
    droneState.coordinates.lng,
    droneState.headingDegrees,
    droneState.altitudeMeters,
    droneTrail,
  ]);

  // Farmer GPS Locating Feature
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setGpsMessage('المتصفح لا يدعم تحديد الموقع الجغرافي.');
      return;
    }

    setLocatingUser(true);
    setGpsMessage('جاري الاتصال بالقمر الصناعي لتحديد موقع حقلك الحالي...');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocatingUser(false);
        const { latitude, longitude } = pos.coords;
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([latitude, longitude], 17, { duration: 1.5 });
        }
        if (onMapClickLocation) {
          onMapClickLocation({ lat: latitude, lng: longitude });
        }
        setGpsMessage(`تم الانتقال إلى إحداثيات موقعك: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        setTimeout(() => setGpsMessage(null), 4000);
      },
      (err) => {
        setLocatingUser(false);
        setGpsMessage('تعذر جلب موقع GPS. يرجى تفعيل إذن الموقع أو استخدام الخريطة يدوياً.');
        setTimeout(() => setGpsMessage(null), 4000);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Save the custom drawn field polygon
  const handleSaveDrawnField = () => {
    if (drawnPoints.length < 3) {
      alert('يرجى تحديد 3 نقاط على الأقل على الخريطة لتشكيل حدود الحقل.');
      return;
    }

    // Calculate center
    const lats = drawnPoints.map((p) => p[0]);
    const lngs = drawnPoints.map((p) => p[1]);
    const centerLat = lats.reduce((a, b) => a + b, 0) / lats.length;
    const centerLng = lngs.reduce((a, b) => a + b, 0) / lngs.length;

    const area = calculatePolygonAreaHectares(drawnPoints);

    const newParcel: FieldParcel = {
      id: `parcel-custom-${Date.now()}`,
      name: newFieldName || 'حقل القمح المخصص',
      region: 'موقع محدد عبر الخريطة الجغرافية',
      areaHectares: area > 0 ? area : 12.5,
      wheatVariety: newWheatVariety,
      sowingDate: 'الموسم الحالي',
      healthIndex: 85,
      lastScanned: 'الآن',
      center: { lat: centerLat, lng: centerLng },
      bounds: drawnPoints,
    };

    if (onSaveNewParcel) {
      onSaveNewParcel(newParcel);
    }

    setIsDrawingMode(false);
    setDrawnPoints([]);
    setGpsMessage(`تم حفظ الحقل "${newParcel.name}" بمساحة ${newParcel.areaHectares} هكتار بنجاح!`);
    setTimeout(() => setGpsMessage(null), 4500);
  };

  const handleCancelDrawing = () => {
    setIsDrawingMode(false);
    setDrawnPoints([]);
    setCalculatedArea(0);
  };

  return (
    <div className="relative w-full h-full min-h-[380px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-xl flex flex-col">
      {/* Map toolbar controls */}
      <div className="absolute top-3 right-3 z-10 flex flex-wrap items-center gap-2">
        {/* Parcel info pill */}
        <div className="bg-slate-950/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/80 text-xs text-slate-200 flex items-center gap-2 shadow-lg">
          <MapPin className="w-4 h-4 text-emerald-400" />
          <div>
            <span className="font-bold text-slate-100">{parcel.name}</span>
            <p className="text-[10px] text-slate-400 font-mono">
              GPS: {droneState.coordinates.lat.toFixed(5)}, {droneState.coordinates.lng.toFixed(5)}
            </p>
          </div>
        </div>

        {/* Locate Me GPS Button */}
        <button
          onClick={handleLocateMe}
          disabled={locatingUser}
          className="bg-slate-900/90 hover:bg-slate-800 text-sky-400 px-3 py-1.5 rounded-xl border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-lg disabled:opacity-50"
          title="توجيه الخريطة لموقع مزرعتك الحالي عبر GPS"
        >
          <Crosshair className={`w-3.5 h-3.5 ${locatingUser ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">موقعي الحالي (GPS)</span>
        </button>

        {/* Draw Field Polygon Button */}
        {!isDrawingMode ? (
          <button
            onClick={() => {
              setIsDrawingMode(true);
              setDrawnPoints([]);
              setCalculatedArea(0);
            }}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg transition-all"
            title="رسم وتحديد حدود قطعة أرض زراعية جديدة"
          >
            <Pencil className="w-3.5 h-3.5" />
            <span>تحديد حدود حقلي (رسم)</span>
          </button>
        ) : (
          <button
            onClick={handleCancelDrawing}
            className="bg-rose-600 hover:bg-rose-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>إلغاء الرسم</span>
          </button>
        )}
      </div>

      {/* Drawing mode interactive panel banner */}
      {isDrawingMode && (
        <div className="absolute top-16 right-3 left-3 z-10 bg-slate-950/95 backdrop-blur-md p-3.5 rounded-2xl border border-amber-500/50 shadow-2xl flex flex-wrap items-center justify-between gap-3 animate-fade-in text-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
              <strong className="text-amber-300">وضع رسم وتحديد حدود الحقل:</strong>
              <span className="text-slate-300">
                انقر على الخريطة لتحديد زوايا وأركان الحقل ({drawnPoints.length} نقاط محددة)
              </span>
            </div>
            {drawnPoints.length >= 3 && (
              <p className="text-emerald-400 font-semibold font-mono">
                المساحة المحسوبة آلياً: {calculatedArea} هكتار
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="text"
              value={newFieldName}
              onChange={(e) => setNewFieldName(e.target.value)}
              placeholder="اسم الحقل (مثال: حوض 5)"
              className="bg-slate-900 border border-slate-700 px-2.5 py-1 rounded-lg text-slate-100 text-xs focus:outline-none focus:border-amber-400"
            />
            <button
              onClick={handleSaveDrawnField}
              disabled={drawnPoints.length < 3}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold disabled:opacity-50 transition-colors shadow-md"
            >
              <Save className="w-3.5 h-3.5" />
              <span>اعتماد وحفظ الحقل</span>
            </button>
          </div>
        </div>
      )}

      {/* GPS Status Message Toast */}
      {gpsMessage && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 z-20 bg-slate-900/95 border border-sky-500/50 text-sky-200 px-4 py-2 rounded-xl text-xs shadow-xl animate-fade-in flex items-center gap-2">
          <Crosshair className="w-4 h-4 text-sky-400" />
          <span>{gpsMessage}</span>
        </div>
      )}

      {/* Leaflet Map DOM Node */}
      <div ref={mapContainerRef} className="w-full flex-1 z-0" />

      {/* Bottom Hint */}
      <div className="absolute bottom-3 left-3 z-10 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/80 text-[11px] text-slate-300 flex items-center gap-2 shadow-lg">
        <Navigation className="w-3.5 h-3.5 text-amber-400" />
        <span>
          {isDrawingMode
            ? 'انقر على الخريطة لوضع رؤوس زوايا المزرعة'
            : 'انقر على أي نقطة بالحقل لتوجيه الدرون إليها مباشرة'}
        </span>
      </div>
    </div>
  );
};
