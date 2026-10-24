import React, { useState, useRef } from 'react';
import { WHEAT_15_CLASSES } from '../data/wheatLabels';
import {
  FileCode,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  Cpu,
  Layers,
  Sparkles,
  X,
  Play,
  FileCheck,
} from 'lucide-react';

interface TFLiteModelManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTfliteFile: { name: string; size: number; lastModified: number } | null;
  onLoadTfliteFile: (fileInfo: { name: string; size: number; lastModified: number; buffer?: ArrayBuffer }) => void;
}

export const TFLiteModelManagerModal: React.FC<TFLiteModelManagerModalProps> = ({
  isOpen,
  onClose,
  activeTfliteFile,
  onLoadTfliteFile,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'sources' | 'classes' | 'colab'>('upload');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const pythonExportCode = `# كود بايثون لتصدير نموذجك المدرب إلى صيغة TFLite مع الـ 15 صنفاً المعتمدة
import tensorflow as tf

# 1. إذا كان نموذجك مدرباً في Keras / TensorFlow (.h5 أو SavedModel):
# model = tf.keras.models.load_model('wheat_disease_model.h5')
converter = tf.lite.TFLiteConverter.from_keras_model(model)

# تفعيل تحسين وضغط الحجم للعمل فائق السرعة على الهواتف والمتصفح (Quantization)
converter.optimizations = [tf.lite.Optimize.DEFAULT]

# تصدير ملف .tflite
tflite_model = converter.convert()
with open('wheat_disease_model.tflite', 'wb') as f:
    f.write(tflite_model)

print("تم تصدير ملف wheat_disease_model.tflite بنجاح!")

# 2. أو إذا كان نموذجك من نوع YOLOv8 / YOLOv11 (Ultralytics):
# from ultralytics import YOLO
# yolo_model = YOLO('best.pt')
# yolo_model.export(format='tflite', int8=False)
`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(pythonExportCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.tflite') && !file.name.endsWith('.bin')) {
      setStatusMessage('تنبيه: يفضل اختيار ملف بامتداد .tflite لضمان التوافق مع المعالج.');
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const buffer = event.target?.result as ArrayBuffer;
      onLoadTfliteFile({
        name: file.name,
        size: file.size,
        lastModified: file.lastModified,
        buffer,
      });
      setStatusMessage(`تم تحميل النموذج [${file.name}] (${(file.size / (1024 * 1024)).toFixed(2)} ميغابايت) بنجاح وربطه بمصنف الـ 15 صنفاً!`);
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                <span>أين تجلب وتثبت نموذج الكشف TFLite؟</span>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                  15 Classes Model
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                تنزيل، رفع، وتوصيل نموذج TensorFlow Lite لكشف أمراض القمح الـ 15 المعتمدة
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-800 bg-slate-950/40 overflow-x-auto">
          <button
            onClick={() => setActiveTab('upload')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'upload'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>رفع ملف النموذج (.tflite)</span>
          </button>

          <button
            onClick={() => setActiveTab('sources')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'sources'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ExternalLink className="w-4 h-4" />
            <span>أين تجد نماذج جاهزة مجانية؟</span>
          </button>

          <button
            onClick={() => setActiveTab('colab')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'colab'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span>كود تصدير بايثون و Google Colab</span>
          </button>

          <button
            onClick={() => setActiveTab('classes')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'classes'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>قائمة الـ 15 صنفاً المدربة (عربي / English)</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar text-xs sm:text-sm">
          {/* TAB 1: Direct File Upload */}
          {activeTab === 'upload' && (
            <div className="space-y-5 animate-fade-in">
              {/* Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer border-2 border-dashed border-amber-500/40 hover:border-amber-400 rounded-2xl p-8 bg-slate-950/60 hover:bg-slate-950/90 transition-all flex flex-col items-center justify-center text-center gap-3 group"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".tflite,.bin"
                  className="hidden"
                />
                <div className="p-4 rounded-2xl bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform">
                  <Upload className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-200 text-base">
                    انقر هنا لاختيار ملف النموذج <span className="font-mono text-amber-400">.tflite</span> أو اسحبه هنا
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    يدعم نماذج MobileNetV2, EfficientNet-Lite, ResNet50, و YOLO المصدرة لصيغة TFLite
                  </p>
                </div>
                <span className="text-[11px] px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  يعمل محلياً بنسبة 100% داخل المتصفح وبدون رفع لبياناتك للخارج
                </span>
              </div>

              {/* Status Message */}
              {statusMessage && (
                <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{statusMessage}</span>
                </div>
              )}

              {/* Current Active Model Card */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">حالة نموذج الكشف الحالي:</span>
                    <strong className="text-slate-100 text-sm">
                      {activeTfliteFile ? activeTfliteFile.name : 'نموذج Gemini 3.8 Flash Plant Pathologist (مدمج واحتياطي)'}
                    </strong>
                    {activeTfliteFile && (
                      <span className="text-xs text-slate-400 block font-mono mt-0.5">
                        الحجم: {(activeTfliteFile.size / (1024 * 1024)).toFixed(2)} MB • جاهز للاستدلال المباشر
                      </span>
                    )}
                  </div>
                </div>

                <span className="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
                  مفعل ونشط
                </span>
              </div>
            </div>
          )}

          {/* TAB 2: Where to get Free Models (Sources) */}
          {activeTab === 'sources' && (
            <div className="space-y-4 animate-fade-in text-slate-300 leading-relaxed">
              <h4 className="font-bold text-amber-300 text-base">
                أين تجلب وتجد نموذج كشف أمراض القمح TFLite؟
              </h4>
              <p className="text-xs text-slate-300">
                يمكنك الحصول على نموذج TFLite جاهز أو تدريبه مجاناً باتباع إحدى هذه الطرق الثلاث:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
                {/* Source 1 */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm mb-1">
                      <span>1. منصة Kaggle & GitHub</span>
                    </div>
                    <p className="text-xs text-slate-400">
                      ابحث في Kaggle Models عن <em>"Wheat Leaf Disease Classification TFLite"</em> أو <em>"Global Wheat Disease Dataset"</em>، وستجد مئات النماذج المدربة مسبقاً والمتاحة للتنزيل المباشر بصيغة .tflite.
                    </p>
                  </div>
                  <div className="text-[11px] text-emerald-400 font-mono">
                    Keywords: wheat rust, tflite, plantvillage
                  </div>
                </div>

                {/* Source 2 */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center gap-2 text-sky-400 font-bold text-sm mb-1">
                      <span>2. مستودع Hugging Face Hub</span>
                    </div>
                    <p className="text-xs text-slate-400">
                      يحتوي على نماذج MobileNetV2 و YOLOv8 المحولة خصيصاً إلى TFLite للأجهزة الطرفية (Edge Devices) لتصنيف أمراض الحبوب والقمح.
                    </p>
                  </div>
                  <div className="text-[11px] text-sky-400 font-mono">
                    HuggingFace: huggingface.co/models?search=wheat
                  </div>
                </div>

                {/* Source 3 */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center gap-2 text-amber-400 font-bold text-sm mb-1">
                      <span>3. تدريب مجاني بنقرة واحدة (Teachable Machine)</span>
                    </div>
                    <p className="text-xs text-slate-400">
                      منصة Google Teachable Machine: قم برفع صور كل مرض من الـ 15 صنفاً في مجلد خاص، اضغط Train، ثم اختر Export Model &gt; TensorFlow Lite &gt; Download!
                    </p>
                  </div>
                  <div className="text-[11px] text-amber-400 font-mono">
                    teachablemachine.withgoogle.com
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Python Colab Script */}
          {activeTab === 'colab' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-100 text-sm">
                    شفرة تصدير TFLite المباشرة في Google Colab / Python:
                  </h4>
                  <p className="text-xs text-slate-400">
                    انسخ هذا الكود في مفكرتك البرمجية لتحويل نموذجك إلى صيغة TFLite وحفظ ملف الـ labels
                  </p>
                </div>
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedCode ? 'تم النسخ!' : 'نسخ الكود'}</span>
                </button>
              </div>

              <div className="relative rounded-2xl bg-slate-950 border border-slate-800 p-4 font-mono text-xs text-emerald-400 overflow-x-auto" dir="ltr">
                <pre>{pythonExportCode}</pre>
              </div>
            </div>
          )}

          {/* TAB 4: 15 Classes Table */}
          {activeTab === 'classes' && (
            <div className="space-y-3 animate-fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h4 className="font-bold text-slate-100 text-sm">
                  قائمة الأصناف الـ 15 المعتمدة في النموذج (ID 0 إلى ID 14):
                </h4>
                <span className="text-xs text-slate-400 font-mono">
                  طِبقاً لملف labelwheat_55f4afd4.txt
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-mono">
                      <th className="p-2.5">ID</th>
                      <th className="p-2.5">Label (English)</th>
                      <th className="p-2.5">الاسم بالعربية</th>
                      <th className="p-2.5">المسبب العلمي</th>
                      <th className="p-2.5">التصنيف</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {WHEAT_15_CLASSES.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-2.5 font-mono font-bold text-amber-400">ID {item.id}</td>
                        <td className="p-2.5 font-mono font-semibold text-slate-200">{item.nameEn}</td>
                        <td className="p-2.5 font-bold text-emerald-300">{item.nameAr}</td>
                        <td className="p-2.5 text-slate-400 italic text-[11px] font-mono">{item.scientificName}</td>
                        <td className="p-2.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              item.category === 'سليم (Healthy)'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : item.category.includes('حشري')
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            }`}
                          >
                            {item.category}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/90">
          <span className="text-xs text-slate-400">
            تتوافق المنظومة مع TFLite ومع نموذج الذكاء الاصطناعي الزراعي المدمج
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-md shadow-amber-500/20"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
