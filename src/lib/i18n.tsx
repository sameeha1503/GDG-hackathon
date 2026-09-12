import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { LangCode } from "./domain";

type Dict = Record<string, string>;

const en: Dict = {
  "app.name": "Rakt-Link",
  "app.tag": "Continuity of care for the National Sickle Cell Anaemia Elimination Mission",
  "nav.tracker": "Follow-up tracker",
  "nav.records": "Care records",
  "nav.donors": "Blood donors",
  "nav.lookup": "Scan a record",
  "nav.signin": "Sign in",
  "nav.signout": "Sign out",
  "common.language": "Language",
  "common.offline": "Demo offline mode",
  "common.online": "Online",
  "common.offlineOn": "Offline",
  "common.lastSynced": "Last synced",
  "common.pendingSync": "waiting to sync",
  "common.cancel": "Cancel",
  "common.save": "Save",
  "common.close": "Close",
  "common.search": "Search",
  "common.all": "All",
  "common.days": "days",
  "m1.title": "Confirmatory test follow-up",
  "m1.subtitle": "People flagged on the field test who still need a confirmatory HPLC test.",
  "m1.add": "Add screened person",
  "m1.overdue": "Days waiting",
  "m1.reminder": "Send reminder",
  "m1.close": "Close record",
  "m2.title": "Portable care record",
  "m2.subtitle": "A QR reference a patient can carry to any facility in India.",
  "m3.title": "Blood donor availability",
  "m3.subtitle": "Ranked outreach list for patients living with sickle cell disease.",
};

const hi: Dict = {
  "app.name": "रक्त-लिंक",
  "app.tag": "राष्ट्रीय सिकल सेल एनीमिया उन्मूलन मिशन के लिए देखभाल की निरंतरता",
  "nav.tracker": "फॉलो-अप ट्रैकर",
  "nav.records": "देखभाल रिकॉर्ड",
  "nav.donors": "रक्तदाता",
  "nav.lookup": "रिकॉर्ड स्कैन करें",
  "nav.signin": "साइन इन",
  "nav.signout": "साइन आउट",
  "common.language": "भाषा",
  "common.offline": "डेमो ऑफ़लाइन मोड",
  "common.online": "ऑनलाइन",
  "common.offlineOn": "ऑफ़लाइन",
  "common.lastSynced": "अंतिम सिंक",
  "common.pendingSync": "सिंक होना बाकी",
  "common.cancel": "रद्द करें",
  "common.save": "सहेजें",
  "common.close": "बंद करें",
  "common.search": "खोजें",
  "common.all": "सभी",
  "common.days": "दिन",
  "m1.title": "पुष्टि जांच फॉलो-अप",
  "m1.subtitle": "फील्ड जांच में चिन्हित लोग जिनकी HPLC पुष्टि जांच बाकी है।",
  "m1.add": "नया व्यक्ति जोड़ें",
  "m1.overdue": "प्रतीक्षा के दिन",
  "m1.reminder": "रिमाइंडर भेजें",
  "m1.close": "रिकॉर्ड बंद करें",
  "m2.title": "पोर्टेबल देखभाल रिकॉर्ड",
  "m2.subtitle": "एक QR संदर्भ जिसे मरीज़ भारत में किसी भी केंद्र पर दिखा सकता है।",
  "m3.title": "रक्तदाता उपलब्धता",
  "m3.subtitle": "सिकल सेल रोग से ग्रस्त मरीज़ों के लिए संपर्क सूची।",
};

const or: Dict = {
  "app.name": "ରକ୍ତ-ଲିଙ୍କ",
  "app.tag": "ଜାତୀୟ ସିକଲ ସେଲ ଆନିମିଆ ନିର୍ମୂଳ ମିଶନ ପାଇଁ ଯତ୍ନର ନିରନ୍ତରତା",
  "nav.tracker": "ଅନୁସରଣ ଟ୍ରାକର",
  "nav.records": "ଯତ୍ନ ରେକର୍ଡ",
  "nav.donors": "ରକ୍ତଦାତା",
  "nav.lookup": "ରେକର୍ଡ ସ୍କାନ କରନ୍ତୁ",
  "nav.signin": "ସାଇନ ଇନ",
  "nav.signout": "ସାଇନ ଆଉଟ",
  "common.language": "ଭାଷା",
  "common.offline": "ଡେମୋ ଅଫଲାଇନ ମୋଡ",
  "common.online": "ଅନଲାଇନ",
  "common.offlineOn": "ଅଫଲାଇନ",
  "common.lastSynced": "ଶେଷ ସିଙ୍କ",
  "common.pendingSync": "ସିଙ୍କ ବାକି",
  "common.cancel": "ବାତିଲ",
  "common.save": "ସେଭ",
  "common.close": "ବନ୍ଦ",
  "common.search": "ଖୋଜନ୍ତୁ",
  "common.all": "ସମସ୍ତ",
  "common.days": "ଦିନ",
  "m1.title": "ନିଶ୍ଚିତକରଣ ପରୀକ୍ଷା ଅନୁସରଣ",
  "m1.subtitle": "ଫିଲଡ ପରୀକ୍ଷାରେ ଚିହ୍ନିତ ବ୍ୟକ୍ତି ଯାହାର HPLC ପରୀକ୍ଷା ବାକି ଅଛି।",
  "m1.add": "ନୂଆ ବ୍ୟକ୍ତି ଯୋଡ଼ନ୍ତୁ",
  "m1.overdue": "ଅପେକ୍ଷା ଦିନ",
  "m1.reminder": "ସ୍ମାରକ ପଠାନ୍ତୁ",
  "m1.close": "ରେକର୍ଡ ବନ୍ଦ କରନ୍ତୁ",
  "m2.title": "ପୋର୍ଟେବଲ ଯତ୍ନ ରେକର୍ଡ",
  "m2.subtitle": "ଏକ QR ସନ୍ଦର୍ଭ ଯାହା ରୋଗୀ ଯେକୌଣସି କେନ୍ଦ୍ରରେ ଦେଖାଇପାରିବ।",
  "m3.title": "ରକ୍ତଦାତା ଉପଲବ୍ଧତା",
  "m3.subtitle": "ସିକଲ ସେଲ ରୋଗୀ ପାଇଁ ସମ୍ପର୍କ ତାଲିକା।",
};

const mr: Dict = {
  "app.name": "रक्त-लिंक",
  "app.tag": "राष्ट्रीय सिकल सेल अ‍ॅनिमिया निर्मूलन अभियानासाठी काळजीची सातत्यता",
  "nav.tracker": "पाठपुरावा ट्रॅकर",
  "nav.records": "काळजी नोंद",
  "nav.donors": "रक्तदाते",
  "nav.lookup": "नोंद स्कॅन करा",
  "nav.signin": "साइन इन",
  "nav.signout": "साइन आउट",
  "common.language": "भाषा",
  "common.offline": "डेमो ऑफलाइन मोड",
  "common.online": "ऑनलाइन",
  "common.offlineOn": "ऑफलाइन",
  "common.lastSynced": "शेवटचे सिंक",
  "common.pendingSync": "सिंक होणे बाकी",
  "common.cancel": "रद्द करा",
  "common.save": "जतन करा",
  "common.close": "बंद करा",
  "common.search": "शोधा",
  "common.all": "सर्व",
  "common.days": "दिवस",
  "m1.title": "निश्चिती चाचणी पाठपुरावा",
  "m1.subtitle": "फील्ड चाचणीत नोंदवलेले लोक ज्यांची HPLC चाचणी बाकी आहे.",
  "m1.add": "नवीन व्यक्ती जोडा",
  "m1.overdue": "प्रतीक्षेचे दिवस",
  "m1.reminder": "स्मरण पाठवा",
  "m1.close": "नोंद बंद करा",
  "m2.title": "पोर्टेबल काळजी नोंद",
  "m2.subtitle": "रुग्ण कोणत्याही केंद्रावर दाखवू शकेल असा QR संदर्भ.",
  "m3.title": "रक्तदाता उपलब्धता",
  "m3.subtitle": "सिकल सेल रुग्णांसाठी संपर्क यादी.",
};

const gu: Dict = {
  "app.name": "રક્ત-લિંક",
  "app.tag": "રાષ્ટ્રીય સિકલ સેલ એનિમિયા નાબૂદી મિશન માટે સંભાળની સાતત્યતા",
  "nav.tracker": "ફોલો-અપ ટ્રેકર",
  "nav.records": "સંભાળ રેકોર્ડ",
  "nav.donors": "રક્તદાતા",
  "nav.lookup": "રેકોર્ડ સ્કેન કરો",
  "nav.signin": "સાઇન ઇન",
  "nav.signout": "સાઇન આઉટ",
  "common.language": "ભાષા",
  "common.offline": "ડેમો ઓફલાઇન મોડ",
  "common.online": "ઓનલાઇન",
  "common.offlineOn": "ઓફલાઇન",
  "common.lastSynced": "છેલ્લું સિંક",
  "common.pendingSync": "સિંક બાકી",
  "common.cancel": "રદ કરો",
  "common.save": "સાચવો",
  "common.close": "બંધ કરો",
  "common.search": "શોધો",
  "common.all": "બધા",
  "common.days": "દિવસ",
  "m1.title": "પુષ્ટિ તપાસ ફોલો-અપ",
  "m1.subtitle": "ફિલ્ડ તપાસમાં નોંધાયેલા લોકો જેમની HPLC તપાસ બાકી છે.",
  "m1.add": "નવી વ્યક્તિ ઉમેરો",
  "m1.overdue": "પ્રતીક્ષાના દિવસો",
  "m1.reminder": "રિમાઇન્ડર મોકલો",
  "m1.close": "રેકોર્ડ બંધ કરો",
  "m2.title": "પોર્ટેબલ સંભાળ રેકોર્ડ",
  "m2.subtitle": "દર્દી કોઈપણ કેન્દ્ર પર બતાવી શકે તેવો QR સંદર્ભ.",
  "m3.title": "રક્તદાતા ઉપલબ્ધતા",
  "m3.subtitle": "સિકલ સેલ રોગના દર્દીઓ માટે સંપર્ક સૂચિ.",
};

const DICTS: Record<LangCode, Dict> = { en, hi, or, mr, gu };

type I18nValue = {
  lang: LangCode;
  setLang: (l: LangCode) => void;
  t: (key: string) => string;
};

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<LangCode>("en");

  useEffect(() => {
    const stored = window.localStorage.getItem("raktlink.lang") as LangCode | null;
    if (stored && stored in DICTS) setLangState(stored);
  }, []);

  const setLang = useCallback((l: LangCode) => {
    setLangState(l);
    window.localStorage.setItem("raktlink.lang", l);
  }, []);

  const t = useCallback(
    (key: string) => DICTS[lang]?.[key] ?? en[key] ?? key,
    [lang],
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}
