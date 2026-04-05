import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { useSocket } from './SocketContext';

const MatchContext = createContext(null);

// ===== INITIAL STATE =====
const initialState = {
  match: null,
  role: 'viewer',       // "host" | "cohost" | "viewer"
  matchCode: '',
  viewerCount: 0,
  sessionId: '',
  isLoading: false,
  error: null
};

// ===== REDUCER =====
function matchReducer(state, action) {
  switch (action.type) {
    case 'SET_MATCH':
      return { ...state, match: action.payload, isLoading: false, error: null };
    case 'SET_ROLE':
      return { ...state, role: action.payload };
    case 'SET_MATCH_CODE':
      return { ...state, matchCode: action.payload };
    case 'SET_SESSION_ID':
      return { ...state, sessionId: action.payload };
    case 'SET_VIEWER_COUNT':
      return { ...state, viewerCount: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'RESET':
      return { ...initialState };
    default:
      return state;
  }
}

// ===== PROVIDER =====
export function MatchProvider({ children }) {
  const [state, dispatch] = useReducer(matchReducer, initialState);
  const { socket } = useSocket();

  // Listen for socket events
  useEffect(() => {
    if (!socket) return;

    const handlers = {
      'match-state': ({ match, role }) => {
        dispatch({ type: 'SET_MATCH', payload: match });
        if (role) dispatch({ type: 'SET_ROLE', payload: role });
      },
      'score-updated': ({ match }) => {
        dispatch({ type: 'SET_MATCH', payload: match });
      },
      'viewer-count': ({ count }) => {
        dispatch({ type: 'SET_VIEWER_COUNT', payload: count });
      },
      'role-changed': ({ role, sessionId }) => {
        dispatch({ type: 'SET_ROLE', payload: role });
        if (sessionId) {
          dispatch({ type: 'SET_SESSION_ID', payload: sessionId });
          localStorage.setItem('cricket-session-id', sessionId);
        }
      },
      'scorer-changed': ({ activeScorer, message }) => {
        // Update match state will come via match-state event
        console.log('Scorer changed:', message);
      },
      'error': ({ message }) => {
        dispatch({ type: 'SET_ERROR', payload: message });
      }
    };

    // Register all handlers
    Object.entries(handlers).forEach(([event, handler]) => {
      socket.on(event, handler);
    });

    return () => {
      Object.keys(handlers).forEach(event => {
        socket.off(event);
      });
    };
  }, [socket]);

  // ===== ACTIONS =====
  const registerHost = useCallback((matchCode) => {
    if (!socket) return;
    let sessionId = localStorage.getItem('cricket-session-id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      localStorage.setItem('cricket-session-id', sessionId);
    }
    dispatch({ type: 'SET_SESSION_ID', payload: sessionId });
    dispatch({ type: 'SET_MATCH_CODE', payload: matchCode });
    dispatch({ type: 'SET_ROLE', payload: 'host' });
    socket.emit('register-host', { matchCode, sessionId });
  }, [socket]);

  const joinMatch = useCallback((matchCode) => {
    if (!socket) return;
    let sessionId = localStorage.getItem('cricket-session-id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      localStorage.setItem('cricket-session-id', sessionId);
    }
    dispatch({ type: 'SET_SESSION_ID', payload: sessionId });
    dispatch({ type: 'SET_MATCH_CODE', payload: matchCode });
    socket.emit('join-match', { matchCode, sessionId });
  }, [socket]);

  const updateScore = useCallback((action, value) => {
    if (!socket || !state.matchCode) return;
    socket.emit('update-score', { matchCode: state.matchCode, action, value });
  }, [socket, state.matchCode]);

  const selectBatsman = useCallback((playerIndex) => {
    if (!socket || !state.matchCode) return;
    socket.emit('select-batsman', { matchCode: state.matchCode, playerIndex });
  }, [socket, state.matchCode]);

  const selectBowler = useCallback((playerIndex) => {
    if (!socket || !state.matchCode) return;
    socket.emit('select-bowler', { matchCode: state.matchCode, playerIndex });
  }, [socket, state.matchCode]);

  const startInnings = useCallback((strikerIndex, nonStrikerIndex, bowlerIndex) => {
    if (!socket || !state.matchCode) return;
    socket.emit('start-innings', {
      matchCode: state.matchCode,
      strikerIndex,
      nonStrikerIndex,
      bowlerIndex
    });
  }, [socket, state.matchCode]);

  const endInnings = useCallback(() => {
    if (!socket || !state.matchCode) return;
    socket.emit('end-innings', { matchCode: state.matchCode });
  }, [socket, state.matchCode]);

  const undoBall = useCallback(() => {
    if (!socket || !state.matchCode) return;
    socket.emit('undo-ball', { matchCode: state.matchCode });
  }, [socket, state.matchCode]);

  const assignCoHost = useCallback((targetSocketId) => {
    if (!socket || !state.matchCode) return;
    socket.emit('assign-cohost', { matchCode: state.matchCode, targetSocketId });
  }, [socket, state.matchCode]);

  const hostReclaim = useCallback(() => {
    if (!socket || !state.matchCode) return;
    socket.emit('host-reclaim', { matchCode: state.matchCode });
  }, [socket, state.matchCode]);

  return (
    <MatchContext.Provider value={{
      ...state,
      dispatch,
      registerHost,
      joinMatch,
      updateScore,
      selectBatsman,
      selectBowler,
      startInnings,
      endInnings,
      undoBall,
      assignCoHost,
      hostReclaim
    }}>
      {children}
    </MatchContext.Provider>
  );
}

export function useMatch() {
  const context = useContext(MatchContext);
  if (!context) {
    throw new Error('useMatch must be used within a MatchProvider');
  }
  return context;
}

export default MatchContext;
