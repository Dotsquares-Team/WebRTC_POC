import React, {useContext, useEffect} from 'react';
import io, {Socket} from 'socket.io-client';
import { store } from './Store/Store';
const SOCKETURLNEW = "https://discursiaapp.24livehost.com/new-match"
const SocketContext = React.createContext<any>(null);

export const SocketProvider = ({children}: any) => {
  // const auth = getHeaders()?.Authorization
  const socket = getAuthTokenSocket();
  useEffect(() => {
    // const res =   socket.connect();
    return () => {
      socket.disconnect();
      disconnectSocket();
    };
  }, [socket]);
  return (
    <SocketContext.Provider
      value={{
        socket,
      }}>
      {children}
    </SocketContext.Provider>
  );
};

interface SocketContextType {
  socket: Socket; // Replace SocketType with your actual socket type
}

export function useSocket<T = any>(): SocketContextType {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketContext');
  }
  return context as SocketContextType;
}

let socket: any = null;

export const getAuthTokenSocket = () => {
  const user = store.getState().userReducer.userDetails;
  if (!socket) {
    console.log('SOCKETURL', SOCKETURLNEW);
    socket = io(`${SOCKETURLNEW}`, {
      // transports: ['websocket'],
      extraHeaders: {
        authorization: `Bearer ${user?.token}`, // Send the token in the headers
      },
      query: {
        userId: user?._id,
      },
    });
    socket.on('authorization', (data: any) => {
      console.log('authorization', data);
    });
    socket.on('connect', async () => {
      console.log('Connected to server:', socket.id);
    });
    socket.on('connect_error', (err: any) => {
      console.log('Socket connection error', err);
    });
  }

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket = null;
  }
};
// // export  {}
export enum SOCKETEVENTS {
  PING = 'ping',
  PONG = 'pong',
  VIDEO_OFFER = 'video-offer',
  VIDEO_ANSWER = 'video-answer',
  FIND_MATCH = 'find-match',
  MATCHED = 'matched',
  NO_MATCHED = 'no-match',
  ICE_CANDIDATE = 'iceCandidate',
  MANUAL_DISCONNECT = 'manual-disconnect',
  USER_DISCONNECT = 'user-disconnected',
  CALL_END = 'end-call',
  CALL_ENDED = 'call-ended',
  SWIPE_NEXT = 'swipe-next',
  SWIPE_CONTAINUE = 'swipe-continue',
  FEEDBACK = 'feedback',
  USER_REVIEW = 'review',
  USER_SWIPED = 'swiped',
  RE_CONNECT = 'reconnect',
  FEEDBACKSCREENTIMESTART = 'feedbackTimeStart',
  FEEDBACKSCREENTIMEUP = 'feedbackScreenTimeUp',
  FEEDBACKWAIT_TIMEUP = 'feedbackWaitTimeUp',
  HAND_ANIMATION_START = 'handAnimation',
  SWIPE_WAITING = 'waiting-continue',
  SWIPE_BEFORE_TIME = 'swipeBeforeTime',
  RECCONECT_SUCCESS = 'reconnect-success',
  APP_STATE = 'nextAppState',
  PEER_RECONNECT = 'peer-reconnect',
  BACK_PRESS = 'back-press',
  BACK_PRESSED = 'back-pressed',
  REPORT_PRESS = 'report-press',
  REPORT_PRESSED = 'report-pressed',
  REPORT_CLOSE = 'report-close',
  PARTICIPANT_MIC_STATUS = 'participant-mic',
}
export enum LISTNERS {
  ICECANDIDATE = 'icecandidate',
  ICECANDIDATE_CHANGE = 'connectionstatechange',
  TRACK = 'track',
}


