import { useState, useEffect, useCallback } from 'react';
import { GameState } from '../types/gameData';

const DEFAULT_STATE: GameState = {
  _meta: { timestamp: '', externalConnected: false },
  player: { name: '–', faction: '', credits: 0, sector: '', sectorOwner: '' },
  control: { occupied: false, controlled: false },
  ship: { name: '', type: '', hull: 100, shields: 100, isDockedOrLanded: false },
  flight: { speed: 0, maxSpeed: 0, maxBoostSpeed: 0, maxTravelSpeed: 0, boostEnergy: 100, boosting: false, travelDrive: false, flightAssist: true, seta: false, autopilot: false, scanMode: false, longRangeScan: false },
  combat: { target: null, alertLevel: 0, attackerCount: 0, incomingMissiles: 0, missileIncoming: false, missileLockingOn: false },
  missionOffers: null,
  activeMission: null,
  logbook: null,
  currentResearch: null,
  factions: null,
  agents: null,
  inventory: null,
  transactionLog: null,
};

export function useGameData(wsUrl: string) {
  const [state, setState] = useState<GameState>(DEFAULT_STATE);
  const [wsConnected, setWsConnected] = useState(false);
  const [hasReceivedState, setHasReceivedState] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let active = true;

    function connect() {
      if (!active) return;
      setIsConnecting(true);

      try {
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          if (!active) return ws?.close();
          setWsConnected(true);
        };

        ws.onmessage = (e) => {
          if (!active) return;
          try {
            setState(JSON.parse(e.data));
            setHasReceivedState(true);
            setIsConnecting(false);
          } catch {
            // ignore parse errors
          }
        };

        ws.onclose = () => {
          if (!active) return;
          setWsConnected(false);
          setIsConnecting(false);
          retryTimer = setTimeout(connect, 3000);
        };

        ws.onerror = () => {
          ws?.close();
        };
      } catch {
        setIsConnecting(false);
        retryTimer = setTimeout(connect, 3000);
      }
    }

    connect();

    return () => {
      active = false;
      if (retryTimer) clearTimeout(retryTimer);
      ws?.close();
    };
  }, [wsUrl]);

  const pressKey = useCallback(async (action: string) => {
    try {
      const res = await fetch('/api/keypress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        console.error(`[KeyPress] Failed for action "${action}": ${err.error}`);
      }
    } catch (e) {
      console.error('[KeyPress] Network error:', e);
    }
  }, []);

  return {
    state,
    wsConnected,
    isInitialLoading: !hasReceivedState && isConnecting,
    pressKey,
  };
}
