export interface DroneState {
  droneId: string;
  missionName: string;
  status: 'IDLE' | 'TAKEOFF' | 'PATROLLING' | 'HOVERING' | 'TRANSMITTING' | 'RTH';
  coordinates: { lat: number; lng: number };
  altitudeMeters: number;
  speedKmh: number;
  batteryPercent: number;
  headingDegrees: number;
  gimbalPitchDegrees: number; // 0 to -90
  satellites: number;
  signalStrengthPercent: number;
  flightTimeSeconds: number;
}

export interface WeatherTelemetry {
  temperatureC: number;
  ambientHumidityPercent: number;
  soilMoisturePercent: number;
  windSpeedKmh: number;
  windDirection: string;
  leafWetnessHours: number;
  uvIndex: number;
  atmosphericPressureHpa: number;
  sprayCondition: 'OPTIMAL' | 'CAUTION_WIND' | 'HIGH_HUMIDITY' | 'UNFAVORABLE';
  sprayAdvice: string;
}

export interface WheatDiseaseDiagnosis {
  diseaseDetected: boolean;
  isHealthy: boolean;
  diseaseNameAr: string;
  diseaseNameEn: string;
  pathogenScientificName: string;
  diseaseCategory: 'فطري (Fungal)' | 'طفيلي / حشري (Parasitic/Pest)' | 'فسيولوجي (Physiological)' | 'سليم (Healthy)' | string;
  confidenceScore: number;
  severityLevel: 'منخفض (Low)' | 'متوسط (Medium)' | 'شديد / خطر (Critical)' | 'لا يوجد' | string;
  affectedPlantPart: string;
  symptomsIdentified: string[];
  microclimateRiskAnalysis: string;
  treatmentRecommendations: {
    chemicalAction: string;
    biologicalAction: string;
    culturalPractices: string;
  };
  sprayGuidance: {
    recommendedWeatherCondition: string;
    urgency: string;
  };
  fieldActionSummary: string;
}

export interface CapturedSample {
  id: string;
  title: string;
  diseaseHint: string;
  category: 'fungal' | 'parasitic' | 'healthy';
  imageUrl: string;
  coordinates: { lat: number; lng: number };
  sampleWeather: Partial<WeatherTelemetry>;
  precomputedDiagnosis?: Partial<WheatDiseaseDiagnosis>;
}

export interface TelemetryPacket {
  id: string;
  timestamp: number;
  droneId: string;
  coordinates: { lat: number; lng: number };
  altitudeMeters: number;
  speedKmh: number;
  weather: WeatherTelemetry;
  capturedMedia?: {
    type: 'image' | 'video';
    dataUrl: string;
    label?: string;
  };
  diagnosis?: WheatDiseaseDiagnosis;
}

export interface CustomModelConfig {
  enabled: boolean;
  modelName: string;
  endpointUrl: string;
  apiKey?: string;
  framework: 'REST API' | 'YOLO / Ultralytics' | 'TensorFlow Serving' | 'HuggingFace' | 'Custom';
  headersJson?: string;
}

export interface FieldParcel {
  id: string;
  name: string;
  region: string;
  areaHectares: number;
  wheatVariety: string;
  sowingDate: string;
  center: { lat: number; lng: number };
  bounds: [number, number][];
  healthIndex: number; // 0 - 100
  lastScanned?: string;
}
