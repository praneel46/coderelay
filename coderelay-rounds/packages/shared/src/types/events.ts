export enum SocketEvent {
  // Server -> Client
  ROUND_STATUS = 'round:status',
  ROUND_COUNTDOWN = 'round:countdown',
  STAGE_TRANSITION = 'stage:transition',
  TEAM_WARNING = 'team:warning',
  TEAM_FORCE_SUBMIT = 'team:force-submit',
  SESSION_RESTORED = 'session:restored',

  // Client -> Server
  CLIENT_HEARTBEAT = 'client:heartbeat',
  CLIENT_JOIN_ROOM = 'client:join-room',
}
