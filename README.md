# موقع محاضر وخطط اللجان (عرض فقط) — بدون Google Cloud

## طريقة الاستخدام
اختر **اللجنة** ← **نوع الوثيقة** (الخطة / محضر الاجتماع) ← **الشهر**، فتظهر الوثيقة بشعار المؤسسة جاهزة لزر «طباعة A4».
(الخطة ورقة واحدة، لذلك لا تظهر قائمة الشهر عندها.)

## 1) ربط الشيت (مرة واحدة)
1. افتح الشيت ← Extensions ← Apps Script، وأضف ملفاً باسم `api` والصق فيه `api.gs`.
2. Deploy ← New deployment ← **Web app** (Execute as: Me — Who has access: Anyone).
3. الصق رابط `/exec` في `config.js` داخل `WEB_APP_URL`.
> عند تعديل `api.gs` لاحقاً: Deploy ← Manage deployments ← Edit ← New version.

## 2) أسماء اللجان
تُعدَّل في `config.js` ← `COMMITTEES`. تُطابَق اللجنة بالكلمات في `keys` مع عنوانها داخل الشيت. أي لجنة جديدة في الشيت تظهر تلقائياً.

## 3) الرفع على GitHub
ارفع كل الملفات (بما فيها `logo.jpg`)، ثم Settings ← Pages ← Branch: main.
للطباعة فعّل «رسومات الخلفية» (Background graphics) ليظهر لون العناوين.
