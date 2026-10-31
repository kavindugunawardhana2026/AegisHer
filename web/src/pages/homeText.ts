import type { Lang } from '../i18n'

/** Landing page copy, English + Sinhala. Kept apart from i18n.tsx because it is long and page-specific. */
const en = {
  navHome: 'Home',
  heroTitle: 'Your face. Your rules.',
  heroGold: 'Sri Lanka’s anti-deepfake shield for women and girls',
  heroBody:
    'Shield your photos from deepfake AI before you post them, and turn online abuse into a ready-to-submit evidence report. Private by design, in English and Sinhala.',
  ctaShield: 'Shield a photo',
  ctaReport: 'Report abuse',
  scroll: 'Scroll',

  marquee: [
    'Deepfake protection',
    'Face-swap defence',
    'Evidence fingerprints',
    'Police-ready PDF',
    'English & සිංහල',
    'Never stored',
    'GPS removed',
    'No account needed',
  ],

  whatEyebrow: 'What we do',
  whatTitle: 'What is AegisHer?',
  whatBody:
    'AegisHer is a safety toolkit for women and girls facing deepfakes and online harassment. It does two things: it shields your photos before they go online, and it helps you document abuse properly so it can be taken down.',

  stats: [
    { value: 100, suffix: '%', label: 'processed in memory, never stored' },
    { value: 8, suffix: '', label: 'types of abuse you can report' },
    { value: 3, suffix: '', label: 'protection strength levels' },
    { value: 2, suffix: '', label: 'languages: English & Sinhala' },
  ],

  toolsEyebrow: 'Explore the tools',
  toolsTitle: 'Two tools. One shield.',
  toolsBody: 'Protect yourself before anything happens, and act fast if it does.',
  prev: 'Previous',
  next: 'Next',
  open: 'Open',
  tools: [
    {
      tag: 'Protect',
      title: 'Photo Shield',
      body: 'Tiny, near-invisible pixel changes make face-recognition AI read a different person. Deepfakes made from your photo come out wrong.',
      href: '#cloak',
    },
    {
      tag: 'Document',
      title: 'Evidence report',
      body: 'Add screenshots and links, answer a few questions, and get a PDF with a takedown request and a chain-of-custody statement.',
      href: '#report',
    },
    {
      tag: 'Prove',
      title: 'Forensic fingerprints',
      body: 'Each file gets SHA-256 and perceptual hashes. They prove it was not changed and help platforms find copies.',
      href: '#about',
    },
    {
      tag: 'Act',
      title: 'Where to report',
      body: 'Your report shows exactly where to send it: Sri Lanka CERT, the Police and each social media platform.',
      href: '#report',
    },
  ],

  demoEyebrow: 'See it work',
  demoTitle: 'To you, the same photo. To AI, a stranger.',
  demoBody:
    'Deepfake tools first turn your face into numbers. AegisHer nudges the pixels so those numbers point to someone else.',
  original: 'Original',
  shielded: 'Shielded',
  matchLabel: 'AI identity match',
  recognised: 'Face recognised',
  stranger: 'No match: different person',
  illustration: 'Illustration. Real results depend on the photo and the strength you choose.',

  journeyEyebrow: 'The journey',
  journeyTitle: 'From photo to protection, mapped out.',
  journeyBody: 'Four simple steps. No account, no data kept.',
  fieldNotes: 'AegisHer · Field notes',
  journey: [
    { tag: 'Step 01', title: 'Upload a photo', body: 'JPG, PNG or WebP. Processed in memory only.' },
    { tag: 'Step 02', title: 'Pick a strength', body: 'Light, Balanced or Maximum.' },
    { tag: 'Step 03', title: 'Download & post', body: 'Share the shielded copy as it is.' },
    { tag: 'Step 04', title: 'If abuse happens', body: 'Build an evidence report in minutes.' },
    { tag: 'Final step', title: 'Get it taken down', body: 'Send the report to CERT, the Police and platforms.' },
  ],

  privacyEyebrow: 'Privacy first',
  privacyTitle: 'Built to keep you safe.',
  privacy: [
    { title: 'Never stored', body: 'Photos and evidence stay in server memory and are never written to disk or logged.' },
    { title: 'Location removed', body: 'GPS and camera details are stripped from every shielded photo.' },
    { title: 'No account needed', body: 'No sign-up, no profile, nothing that links the tool back to you.' },
  ],

  faqEyebrow: 'Questions',
  faqTitle: 'Good to know',
  faq: [
    {
      q: 'Will people notice the changes?',
      a: 'With Balanced strength the changes are nearly invisible. Maximum is stronger but may show a faint texture when zoomed in.',
    },
    {
      q: 'Does it stop every deepfake?',
      a: 'No tool can promise that. New AI models or heavy edits can weaken the shield, so use it together with private accounts and report abuse quickly.',
    },
    { q: 'Are my photos saved anywhere?', a: 'No. Everything is processed in memory and discarded when your request finishes.' },
    {
      q: 'Where do I send the evidence report?',
      a: 'The report lists the right places, including Sri Lanka CERT, the Police and the platform where the content was posted.',
    },
    { q: 'Can I use AegisHer in Sinhala?', a: 'Yes. Switch between English and සිංහල with the button at the top of the page.' },
  ],

  ctaTitle: 'Take back control of your image.',
  ctaBody: 'Shield your next photo before you post it.',
}

export type HomeText = typeof en

const si: HomeText = {
  navHome: 'මුල් පිටුව',
  heroTitle: 'ඔබේ මුහුණ. ඔබේ තීරණය.',
  heroGold: 'කාන්තාවන් සහ දැරියන් සඳහා ශ්‍රී ලංකාවේ deepfake ආරක්ෂක පලිහ',
  heroBody:
    'ඡායාරූප පළ කිරීමට පෙර deepfake AI වලින් ඒවා ආරක්ෂා කරන්න, සහ online හිරිහැර ඉදිරිපත් කිරීමට සූදානම් සාක්ෂි වාර්තාවක් බවට පත් කරන්න. පෞද්ගලිකත්වය මුල් කරගෙන, සිංහලෙන් සහ ඉංග්‍රීසියෙන්.',
  ctaShield: 'ඡායාරූපයක් ආරක්ෂා කරන්න',
  ctaReport: 'හිරිහැර වාර්තා කරන්න',
  scroll: 'පහළට',

  marquee: [
    'Deepfake ආරක්ෂාව',
    'Face-swap වලින් ආරක්ෂාව',
    'සාක්ෂි ඇඟිලි සලකුණු',
    'පොලිසියට සූදානම් PDF',
    'සිංහල සහ English',
    'කිසිවිටෙක ගබඩා නොකෙරේ',
    'GPS දත්ත ඉවත් කෙරේ',
    'Account එකක් අවශ්‍ය නැත',
  ],

  whatEyebrow: 'අප කරන දේ',
  whatTitle: 'AegisHer යනු කුමක්ද?',
  whatBody:
    'AegisHer යනු deepfake සහ online හිරිහැරවලට මුහුණ දෙන කාන්තාවන් සහ දැරියන් සඳහා වූ ආරක්ෂක මෙවලම් කට්ටලයකි. එය කරන්නේ දේවල් දෙකකි: ඔබේ ඡායාරූප online යාමට පෙර ඒවා ආරක්ෂා කරයි, සහ හිරිහැර ඉවත් කරවා ගත හැකි පරිදි ඒවා නිවැරදිව ලේඛනගත කිරීමට උදව් කරයි.',

  stats: [
    { value: 100, suffix: '%', label: 'මතකයේ පමණක් සකසයි, ගබඩා නොකරයි' },
    { value: 8, suffix: '', label: 'වාර්තා කළ හැකි හිරිහැර වර්ග' },
    { value: 3, suffix: '', label: 'ආරක්ෂණ මට්ටම්' },
    { value: 2, suffix: '', label: 'භාෂා: සිංහල සහ English' },
  ],

  toolsEyebrow: 'මෙවලම් ගවේෂණය කරන්න',
  toolsTitle: 'මෙවලම් දෙකක්. එක් පලිහක්.',
  toolsBody: 'කිසිවක් සිදු වීමට පෙර ඔබව ආරක්ෂා කරගන්න, සිදු වුවහොත් ඉක්මනින් ක්‍රියා කරන්න.',
  prev: 'පෙර',
  next: 'ඊළඟ',
  open: 'විවෘත කරන්න',
  tools: [
    {
      tag: 'ආරක්ෂා කරන්න',
      title: 'ඡායාරූප ආරක්ෂාව',
      body: 'ඇසට නොපෙනෙන තරම් කුඩා pixel වෙනස්කම් නිසා මුහුණු හඳුනාගන්නා AI වලට වෙනත් පුද්ගලයෙකු පෙනේ. ඔබේ ඡායාරූපයෙන් සාදන deepfakes වැරදි ලෙස නිමවේ.',
      href: '#cloak',
    },
    {
      tag: 'ලේඛනගත කරන්න',
      title: 'සාක්ෂි වාර්තාව',
      body: 'Screenshots සහ links එක් කර ප්‍රශ්න කිහිපයකට පිළිතුරු දෙන්න. Takedown ඉල්ලීමක් සහ chain-of-custody ප්‍රකාශයක් සහිත PDF එකක් ලැබේ.',
      href: '#report',
    },
    {
      tag: 'ඔප්පු කරන්න',
      title: 'Forensic ඇඟිලි සලකුණු',
      body: 'සෑම ගොනුවකටම SHA-256 සහ perceptual hashes ලැබේ. එය වෙනස් නොවූ බව ඔප්පු කරන අතර පිටපත් සොයා ගැනීමට platforms වලට උදව් වේ.',
      href: '#about',
    },
    {
      tag: 'ක්‍රියා කරන්න',
      title: 'වාර්තා කළ යුතු තැන්',
      body: 'වාර්තාව යැවිය යුතු තැන් ඔබට පෙන්වයි: Sri Lanka CERT, පොලිසිය සහ එක් එක් social media platform.',
      href: '#report',
    },
  ],

  demoEyebrow: 'ක්‍රියාත්මක වන ආකාරය',
  demoTitle: 'ඔබට එකම ඡායාරූපය. AI වලට නාඳුනන කෙනෙක්.',
  demoBody: 'Deepfake මෙවලම් මුලින්ම ඔබේ මුහුණ සංඛ්‍යා බවට පත් කරයි. AegisHer pixel සුළු වශයෙන් වෙනස් කරන නිසා එම සංඛ්‍යා වෙනත් අයෙකුට යොමු වේ.',
  original: 'මුල් ඡායාරූපය',
  shielded: 'ආරක්ෂිත',
  matchLabel: 'AI අනන්‍යතා ගැළපීම',
  recognised: 'මුහුණ හඳුනාගත්තා',
  stranger: 'ගැළපීමක් නැත: වෙනත් පුද්ගලයෙක්',
  illustration: 'නිදර්ශනයකි. සැබෑ ප්‍රතිඵල ඡායාරූපය සහ ඔබ තෝරන මට්ටම අනුව වෙනස් වේ.',

  journeyEyebrow: 'ගමන් මග',
  journeyTitle: 'ඡායාරූපයේ සිට ආරක්ෂාව දක්වා, පියවරෙන් පියවර.',
  journeyBody: 'සරල පියවර හතරක්. Account එකක් නැත, දත්ත තබා ගැනීමක් නැත.',
  fieldNotes: 'AegisHer · Field notes',
  journey: [
    { tag: 'පියවර 01', title: 'ඡායාරූපයක් upload කරන්න', body: 'JPG, PNG හෝ WebP. මතකයේ පමණක් සකසයි.' },
    { tag: 'පියවර 02', title: 'මට්ටම තෝරන්න', body: 'සැහැල්ලු, සමබර හෝ උපරිම.' },
    { tag: 'පියවර 03', title: 'Download කර පළ කරන්න', body: 'ආරක්ෂිත පිටපත එලෙසම බෙදාගන්න.' },
    { tag: 'පියවර 04', title: 'හිරිහැරයක් සිදු වුවහොත්', body: 'මිනිත්තු කිහිපයකින් සාක්ෂි වාර්තාවක් සාදන්න.' },
    { tag: 'අවසාන පියවර', title: 'ඉවත් කරවා ගන්න', body: 'වාර්තාව CERT, පොලිසිය සහ platforms වෙත යවන්න.' },
  ],

  privacyEyebrow: 'පෞද්ගලිකත්වය මුලින්ම',
  privacyTitle: 'ඔබව ආරක්ෂිතව තබා ගැනීමට නිර්මාණය කළා.',
  privacy: [
    { title: 'කිසිවිටෙක ගබඩා නොකෙරේ', body: 'ඡායාරූප සහ සාක්ෂි server මතකයේ පමණක් රැඳෙන අතර disk එකට ලිවීම හෝ log කිරීම සිදු නොවේ.' },
    { title: 'ස්ථාන දත්ත ඉවත් කෙරේ', body: 'සෑම ආරක්ෂිත ඡායාරූපයකින්ම GPS සහ කැමරා තොරතුරු ඉවත් කෙරේ.' },
    { title: 'Account එකක් අවශ්‍ය නැත', body: 'ලියාපදිංචියක් නැත, profile එකක් නැත, ඔබව හඳුනාගත හැකි කිසිවක් නැත.' },
  ],

  faqEyebrow: 'ප්‍රශ්න',
  faqTitle: 'දැනගත යුතු දේ',
  faq: [
    {
      q: 'වෙනස්කම් අනිත් අයට පෙනේද?',
      a: 'සමබර මට්ටමේදී වෙනස්කම් බොහෝ දුරට නොපෙනේ. උපරිම මට්ටම වඩා ශක්තිමත් නමුත් zoom කළ විට සියුම් රටාවක් පෙනිය හැක.',
    },
    {
      q: 'එය සියලුම deepfakes නවත්වයිද?',
      a: 'කිසිම මෙවලමකට එය පොරොන්දු විය නොහැක. නව AI models හෝ දැඩි edits මගින් ආරක්ෂාව දුර්වල විය හැකි නිසා private accounts සමඟ භාවිත කර, හිරිහැර ඉක්මනින් වාර්තා කරන්න.',
    },
    { q: 'මගේ ඡායාරූප කොතැනක හෝ ගබඩා වේද?', a: 'නැත. සියල්ල මතකයේ සකසා, ඔබේ ඉල්ලීම අවසන් වූ විට ඉවත් කෙරේ.' },
    {
      q: 'සාක්ෂි වාර්තාව යැවිය යුත්තේ කොහෙටද?',
      a: 'වාර්තාවේ Sri Lanka CERT, පොලිසිය සහ අන්තර්ගතය පළ වූ platform ඇතුළු නිවැරදි ස්ථාන දක්වා ඇත.',
    },
    { q: 'AegisHer සිංහලෙන් භාවිත කළ හැකිද?', a: 'ඔව්. පිටුවේ ඉහළ ඇති බොත්තමෙන් සිංහල සහ English අතර මාරු වන්න.' },
  ],

  ctaTitle: 'ඔබේ රූපයේ පාලනය නැවත ඔබ අතට ගන්න.',
  ctaBody: 'ඊළඟ ඡායාරූපය පළ කිරීමට පෙර එය ආරක්ෂා කරන්න.',
}

export const homeText: Record<Lang, HomeText> = { en, si }
