import { InfoPage } from '../../components/common/InfoPage';

export const metadata = {
  title: 'Terms of Service · Being Us',
  description: 'The terms that govern your use of Being Us, our synchronized co-watching platform.',
};

const sections = [
  {
    id: 'agreement',
    icon: 'description',
    title: 'The Agreement',
    blocks: [
      {
        paragraphs: [
          'Welcome to Being Us. These Terms of Service ("Terms") form a binding agreement between you and Being Us. By creating an account, creating or joining a room, or otherwise using the service, you agree to these Terms.',
          'If you do not agree with any part of these Terms, please do not use Being Us.',
        ],
      },
    ],
  },
  {
    id: 'eligibility',
    icon: 'badge',
    title: 'Eligibility',
    blocks: [
      {
        list: [
          'You must be at least 13 years old to use Being Us.',
          'You are responsible for the activity that happens through your account.',
          'You agree to provide accurate information when signing up and to keep it current.',
        ],
      },
    ],
  },
  {
    id: 'account',
    icon: 'manage_accounts',
    title: 'Your Account',
    blocks: [
      {
        paragraphs: [
          'You are responsible for safeguarding your account credentials and for any activity under your account. Notify us immediately of any unauthorized use.',
          'You may delete your account at any time. Deleting your account removes your profile data in accordance with our Privacy Policy.',
        ],
      },
    ],
  },
  {
    id: 'room-rules',
    icon: 'meeting_room',
    title: 'Rooms & Conduct',
    blocks: [
      {
        heading: 'Using rooms responsibly',
        list: [
          'Share room codes only with people you trust to respect the host and other participants.',
          'Honor the host’s playback controls — the host decides what plays and who can pause.',
          'Treat everyone with respect. Disruptive, harassing, or hateful behavior is not tolerated.',
          'Do not attempt to bypass room controls, interfere with playback sync, or disrupt others’ experience.',
        ],
      },
      {
        heading: 'What you must not do',
        list: [
          'Post spam, links to malware, or unsolicited commercial content.',
          'Upload or stream content you do not have the right to share.',
          'Harass, threaten, impersonate, or dox other users.',
          'Attempt to access accounts, rooms, or systems you are not authorized to access.',
        ],
      },
    ],
  },
  {
    id: 'content',
    icon: 'movie',
    title: 'Content & Streaming',
    blocks: [
      {
        paragraphs: [
          'Being Us provides a platform for synchronized viewing of videos. You are solely responsible for the content you choose to play, queue, or share in a room, and for ensuring you have the rights to stream it.',
          'You retain all rights to your own content. By using Being Us, you grant us a limited license to host, transmit, and display that content solely to operate the service and deliver it to your room participants.',
          'We do not pre-screen room content, but we may remove any content that violates these Terms or applicable law.',
        ],
      },
    ],
  },
  {
    id: 'acceptable-use',
    icon: 'gavel',
    title: 'Acceptable Use',
    blocks: [
      {
        paragraphs: [
          'You agree not to misuse the service, including by:',
        ],
        list: [
          'Interfering with or disrupting servers, networks, or connected services.',
          'Attempting to reverse engineer, scrape, or copy the service in unauthorized ways.',
          'Using automated tools or bots to create rooms, send messages, or inflate room activity.',
          'Using Being Us to violate any applicable law or regulation.',
        ],
      },
    ],
  },
  {
    id: 'intellectual-property',
    icon: 'copyright',
    title: 'Intellectual Property',
    blocks: [
      {
        paragraphs: [
          'The Being Us name, logo, design, and software are our property and protected by intellectual property laws. You may not use our branding without prior written permission.',
          'We grant you a limited, non-exclusive, revocable license to use Being Us for your personal, non-commercial viewing enjoyment.',
        ],
      },
    ],
  },
  {
    id: 'termination',
    icon: 'block',
    title: 'Termination',
    blocks: [
      {
        paragraphs: [
          'We may suspend or terminate your access to Being Us if you violate these Terms, disrupt the community, or pose a risk to the service or other users. You may stop using Being Us at any time by closing your account.',
          'Sections of these Terms that by their nature should survive termination — including content responsibility, intellectual property, and disclaimers — will continue to apply.',
        ],
      },
    ],
  },
  {
    id: 'disclaimers',
    icon: 'info',
    title: 'Disclaimers & Limitation of Liability',
    blocks: [
      {
        paragraphs: [
          'Being Us is provided "as is" and "as available" without warranties of any kind, whether express or implied, including merchantability, fitness for a particular purpose, and non-infringement.',
          'To the maximum extent permitted by law, Being Us shall not be liable for indirect, incidental, special, or consequential damages, or for any loss of data or goodwill, arising from your use of the service.',
          'Our total liability to you for any claim arising out of these Terms shall not exceed the greater of one hundred dollars ($100) or the amounts you paid to us in the twelve months preceding the claim.',
        ],
      },
    ],
  },
  {
    id: 'changes-to-terms',
    icon: 'update',
    title: 'Changes to These Terms',
    blocks: [
      {
        paragraphs: [
          'We may revise these Terms from time to time. Material changes will be announced within the app and the updated Terms posted on this page with a new "Last updated" date. Continued use after changes take effect constitutes acceptance of the revised Terms.',
        ],
      },
    ],
  },
  {
    id: 'contact',
    icon: 'contact_support',
    title: 'Contact',
    blocks: [
      {
        paragraphs: [
          'For questions about these Terms, contact us at legal@beingus.app.',
        ],
      },
    ],
  },
];

export default function TermsPage() {
  return (
    <InfoPage
      active="/terms"
      icon="description"
      eyebrow="Legal"
      title="Terms of Service"
      intro="The rules of the road for using Being Us — so everyone can enjoy watching together, fairly."
      lastUpdated="August 6, 2026"
      sections={sections}
    />
  );
}
