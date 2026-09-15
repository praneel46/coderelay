'use client';

import React, { useState, useEffect } from 'react';
import ParticipantRound1Page from '../round1/page';
import ParticipantRound2Page from '../round2/page';

export default function ParticipantArenaPage() {
  const [loading, setLoading] = useState<boolean>(true);
  const [activeRoundNumber, setActiveRoundNumber] = useState<number>(1);
  const [roundStatus, setRoundStatus] = useState<string>('READY'); // READY, ACTIVE, PAUSED, FINALIZED
  const [roundTitle, setRoundTitle] = useState<string>('ROUND 1 — CODE IQ');
  const [teamQualifiedR2, setTeamQualifiedR2] = useState<boolean | null>(null);
  const [teamCode, setTeamCode] = useState<string>('');
  const [teamName, setTeamName] = useState<string>('');
  const [memberName, setMemberName] = useState<string>('');
  const [countdown, setCountdown] = useState<number | null>(null);
  const [paused, setPaused] = useState<boolean>(false);

  useEffect(() => {
    fetchActiveSession();
    const interval = setInterval(fetchActiveSession, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchActiveSession = async () => {
    try {
      const r1Res = await fetch('/api/round1/state');
      const r2Res = await fetch('/api/round2/state');

      let currentRound = 1;
      let status = 'READY';
      let isPaused = false;

      if (r2Res.ok) {
        const r2Data = await r2Res.json();
        if (r2Data.teamCode) {
          setTeamCode(r2Data.teamCode);
          setTeamName(r2Data.teamName);
          setMemberName(r2Data.memberName);
        }

        if (r2Data.roundState === 'ACTIVE' || r2Data.roundState === 'PAUSED' || r2Data.roundState === 'MEMBER_1_ACTIVE') {
          currentRound = 2;
          status = r2Data.roundState;
          if (r2Data.roundState === 'PAUSED') isPaused = true;
        }
      }

      if (r1Res.ok) {
        const r1Data = await r1Res.json();
        if (r1Data.roundState === 'PAUSED') isPaused = true;
        if (r1Data.teamQualified !== undefined) setTeamQualifiedR2(r1Data.teamQualified);
        if (r1Data.roundState === 'COMPLETED' && currentRound === 1) {
          status = 'ROUND1_COMPLETE';
        } else if (r1Data.roundState === 'ACTIVE' && currentRound === 1) {
          status = 'ACTIVE';
        }
      }

      setActiveRoundNumber(currentRound);
      setRoundStatus(status);
      setPaused(isPaused);
      setRoundTitle(currentRound === 1 ? 'ROUND 1 — CODE IQ' : 'ROUND 2 — TRIPLE STRIKE');
    } catch (e) {
      console.error('Error fetching arena session:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bgApp bg-tech-grid text-textPrimary flex flex-col items-center justify-center font-mono text-sm">
        <div className="flex items-center space-x-3 p-6 rounded-xl bg-bgSurfaceBase/90 border border-borderMedium glass-panel shadow-[0_0_30px_rgba(0,0,0,0.5)]">
          <div className="w-5 h-5 rounded-full border-2 border-accentCyan border-t-transparent animate-spin" />
          <span className="text-textSecondary uppercase tracking-wider">SYNCHRONIZING ARENA SESSION...</span>
        </div>
      </div>
    );
  }

  // PAUSED OVERLAY (Server-Authoritative)
  if (paused) {
    return (
      <div className="min-h-screen bg-bgApp bg-tech-grid text-textPrimary flex items-center justify-center p-6 font-mono select-none">
        <div className="max-w-md w-full p-8 rounded-xl bg-bgSurfaceBase/95 border-2 border-statusWarning text-center space-y-6 shadow-[0_0_50px_rgba(245,158,11,0.2)] glass-panel">
          <div className="w-16 h-16 rounded-full bg-statusWarning/10 text-statusWarning flex items-center justify-center font-bold text-3xl mx-auto border border-statusWarning/30 animate-pulse">
            ⏸️
          </div>
          <div className="space-y-2">
            <div className="text-[10px] text-statusWarning uppercase tracking-widest bg-statusWarning/10 py-1 px-3 rounded inline-block">
              SERVER AUTHORITATIVE PAUSE
            </div>
            <h2 className="text-2xl font-extrabold text-statusWarning uppercase tracking-wider">
              ROUND PAUSED — PLEASE WAIT
            </h2>
            <p className="text-xs text-textMuted leading-relaxed">
              The organizer has paused the competition. All timers and question interactions are temporarily frozen on the server. Your work and draft answers remain 100% saved and secure.
            </p>
          </div>
          <div className="p-3.5 rounded-lg bg-bgApp border border-borderSubtle text-xs text-textSecondary flex items-center justify-between">
            <span className="text-textMuted uppercase">STATUS:</span>
            <span className="font-bold text-statusWarning flex items-center space-x-1.5">
              <span className="h-2 w-2 rounded-full bg-statusWarning animate-ping" />
              <span>SERVER PAUSED</span>
            </span>
          </div>
        </div>
      </div>
    );
  }

  // SYNCHRONIZED COUNTDOWN (5-4-3-2-1)
  if (countdown !== null && countdown > 0) {
    return (
      <div className="min-h-screen bg-bgApp bg-tech-grid text-textPrimary flex items-center justify-center p-6 font-mono select-none">
        <div className="text-center space-y-6 max-w-lg p-10 rounded-2xl bg-bgSurfaceBase/80 border border-accentCyan/40 glass-panel glow-cyan-lg">
          <div className="text-xs font-bold text-accentCyan uppercase tracking-widest bg-accentCyan/10 px-4 py-1.5 rounded-full inline-block">
            {roundTitle} — SYNCHRONIZED START
          </div>
          <div className="text-9xl font-black text-accentCyan drop-shadow-[0_0_35px_rgba(0,210,255,0.6)] animate-pulse">
            {countdown}
          </div>
          <div className="text-sm font-bold text-textSecondary uppercase tracking-widest">
            GET READY... ARENA UNLOCKING
          </div>
        </div>
      </div>
    );
  }

  // LOBBY / WAITING FOR ORGANIZER TO START
  if (roundStatus === 'READY' || roundStatus === 'DRAFT' || roundStatus === 'STAGED' || roundStatus === 'PENDING') {
    return (
      <div className="min-h-screen bg-bgApp bg-tech-grid text-textPrimary flex items-center justify-center p-6 font-mono select-none">
        <div className="max-w-lg w-full p-8 rounded-xl bg-bgSurfaceBase/90 border border-borderMedium text-center space-y-6 shadow-[0_0_40px_rgba(0,0,0,0.6)] glass-panel">
          <div className="w-16 h-16 rounded-full bg-accentCyan/10 text-accentCyan flex items-center justify-center font-bold text-2xl mx-auto border border-accentCyan/30 glow-cyan-sm">
            ⏳
          </div>

          <div className="space-y-2">
            <div className="text-[10px] font-mono text-accentCyan font-bold uppercase tracking-widest bg-accentCyan/10 px-3 py-1 rounded inline-block">
              VIDYANTRA 2026 // GET READY // WAITING FOR ORGANIZER
            </div>
            <h2 className="text-3xl font-extrabold text-textPrimary tracking-tight">{roundTitle}</h2>
            {teamName && (
              <div className="text-xs text-textMuted pt-1">
                Team: <span className="text-textPrimary font-bold">{teamName} ({teamCode})</span> • Member: <span className="text-accentCyan font-bold">{memberName}</span>
              </div>
            )}
          </div>

          <div className="p-4 rounded-lg bg-bgApp border border-borderMedium text-left text-xs">
            <div className="flex justify-between items-center">
              <span className="text-textMuted uppercase">STATUS:</span>
              <span className="font-bold text-statusWarning uppercase flex items-center space-x-2">
                <span className="h-2 w-2 rounded-full bg-statusWarning animate-status-pulse" />
                <span>WAITING FOR ORGANIZER TO START</span>
              </span>
            </div>
          </div>

          <p className="text-xs text-textMuted leading-relaxed">
            Please stay on this screen. Your arena interface will unlock automatically as soon as the organizer initiates the competition timer.
          </p>
        </div>
      </div>
    );
  }

  // ROUND 1 COMPLETE RESULTS / QUALIFICATION STATUS
  if (roundStatus === 'ROUND1_COMPLETE') {
    return (
      <div className="min-h-screen bg-bgApp bg-tech-grid text-textPrimary flex items-center justify-center p-6 font-mono select-none">
        <div className="max-w-md w-full p-8 rounded-xl bg-bgSurfaceBase/90 border border-borderMedium text-center space-y-6 shadow-xl glass-panel">
          <div className="text-5xl">🏁</div>
          <h2 className="text-2xl font-bold text-textPrimary uppercase tracking-wider">ROUND 1 COMPLETE</h2>

          <div className={`p-6 rounded-lg border text-center space-y-2 ${
            teamQualifiedR2 ? 'bg-statusSuccess/10 border-statusSuccess text-statusSuccess' : 'bg-statusDanger/10 border-statusDanger text-statusDanger'
          }`}>
            <div className="text-xs uppercase font-bold tracking-widest">OFFICIAL TEAM RESULT</div>
            <div className="text-2xl font-extrabold tracking-tight">
              {teamQualifiedR2 ? '✓ QUALIFIED FOR ROUND 02' : 'NOT QUALIFIED'}
            </div>
            <p className="text-xs leading-relaxed text-textSecondary pt-1">
              {teamQualifiedR2
                ? 'Congratulations! Your team has qualified for Round 2 — Triple Strike. Waiting for the organizer to start Round 2.'
                : 'Your team has been eliminated from competition. Thank you for participating in CODE RELAY!'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ACTIVE ROUND 1 ARENA
  if (activeRoundNumber === 1 && (roundStatus === 'ACTIVE' || roundStatus === 'OPEN')) {
    return <ParticipantRound1Page />;
  }

  // ACTIVE ROUND 2 ARENA
  if (activeRoundNumber === 2) {
    return <ParticipantRound2Page />;
  }

  return (
    <div className="min-h-screen bg-bgApp bg-tech-grid text-textPrimary flex items-center justify-center font-mono text-sm">
      <span>Connecting to Competition Arena...</span>
    </div>
  );
}
