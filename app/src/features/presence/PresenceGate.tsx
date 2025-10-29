import * as React from 'react';
import { usePresenceHeartbeat } from './PresenceService';

export default function PresenceGate() {
  usePresenceHeartbeat();
  return null;
}

