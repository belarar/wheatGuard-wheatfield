import { CapturedSample } from '../types';
import { WHEAT_15_CLASSES, WheatClassInfo } from './wheatLabels';

// Helper to create visual SVG data URLs for each of the 15 trained disease classes
function generateClassVisualSvg(cls: WheatClassInfo): string {
  let innerArt = '';

  switch (cls.id) {
    case 0: // Aphid
      innerArt = `
        <line x1="300" y1="390" x2="300" y2="50" stroke="#4ade80" stroke-width="14"/>
        <g fill="#15803d" stroke="#166534" stroke-width="1">
          <ellipse cx="305" cy="180" rx="7" ry="5"/><ellipse cx="295" cy="195" rx="8" ry="6"/>
          <ellipse cx="304" cy="210" rx="7" ry="5.5"/><ellipse cx="292" cy="225" rx="8.5" ry="6"/>
          <ellipse cx="308" cy="240" rx="7.5" ry="5"/><ellipse cx="296" cy="260" rx="9" ry="6.5"/>
        </g>
      `;
      break;

    case 1: // Black Rust (Stem)
      innerArt = `
        <line x1="300" y1="400" x2="300" y2="40" stroke="#65a30d" stroke-width="16"/>
        <g fill="#171717" stroke="#451a03" stroke-width="1.5">
          <ellipse cx="300" cy="130" rx="6" ry="18"/><ellipse cx="304" cy="180" rx="7" ry="24"/>
          <ellipse cx="296" cy="240" rx="6" ry="20"/><ellipse cx="302" cy="300" rx="7" ry="22"/>
          <ellipse cx="298" cy="350" rx="5" ry="16"/>
        </g>
      `;
      break;

    case 2: // Blast
      innerArt = `
        <line x1="300" y1="390" x2="300" y2="70" stroke="#84cc16" stroke-width="6"/>
        <!-- Bleached bleached dead upper spike -->
        <g fill="#fef08a" stroke="#ca8a04" stroke-width="1.5">
          <ellipse cx="280" cy="100" rx="18" ry="10" transform="rotate(-30 280 100)"/>
          <ellipse cx="320" cy="120" rx="18" ry="10" transform="rotate(30 320 120)"/>
          <ellipse cx="280" cy="140" rx="18" ry="10" transform="rotate(-30 280 140)"/>
        </g>
        <!-- Green lower spike -->
        <g fill="#65a30d" stroke="#365314" stroke-width="1.5">
          <ellipse cx="320" cy="180" rx="20" ry="12" transform="rotate(30 320 180)"/>
          <ellipse cx="280" cy="210" rx="20" ry="12" transform="rotate(-30 280 210)"/>
          <ellipse cx="320" cy="240" rx="20" ry="12" transform="rotate(30 320 240)"/>
        </g>
        <circle cx="300" cy="155" r="9" fill="#713f12" opacity="0.8"/>
      `;
      break;

    case 3: // Brown Rust
      innerArt = `
        <path d="M 100,400 Q 200,180 270,20 Q 310,20 370,180 Q 430,280 470,400 Z" fill="#365e2a"/>
        <g fill="#c2410c" stroke="#78350f" stroke-width="1">
          <circle cx="240" cy="120" r="5"/><circle cx="255" cy="115" r="4"/><circle cx="280" cy="140" r="6"/>
          <circle cx="295" cy="130" r="4.5"/><circle cx="230" cy="180" r="6"/><circle cx="250" cy="195" r="5.5"/>
          <circle cx="310" cy="190" r="7"/><circle cx="260" cy="240" r="6.5"/><circle cx="290" cy="250" r="5"/>
        </g>
      `;
      break;

    case 4: // Common Root Rot
      innerArt = `
        <rect x="0" y="240" width="600" height="160" fill="#29180c"/>
        <line x1="300" y1="240" x2="300" y2="40" stroke="#65a30d" stroke-width="12"/>
        <!-- Necrotic black root crown -->
        <rect x="288" y="220" width="24" height="60" fill="#0c0704" stroke="#451a03" stroke-width="2"/>
        <!-- Rotten dark brown roots -->
        <g stroke="#1a0c02" stroke-width="3" fill="none">
          <path d="M 300,280 Q 260,330 230,380"/>
          <path d="M 300,280 Q 310,340 305,390"/>
          <path d="M 300,280 Q 340,330 370,380"/>
        </g>
      `;
      break;

    case 5: // Fusarium Head
      innerArt = `
        <line x1="300" y1="390" x2="300" y2="60" stroke="#84cc16" stroke-width="6"/>
        <g fill="#fda4af" stroke="#b45309" stroke-width="1.5">
          <ellipse cx="280" cy="100" rx="20" ry="12" transform="rotate(-30 280 100)"/>
          <ellipse cx="320" cy="120" rx="20" ry="12" transform="rotate(30 320 120)"/>
          <ellipse cx="280" cy="150" rx="22" ry="13" transform="rotate(-30 280 150)"/>
          <ellipse cx="320" cy="170" rx="22" ry="13" transform="rotate(30 320 170)"/>
        </g>
        <g stroke="#eab308" stroke-width="1.5" opacity="0.8">
          <line x1="270" y1="95" x2="210" y2="40"/><line x1="330" y1="115" x2="390" y2="60"/>
        </g>
      `;
      break;

    case 6: // Leaf Blight
      innerArt = `
        <path d="M 110,400 Q 210,180 270,30 Q 320,30 370,180 Q 420,290 460,400 Z" fill="#365e2a"/>
        <ellipse cx="280" cy="160" rx="40" ry="16" fill="#78350f" stroke="#ca8a04" stroke-width="2"/>
        <ellipse cx="310" cy="240" rx="45" ry="18" fill="#451a03" stroke="#eab308" stroke-width="2"/>
        <ellipse cx="260" cy="310" rx="35" ry="14" fill="#78350f" stroke="#b45309" stroke-width="2"/>
      `;
      break;

    case 7: // Mildew
      innerArt = `
        <path d="M 120,400 Q 220,180 270,25 Q 310,25 360,180 Q 420,290 460,400 Z" fill="#234a1b"/>
        <g fill="#f8fafc" opacity="0.85">
          <circle cx="270" cy="130" r="26"/><circle cx="295" cy="155" r="20"/>
          <circle cx="245" cy="210" r="30"/><circle cx="305" cy="235" r="24"/>
          <circle cx="275" cy="290" r="32"/>
        </g>
      `;
      break;

    case 8: // Mite
      innerArt = `
        <!-- Curled wheat leaf tube -->
        <path d="M 220,400 Q 250,200 270,40 Q 300,40 310,200 Q 320,320 330,400 Z" fill="#4d7c0f" stroke="#ca8a04" stroke-width="3"/>
        <path d="M 270,40 Q 285,180 285,400" stroke="#facc15" stroke-width="2" stroke-dasharray="4,4"/>
        <circle cx="275" cy="160" r="3" fill="#ffffff"/><circle cx="280" cy="200" r="3" fill="#ffffff"/>
      `;
      break;

    case 9: // Septoria
      innerArt = `
        <path d="M 110,400 Q 220,160 270,30 Q 320,30 380,180 Q 430,300 460,400 Z" fill="#3b6228"/>
        <path d="M 230,120 Q 280,105 290,140 Q 260,160 220,140 Z" fill="#78350f" stroke="#ca8a04" stroke-width="2"/>
        <path d="M 250,210 Q 330,190 320,240 Q 270,270 240,240 Z" fill="#78350f" stroke="#eab308" stroke-width="2.5"/>
        <circle cx="260" cy="130" r="2" fill="#000"/><circle cx="280" cy="225" r="2" fill="#000"/>
      `;
      break;

    case 10: // Smut
      innerArt = `
        <line x1="300" y1="390" x2="300" y2="70" stroke="#84cc16" stroke-width="6"/>
        <!-- Complete black sooty spore mass replacing spikelets -->
        <g fill="#09090b" stroke="#27272a" stroke-width="2">
          <ellipse cx="285" cy="110" rx="22" ry="14" transform="rotate(-30 285 110)"/>
          <ellipse cx="315" cy="130" rx="22" ry="14" transform="rotate(30 315 130)"/>
          <ellipse cx="285" cy="160" rx="24" ry="15" transform="rotate(-30 285 160)"/>
          <ellipse cx="315" cy="180" rx="24" ry="15" transform="rotate(30 315 180)"/>
          <ellipse cx="285" cy="210" rx="24" ry="15" transform="rotate(-30 285 210)"/>
          <ellipse cx="315" cy="230" rx="24" ry="15" transform="rotate(30 315 230)"/>
        </g>
        <!-- Flying black teliospore powder -->
        <circle cx="250" cy="100" r="3" fill="#000"/><circle cx="340" cy="120" r="3" fill="#000"/>
        <circle cx="230" cy="150" r="2.5" fill="#000"/><circle cx="360" cy="180" r="2.5" fill="#000"/>
      `;
      break;

    case 11: // Stem_fly
      innerArt = `
        <line x1="300" y1="400" x2="300" y2="50" stroke="#84cc16" stroke-width="16"/>
        <!-- Bored hole & broken stem bend -->
        <path d="M 300,220 L 290,260 L 320,300" stroke="#713f12" stroke-width="4" fill="none"/>
        <circle cx="298" cy="235" r="5" fill="#1c1917" stroke="#b45309" stroke-width="1.5"/>
        <ellipse cx="302" cy="160" rx="3" ry="8" fill="#ca8a04"/>
      `;
      break;

    case 12: // Tan spot
      innerArt = `
        <path d="M 110,400 Q 210,180 270,30 Q 320,30 370,180 Q 420,290 460,400 Z" fill="#365e2a"/>
        <!-- Eye-like tan spot with yellow halo and dark center -->
        <ellipse cx="280" cy="150" rx="32" ry="18" fill="#facc15" opacity="0.9"/>
        <ellipse cx="280" cy="150" rx="22" ry="12" fill="#78350f"/>
        <circle cx="280" cy="150" r="5" fill="#29180c"/>

        <ellipse cx="300" cy="250" rx="36" ry="20" fill="#facc15" opacity="0.9"/>
        <ellipse cx="300" cy="250" rx="24" ry="13" fill="#78350f"/>
        <circle cx="300" cy="250" r="6" fill="#29180c"/>
      `;
      break;

    case 13: // healthy_wheat
      innerArt = `
        <defs>
          <linearGradient id="healthyLeaf" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#4ade80"/>
            <stop offset="70%" stop-color="#22c55e"/>
            <stop offset="100%" stop-color="#15803d"/>
          </linearGradient>
        </defs>
        <path d="M 120,400 Q 220,150 280,30 Q 320,30 360,170 Q 420,290 460,400 Z" fill="url(#healthyLeaf)"/>
        <line x1="290" y1="390" x2="290" y2="35" stroke="#86efac" stroke-width="3" opacity="0.7"/>
      `;
      break;

    case 14: // yellow_rust
    default:
      innerArt = `
        <path d="M 120,400 Q 180,200 240,30 Q 300,10 330,10 Q 360,200 440,400 Z" fill="#2d5a27"/>
        <g stroke="#f59e0b" stroke-width="3" stroke-dasharray="4,6,8,4">
          <line x1="260" y1="400" x2="275" y2="50"/>
          <line x1="285" y1="400" x2="290" y2="40"/>
          <line x1="305" y1="400" x2="305" y2="60"/>
        </g>
      `;
      break;
  }

  const badgeColor = cls.category === 'سليم (Healthy)' ? '#22c55e' : cls.category.includes('حشري') ? '#eab308' : '#f43f5e';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="600" height="400">
    <rect width="600" height="400" fill="#0f172a"/>
    ${innerArt}
    <!-- Label Header Badge -->
    <rect x="15" y="15" width="310" height="46" rx="8" fill="#020617" fill-opacity="0.85" stroke="${badgeColor}" stroke-width="1.5"/>
    <text x="28" y="36" fill="${badgeColor}" font-family="sans-serif" font-size="14" font-weight="bold">ID ${cls.id}: ${cls.nameAr}</text>
    <text x="28" y="52" fill="#94a3b8" font-family="monospace" font-size="11">${cls.nameEn} • ${cls.labelKey}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Build all 15 captured samples dynamically from WHEAT_15_CLASSES
export const WHEAT_DISEASE_SAMPLES: CapturedSample[] = WHEAT_15_CLASSES.map((cls, idx) => {
  const isHealthy = cls.category === 'سليم (Healthy)';
  const isCritical = cls.severityDefault.includes('شديد') || cls.severityDefault.includes('خطر');

  return {
    id: `sample-class-${cls.id}-${cls.labelKey.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
    title: `${cls.nameAr} (${cls.nameEn})`,
    diseaseHint: cls.symptoms[0] || cls.nameEn,
    category: isHealthy ? 'healthy' : cls.category.includes('حشري') ? 'parasitic' : 'fungal',
    imageUrl: generateClassVisualSvg(cls),
    coordinates: {
      lat: 31.8972 + (idx % 4) * 0.001 - 0.002,
      lng: -6.5891 + Math.floor(idx / 4) * 0.001 - 0.002,
    },
    sampleWeather: {
      temperatureC: isHealthy ? 21.0 : cls.id === 14 ? 16.5 : cls.id === 5 ? 24.5 : 22.0,
      ambientHumidityPercent: isHealthy ? 65 : cls.category === 'فطري (Fungal)' ? 84 : 62,
      soilMoisturePercent: 64,
      windSpeedKmh: 10.5,
      windDirection: 'شمالية غربية',
      leafWetnessHours: isHealthy ? 2.0 : 6.0,
      uvIndex: 5,
    },
    precomputedDiagnosis: {
      diseaseDetected: !isHealthy,
      isHealthy,
      diseaseNameAr: cls.nameAr,
      diseaseNameEn: cls.nameEn,
      pathogenScientificName: cls.scientificName,
      diseaseCategory: cls.category,
      confidenceScore: isHealthy ? 99 : 96 - (idx % 4),
      severityLevel: cls.severityDefault,
      affectedPlantPart: cls.affectedPart,
      symptomsIdentified: cls.symptoms,
      microclimateRiskAnalysis: cls.weatherRisk,
      treatmentRecommendations: {
        chemicalAction: cls.chemicalTreatment,
        biologicalAction: cls.biologicalTreatment,
        culturalPractices: cls.culturalPractices,
      },
      sprayGuidance: {
        recommendedWeatherCondition: cls.sprayConditionOptimal,
        urgency: isCritical
          ? 'فوري (خلال 24-48 ساعة)'
          : isHealthy
          ? 'غير مطلوب'
          : 'خلال 2-3 أيام',
      },
      fieldActionSummary: isHealthy
        ? 'الحقل في حالة صحية ممتازة وخالٍ تماماً من الإصابات. يوصى بمواصلة برنامج الرعاية المتوازن.'
        : `تم رصد إصابة مؤكدة بـ [${cls.nameAr}] المسببة بواسطة [${cls.scientificName}]. الإجراء الفوري: ${cls.chemicalTreatment.slice(0, 120)}...`,
    },
  };
});
