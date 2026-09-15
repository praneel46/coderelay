export enum ConnectionState {
  CONNECTED = 'CONNECTED',
  RECONNECTING = 'RECONNECTING',
  RESTORED = 'RESTORED',
  DISCONNECTED = 'DISCONNECTED',
}

export interface SecurityEvent {
  id: string;
  teamId: string;
  memberId?: string;
  violationType: 'TAB_SWITCH' | 'VISIBILITY_CHANGE' | 'COPY' | 'PASTE' | 'FULLSCREEN_EXIT';
  warningNumber: 1 | 2 | 3;
  actionTaken: 'WARNING' | 'FORCE_SUBMIT' | 'NONE';
  createdAt: string;
}

export interface CompetitionStateSummary {
  roundSlug: string;
  roundStatus: string;
  currentStageOrder: number;
  activeMemberOrder?: 1 | 2 | 3;
  remainingSeconds: number;
  serverTimestamp: string;
}
