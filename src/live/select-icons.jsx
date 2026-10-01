import React from 'react';
import {
  Hash,
  MessageSquareReply,
  PencilLine,
  Siren,
  Trash2,
  Send,
  Eye,
  Braces,
  MousePointer2,
  Workflow,
  Layers,
  BookmarkCheck,
  ClipboardCheck,
  Megaphone,
  Users,
  Pin,
  Paintbrush,
  History,
} from 'lucide-react';

export function TaskIcon({ task }) {
  const Icon =
    {
      'channel-topic': Hash,
      'thread-reply': MessageSquareReply,
      'edit-message': PencilLine,
      'incident-triage': Siren,
      'delete-draft': Trash2,
      'handoff-dm': Send,
      'release-sync': Workflow,
      'incident-closeout': Siren,
      'saved-cleanup': BookmarkCheck,
      'decision-record': ClipboardCheck,
      'handoff-repair': PencilLine,
      'qa-signoff': ClipboardCheck,
      'publish-update': Megaphone,
      'oncall-briefing': Users,
      'thread-repair': MessageSquareReply,
      'pin-refresh': Pin,
      'design-handoff': Paintbrush,
      'release-retrospective': History,
    }[task] ?? MessageSquareReply;
  return <Icon size={17} aria-hidden="true" />;
}

export function ModeIcon({ mode }) {
  const Icon =
    { a11y: Eye, 'json-ui': Braces, pixels: MousePointer2, api: Workflow }[mode] ?? Layers;
  return <Icon size={17} aria-hidden="true" />;
}
