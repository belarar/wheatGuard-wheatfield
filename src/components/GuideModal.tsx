import React from 'react';
import { X, ShieldCheck, Plane, Cpu, Wifi, Smartphone, CheckCircle2, ArrowRight } from 'lucide-react';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenModelModal: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({
  isOpen,
  onClose,
  onOpenModelModal,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">
                دليل منظومة WheatGuard و WheatField المتكاملة
              </h3>
              <p className="text-xs text-slate-400">
                شرح وظيفة التطبيقين، كيفية الربط المباشر، وتوصيل نموذجك المخصص
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar text-slate-300 text-xs sm:text-sm leading-relaxed">
          {/* WheatField Card */}
          <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/30 space-y-2">
            <h4 className="font-bold text-amber-300 flex items-center gap-2 text-sm sm:text-base">
              <Plane className="w-5 h-5" />
              1. تطبيق WheatField (محاكي الدرون والمستشعرات الزراعية):
            </h4>
            <p>
              يحاكي طيران طائرة زراعية بدون طيار (Agro-Drone) فوق حقول القمح الحقيقية المحددة بالخرائط الجغرافية بالأقمار الصناعية (Satellite GIS).
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-300 mr-2">
              <li>قمرة قيادة مباشرة (FPV HUD) مع قياس الارتفاع والسرعة ومستوى البطارية وزاوية الكاميرا.</li>
              <li>فلتر المسح الطيفي (NDVI) للكشف عن بؤر الإجهاد النباتي وضعف الكلوروفيل بالأشعة تحت الحمراء.</li>
              <li>مستشعرات إنترنت الأشياء (IoT) لقياس: رطوبة الهواء، رطوبة التربة، درجة الحرارة، سرعة واتجاه الرياح، وساعات بلل الأوراق.</li>
              <li>زر <strong>"إرسال إلى WheatGuard"</strong> ينقل الصورة وقراءات الطقس فورياً للتطبيق الأول للتشخيص.</li>
            </ul>
          </div>

          {/* WheatGuard Card */}
          <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 space-y-2">
            <h4 className="font-bold text-emerald-300 flex items-center gap-2 text-sm sm:text-base">
              <ShieldCheck className="w-5 h-5" />
              2. تطبيق WheatGuard (حارس القمح والتشخيص بالذكاء الاصطناعي):
            </h4>
            <p>
              يعمل كمركز تحكم وتشخيص نباتي خبير (Plant Pathologist) يعالج عينات الصور والفيديوهات القادمة من الدرون:
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-300 mr-2">
              <li>كشف الأمراض الفطرية: الصدأ الأصفر، صدأ الأوراق البني، البياض الدقيقي، السبتوريا، لفحة الفيوزاريوم.</li>
              <li>كشف الآفات الطفيلية والحشرية: حشرات من القمح والتثاقل الطفيلي.</li>
              <li>استخراج نسبة التأكد (AI Confidence %) ومستوى خطورة الإصابة.</li>
              <li>تقديم خطة علاجية متكاملة (مبيدات فطرية جهازية، مكافحة حيوية، وتوجيهات تنظيم الري والتسميد).</li>
              <li>تقييم ملاءمة سرعة الرياح للرش الجوي وتنبيه المزارع في حال وجود خطر انجراف المبيد.</li>
            </ul>
          </div>

          {/* Custom Model Integration */}
          <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-500/30 space-y-2">
            <h4 className="font-bold text-blue-300 flex items-center gap-2 text-sm sm:text-base">
              <Cpu className="w-5 h-5" />
              3. كيف تزودني بنموذجك المخصص (Custom AI Model)؟
            </h4>
            <p>
              بناءً على طلبك: <em>"سازودك بنمودج عند ما تبني التطبيق بحيث يكشف عن امراض القمح"</em>:
            </p>
            <p className="text-slate-300">
              قمنا بتوفير <strong>بوابة النماذج المخصصة (Custom Model Hub)</strong> داخل التطبيق. يمكنك النقر على الزر بالأسفل وتعيين:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono text-blue-200 mt-2">
              <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                • Endpoint URL: رابط الـ API لسيرفرك
              </div>
              <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                • Framework: YOLO / PyTorch / TF / FastAPI
              </div>
            </div>
            <p className="mt-2 text-slate-400 text-xs">
              أو يمكنك إرسال روابط أو كود أو مواصفات نموذجك لي في المحادثة مباشرة وسأقوم بتوصيلها برمجياً فوراً!
            </p>
          </div>

          {/* Web & Mobile view */}
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 flex items-center gap-3">
            <Smartphone className="w-6 h-6 text-amber-400 shrink-0" />
            <div className="text-xs">
              <strong className="text-slate-100 block mb-0.5">العمل على الويب والهاتف المحمول:</strong>
              يمكنك في أي لحظة النقر على أيقونة الهاتف بالأعلى لمعاينة كيف يعمل التطبيقان داخل واجهة هاتف ذكي بدقة عالية، أو تفعيل "العرض المزدوج" لتشغيلهما معاً جنباً إلى جنب!
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/90">
          <button
            onClick={() => {
              onClose();
              onOpenModelModal();
            }}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-amber-400 hover:text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-xl transition-colors"
          >
            <Cpu className="w-4 h-4" />
            <span>فتح إعدادات النموذج المخصص</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-all shadow-md shadow-emerald-500/20"
          >
            فهمت، متابعة الاستخدام
          </button>
        </div>
      </div>
    </div>
  );
};
