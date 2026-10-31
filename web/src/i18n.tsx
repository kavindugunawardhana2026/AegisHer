import { createContext, useContext, useState, type ReactNode } from 'react'

export type Lang = 'en' | 'si'

const en = {
  tagline: 'Protect your photos. Document the abuse. Get it taken down.',
  navCloak: 'Photo Shield',
  navReport: 'Report Abuse',
  navAbout: 'How it works',
  privacy: 'Your photos are processed in memory and never stored.',

  // Cloak studio
  cloakTitle: 'Shield a photo before you post it',
  cloakIntro:
    'AegisHer adds tiny pixel changes you can barely see. To the AI models used for deepfakes and face-swaps, your face stops looking like you.',
  dropPhoto: 'Drop a photo here or click to choose',
  dropPhotoHint: 'JPG, PNG or WebP · up to 20 MB',
  strength: 'Protection strength',
  low: 'Light',
  lowDesc: 'Least visible. Weaker protection.',
  medium: 'Balanced',
  mediumDesc: 'Recommended. Nearly invisible, strong protection.',
  high: 'Maximum',
  highDesc: 'Strongest. Faint texture may show when zoomed.',
  protect: 'Shield my photo',
  working: 'Shielding your photo…',
  workingHint: 'This can take 20–60 seconds on a computer without a graphics card.',
  before: 'Original',
  after: 'Shielded',
  showDiff: 'Show the hidden changes (amplified ×12)',
  download: 'Download shielded photo',
  another: 'Shield another photo',
  identityMatch: 'AI identity match',
  identityMatchHelp: 'How much the face-recognition AI still thinks this is you. 100% = same person.',
  afterCompression: 'after Instagram-style compression',
  visualQuality: 'Visual change',
  facesFound: 'Faces protected',
  metaStripped: 'Location & camera data removed',
  protectionStrong: 'Strong protection',
  protectionModerate: 'Moderate protection',
  protectionWeak: 'Weak protection – try a higher strength',
  noFaces: 'No face found – the whole photo was shielded against AI editing.',
  invisible: 'Invisible',
  verySubtle: 'Very subtle',
  subtle: 'Subtle',
  tipsTitle: 'Before you post',
  tip1: 'Upload the downloaded file as it is. Don’t re-edit or add filters afterwards.',
  tip2: 'Shielding reduces risk; it cannot guarantee protection against every future AI model.',
  tip3: 'Keep privacy settings tight. Shielding works best together with a private account.',

  // Report wizard
  reportTitle: 'Build an evidence report',
  reportIntro:
    'Answer a few questions and add screenshots and links. AegisHer creates a PDF with tamper-proof fingerprints of your evidence, ready for Sri Lanka CERT, the Police and social media platforms.',
  danger: 'In immediate danger? Call 119 (Police emergency).',
  notAlone: 'This is not your fault, and you are not alone.',
  stepYou: 'About you',
  stepWhat: 'What happened',
  stepEvidence: 'Evidence',
  stepReview: 'Review',
  stepDone: 'Report',
  fullName: 'Full name',
  email: 'Email',
  phone: 'Phone',
  nic: 'NIC number (optional)',
  address: 'Address (optional)',
  onBehalf: 'Reporting for someone else? Their name and your relationship',
  optional: 'optional',
  incidentType: 'What kind of abuse is it?',
  dateSeen: 'When did you first notice it?',
  description: 'Describe what happened',
  descriptionHint: 'Write in English or Sinhala. Include where it was posted, who shared it and any threats or demands.',
  perpetrator: 'Who is responsible? (account names, profile links, phone numbers – if known)',
  screenshots: 'Screenshots and files',
  screenshotsHint: 'Add the original screenshots. Don’t crop or edit them – the fingerprint must match the original.',
  dropEvidence: 'Drop screenshots here or click to choose',
  links: 'Links to the harmful content',
  linkPlaceholder: 'https://…',
  linkNotes: 'Note (optional)',
  addLink: 'Add link',
  remove: 'Remove',
  thumbnails: 'Image previews in the PDF',
  thumbBlurred: 'Blurred (recommended)',
  thumbFull: 'Full',
  thumbNone: 'None',
  back: 'Back',
  next: 'Continue',
  fingerprinting: 'Fingerprinting evidence…',
  generate: 'Generate PDF report',
  generating: 'Creating your report…',
  reportReady: 'Your report is ready',
  downloadPdf: 'Download PDF',
  reportId: 'Report ID',
  pdfHash: 'PDF SHA-256',
  whereToSend: 'Where to send it',
  afterTips: 'What to do next',
  afterTip1: 'Keep the original files and this PDF safely. Don’t delete chats or messages.',
  afterTip2: 'Don’t reply to or pay anyone who is threatening you.',
  afterTip3: 'For intimate images, also use StopNCII.org – it blocks re-uploads on many platforms without sharing your images.',
  startOver: 'Start a new report',
  required: 'Required',
  needEvidence: 'Add at least one screenshot or link.',
  copy: 'Copy',
  copied: 'Copied',
  types: {
    deepfake: 'Deepfake / AI-edited image or video',
    non_consensual_image_sharing: 'Private photos shared without consent',
    sextortion: 'Sextortion / blackmail',
    impersonation_fake_profile: 'Fake profile / impersonation',
    harassment_threats: 'Harassment or threats',
    doxxing: 'Personal details published',
    hacked_account: 'Hacked account',
    other: 'Something else',
  },

  // About
  aboutTitle: 'How AegisHer works',
  about1Title: 'Adversarial cloaking',
  about1:
    'Deepfake tools first turn a face into numbers (an “embedding”) using face-recognition models like ArcFace, or into a latent image using a Stable Diffusion encoder. AegisHer slightly changes pixels – at most a few levels out of 255 – so that these encoders read a completely different identity. The tool then works from the wrong face and the output breaks.',
  about2Title: 'Forensic fingerprints',
  about2:
    'Every evidence file gets a SHA-256 hash (proves the exact file was not changed) and a perceptual hash (lets platforms find copies, even resized ones). The report lists them with a chain-of-custody statement.',
  about3Title: 'Privacy by design',
  about3:
    'Photos and evidence are processed in server memory only and are never written to disk or logged. Location (GPS) data is removed from shielded photos.',
  about4Title: 'Limits',
  about4:
    'No cloak is perfect: new AI models, heavy edits or screenshots-of-screenshots can weaken it. Treat it as one layer of protection together with privacy settings, and report abuse quickly.',
}

type Dict = typeof en

const si: Dict = {
  tagline: 'ඔබේ ඡායාරූප ආරක්ෂා කරන්න. හිරිහැරය සාක්ෂි සහිතව වාර්තා කරන්න. ඉවත් කරවා ගන්න.',
  navCloak: 'ඡායාරූප ආරක්ෂාව',
  navReport: 'හිරිහැර වාර්තා කරන්න',
  navAbout: 'ක්‍රියා කරන ආකාරය',
  privacy: 'ඔබේ ඡායාරූප මතකයේ පමණක් සකසන අතර කිසිවිටෙක ගබඩා නොකෙරේ.',

  cloakTitle: 'පළ කිරීමට පෙර ඡායාරූපය ආරක්ෂා කරන්න',
  cloakIntro:
    'AegisHer ඇසට නොපෙනෙන තරම් කුඩා pixel වෙනස්කම් එක් කරයි. Deepfake සහ face-swap සඳහා භාවිත AI වලට ඔබේ මුහුණ ඔබ ලෙස හඳුනාගත නොහැකි වේ.',
  dropPhoto: 'ඡායාරූපය මෙහි දමන්න හෝ තෝරා ගැනීමට click කරන්න',
  dropPhotoHint: 'JPG, PNG හෝ WebP · 20 MB දක්වා',
  strength: 'ආරක්ෂණ ප්‍රමාණය',
  low: 'සැහැල්ලු',
  lowDesc: 'අවම වෙනස. ආරක්ෂාව අඩුයි.',
  medium: 'සමබර',
  mediumDesc: 'නිර්දේශිතයි. නොපෙනෙන තරම්, ශක්තිමත් ආරක්ෂාව.',
  high: 'උපරිම',
  highDesc: 'ශක්තිමත්ම. Zoom කළ විට සියුම් රටාවක් පෙනිය හැක.',
  protect: 'ඡායාරූපය ආරක්ෂා කරන්න',
  working: 'ඡායාරූපය ආරක්ෂා කරමින්…',
  workingHint: 'Graphics card නැති පරිගණකයක තත්පර 20–60ක් ගත විය හැක.',
  before: 'මුල් පිටපත',
  after: 'ආරක්ෂිත',
  showDiff: 'සැඟවුණු වෙනස්කම් පෙන්වන්න (×12 විශාල කර)',
  download: 'ආරක්ෂිත ඡායාරූපය බාගන්න',
  another: 'තවත් ඡායාරූපයක් ආරක්ෂා කරන්න',
  identityMatch: 'AI අනන්‍යතා ගැළපීම',
  identityMatchHelp: 'මුහුණු හඳුනාගැනීමේ AI එක තවමත් මෙය ඔබ ලෙස සලකන ප්‍රමාණය. 100% = එකම පුද්ගලයා.',
  afterCompression: 'Instagram ආකාර compression පසු',
  visualQuality: 'දෘශ්‍ය වෙනස',
  facesFound: 'ආරක්ෂා කළ මුහුණු',
  metaStripped: 'ස්ථාන සහ කැමරා දත්ත ඉවත් කළා',
  protectionStrong: 'ශක්තිමත් ආරක්ෂාව',
  protectionModerate: 'මධ්‍යස්ථ ආරක්ෂාව',
  protectionWeak: 'දුර්වල ආරක්ෂාව – වැඩි ප්‍රමාණයක් උත්සාහ කරන්න',
  noFaces: 'මුහුණක් හමු නොවීය – සම්පූර්ණ ඡායාරූපයම AI සංස්කරණයට එරෙහිව ආරක්ෂා කළා.',
  invisible: 'නොපෙනේ',
  verySubtle: 'ඉතා සියුම්',
  subtle: 'සියුම්',
  tipsTitle: 'පළ කිරීමට පෙර',
  tip1: 'බාගත් ගොනුව එලෙසම upload කරන්න. පසුව edit කිරීම හෝ filters දැමීම නොකරන්න.',
  tip2: 'මෙය අවදානම අඩු කරයි; අනාගත සියලු AI වලට එරෙහිව සහතික කළ නොහැක.',
  tip3: 'Privacy settings දැඩිව තබා ගන්න. Private account එකක් සමඟ මෙය වඩාත් හොඳින් ක්‍රියා කරයි.',

  reportTitle: 'සාක්ෂි වාර්තාවක් සාදන්න',
  reportIntro:
    'ප්‍රශ්න කිහිපයකට පිළිතුරු දී screenshots සහ links එක් කරන්න. Sri Lanka CERT, පොලිසිය සහ සමාජ මාධ්‍ය වෙත යැවීමට සූදානම්, වෙනස් කළ නොහැකි ඇඟිලි සලකුණු (hashes) සහිත PDF එකක් AegisHer සාදයි.',
  danger: 'ක්ෂණික අනතුරක? 119 අමතන්න (පොලිස් හදිසි ඇමතුම).',
  notAlone: 'මෙය ඔබේ වරදක් නොවේ. ඔබ තනි නොවේ.',
  stepYou: 'ඔබ ගැන',
  stepWhat: 'සිදු වූයේ කුමක්ද',
  stepEvidence: 'සාක්ෂි',
  stepReview: 'පරීක්ෂා කරන්න',
  stepDone: 'වාර්තාව',
  fullName: 'සම්පූර්ණ නම',
  email: 'ඊමේල්',
  phone: 'දුරකථන අංකය',
  nic: 'ජා.හැ. අංකය (අත්‍යවශ්‍ය නැත)',
  address: 'ලිපිනය (අත්‍යවශ්‍ය නැත)',
  onBehalf: 'වෙනත් අයෙකු වෙනුවෙන්ද? ඔවුන්ගේ නම සහ ඔබේ සම්බන්ධතාව',
  optional: 'අත්‍යවශ්‍ය නැත',
  incidentType: 'මෙය කුමන ආකාරයේ හිරිහැරයක්ද?',
  dateSeen: 'ඔබ මුලින්ම දුටුවේ කවදාද?',
  description: 'සිදු වූ දේ විස්තර කරන්න',
  descriptionHint: 'ඉංග්‍රීසි හෝ සිංහලෙන් ලියන්න. පළ කළ ස්ථානය, බෙදාගත් අය සහ තර්ජන හෝ ඉල්ලීම් ඇතුළත් කරන්න.',
  perpetrator: 'වගකිව යුත්තේ කවුද? (account නම්, profile links, දුරකථන අංක – දන්නේ නම්)',
  screenshots: 'Screenshots සහ ගොනු',
  screenshotsHint: 'මුල් screenshots එක් කරන්න. Crop හෝ edit නොකරන්න – hash එක මුල් ගොනුවට ගැළපිය යුතුයි.',
  dropEvidence: 'Screenshots මෙහි දමන්න හෝ තෝරා ගැනීමට click කරන්න',
  links: 'හානිකර අන්තර්ගතයේ links',
  linkPlaceholder: 'https://…',
  linkNotes: 'සටහන (අත්‍යවශ්‍ය නැත)',
  addLink: 'Link එක් කරන්න',
  remove: 'ඉවත් කරන්න',
  thumbnails: 'PDF හි රූප පෙරදසුන්',
  thumbBlurred: 'බොඳ කළ (නිර්දේශිත)',
  thumbFull: 'සම්පූර්ණ',
  thumbNone: 'නැත',
  back: 'ආපසු',
  next: 'ඉදිරියට',
  fingerprinting: 'සාක්ෂි වල hashes ගණනය කරමින්…',
  generate: 'PDF වාර්තාව සාදන්න',
  generating: 'ඔබේ වාර්තාව සාදමින්…',
  reportReady: 'ඔබේ වාර්තාව සූදානම්',
  downloadPdf: 'PDF බාගන්න',
  reportId: 'වාර්තා අංකය',
  pdfHash: 'PDF SHA-256',
  whereToSend: 'යැවිය යුත්තේ කොහෙටද',
  afterTips: 'ඊළඟට කළ යුතු දේ',
  afterTip1: 'මුල් ගොනු සහ මෙම PDF එක ආරක්ෂිතව තබා ගන්න. Chats හෝ messages මකන්න එපා.',
  afterTip2: 'ඔබට තර්ජනය කරන අයට පිළිතුරු දීම හෝ මුදල් ගෙවීම නොකරන්න.',
  afterTip3: 'පෞද්ගලික රූප සඳහා StopNCII.org ද භාවිත කරන්න – ඔබේ රූප බෙදා නොගෙනම බොහෝ platforms වල නැවත upload වීම අවහිර කරයි.',
  startOver: 'නව වාර්තාවක් අරඹන්න',
  required: 'අවශ්‍යයි',
  needEvidence: 'අවම වශයෙන් එක් screenshot එකක් හෝ link එකක් එක් කරන්න.',
  copy: 'පිටපත් කරන්න',
  copied: 'පිටපත් විය',
  types: {
    deepfake: 'Deepfake / AI මගින් වෙනස් කළ රූප හෝ වීඩියෝ',
    non_consensual_image_sharing: 'අවසරයකින් තොරව පෞද්ගලික රූප බෙදාහැරීම',
    sextortion: 'ලිංගික කප්පම් / බ්ලැක්මේල්',
    impersonation_fake_profile: 'ව්‍යාජ profile / වෙස්වලාගැනීම',
    harassment_threats: 'හිරිහැර හෝ තර්ජන',
    doxxing: 'පෞද්ගලික තොරතුරු පළ කිරීම',
    hacked_account: 'Hack වූ ගිණුම',
    other: 'වෙනත්',
  },

  aboutTitle: 'AegisHer ක්‍රියා කරන ආකාරය',
  about1Title: 'Adversarial cloaking',
  about1:
    'Deepfake මෙවලම් මුලින්ම ArcFace වැනි මුහුණු හඳුනාගැනීමේ models මගින් මුහුණ සංඛ්‍යා බවට (embedding) හෝ Stable Diffusion encoder මගින් latent රූපයක් බවට පත් කරයි. AegisHer pixel ස්වල්පයක් – 255න් මට්ටම් කිහිපයක් පමණක් – වෙනස් කරන නිසා මෙම encoders වලට සම්පූර්ණයෙන්ම වෙනත් අනන්‍යතාවයක් පෙනේ. එවිට මෙවලම වැරදි මුහුණකින් වැඩ කරන අතර ප්‍රතිඵලය විකෘති වේ.',
  about2Title: 'Forensic ඇඟිලි සලකුණු',
  about2:
    'සෑම සාක්ෂි ගොනුවකටම SHA-256 hash එකක් (ගොනුව වෙනස් නොවූ බව ඔප්පු කරයි) සහ perceptual hash එකක් (resize කළ පිටපත් පවා සොයා ගැනීමට platforms වලට උදව් වේ) ලැබේ. වාර්තාවේ chain-of-custody ප්‍රකාශයක් සමඟ ඒවා ලැයිස්තුගත කෙරේ.',
  about3Title: 'පෞද්ගලිකත්වය මුල් කරගත් නිර්මාණය',
  about3:
    'ඡායාරූප සහ සාක්ෂි server මතකයේ පමණක් සකසන අතර disk එකට ලිවීම හෝ log කිරීම සිදු නොවේ. ආරක්ෂිත ඡායාරූප වලින් ස්ථාන (GPS) දත්ත ඉවත් කෙරේ.',
  about4Title: 'සීමාවන්',
  about4:
    'කිසිම cloak එකක් පරිපූර්ණ නොවේ: නව AI models, දැඩි edits හෝ screenshot වල screenshots මගින් එය දුර්වල විය හැක. Privacy settings සමඟ එක් ආරක්ෂණ ස්ථරයක් ලෙස සලකා, හිරිහැර ඉක්මනින් වාර්තා කරන්න.',
}

const dicts: Record<Lang, Dict> = { en, si }

const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: Dict }>({ lang: 'en', setLang: () => {}, t: en })

function initialLang(): Lang {
  try {
    const saved = localStorage.getItem('aegisher.lang')
    if (saved === 'en' || saved === 'si') return saved
  } catch {
    /* storage blocked */
  }
  return navigator.language?.startsWith('si') ? 'si' : 'en'
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang)
  const setLang = (l: Lang) => {
    setLangState(l)
    document.documentElement.lang = l
    try {
      localStorage.setItem('aegisher.lang', l)
    } catch {
      /* storage blocked */
    }
  }
  return <Ctx.Provider value={{ lang, setLang, t: dicts[lang] }}>{children}</Ctx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useI18n = () => useContext(Ctx)
