import { InfoPage } from '../../components/common/InfoPage';

export const metadata = {
  title: 'Privacy Policy · Being Us',
  description: 'How Being Us collects, uses, and protects your information while you watch together.',
};

const sections = [
  {
    id: 'overview',
    icon: 'shield',
    title: 'Our Privacy Promise',
    blocks: [
      {
        paragraphs: [
          'Being Us is built around a simple idea: your shared viewing moments are personal, and they should stay that way. We collect the minimum information needed to deliver a smooth, synchronized viewing experience — and we never sell your data.',
          'This policy explains what we collect, why we collect it, and the choices you have. It applies to everyone who uses Being Us, whether you create a room, join one, or just browse.',
        ],
      },
    ],
  },
  {
    id: 'data-we-collect',
    icon: 'database',
    title: 'What We Collect',
    blocks: [
      {
        heading: 'Information you provide',
        list: [
          'Account details — your name, email address, and avatar when you sign up or sign in.',
          'Room preferences — room names, watch titles, queue items, and mood selections you make.',
          'Support requests — any details you share when contacting us for help.',
        ],
      },
      {
        heading: 'Information we collect automatically',
        list: [
          'Session data — when a room is active, which participants are present and their sync state.',
          'Usage data — anonymized counts of rooms created and features used, so we can improve Being Us.',
          'Device basics — browser type and approximate region, used only for compatibility and security.',
        ],
      },
      {
        paragraphs: [
          'We do not require an account to join a room. Guests are identified only by a temporary name and are not tied to any stored profile unless they choose to sign in.',
        ],
      },
    ],
  },
  {
    id: 'how-we-use',
    icon: 'manage_accounts',
    title: 'How We Use Your Information',
    blocks: [
      {
        heading: 'Purpose-driven only',
        list: [
          'To operate Being Us — creating rooms, keeping playback in sync, and delivering chat in real time.',
          'To keep your experience safe — detecting abuse, preventing spam, and enforcing our Terms.',
          'To communicate with you — transactional emails like room invitations or security notices.',
          'To improve the product — understanding feature usage through aggregate, non-identifying statistics.',
        ],
      },
    ],
  },
  {
    id: 'sharing',
    icon: 'group_off',
    title: 'Who We Share It With',
    blocks: [
      {
        paragraphs: [
          'We do not sell, rent, or trade your personal information. We share data only in these limited circumstances:',
        ],
        list: [
          'Service providers — hosting and infrastructure partners that process data on our behalf under strict agreements.',
          'Legal obligations — when required by law, subpoena, or to protect the rights and safety of our community.',
          'With your consent — any time you explicitly opt in to a sharing arrangement, you will know exactly what is shared and with whom.',
        ],
      },
    ],
  },
  {
    id: 'room-privacy',
    icon: 'lock',
    title: 'Room Privacy & Playback',
    blocks: [
      {
        paragraphs: [
          'Rooms are private by default. A room is discoverable only through its unique 6-digit code, which you share with the people you want to watch with. The host controls the queue, who is admitted, and playback permissions.',
          'If you host a room, you decide what videos are played and who can join. Participants cannot see the full queue or chat history of a room unless they are currently in it.',
          'Chat messages and reactions are visible only to people in the same room at the time, and they disappear when the room ends.',
        ],
      },
    ],
  },
  {
    id: 'data-retention',
    icon: 'schedule',
    title: 'Data Retention',
    blocks: [
      {
        paragraphs: [
          'Room data — messages, queues, and sync states — is ephemeral by design. Room histories are cleared shortly after the last participant leaves.',
          'Account data is kept for as long as your account is active. You can request deletion at any time, and we will remove your profile data within 30 days unless we are legally required to keep it.',
        ],
      },
    ],
  },
  {
    id: 'your-rights',
    icon: 'verified_user',
    title: 'Your Rights & Choices',
    blocks: [
      {
        heading: 'You are in control',
        list: [
          'Access and correct your profile information at any time from your profile page.',
          'Export a copy of the account data we hold about you on request.',
          'Delete your account and its associated data — just ask us.',
          'Opt out of non-essential communications while continuing to use Being Us.',
          'Use guest mode to watch without creating any account at all.',
        ],
      },
    ],
  },
  {
    id: 'cookies',
    icon: 'cookie',
    title: 'Cookies & Local Storage',
    blocks: [
      {
        paragraphs: [
          'Being Us uses local storage to remember session preferences such as your display name, selected mood, and last active room. These values never leave your device and are not used for advertising.',
          'We do not use third-party tracking cookies, advertising cookies, or cross-site data sharing.',
        ],
      },
    ],
  },
  {
    id: 'children',
    icon: 'family_restroom',
    title: 'Children',
    blocks: [
      {
        paragraphs: [
          'Being Us is not directed at children under the age of 13, and we do not knowingly collect personal information from them. If you believe a child has provided us with personal information, contact us and we will delete it promptly.',
        ],
      },
    ],
  },
  {
    id: 'changes',
    icon: 'update',
    title: 'Changes to This Policy',
    blocks: [
      {
        paragraphs: [
          'We may update this policy from time to time. When we do, we will revise the "Last updated" date at the top of this page and, for significant changes, notify you through the app.',
        ],
      },
    ],
  },
  {
    id: 'contact',
    icon: 'contact_support',
    title: 'Contact Us',
    blocks: [
      {
        paragraphs: [
          'Questions about privacy? Write to us at privacy@beingus.app. We read every message and aim to respond within two business days.',
        ],
      },
    ],
  },
];

export default function PrivacyPage() {
  return (
    <InfoPage
      active="/privacy"
      icon="shield"
      eyebrow="Privacy"
      title="Privacy Policy"
      intro="How Being Us handles your information, protects your watch sessions, and keeps your shared moments private."
      lastUpdated="August 6, 2026"
      sections={sections}
    />
  );
}
