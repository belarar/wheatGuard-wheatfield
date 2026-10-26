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

export interface BoundingBox {
  box_2d: [number, number, number, number]; // [ymin, xmin, ymax, xmax] 0-1000 normalized
  labelAr: string;
  labelEn: string;
  classId: number;
  confidence: number;
}

export interface PreprocessingOptions {
  enabled?: boolean;
  autoWhiteBalance?: boolean;
  contrastStretching?: boolean;
  whiteBalanceStrength?: number; // 0.0 to 1.0 (default 0.75)
  contrastClipPercentile?: number; // 0.5 to 3.0 (default 1.5%)
  targetD65Daylight?: boolean;
}

export interface PreprocessingMetrics {
  applied: boolean;
  whiteBalanceCorrection: {
    gainR: number;
    gainG: number;
    gainB: number;
    colorTempShiftKelvin: string;
    neutralizedCast: string; // e.g. "وهج الشمس الذهبي (Warm Sunlight)"
  };
  contrastCorrection: {
    originalMinLum: number;
    originalMaxLum: number;
    contrastGainPercent: number;
    dynamicRangeExpanded: boolean;
  };
  resolution: {
    targetWidth: number;
    targetHeight: number;
  };
  originalDataUrl?: string;
  preprocessedDataUrl?: string;
}

export interface VisualFeatureProfile {
  yellowPustuleCount: number;
  brownPustuleCount: number;
  blackNecroticCount: number;
  whitePowderCount: number;
  healthyGreenCount: number;
  detectedCandidateClassId: number;
  reasoning: string;
  spectralBreakdown?: {
    yellowUrediniaPercent: number;
    brownRustPercent: number;
    darkNecrosisPercent: number;
    whiteMildewPercent: number;
    foliarGreenPercent: number;
    backgroundPercent: number;
  };
  stripeCollinearityScore?: number; // 0-100 linear alignment score for Yellow Rust
}

export interface ClassProbabilityItem {
  classId: number;
  nameAr: string;
  nameEn: string;
  probability: number; // 0 to 100
}

export interface AccuracyVerificationDetails {
  verifiedCriterion: string;
  confusionCheckedAgainst: string;
  confidenceMargin: number;
  isGroundTruthAligned: boolean;
  tensorGridResolution: string; // "640x640"
  pathologyRulePassed: boolean;
}

export interface WheatDiseaseDiagnosis {
  predictedClassId?: number;
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
  boundingBoxes?: BoundingBox[];
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
  preprocessing?: PreprocessingMetrics;
  featureProfile?: VisualFeatureProfile;
  topClassProbabilities?: ClassProbabilityItem[];
  accuracyVerification?: AccuracyVerificationDetails;
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
  formattedTimestampLatin?: string; // Strictly Latin digits (0-9) e.g. "2026-10-26 14:25:08"
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
