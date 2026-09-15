export interface Submission {
  id: string;
  teamId: string;
  roundId: string;
  stageId?: string;
  memberId?: string;
  questionId?: string;
  answer?: string;
  codeContent?: string;
  isAutoSubmitted: boolean;
  submittedAt: string;
}

export interface RelaySnapshot {
  id: string;
  participantSessionId: string;
  memberId: string;
  memberOrder: 1 | 2 | 3;
  codeContent: string;
  snapshotType: 'PERIODIC' | 'HANDOFF' | 'FINAL_LOCK';
  createdAt: string;
}
