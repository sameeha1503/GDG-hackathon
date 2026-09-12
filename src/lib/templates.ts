import type { LangCode } from "./domain";

/**
 * Static reminder message templates. These are fixed, human-reviewed strings —
 * NOT live machine translation. In production these would be handed to an
 * SMS/IVR provider; here they are only written to the reminder activity log.
 */
export const REMINDER_TEMPLATES: Record<LangCode, string> = {
  en: "Hello {name}, your sickle cell confirmatory test (HPLC) at {phc} is still pending ({days} days). Please visit your district hospital lab. - NSCAEM",
  hi: "नमस्ते {name}, {phc} से आपकी सिकल सेल पुष्टि जांच (HPLC) अभी बाकी है ({days} दिन)। कृपया जिला अस्पताल की प्रयोगशाला में जाएँ। - NSCAEM",
  or: "ନମସ୍କାର {name}, {phc} ରୁ ଆପଣଙ୍କ ସିକଲ ସେଲ ନିଶ୍ଚିତକରଣ ପରୀକ୍ଷା (HPLC) ଏପର୍ଯ୍ୟନ୍ତ ବାକି ଅଛି ({days} ଦିନ)। ଦୟାକରି ଜିଲ୍ଲା ଡାକ୍ତରଖାନା ଲାବକୁ ଯାଆନ୍ତୁ। - NSCAEM",
  mr: "नमस्कार {name}, {phc} येथून तुमची सिकल सेल निश्चिती चाचणी (HPLC) प्रलंबित आहे ({days} दिवस). कृपया जिल्हा रुग्णालयाच्या प्रयोगशाळेत भेट द्या. - NSCAEM",
  gu: "નમસ્તે {name}, {phc} થી તમારી સિકલ સેલ પુષ્ટિ તપાસ (HPLC) બાકી છે ({days} દિવસ). કૃપા કરીને જિલ્લા હોસ્પિટલની લેબમાં જાઓ. - NSCAEM",
};

export function buildReminder(
  lang: LangCode,
  vars: { name: string; phc: string; days: number },
): string {
  return (REMINDER_TEMPLATES[lang] ?? REMINDER_TEMPLATES.en)
    .replace("{name}", vars.name)
    .replace("{phc}", vars.phc)
    .replace("{days}", String(vars.days));
}
