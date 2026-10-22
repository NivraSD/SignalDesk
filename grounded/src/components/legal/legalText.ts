import { CONTACT_EMAIL } from '@/lib/constants'

// The Privacy Policy and Terms, as plain sections. Keep these accurate to what the app actually does:
// when a feature starts sending data somewhere new, add it here and bump CONSENT_VERSION.

export interface LegalSection { title: string; body: string[] }

export const EFFECTIVE = 'October 22, 2026'

export const PRIVACY: LegalSection[] = [
  {
    title: 'Who we are',
    body: [
      `Grounded is a daily wellness and recovery companion run by Grounded Project ("we", "us"). Questions, requests and complaints go to ${CONTACT_EMAIL}.`,
      'Grounded is not a medical service, not therapy, and not emergency help. It is not covered by HIPAA.',
    ],
  },
  {
    title: 'What we collect',
    body: [
      'Your account: your email address and a password (stored only as a secure hash by our database provider).',
      'What you write and choose in Grounded: check-ins and scores, plans, journal entries, tasks and events, chat messages, what you share in About you, your areas, activities, vision board, pill checks, and anything you keep from Laugh.',
      'What Grounded works out from that, to be more helpful: a short running summary of what you have shared and patterns it notices (you can see and change it in About you), and search indexes ("embeddings") of your writing so the companion can recall it.',
      'If you connect Google Calendar: access to your calendar events, as described below.',
      'If you contribute: payment is handled entirely by Stripe. We see that a contribution was made and its amount, never your card details.',
      'Basic technical records our hosting providers keep, such as request logs and IP addresses, for security and to keep the service running.',
    ],
  },
  {
    title: 'How we use it',
    body: [
      'Only to run Grounded for you: to show your history and plans, to let the companion respond with context, to suggest activities and plans, to send emails you ask for, and to keep the service secure.',
      'We do not sell your information, share it with advertisers, or use it for advertising.',
      'Some of what you write is sensitive (health, mood, recovery). You decide what to share, and you can leave anything blank.',
    ],
  },
  {
    title: 'Services that process your information',
    body: [
      'We rely on these companies to run Grounded. Each receives only what its job needs:',
      'Supabase: our database, sign-in, and server functions. Everything you write is stored here.',
      'Vercel: hosts the website and app.',
      'Anthropic (Claude): writes the companion\'s replies, reflections, plan suggestions, your running summary, and Laugh poems. It receives the relevant parts of what you have written.',
      'Voyage AI: turns your writing into search indexes so the companion can recall it.',
      'Google (Gemini): creates the artwork. It receives art directions only, not your writing.',
      'Google Calendar: only if you connect it.',
      'Resend: sends emails such as pill summaries, and receives mail sent to our address.',
      'Stripe: processes contributions.',
    ],
  },
  {
    title: 'Google Calendar',
    body: [
      'If you connect Google Calendar, Grounded reads your events to avoid double-booking and adds events you ask it to add (for example from your plan or the Add screen). It does not change or delete events it did not create, except when you ask.',
      'Grounded\'s use and transfer of information received from Google APIs adheres to the Google API Services User Data Policy, including the Limited Use requirements. Calendar data is used only to provide these features to you. It is not sold, not used for advertising, not used to train AI models, and not read by people except with your permission, for security, or where the law requires.',
      'You can disconnect at any time in Settings → Google Calendar, which deletes Grounded\'s access tokens. You can also remove Grounded\'s access in your Google Account settings.',
    ],
  },
  {
    title: 'Sharing',
    body: [
      'We do not share your information with anyone except the services listed above, and when the law requires it or to protect someone from serious harm.',
      'If Grounded Project is ever transferred to someone else, this policy continues to apply to information collected under it, and we will tell you first.',
    ],
  },
  {
    title: 'Keeping and deleting your information',
    body: [
      'We keep your information while your account exists. Clear chat (Settings) hides past messages from your screen; it does not delete them, and the companion still remembers.',
      `To delete your account and everything in it, email ${CONTACT_EMAIL} from your account's email address. We will delete it within 30 days, except where the law requires us to keep something, and confirm when it is done. You can also ask us for a copy of your information.`,
    ],
  },
  {
    title: 'Security',
    body: [
      'Connections are encrypted, each person can only reach their own information, and access tokens for connected services are never sent to your browser. No system is perfectly secure; if we learn of a breach affecting you, we will tell you.',
    ],
  },
  {
    title: 'Age',
    body: ['Grounded is for people 18 and older. We do not knowingly collect information from anyone younger.'],
  },
  {
    title: 'Your rights',
    body: [
      `Depending on where you live, you may have the right to see, correct, export, or delete your information, and to withdraw consent. Email ${CONTACT_EMAIL} and we will help, whatever your location.`,
    ],
  },
  {
    title: 'Changes',
    body: ['If we change this policy in a way that matters, we will ask you to review and agree again in the app before you continue.'],
  },
]

export const TERMS: LegalSection[] = [
  {
    title: 'The basics',
    body: [
      'These terms are an agreement between you and Grounded Project for using Grounded. By creating an account or using the app, you agree to them and to the Privacy Policy. You must be 18 or older.',
    ],
  },
  {
    title: 'Not medical care, not emergency help',
    body: [
      'Grounded is a personal wellness tool. It is not therapy, medical advice, diagnosis, or treatment, and it does not replace a doctor, therapist, sponsor, or support group. Talk to a qualified professional about your health and medication.',
      'Grounded cannot respond to emergencies. If you are in crisis or might hurt yourself or someone else, call or text 988 (Suicide & Crisis Lifeline, US) or call 911 or your local emergency number.',
    ],
  },
  {
    title: 'AI can be wrong',
    body: [
      'The companion, plans, summaries and other generated content come from AI. They can be inaccurate, incomplete, or unsuitable for you. Use your own judgment and do not rely on them for decisions about health, safety, money, or law.',
    ],
  },
  {
    title: 'Your content',
    body: [
      'What you write stays yours. You give us permission to store and process it only as needed to run Grounded for you, as described in the Privacy Policy.',
    ],
  },
  {
    title: 'Using Grounded fairly',
    body: [
      'Use Grounded only for yourself and lawfully. Do not try to access other people\'s accounts or data, disrupt the service, or misuse it. Keep your password to yourself.',
    ],
  },
  {
    title: 'Contributions',
    body: [
      `Grounded is free. Contributions are voluntary and do not buy any extra features or service. If you contributed by mistake, email ${CONTACT_EMAIL} within 30 days and we will refund it.`,
    ],
  },
  {
    title: 'Changes and ending',
    body: [
      'Grounded may change, and features may come and go. You can stop using it at any time and ask us to delete your account. We may suspend accounts that misuse the service. If we ever shut Grounded down, we will give you notice and a way to get a copy of your information first.',
    ],
  },
  {
    title: 'No warranty; limits on liability',
    body: [
      'Grounded is provided "as is", without warranties of any kind. To the extent the law allows, Grounded Project is not liable for indirect or consequential losses, or for anything arising from relying on the app or its AI-generated content, and our total liability is limited to the amount you contributed in the past 12 months. Some places do not allow these limits, so they may not apply to you.',
    ],
  },
  {
    title: 'Contact',
    body: [`Questions about these terms: ${CONTACT_EMAIL}.`],
  },
]
