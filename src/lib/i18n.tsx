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
  // App Shell & Branding
  "app.name": "Rakt-Link",
  "app.subtitle": "NSCAEM prototype",
  "app.mission": "National Sickle Cell Anaemia Elimination Mission",
  "app.tag": "Continuity of care for the National Sickle Cell Anaemia Elimination Mission",
  "app.footer":
    "Prototype for the National Sickle Cell Anaemia Elimination Mission. Reminders, ABHA IDs and donor outreach are simulated for demonstration; no messages are actually sent.",
  "role.health_worker": "ASHA / PHC worker",
  "role.blood_bank": "Blood bank staff",

  // Navigation
  "nav.tracker": "Follow-up tracker",
  "nav.records": "Care records",
  "nav.donors": "Blood donors",
  "nav.lookup": "Scan a record",
  "nav.signin": "Sign in",
  "nav.signout": "Sign out",

  // Common
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
  "common.open": "Open",
  "common.email": "Email",
  "common.password": "Password",
  "common.loading": "Loading…",
  "common.actions": "Actions",
  "common.status": "Status",
  "common.district": "District",
  "common.facility": "Facility",
  "common.patient": "Patient",
  "common.phone": "Phone number",
  "common.date": "Date",
  "common.notes": "Notes",
  "common.updated": "Updated",

  // Home Page
  "home.hero.title": "Rakt-Link keeps the care journey joined up after the field screening test.",
  "home.hero.signin": "Sign in as a health worker",
  "home.hero.scan": "Scan a patient's QR record",
  "home.card1.title": "Confirmatory test follow-up",
  "home.card1.body":
    "Everyone flagged on a field screening test, with clear 7 / 14 / 21 day waiting flags and a reminder log in five languages.",
  "home.card2.title": "Portable care record",
  "home.card2.body":
    "A QR reference a patient carries between facilities. Only people with a documented confirmatory report can have one.",
  "home.card3.title": "Blood donor availability",
  "home.card3.body":
    "For patients living with sickle cell disease: transparent donor ranking, staged outreach and donor privacy by design.",
  "home.demo.title": "Demo logins",
  "home.demo.subtitle":
    "This prototype is pre-loaded with realistic demonstration data across all three modules.",
  "home.demo.notice":
    "Eligibility rules and donor privacy are enforced on the server, not just hidden in the screens. Reminders, ABHA numbers and donor outreach are simulated.",

  // Auth Page
  "auth.title": "Sign in",
  "auth.subtitle":
    "Health workers see full records. Anyone can still check whether a QR record exists, without any medical detail.",
  "auth.signinBtn": "Sign in",
  "auth.signingIn": "Signing in…",
  "auth.demoAccounts": "Demo logins",

  // Lookup Page
  "lookup.title": "Scan a care record",
  "lookup.subtitle":
    "Point the camera at a patient's Rakt-Link QR code, or type the reference printed under it.",
  "lookup.cameraScan": "Camera scan",
  "lookup.startCamera": "Start camera",
  "lookup.manualEntry": "Type the reference",
  "lookup.recordFound": "This care record exists.",
  "lookup.recordFoundNote":
    "Medical details are not shown to unauthenticated users. A signed-in health worker can open the full record.",
  "lookup.signinToView": "Sign in to view it",
  "lookup.recordNotFound": "No record matches that reference.",
  "lookup.placeholder": "e.g. RL-XXXXXX",

  // Tracker
  "m1.title": "Confirmatory test follow-up",
  "m1.subtitle": "People flagged on the field test who still need a confirmatory HPLC test.",
  "m1.add": "Add screened person",
  "m1.overdue": "Days waiting",
  "m1.reminder": "Send reminder",
  "m1.close": "Close record",
  "m1.stat.waiting": "Awaiting confirmation",
  "m1.stat.d7": "Overdue 7+ days",
  "m1.stat.d14": "Overdue 14+ days",
  "m1.stat.d21": "Critical 21+ days",
  "m1.band.on_track": "On track",
  "m1.band.d7": "Overdue 7+ days",
  "m1.band.d14": "Overdue 14+ days",
  "m1.band.d21": "Overdue 21+ days",
  "m1.status.awaiting": "Awaiting confirmation",
  "m1.status.unverified": "Tested, no report seen",
  "m1.status.documented": "Documented result",
  "m1.sort.waiting": "Longest waiting first",
  "m1.sort.name": "Name",
  "m1.filter.status": "Status",
  "m1.filter.band": "Overdue band",
  "m1.filter.district": "District",
  "m1.filter.sort": "Sort by",
  "m1.searchPlaceholder": "Name or code",

  // Records
  "m2.title": "Portable care record",
  "m2.subtitle": "A QR reference a patient can carry to any facility in India.",
  "m2.createBtn": "Create care record",
  "m2.searchPlaceholder": "Search by name, reference or ABHA…",
  "m2.statusActive": "Active treatment",
  "m2.statusMonitoring": "Routine monitoring",
  "m2.statusTransferred": "Transferred out",
  "m2.statusLost": "Lost to follow-up",

  // Donors
  "m3.title": "Blood donor availability",
  "m3.subtitle": "Ranked outreach list for patients living with sickle cell disease.",
  "m3.requestTitle": "Recipient request",
  "m3.bloodGroup": "Blood group",
  "m3.urgency": "Urgency",
  "m3.units": "Units needed",
  "m3.findBtn": "Find compatible donors",
  "m3.rankedTitle": "Ranked donor list",
  "m3.matchScore": "Match score",
  "m3.contactBtn": "Contact donor",
};

const hi: Dict = {
  // App Shell & Branding
  "app.name": "रक्त-लिंक",
  "app.subtitle": "NSCAEM प्रोटोटाइप",
  "app.mission": "राष्ट्रीय सिकल सेल एनीमिया उन्मूलन मिशन",
  "app.tag": "राष्ट्रीय सिकल सेल एनीमिया उन्मूलन मिशन के लिए देखभाल की निरंतरता",
  "app.footer":
    "राष्ट्रीय सिकल सेल एनीमिया उन्मूलन मिशन के लिए प्रोटोटाइप। रिमाइंडर, आभा (ABHA) आईडी और रक्तदाता संपर्क केवल प्रदर्शन के लिए सिमुलेटेड हैं; कोई वास्तविक संदेश नहीं भेजा जाता है।",
  "role.health_worker": "आशा / PHC कार्यकर्ता",
  "role.blood_bank": "ब्लड बैंक कर्मचारी",

  // Navigation
  "nav.tracker": "फॉलो-अप ट्रैकर",
  "nav.records": "देखभाल रिकॉर्ड",
  "nav.donors": "रक्तदाता",
  "nav.lookup": "रिकॉर्ड स्कैन करें",
  "nav.signin": "साइन इन",
  "nav.signout": "साइन आउट",

  // Common
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
  "common.open": "खोलें",
  "common.email": "ईमेल",
  "common.password": "पासवर्ड",
  "common.loading": "लोड हो रहा है…",
  "common.actions": "कार्रवाई",
  "common.status": "स्थिति",
  "common.district": "ज़िला",
  "common.facility": "स्वास्थ्य केंद्र",
  "common.patient": "मरीज़",
  "common.phone": "फ़ोन नंबर",
  "common.date": "तारीख",
  "common.notes": "टिप्पणियाँ",
  "common.updated": "अंतिम अपडेट",

  // Home Page
  "home.hero.title": "रक्त-लिंक फील्ड स्क्रीनिंग जांच के बाद देखभाल की निरंतरता सुनिश्चित करता है।",
  "home.hero.signin": "स्वास्थ्य कार्यकर्ता के रूप में साइन इन करें",
  "home.hero.scan": "मरीज़ का QR रिकॉर्ड स्कैन करें",
  "home.card1.title": "पुष्टि जांच फॉलो-अप",
  "home.card1.body":
    "फील्ड स्क्रीनिंग में चिन्हित सभी व्यक्ति, 7 / 14 / 21 दिनों की स्पष्ट प्रतीक्षा स्थिति और पाँच भाषाओं में रिमाइंडर लॉग के साथ।",
  "home.card2.title": "पोर्टेबल देखभाल रिकॉर्ड",
  "home.card2.body":
    "एक QR संदर्भ जिसे मरीज़ विभिन्न स्वास्थ्य केंद्रों के बीच साथ रख सकता है। केवल दस्तावेजी पुष्टि रिपोर्ट वाले व्यक्तियों के लिए उपलब्ध।",
  "home.card3.title": "रक्तदाता उपलब्धता",
  "home.card3.body":
    "सिकल सेल रोग से पीड़ित मरीज़ों के लिए: पारदर्शी रक्तदाता रैंकिंग, चरणबद्ध संपर्क और गोपनीयता सुरक्षा।",
  "home.demo.title": "डेमो लॉगिन",
  "home.demo.subtitle":
    "यह प्रोटोटाइप तीनों मॉड्यूल में वास्तविक प्रदर्शन डेटा के साथ पहले से लोड है।",
  "home.demo.notice":
    "पात्रता नियम और रक्तदाता गोपनीयता सर्वर पर लागू होती है। रिमाइंडर, आभा (ABHA) आईडी और रक्तदाता संपर्क केवल प्रदर्शन के लिए सिमुलेटेड हैं।",

  // Auth Page
  "auth.title": "साइन इन",
  "auth.subtitle":
    "स्वास्थ्य कार्यकर्ता पूरा रिकॉर्ड देख सकते हैं। कोई भी व्यक्ति बिना किसी चिकित्सा विवरण के यह जांच सकता है कि QR रिकॉर्ड मौजूद है या नहीं।",
  "auth.signinBtn": "साइन इन करें",
  "auth.signingIn": "साइन इन हो रहा है…",
  "auth.demoAccounts": "डेमो खाते",

  // Lookup Page
  "lookup.title": "रिकॉर्ड स्कैन करें",
  "lookup.subtitle":
    "मरीज़ के रक्त-लिंक QR कोड पर कैमरा रखें, या नीचे छपा संदर्भ कोड टाइप करें।",
  "lookup.cameraScan": "कैमरा स्कैन",
  "lookup.startCamera": "कैमरा शुरू करें",
  "lookup.manualEntry": "संदर्भ कोड टाइप करें",
  "lookup.recordFound": "यह देखभाल रिकॉर्ड मौजूद है।",
  "lookup.recordFoundNote":
    "अनधिकृत उपयोगकर्ताओं को चिकित्सा विवरण नहीं दिखाए जाते हैं। साइन-इन किया हुआ स्वास्थ्य कार्यकर्ता पूरा रिकॉर्ड देख सकता है।",
  "lookup.signinToView": "इसे देखने के लिए साइन इन करें",
  "lookup.recordNotFound": "इस संदर्भ से कोई रिकॉर्ड मेल नहीं खाता।",
  "lookup.placeholder": "उदा. RL-XXXXXX",

  // Tracker
  "m1.title": "पुष्टि जांच फॉलो-अप",
  "m1.subtitle": "फील्ड जांच में चिन्हित लोग जिनकी HPLC पुष्टि जांच बाकी है।",
  "m1.add": "नया व्यक्ति जोड़ें",
  "m1.overdue": "प्रतीक्षा के दिन",
  "m1.reminder": "रिमाइंडर भेजें",
  "m1.close": "रिकॉर्ड बंद करें",
  "m1.stat.waiting": "पुष्टि की प्रतीक्षा",
  "m1.stat.d7": "7+ दिन से लंबित",
  "m1.stat.d14": "14+ दिन से लंबित",
  "m1.stat.d21": "गंभीर 21+ दिन",
  "m1.band.on_track": "समय पर",
  "m1.band.d7": "7+ दिन से लंबित",
  "m1.band.d14": "14+ दिन से लंबित",
  "m1.band.d21": "गंभीर 21+ दिन",
  "m1.status.awaiting": "पुष्टि की प्रतीक्षा",
  "m1.status.unverified": "जांच हुई, रिपोर्ट नहीं देखी",
  "m1.status.documented": "दस्तावेजी परिणाम",
  "m1.sort.waiting": "अधिक प्रतीक्षा वाले पहले",
  "m1.sort.name": "नाम",
  "m1.filter.status": "स्थिति",
  "m1.filter.band": "प्रतीक्षा अवधि",
  "m1.filter.district": "ज़िला",
  "m1.filter.sort": "क्रमबद्ध करें",
  "m1.searchPlaceholder": "नाम या कोड",

  // Records
  "m2.title": "पोर्टेबल देखभाल रिकॉर्ड",
  "m2.subtitle": "एक QR संदर्भ जिसे मरीज़ भारत में किसी भी केंद्र पर दिखा सकता है।",
  "m2.createBtn": "देखभाल रिकॉर्ड बनाएं",
  "m2.searchPlaceholder": "नाम, संदर्भ या आभा (ABHA) से खोजें…",
  "m2.statusActive": "सक्रिय उपचार",
  "m2.statusMonitoring": "नियमित निगरानी",
  "m2.statusTransferred": "स्थानांतरित",
  "m2.statusLost": "फॉलो-अप छूटा",

  // Donors
  "m3.title": "रक्तदाता उपलब्धता",
  "m3.subtitle": "सिकल सेल रोग से ग्रस्त मरीज़ों के लिए संपर्क सूची।",
  "m3.requestTitle": "रक्त अनुरोध विवरण",
  "m3.bloodGroup": "रक्त समूह",
  "m3.urgency": "प्राथमिकता",
  "m3.units": "आवश्यक यूनिट",
  "m3.findBtn": "संगत रक्तदाता खोजें",
  "m3.rankedTitle": "प्राथमिकता रक्तदाता सूची",
  "m3.matchScore": "मैच स्कोर",
  "m3.contactBtn": "रक्तदाता से संपर्क करें",
};

const or: Dict = {
  // App Shell & Branding
  "app.name": "ରକ୍ତ-ଲିଙ୍କ",
  "app.subtitle": "NSCAEM ପ୍ରୋଟୋଟାଇପ୍",
  "app.mission": "ଜାତୀୟ ସିକଲ ସେଲ ଆନିମିଆ ନିର୍ମୂଳ ମିଶନ",
  "app.tag": "ଜାତୀୟ ସିକଲ ସେଲ ଆନିମିଆ ନିର୍ମୂଳ ମିଶନ ପାଇଁ ଯତ୍ନର ନିରନ୍ତରତା",
  "app.footer":
    "ଜାତୀୟ ସିକଲ ସେଲ ଆନିମିଆ ନିର୍ମୂଳ ମିଶନ ପାଇଁ ପ୍ରୋଟୋଟାଇପ୍। ସ୍ମାରକ, ଆଭା (ABHA) ID ଏବଂ ରକ୍ତଦାତା ସମ୍ପର୍କ କେବଳ ପ୍ରଦର୍ଶନ ପାଇଁ; ପ୍ରକୃତ ବାର୍ତ୍ତା ପଠାଯାଇ ନାହିଁ।",
  "role.health_worker": "ଆଶା / PHC କର୍ମୀ",
  "role.blood_bank": "ରକ୍ତ ଭଣ୍ଡାର କର୍ମଚାରୀ",

  // Navigation
  "nav.tracker": "ଅନୁସରଣ ଟ୍ରାକର",
  "nav.records": "ଯତ୍ନ ରେକର୍ଡ",
  "nav.donors": "ରକ୍ତଦାତା",
  "nav.lookup": "ରେକର୍ଡ ସ୍କାନ କରନ୍ତୁ",
  "nav.signin": "ସାଇନ ଇନ",
  "nav.signout": "ସାଇନ ଆଉଟ",

  // Common
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
  "common.open": "ଖୋଲନ୍ତୁ",
  "common.email": "ଇମେଲ",
  "common.password": "ପାସୱାର୍ଡ",
  "common.loading": "ଲୋଡ୍ ହେଉଛି…",
  "common.actions": "କାର୍ଯ୍ୟାନୁଷ୍ଠାନ",
  "common.status": "ସ୍ଥିତି",
  "common.district": "ଜିଲ୍ଲା",
  "common.facility": "ସ୍ୱାସ୍ଥ୍ୟ କେନ୍ଦ୍ର",
  "common.patient": "ରୋଗୀ",
  "common.phone": "ଫୋନ ନମ୍ବର",
  "common.date": "ତାରିଖ",
  "common.notes": "ଟିପ୍ପଣୀ",
  "common.updated": "ଅପଡେଟ୍ ହୋଇଛି",

  // Home Page
  "home.hero.title": "ରକ୍ତ-ଲିଙ୍କ ଫିଲ୍ଡ ସ୍କ୍ରିନିଂ ପରୀକ୍ଷା ପରେ ଯତ୍ନର ନିରନ୍ତରତା ବଜାୟ ରଖେ।",
  "home.hero.signin": "ସ୍ୱାସ୍ଥ୍ୟ କର୍ମୀ ଭାବରେ ସାଇନ ଇନ କରନ୍ତୁ",
  "home.hero.scan": "ରୋଗୀଙ୍କ QR ରେକର୍ଡ ସ୍କାନ କରନ୍ତୁ",
  "home.card1.title": "ନିଶ୍ଚିତକରଣ ପରୀକ୍ଷା ଅନୁସରଣ",
  "home.card1.body":
    "ଫିଲ୍ଡ ସ୍କ୍ରିନିଂରେ ଚିହ୍ନିତ ସମସ୍ତ ବ୍ୟକ୍ତି, ୭ / ୧୪ / ୨୧ ଦିନର ସ୍ପଷ୍ଟ ପ୍ରତୀକ୍ଷା ସୂଚକ ଏବଂ ପାଞ୍ଚଟି ଭାଷାରେ ସ୍ମାରକ ଲଗ୍ ସହିତ।",
  "home.card2.title": "ପୋର୍ଟେବଲ ଯତ୍ନ ରେକର୍ଡ",
  "home.card2.body":
    "ଏକ QR ସନ୍ଦର୍ଭ ଯାହା ରୋଗୀ ବିଭିନ୍ନ କେନ୍ଦ୍ର ମଧ୍ୟରେ ନେଇପାରିବେ। କେବଳ ଡକ୍ୟୁମେଣ୍ଟେଡ୍ ନିଶ୍ଚିତକରଣ ରିପୋର୍ଟ ଥିବା ଲୋକଙ୍କ ପାଇଁ ଉପଲବ୍ଧ।",
  "home.card3.title": "ରକ୍ତଦାତା ଉପଲବ୍ଧତା",
  "home.card3.body":
    "ସିକଲ ସେଲ ରୋଗୀଙ୍କ ପାଇଁ: ସ୍ୱଚ୍ଛ ରକ୍ତଦାତା ମାନ୍ୟତା, ପର୍ଯ୍ୟାୟକ୍ରମେ ଯୋଗାଯୋଗ ଏବଂ ଗୋପନୀୟତା ସୁରକ୍ଷା।",
  "home.demo.title": "ଡେମୋ ଲଗଇନ",
  "home.demo.subtitle":
    "ଏହି ପ୍ରୋଟୋଟାଇପ୍ ତିନୋଟି ଯାକ ମଡ୍ୟୁଲରେ ବାସ୍ତବିକ ତଥ୍ୟ ସହିତ ପ୍ରି-ଲୋଡ୍ ଅଛି।",
  "home.demo.notice":
    "ଯୋଗ୍ୟତା ନିୟମ ଏବଂ ରକ୍ତଦାତା ଗୋପନୀୟତା ସର୍ଭରରେ ଲାଗୁ ହୋଇଛି। ସ୍ମାରକ, ଆଭା (ABHA) ID ଏବଂ ରକ୍ତଦାତା ସମ୍ପର୍କ ପ୍ରଦର୍ଶନ ପାଇଁ ସିମୁଲେଟ୍ କରାଯାଇଛି।",

  // Auth Page
  "auth.title": "ସାଇନ ଇନ",
  "auth.subtitle":
    "ସ୍ୱାସ୍ଥ୍ୟ କର୍ମୀ ସମ୍ପୂର୍ଣ୍ଣ ରେକର୍ଡ ଦେଖିପାରିବେ। ଯେକୌଣସି ବ୍ୟକ୍ତି ଡାକ୍ତରୀ ବିବରଣୀ ବିନା QR ରେକର୍ଡ ଅଛି କି ନାହିଁ ଯାଞ୍ଚ କରିପାରିବେ।",
  "auth.signinBtn": "ସାଇନ ଇନ କରନ୍ତୁ",
  "auth.signingIn": "ସାଇନ ଇନ ହେଉଛି…",
  "auth.demoAccounts": "ଡେମୋ ଆକାଉଣ୍ଟ",

  // Lookup Page
  "lookup.title": "ରେକର୍ଡ ସ୍କାନ କରନ୍ତୁ",
  "lookup.subtitle":
    "ରୋଗୀଙ୍କ ରକ୍ତ-ଲିଙ୍କ QR କୋଡ୍ ଆଡକୁ କ୍ୟାମେରା ଲକ୍ଷ୍ୟ କରନ୍ତୁ, କିମ୍ବା ତଳେ ଥିବା ରେଫରେନ୍ସ କୋଡ୍ ଟାଇପ୍ କରନ୍ତୁ।",
  "lookup.cameraScan": "କ୍ୟାମେରା ସ୍କାନ",
  "lookup.startCamera": "କ୍ୟାମେରା ଆରମ୍ଭ କରନ୍ତୁ",
  "lookup.manualEntry": "ରେଫରେନ୍ସ କୋଡ୍ ଟାଇପ୍ କରନ୍ତୁ",
  "lookup.recordFound": "ଏହି ଯତ୍ନ ରେକର୍ଡ ଉପଲବ୍ଧ ଅଛି।",
  "lookup.recordFoundNote":
    "ଅଣ-ପ୍ରମାଣୀକୃତ ଉପଭୋକ୍ତାଙ୍କୁ ଡାକ୍ତରୀ ବିବରଣୀ ଦେଖାଯାଏ ନାହିଁ। ସାଇନ-ଇନ ଥିବା ସ୍ୱାସ୍ଥ୍ୟ କର୍ମୀ ସମ୍ପୂର୍ଣ୍ଣ ରେକର୍ଡ ଦେଖିପାରିବେ।",
  "lookup.signinToView": "ଏହା ଦେଖିବା ପାଇଁ ସାଇନ ଇନ କରନ୍ତୁ",
  "lookup.recordNotFound": "ଏହି ରେଫରେନ୍ସ ସହିତ କୌଣସି ରେକର୍ଡ ମିଳିଲା ନାହିଁ।",
  "lookup.placeholder": "ଉଦା. RL-XXXXXX",

  // Tracker
  "m1.title": "ନିଶ୍ଚିତକରଣ ପରୀକ୍ଷା ଅନୁସରଣ",
  "m1.subtitle": "ଫିଲଡ ପରୀକ୍ଷାରେ ଚିହ୍ନିତ ବ୍ୟକ୍ତି ଯାହାର HPLC ପରୀକ୍ଷା ବାକି ଅଛି।",
  "m1.add": "ନୂଆ ବ୍ୟକ୍ତି ଯୋଡ଼ନ୍ତୁ",
  "m1.overdue": "ଅପେକ୍ଷା ଦିନ",
  "m1.reminder": "ସ୍ମାରକ ପଠାନ୍ତୁ",
  "m1.close": "ରେକର୍ଡ ବନ୍ଦ କରନ୍ତୁ",
  "m1.stat.waiting": "ନିଶ୍ଚିତକରଣ ପ୍ରତୀକ୍ଷାରେ",
  "m1.stat.d7": "୭+ ଦିନରୁ ବାକି",
  "m1.stat.d14": "୧୪+ ଦିନରୁ ବାକି",
  "m1.stat.d21": "ଗୁରୁତର ୨୧+ ଦିନ",
  "m1.band.on_track": "ସମୟାନୁସାରେ",
  "m1.band.d7": "୭+ ଦିନରୁ ବାକି",
  "m1.band.d14": "୧୪+ ଦିନରୁ ବାକି",
  "m1.band.d21": "ଗୁରୁତର ୨୧+ ଦିନ",
  "m1.status.awaiting": "ନିଶ୍ଚିତକରଣ ପ୍ରତୀକ୍ଷାରେ",
  "m1.status.unverified": "ପରୀକ୍ଷିତ, ରିପୋର୍ଟ ଦେଖାଯାଇ ନାହିଁ",
  "m1.status.documented": "ନଥିଭୁକ୍ତ ଫଳାଫଳ",
  "m1.sort.waiting": "ଅଧିକ ପ୍ରତୀକ୍ଷା ପ୍ରଥମେ",
  "m1.sort.name": "ନାମ",
  "m1.filter.status": "ସ୍ଥିତି",
  "m1.filter.band": "ପ୍ରତୀକ୍ଷା ସମୟ",
  "m1.filter.district": "ଜିଲ୍ଲା",
  "m1.filter.sort": "କ୍ରମ",
  "m1.searchPlaceholder": "ନାମ କିମ୍ବା କୋଡ୍",

  // Records
  "m2.title": "ପୋର୍ଟେବଲ ଯତ୍ନ ରେକର୍ଡ",
  "m2.subtitle": "ଏକ QR ସନ୍ଦର୍ଭ ଯାହା ରୋଗୀ ଯେକୌଣସି କେନ୍ଦ୍ରରେ ଦେଖାଇପାରିବ।",
  "m2.createBtn": "ଯତ୍ନ ରେକର୍ଡ ତିଆରି କରନ୍ତୁ",
  "m2.searchPlaceholder": "ନାମ, ରେଫରେନ୍ସ କିମ୍ବା ଆଭା ଦ୍ୱାରା ଖୋଜନ୍ତୁ…",
  "m2.statusActive": "ସକ୍ରିୟ ଚିକିତ୍ସା",
  "m2.statusMonitoring": "ନିୟମିତ ନିରୀକ୍ଷଣ",
  "m2.statusTransferred": "ସ୍ଥାନାନ୍ତରିତ",
  "m2.statusLost": "ଅନୁସରଣ ବନ୍ଦ",

  // Donors
  "m3.title": "ରକ୍ତଦାତା ଉପଲବ୍ଧତା",
  "m3.subtitle": "ସିକଲ ସେଲ ରୋଗୀ ପାଇଁ ସମ୍ପର୍କ ତାଲିକା।",
  "m3.requestTitle": "ରକ୍ତ ଅନୁରୋଧ ବିବରଣୀ",
  "m3.bloodGroup": "ରକ୍ତ ବର୍ଗ",
  "m3.urgency": "ଜରୁରୀତା",
  "m3.units": "ଆବଶ୍ୟକ ୟୁନିଟ୍",
  "m3.findBtn": "ଉପଯୁକ୍ତ ରକ୍ତଦାତା ଖୋଜନ୍ତୁ",
  "m3.rankedTitle": "ରକ୍ତଦାତା ତାଲିକା",
  "m3.matchScore": "ମ୍ୟାଚ୍ ସ୍କୋର",
  "m3.contactBtn": "ରକ୍ତଦାତାଙ୍କ ସହ ଯୋଗାଯୋଗ କରନ୍ତୁ",
};

const mr: Dict = {
  // App Shell & Branding
  "app.name": "रक्त-लिंक",
  "app.subtitle": "NSCAEM प्रोटोटाइप",
  "app.mission": "राष्ट्रीय सिकल सेल अ‍ॅनिमिया निर्मूलन अभियान",
  "app.tag": "राष्ट्रीय सिकल सेल अ‍ॅनिमिया निर्मूलन अभियानासाठी काळजीची सातत्यता",
  "app.footer":
    "राष्ट्रीय सिकल सेल अ‍ॅनिमिया निर्मूलन अभियानासाठी प्रोटोटाइप. स्मरणपत्रे, आभा (ABHA) आयडी आणि रक्तदाता संपर्क केवळ प्रात्यक्षिकासाठी आहेत; कोणतेही प्रत्यक्ष संदेश पाठवले जात नाहीत.",
  "role.health_worker": "आशा / PHC कार्यकर्ता",
  "role.blood_bank": "रक्तपेढी कर्मचारी",

  // Navigation
  "nav.tracker": "पाठपुरावा ट्रॅकर",
  "nav.records": "काळजी नोंद",
  "nav.donors": "रक्तदाते",
  "nav.lookup": "नोंद स्कॅन करा",
  "nav.signin": "साइन इन",
  "nav.signout": "साइन आउट",

  // Common
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
  "common.open": "उघडा",
  "common.email": "ईमेल",
  "common.password": "पासवर्ड",
  "common.loading": "लोड होत आहे…",
  "common.actions": "कृती",
  "common.status": "स्थिती",
  "common.district": "जिल्हा",
  "common.facility": "आरोग्य केंद्र",
  "common.patient": "रुग्ण",
  "common.phone": "फोन नंबर",
  "common.date": "दिनांक",
  "common.notes": "नोंदी",
  "common.updated": "अद्यतनित",

  // Home Page
  "home.hero.title": "रक्त-लिंक फील्ड स्क्रीनिंग चाचणीनंतर उपचारांची सातत्यता राखते.",
  "home.hero.signin": "आरोग्य कार्यकर्ता म्हणून साइन इन करा",
  "home.hero.scan": "रुग्णाची QR नोंद स्कॅन करा",
  "home.card1.title": "निश्चिती चाचणी पाठपुरावा",
  "home.card1.body":
    "फील्ड स्क्रीनिंगमध्ये आढळलेले सर्व व्यक्ती, ७ / १४ / २१ दिवसांची स्पष्ट प्रतीक्षा स्थिती आणि पाच भाषांमध्ये स्मरण नोंदीसह.",
  "home.card2.title": "पोर्टेबल काळजी नोंद",
  "home.card2.body":
    "रुग्ण विविध केंद्रांदरम्यान सोबत ठेवू शकेल असा QR संदर्भ. केवळ प्रमाणित पुष्टी अहवाल असलेल्या व्यक्तींसाठीच उपलब्ध.",
  "home.card3.title": "रक्तदाता उपलब्धता",
  "home.card3.body":
    "सिकल सेल रुग्णांसाठी: पारदर्शक रक्तदाता क्रमवारी, टप्प्याटप्प्याने संपर्क आणि गोपनीयतेचे संरक्षण.",
  "home.demo.title": "डेमो लॉगिन",
  "home.demo.subtitle":
    "हा प्रोटोटाइप तिन्ही मॉड्यूल्समध्ये वास्तववादी डेमो डेटासह लोड केलेला आहे.",
  "home.demo.notice":
    "पात्रता नियम आणि रक्तदाता गोपनीयता सर्व्हरवर लागू केली आहे. स्मरणपत्रे, आभा (ABHA) आयडी आणि रक्तदाता संपर्क केवळ प्रात्यक्षिकासाठी आहेत.",

  // Auth Page
  "auth.title": "साइन इन",
  "auth.subtitle":
    "आरोग्य कर्मचारी संपूर्ण नोंदी पाहू शकतात. कोणताही व्यक्ती वैद्यकीय तपशीलांशिवाय QR नोंद अस्तित्वात आहे का ते तपासू शकतो.",
  "auth.signinBtn": "साइन इन करा",
  "auth.signingIn": "साइन इन होत आहे…",
  "auth.demoAccounts": "डेमो खाती",

  // Lookup Page
  "lookup.title": "नोंद स्कॅन करा",
  "lookup.subtitle":
    "रुग्णाच्या रक्त-लिंक QR कोडवर कॅमेरा दाखवा, किंवा खाली छापलेला संदर्भ कोड टाइप करा.",
  "lookup.cameraScan": "कॅमेरा स्कॅन",
  "lookup.startCamera": "कॅमेरा सुरू करा",
  "lookup.manualEntry": "संदर्भ कोड टाइप करा",
  "lookup.recordFound": "ही काळजी नोंद अस्तित्वात आहे.",
  "lookup.recordFoundNote":
    "अप्रमाणित वापरकर्त्यांना वैद्यकीय तपशील दाखवले जात नाहीत. साइन-इन केलेला आरोग्य कर्मचारी संपूर्ण नोंद पाहू शकतो.",
  "lookup.signinToView": "हे पाहण्यासाठी साइन इन करा",
  "lookup.recordNotFound": "या संदर्भाशी कोणतीही नोंद जुळत नाही.",
  "lookup.placeholder": "उदा. RL-XXXXXX",

  // Tracker
  "m1.title": "निश्चिती चाचणी पाठपुरावा",
  "m1.subtitle": "फील्ड चाचणीत नोंदवलेले लोक ज्यांची HPLC चाचणी बाकी आहे.",
  "m1.add": "नवीन व्यक्ती जोडा",
  "m1.overdue": "प्रतीक्षेचे दिवस",
  "m1.reminder": "स्मरण पाठवा",
  "m1.close": "नोंद बंद करा",
  "m1.stat.waiting": "निश्चितीची प्रतीक्षा",
  "m1.stat.d7": "७+ दिवस प्रलंबित",
  "m1.stat.d14": "१४+ दिवस प्रलंबित",
  "m1.stat.d21": "गंभीर २१+ दिवस",
  "m1.band.on_track": "वेळेवर",
  "m1.band.d7": "७+ दिवस प्रलंबित",
  "m1.band.d14": "१४+ दिवस प्रलंबित",
  "m1.band.d21": "गंभीर २१+ दिवस",
  "m1.status.awaiting": "निश्चितीची प्रतीक्षा",
  "m1.status.unverified": "चाचणी झाली, अहवाल नाही",
  "m1.status.documented": "प्रमाणित निकाल",
  "m1.sort.waiting": "सर्वाधिक प्रतीक्षा आधी",
  "m1.sort.name": "नाव",
  "m1.filter.status": "स्थिती",
  "m1.filter.band": "प्रतीक्षा कालावधी",
  "m1.filter.district": "जिल्हा",
  "m1.filter.sort": "क्रमवारी",
  "m1.searchPlaceholder": "नाव किंवा कोड",

  // Records
  "m2.title": "पोर्टेबल काळजी नोंद",
  "m2.subtitle": "रुग्ण कोणत्याही केंद्रावर दाखवू शकेल असा QR संदर्भ.",
  "m2.createBtn": "काळजी नोंद तयार करा",
  "m2.searchPlaceholder": "नाव, संदर्भ किंवा आभा द्वारे शोधा…",
  "m2.statusActive": "सक्रिय उपचार",
  "m2.statusMonitoring": "नियमित देखरेख",
  "m2.statusTransferred": "स्थानांतरित",
  "m2.statusLost": "पाठपुरावा सुटला",

  // Donors
  "m3.title": "रक्तदाता उपलब्धता",
  "m3.subtitle": "सिकल सेल रुग्णांसाठी संपर्क यादी.",
  "m3.requestTitle": "रक्त मागणी तपशील",
  "m3.bloodGroup": "रक्तगट",
  "m3.urgency": "तातडी",
  "m3.units": "आवश्यक युनिट्स",
  "m3.findBtn": "सुसंगत रक्तदाते शोधा",
  "m3.rankedTitle": "रक्तदाता यादी",
  "m3.matchScore": "मॅच स्कोअर",
  "m3.contactBtn": "रक्तदात्याशी संपर्क साधा",
};

const gu: Dict = {
  // App Shell & Branding
  "app.name": "રક્ત-લિંક",
  "app.subtitle": "NSCAEM પ્રોટોટાઇપ",
  "app.mission": "રાષ્ટ્રીય સિકલ સેલ એનિમિયા નાબૂદી મિશન",
  "app.tag": "રાષ્ટ્રીય સિકલ સેલ એનિમિયા નાબૂદી મિશન માટે સંભાળની સાતત્યતા",
  "app.footer":
    "રાષ્ટ્રીય સિકલ સેલ એનિમિયા નાબૂદી મિશન માટેનો પ્રોટોટાઇપ. રિમાઇન્ડર્સ, આભા (ABHA) ID અને રક્તદાતા સંપર્ક પ્રદર્શન માટે સિમ્યુલેટેડ છે; કોઈ સંદેશ ખરેખર મોકલવામાં આવતો નથી.",
  "role.health_worker": "આશા / PHC કાર્યકર",
  "role.blood_bank": "બ્લડ બેંક સ્ટાફ",

  // Navigation
  "nav.tracker": "ફોલો-અપ ટ્રેકર",
  "nav.records": "સંભાળ રેકોર્ડ",
  "nav.donors": "રક્તદાતા",
  "nav.lookup": "રેકોર્ડ સ્કેન કરો",
  "nav.signin": "સાઇન ઇન",
  "nav.signout": "સાઇન આઉટ",

  // Common
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
  "common.open": "ખોલો",
  "common.email": "ઈમેલ",
  "common.password": "પાસવર્ડ",
  "common.loading": "લોડ થઈ રહ્યું છે…",
  "common.actions": "પગલાં",
  "common.status": "સ્થિતિ",
  "common.district": "જિલ્લો",
  "common.facility": "આરોગ્ય કેન્દ્ર",
  "common.patient": "દર્દી",
  "common.phone": "ફોન નંબર",
  "common.date": "તારીખ",
  "common.notes": "નોંધો",
  "common.updated": "અપડેટ થયેલ",

  // Home Page
  "home.hero.title": "રક્ત-લિંક ફિલ્ડ સ્ક્રીનીંગ ટેસ્ટ પછી સંભાળની સાતત્યતા જાળવી રાખે છે.",
  "home.hero.signin": "આરોગ્ય કાર્યકર તરીકે સાઇન ઇન કરો",
  "home.hero.scan": "દર્દીનો QR રેકોર્ડ સ્કેન કરો",
  "home.card1.title": "પુષ્ટિ તપાસ ફોલો-અપ",
  "home.card1.body":
    "ફિલ્ડ સ્ક્રીનીંગમાં ચિહ્નિત દરેક વ્યક્તિ, ૭ / ૧૪ / ૨૧ દિવસની સ્પષ્ટ પ્રતીક્ષા સ્થિતિ અને પાંચ ભાષાઓમાં રિમાઇન્ડર લૉગ સાથે.",
  "home.card2.title": "પોર્ટેબલ સંભાળ રેકોર્ડ",
  "home.card2.body":
    "એક QR સંદર્ભ જેને દર્દી વિવિધ કેન્દ્રો વચ્ચે સાથે રાખી શકે છે. માત્ર પ્રમાણિત પુષ્ટિ અહેવાલ ધરાવતી વ્યક્તિઓ માટે જ ઉપલબ્ધ.",
  "home.card3.title": "રક્તદાતા ઉપલબ્ધતા",
  "home.card3.body":
    "સિકલ સેલ દર્દીઓ માટે: પારદર્શક રક્તદાતા રેન્કિંગ, તબક્કાવાર સંપર્ક અને ગોપનીયતા સુરક્ષા.",
  "home.demo.title": "ડેમો લૉગિન",
  "home.demo.subtitle":
    "આ પ્રોટોટાઇપ ત્રણેય મોડ્યુલમાં વાસ્તવિક ડેમો ડેટા સાથે પ્રી-લોડેડ છે.",
  "home.demo.notice":
    "પાત્રતા નિયમો અને રક્તદાતા ગોપનીયતા સર્વર પર લાગુ થાય છે. રિમાઇન્ડર્સ, આભા (ABHA) ID અને રક્તદાતા સંપર્ક પ્રદર્શન માટે સિમ્યુલેટેડ છે.",

  // Auth Page
  "auth.title": "સાઇન ઇન",
  "auth.subtitle":
    "આરોગ્ય કર્મચારીઓ સંપૂર્ણ રેકોર્ડ જોઈ શકે છે. કોઈપણ વ્યક્તિ તબીબી વિગતો વિના QR રેકોર્ડ અસ્તિત્વમાં છે કે નહીં તે ચકાસી શકે છે.",
  "auth.signinBtn": "સાઇન ઇન કરો",
  "auth.signingIn": "સાઇન ઇન થઈ રહ્યું છે…",
  "auth.demoAccounts": "ડેમો એકાઉન્ટ્સ",

  // Lookup Page
  "lookup.title": "રેકોર્ડ સ્કેન કરો",
  "lookup.subtitle":
    "દર્દીના રક્ત-લિંક QR કોડ તરફ કૅમેરો રાખો, અથવા નીચે છાપેલ સંદર્ભ કોડ લખો.",
  "lookup.cameraScan": "કૅમેરા સ્કેન",
  "lookup.startCamera": "કૅમેરો શરૂ કરો",
  "lookup.manualEntry": "સંદર્ભ કોડ લખો",
  "lookup.recordFound": "આ સંભાળ રેકોર્ડ ઉપલબ્ધ છે.",
  "lookup.recordFoundNote":
    "અપ્રમાણિત વપરાશકર્તાઓને તબીબી વિગતો બતાવવામાં આવતી નથી. સાઇન-ઇન થયેલ આરોગ્ય કાર્યકર સંપૂર્ણ રેકોર્ડ જોઈ શકે છે.",
  "lookup.signinToView": "તે જોવા માટે સાઇન ઇન કરો",
  "lookup.recordNotFound": "આ સંદર્ભ સાથે કોઈ રેકોર્ડ મળ્યો નથી.",
  "lookup.placeholder": "દા.ત. RL-XXXXXX",

  // Tracker
  "m1.title": "પુષ્ટિ તપાસ ફોલો-અપ",
  "m1.subtitle": "ફિલ્ડ તપાસમાં નોંધાયેલા લોકો જેમની HPLC તપાસ બાકી છે.",
  "m1.add": "નવી વ્યક્તિ ઉમેરો",
  "m1.overdue": "પ્રતીક્ષાના દિવસો",
  "m1.reminder": "રિમાઇન્ડર મોકલો",
  "m1.close": "રેકોર્ડ બંધ કરો",
  "m1.stat.waiting": "પુષ્ટિની પ્રતીક્ષા",
  "m1.stat.d7": "૭+ દિવસથી બાકી",
  "m1.stat.d14": "૧૪+ દિવસથી બાકી",
  "m1.stat.d21": "ગંભીર ૨૧+ દિવસ",
  "m1.band.on_track": "સમયસર",
  "m1.band.d7": "૭+ દિવસથી બાકી",
  "m1.band.d14": "૧૪+ દિવસથી બાકી",
  "m1.band.d21": "ગંભીર ૨૧+ દિવસ",
  "m1.status.awaiting": "પુષ્ટિની પ્રતીક્ષા",
  "m1.status.unverified": "તપાસ થઈ, રિપોર્ટ જોવાયો નથી",
  "m1.status.documented": "પ્રમાણિત પરિણામ",
  "m1.sort.waiting": "સૌથી વધુ રાહ જોતા પહેલા",
  "m1.sort.name": "નામ",
  "m1.filter.status": "સ્થિતિ",
  "m1.filter.band": "પ્રતીક્ષા સમયગાળો",
  "m1.filter.district": "જિલ્લો",
  "m1.filter.sort": "ક્રમ ગોઠવો",
  "m1.searchPlaceholder": "નામ અથવા કોડ",

  // Records
  "m2.title": "પોર્ટેબલ સંભાળ રેકોર્ડ",
  "m2.subtitle": "દર્દી કોઈપણ કેન્દ્ર પર બતાવી શકે તેવો QR સંદર્ભ.",
  "m2.createBtn": "સંભાળ રેકોર્ડ બનાવો",
  "m2.searchPlaceholder": "નામ, સંદર્ભ અથવા આભા દ્વારા શોધો…",
  "m2.statusActive": "સક્રિય સારવાર",
  "m2.statusMonitoring": "નિયમિત દેખરેખ",
  "m2.statusTransferred": "સ્થળાંતરિત",
  "m2.statusLost": "ફોલો-અપ ચૂકી ગયા",

  // Donors
  "m3.title": "રક્તદાતા ઉપલબ્ધતા",
  "m3.subtitle": "સિકલ સેલ રોગના દર્દીઓ માટે સંપર્ક સૂચિ.",
  "m3.requestTitle": "રક્ત વિનંતી વિગતો",
  "m3.bloodGroup": "બ્લડ ગ્રુપ",
  "m3.urgency": "તાકીદ",
  "m3.units": "જરૂરી યુનિટ",
  "m3.findBtn": "સુસંગત રક્તદાતાઓ શોધો",
  "m3.rankedTitle": "રક્તદાતા યાદી",
  "m3.matchScore": "મેચ સ્કોર",
  "m3.contactBtn": "રક્તદાતાનો સંપર્ક કરો",
};

const DICTS: Record<LangCode, Dict> = { en, hi, or, mr, gu };

type I18nValue = {
  lang: LangCode;
  setLang: (l: LangCode) => void;
  t: (key: string, fallback?: string) => string;
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
    (key: string, fallback?: string) => DICTS[lang]?.[key] ?? en[key] ?? fallback ?? key,
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
