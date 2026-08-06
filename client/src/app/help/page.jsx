import { InfoPage } from '../../components/common/InfoPage';

export const metadata = {
  title: 'Help Center · Being Us',
  description: 'Guides and answers for getting the most out of Being Us — rooms, sync, playback controls, and more.',
};

const sections = [
  {
    id: 'getting-started',
    icon: 'rocket_launch',
    title: 'Getting Started',
    blocks: [
      {
        qa: [
          {
            icon: 'add',
            q: 'How do I create a room?',
            a: ['Click "Create Room" anywhere on the site.', 'Choose a room name or use the one we suggest.', 'Share the 6-digit code with your friends. You are the host, which means you control what plays and who joins.'],
          },
          {
            icon: 'meeting_room',
            q: 'How do I join a room?',
            a: ['Click "Join a Room" on the home screen.', 'Enter the 6-digit code your host shared with you.', 'Pick a display name (or sign in to use your profile) and you are in — playback snaps into sync automatically.'],
          },
          {
            icon: 'group',
            q: 'Do I need an account?',
            a: ['No. You can create or join a room as a guest with just a display name.', 'Signing in adds extras like your saved avatar and lets hosts be recognized by their profile.'],
          },
        ],
      },
    ],
  },
  {
    id: 'sync-playback',
    icon: 'sync_alt',
    title: 'Sync & Playback',
    blocks: [
      {
        qa: [
          {
            icon: 'sync',
            q: 'How does synced playback work?',
            a: ['Being Us keeps every participant on the same video at the same timestamp. When the host plays, pauses, seeks, or skips, everyone follows in real time.', 'If your connection hiccups, the player automatically resyncs on the next play event.'],
          },
          {
            icon: 'pause',
            q: 'Why can’t I pause?',
            a: ['The host controls playback permissions. If pause is disabled for guests, only the host can pause or seek.', 'Ask the host to enable guest controls from the room settings.'],
          },
          {
            icon: 'wifi_tethering',
            q: 'My video keeps buffering. What can I do?',
            a: ['Close other tabs and apps that are using your internet connection.', 'Lower the video quality from the player settings.', 'Restart your browser — this often clears stalled connections.'],
          },
          {
            icon: 'queue_music',
            q: 'How does the shared queue work?',
            a: ['Anyone with the right permission can add videos to the queue.', 'Videos play automatically in order when the current one finishes.', 'The host can reorder or remove items at any time.'],
          },
        ],
      },
    ],
  },
  {
    id: 'rooms-guests',
    icon: 'group',
    title: 'Rooms & Guests',
    blocks: [
      {
        qa: [
          {
            icon: 'person_add',
            q: 'How do I invite more people?',
            a: ['Copy the room code from the room header and share it anywhere — messages, group chats, or voice calls.', 'Up to 50 people can watch together in one room.'],
          },
          {
            icon: 'touch_app',
            q: 'What happens when the host leaves?',
            a: ['The room is transferred to the next available participant automatically, so watching continues without interruption.', 'If the last person leaves, the room ends and its data is cleared.'],
          },
          {
            icon: 'block',
            q: 'Can I remove someone from my room?',
            a: ['Yes. As host, open the member list and choose to remove a participant.', 'Removed members cannot rejoin unless the host shares the code again.'],
          },
        ],
      },
    ],
  },
  {
    id: 'moods-chat',
    icon: 'palette',
    title: 'Moods & Chat',
    blocks: [
      {
        qa: [
          {
            icon: 'chair',
            q: 'What are Theater Moods?',
            a: ['Moods transform the app’s atmosphere to match your viewing vibe — from a cozy starlit cabin to a classic cinema.', 'Pick one in the room settings. Everyone in the room can choose their own mood.'],
          },
          {
            icon: 'chat_bubble',
            q: 'What are Moments in Time?',
            a: ['Chat messages can be pinned to the exact video timestamp, so your reactions are saved right where they happened.', 'Reopen a pinned moment later to relive exactly when everyone reacted.'],
          },
          {
            icon: 'emoji_emotions',
            q: 'How do reactions work?',
            a: ['Click the emoji button in the chat bar to react to what’s on screen.', 'Reactions animate over the video and are visible to everyone in the room instantly.'],
          },
        ],
      },
    ],
  },
  {
    id: 'troubleshooting',
    icon: 'build',
    title: 'Troubleshooting',
    blocks: [
      {
        qa: [
          {
            icon: 'no_sound',
            q: 'Everyone can see the video but I hear no audio',
            a: ['Check your device volume and that the tab is not muted.', 'Make sure your browser has permission to play audio.', 'If you have multiple outputs (e.g. Bluetooth), confirm the correct device is selected.'],
          },
          {
            icon: 'link_off',
            q: 'My room code does not work',
            a: ['Double-check each digit — codes are case-sensitive and 6 digits long.', 'Room codes expire when the room ends. Ask the host to confirm the room is still active.'],
          },
          {
            icon: 'disabled_visible',
            q: 'I can’t see other participants’ video',
            a: ['Being Us synchronizes one shared video — there are no individual webcams.', 'Ensure everyone is in the same room (check the room code in the header).'],
          },
        ],
      },
    ],
  },
];

const contactCard = (
  <section className="card p-6 sm:p-10 text-center mt-4 overflow-hidden relative">
    <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-error-container blur-3xl pointer-events-none" aria-hidden="true"></div>
    <div className="relative">
      <div className="w-14 h-14 rounded-2xl bg-error-container text-primary flex items-center justify-center mx-auto mb-4 shadow-soft">
        <span className="material-symbols-outlined text-[28px]">support_agent</span>
      </div>
      <h2 className="font-headline-md text-2xl mb-2 text-on-background">Still stuck?</h2>
      <p className="font-body-md text-on-surface-variant text-sm sm:text-base max-w-xl mx-auto mb-6">
        Our team is happy to help. Tell us what you are seeing and we will get back to you within one business day.
      </p>
      <a href="mailto:support@beingus.app" className="btn btn-primary px-6 sm:px-8 py-3">
        <span className="material-symbols-outlined text-[18px]">mail</span>
        Contact Support
      </a>
    </div>
  </section>
);

export default function HelpPage() {
  return (
    <InfoPage
      active="/help"
      icon="help"
      eyebrow="Help Center"
      title="How can we help?"
      intro="Guides and quick answers for creating rooms, staying in sync, and making the most of watching together."
      lastUpdated="August 6, 2026"
      sections={sections}
    >
      {contactCard}
    </InfoPage>
  );
}
