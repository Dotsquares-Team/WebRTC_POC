import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  NativeModules,
  Image,
  AppState,
  Platform,
} from 'react-native';
import {
  LISTNERS,
  SOCKETEVENTS,
  useSocket,
} from './SocketProvider';
import {
  RTCView,
} from 'react-native-webrtc';

import {useSelector, useDispatch} from 'react-redux';
import {
  activeScreenAwake,
  deActiveScreenAwake,
  debounce,
  getUserId,
  Images,
  pauseProcessing,
  startInCallManage,
} from './Helper';
import WebRTCService from './WebRTCService';
import { RootState, store } from './Store/Store';

enum CAMERASWAP {
  FRONT = 'front',
  BACK = 'back',
}
enum SWIPE_CONTAINUE_OPTIONS {
  WAITING = 'waiting',
  CONTAINUE = 'continue',
}
enum CALL_PAYPAUSE {
  PLAY = 'play',
  PAUSE = 'pause',
}

export const getSSOptions = (callerId: any) => {
  const user = store.getState().userReducer.userDetails;
  return {
    format: 'png',
    quality: 0.9,
    fileName: `callId_${callerId}_UID_${user?._id}`,
  };
};
// const {WebRTCModule} = NativeModules;
// const webRTCEventEmitter = new NativeEventEmitter(WebRTCModule);
// MAIN FUNCTION
const queuedCandidates: any[] = []; // Queue to store ICE candidates
const webRTCService = new WebRTCService();
let userId_: any = '';
const VideoCallScreen = ({navigation, route}: any) => {
  const {
    AudioSessionManager,
  } = NativeModules;
  const dispatch = useDispatch();
  const viewRef = useRef<View>(null);
  const swapeCameraRef = useRef<any>(true);
  const isUserEnableRecording = useRef<any>(false);
  const stream = useRef<any>(null);
  const localStream = useRef<any>(null);
  const topic =useSelector((state:RootState)=> state.userReducer.topic)
  const {socket} = useSocket();
  const callerId = useRef(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnnect, setIsConnect] = useState(false);
  const [isFrontCamera, setIsFrontCamera] = useState<any>(true);
  const [isMute, setIsMute] = useState<any>(false);
  const [swapCamera, setSwapCamera] = useState(true);
  const [showprompts, setShowPrompts] = useState(true);
    const [isLocalCameraConnnect, setIsLocalCameraConnect] = useState(false);

  const webRTCViewRef = useRef(null);
  const webRTCViewRefRemote = useRef(null);

 
  //SOCKETS
  useEffect(() => {
    // FOR KEEP SCREEN ACTIVE WHILE CALL
    activeScreenAwake();
    socket.on(SOCKETEVENTS.VIDEO_OFFER, offerHandler);
    socket.on(SOCKETEVENTS.ICE_CANDIDATE, iceCandidateAddHandler);
    socket.on(SOCKETEVENTS.VIDEO_ANSWER, videoAnswerHandler);
    socket.on(SOCKETEVENTS.MATCHED, userMatchHandler);
    socket.on(SOCKETEVENTS.NO_MATCHED, userNoFound);
    socket.on(SOCKETEVENTS.PARTICIPANT_MIC_STATUS, handleParticipantMicStatus);
    return () => {
      socket.off(SOCKETEVENTS.VIDEO_OFFER);
      socket.off(SOCKETEVENTS.ICE_CANDIDATE);
      socket.off(SOCKETEVENTS.VIDEO_ANSWER);
      socket.off(SOCKETEVENTS.MATCHED);
      socket.off(SOCKETEVENTS.PARTICIPANT_MIC_STATUS);
      socket.off(SOCKETEVENTS.NO_MATCHED);
      socket.off(SOCKETEVENTS.SWIPE_WAITING);
      socket.off(SOCKETEVENTS.RE_CONNECT);
      deActiveScreenAwake();
    };
  }, []);


  useEffect(() => {
    webRTCService.peerConnection?.addEventListener(
      LISTNERS.ICECANDIDATE,
      (event: any) => {
        console.log('CANDIDATES DATA HERE', event);
        if (!event.candidate) {
          return;
        }

        forwardCandidate(event.candidate);
      },
    );
    webRTCService.peerConnection?.addEventListener(
      LISTNERS.ICECANDIDATE_CHANGE,
      connectionCallback,
    );
    webRTCService.peerConnection?.addEventListener(
      LISTNERS.TRACK,
      (event: any) => {
        // Grab the remote track from the connected participant.
        // const remote = remoteStream || new MediaStream();
        // remote.addTrack(event.track, remote);
        // // remoteStream = remote;
        // setRemoteStream(remote);
        stream.current = event.streams[0];
      },
    );
  }, [
    webRTCService.peerConnection,
    webRTCViewRef.current,
    webRTCViewRefRemote.current,
  ]);

  useEffect(() => {
    if (webRTCService.remoteStream) {
      // setRemoteStream(webRTCService.remoteStream);
      stream.current = webRTCService.remoteStream;
    }
  }, [webRTCService.remoteStream, webRTCViewRef.current]);

  useEffect(() => {
    setTimeout(async () => {
      try {
        await startInCallManage();
        await startCall();
        // await requestMicrophonePermission();
      } catch (error) {
        console.log('Error while starting call', error);
      }
    }, 1000);
  }, []);
  // get sound level

  function handleParticipantMicStatus(data: any) {
    try {
      store.dispatch(updateParticipantMicStatus(data?.micStatus));
    } catch (error) {
      console.log('Error while calling handleParticipantMicStatus', error);
    }
  }
 
  const iceCandidateAddHandler = async (candidate: any) => {
    try {
    
      await addCandidate(candidate?.candidate);
    } catch (error) {
      console.log(Platform.OS, 'Error while adding ice_Candidate', error);
    }
  };
  const connectionCallback = async () => {
    let connectionType = webRTCService?.peerConnection?.connectionState;
    console.log(
      Platform.OS,
      'Connection status',
      connectionType,
    );
    try {
      if (connectionType == 'connecting') {
        // requestMicrophonePermission()
      }
      if (connectionType === 'connected') {
        let connectionTimer: any;
       
        await pauseProcessing();
        setIsConnect(true);
        setIsLoading(false);
        if (userId_ != callerId.current) {
          userId_ = callerId.current;
          sendEventForFeedbackScreen();
        }
        // startScreenRecordingFun();
      } 
    } catch (error) {
      console.log('Error on connection callBack', error);
    }
  };
  const sendEventForFeedbackScreen = () => {
    try {
      let data = {
        callId: callerId.current,
        userId: getUserId(),
      };
      socket.emit(SOCKETEVENTS.FEEDBACKSCREENTIMESTART, data);
    } catch (error) {
      console.log('Error while calling sendEventForFeedbackScreen');
    }
  };
  const offerHandler = async (data: any) => {
    console.log(Platform.OS, '=========>offerHandler', JSON.stringify(data));
    isUserEnableRecording.current = data?.enable_recording ?? false;
    try {
      callerId.current = data?.callId;
      await webRTCService.setRemoteDescription(data?.offer);
      const answer = await webRTCService.createAnswer();
      forwardAnswer(answer, data);
    } catch (error) {
      console.log('Error while accepting offer', error);
    }
  };


  const videoAnswerHandler = async (data: any) => {
    try {
      await webRTCService.setRemoteDescription(data?.answer);
    } catch (error) {
      console.log('Error while calling videoAnswerHandler', error);
    }
  };
  const userMatchHandler = async (data: any) => {
    try {
      isUserEnableRecording.current = data?.enable_recording ?? false;
      console.log(Platform.OS, 'MATCHED HERE', JSON.stringify(data));
      callerId.current = data?.callId;
      const offer = await createOffer();
      forwardOffer(offer, data?.callId);
    } catch (error) {
      console.log('Error while calling userMatchHandler', error);
    }
  };
  const userNoFound = (data: any) => {
    const user = store.getState().userReducer.userDetails;
    console.log('userNoFound', data, user?._id);
  };
  const startCall = async () => {
    try {
      console.log(
        'startCall>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>',
      );
      const connection = createConnection();
      const userMedia = await getUserMedia();
      localStream.current = userMedia;
      addMediaTracks();
      findMatchUser();
         setIsLocalCameraConnect(true);
    } catch (error) {
      console.log('Error while starting a call', error);
    }
  };
  const findMatchUser = () => {
    try {
      let payload = {
        userId: getUserId(),
        topic: topic?._id,
      };
      socket.emit(SOCKETEVENTS.FIND_MATCH, payload);
    } catch (error) {
      console.log('Error while matching find', error);
      throw error;
    }
  };


  const requestMicrophonePermission = async () => {
    console.log('requestMicrophonePermission>>>>>>>>');
    if (Platform.OS == 'ios') {
      try {
        const result = await AudioSessionManager.requestMicrophonePermission();
        console.log('requestMicrophonePermission', result);
      } catch (error) {
        console.error(
          'Error setting audio requestMicrophonePermission:',
          error,
        );
      }
    }
  };


  const getUserMedia = async () => {
    console.log('🚀 ~ getUserMedia ~ getUserMedia:');
    try {
      return webRTCService.getLocalStream();
    } catch (error) {
      console.log('Error while calling mediaDevices.getUserMedia', error);
    }
  };
  const createConnection = () => {
    try {
      return webRTCService.createPeerConnection();
    } catch (error) {
      console.log('error while creating the call connection', error);
      throw error;
    }
  };
  const addMediaTracks = () => {
    console.log('🚀 ~ addMediaTracks ~ addMediaTracks:');
    try {
      return webRTCService.addLocalStreamToConnection();
    } catch (error) {
      console.log('Error while calling peerConnection.addTrack', error);
      throw error;
    }
  };
  // const createOffer = async () => {
  //   try {
  //     return webRTCService.createOffer();
  //   } catch (error) {
  //     console.log('error while creating offer', error);
  //   }
  // };
  const createOffer = async () => {
    try {
      return webRTCService.createOffer();
    } catch (error) {
      console.log('error while creating offer', error);
    }
  };
  const addCandidate = async (candidate: any) => {
    try {
      return webRTCService.addIceCandidate(candidate);
    } catch (error) {
      console.log(Platform.OS, 'error while creating offer', error);
    }
  };


  const forwardOffer = (offer: any, callId: any) => {
    try {
      let data = {
        offer,
        callId,
        userId: getUserId(),
      };
      socket.emit(SOCKETEVENTS.VIDEO_OFFER, data);
    } catch (error) {
      console.log('Error while sending offer', error);
    }
  };
  const forwardAnswer = (answer: any, offerData: any) => {
    try {
      let data = {
        answer,
        callId: offerData?.callId,
        userId: getUserId(),
      };
      socket.emit(SOCKETEVENTS.VIDEO_ANSWER, data);
    } catch (error) {
      throw error;
    }
  };

  const forwardCandidate = (candidate: any) => {
    try {
      const user = store.getState().userReducer.userDetails;
      let data = {
        candidate,
        callId: callerId.current,
        userId: getUserId(),
      };
      socket.emit(SOCKETEVENTS.ICE_CANDIDATE, data);
    } catch (error) {
      console.log('Error while calling forwardCandidate', error);
    }
  };





  const muteHandler = async () => {
    try {
      function audioMute() {
        return new Promise(resolve => {
          const tracks = webRTCService.localStream?.getTracks();
          if (tracks) {
            for (const track of tracks) {
              if (track.kind === 'audio') {
                track.enabled = !track.enabled;
              }
            }
          }
          resolve(true);
        });
      }
      await audioMute();
    
    } catch (error) {
      console.log('Error while calling muteHandler', error);
    }
  };
  const getSwapView = useCallback(
    (type: CAMERASWAP) => {
      switch (type) {
        case CAMERASWAP.BACK:
          return swapCamera
            ? stream.current?.toURL()
            : webRTCService.localStream?.toURL();
        case CAMERASWAP.FRONT:
          return swapCamera
            ? webRTCService.localStream?.toURL()
            : stream.current?.toURL();
        default:
          break;
      }
    },
    [
      swapCamera,
      webRTCService.localStream,
      stream.current,
      localStream.current,
    ],
  );



  const remoteStreamView = useMemo(() => {
    return (
     
        <RTCView
          mirror={true}
          streamURL={getSwapView(CAMERASWAP.BACK)}
          objectFit={'cover'}
          zOrder={0}
          ref={webRTCViewRefRemote}
          style={{width: '100%', height: '100%'}}
        />
    );
  }, [
    stream.current,
    isConnnect,
    swapCamera,
    localStream.current,
    webRTCViewRefRemote.current,
  ]);


  // SMALL CAMERA DESIGN
  const smallCameraComponent = useMemo(() => {
    console.log(
      '🚀 ~ smallCameraComponent ~ getSwapView(CAMERASWAP.FRONT):',
      getSwapView(CAMERASWAP.FRONT),webRTCService.localStream?.toURL()
    );
    return (
      <View style={styles.smallCameraContent}>
        <TouchableOpacity
          onPress={() => {
            // setSwapCamera(val => !val);
            // swapeCameraRef.current = !swapeCameraRef.current;
          }}
          activeOpacity={0.8}
          style={styles.smallScreen}>
            <RTCView
              streamURL={getSwapView(CAMERASWAP.FRONT)}
              zOrder={0}
              ref={webRTCViewRef}
              mirror={true}
              objectFit={'cover'}
              style={{width: '98%', height: '98%'}}
            />
        </TouchableOpacity>
        {/* {!isLoading && showprompts && (
          <VideoCallThought topicData={topic} title={topic?.title} />
        )} */}
      </View>
    );
  }, [
    webRTCService.localStream,
    swapCamera,
    showprompts,
    viewRef.current,
    stream.current,
    isLoading,
    localStream.current,
    webRTCViewRef.current,
  ]);

  const handleInputChange = useCallback(funcCall => {
    return debounce(value => {
      funcCall();
    }, 500);
  }, []);

  const swapHandle = () => {
    setSwapCamera(val => !val);
    setIsFrontCamera(val => !val);
    swapeCameraRef.current = !swapeCameraRef.current;
  };

  const mikeHandler = handleInputChange(muteHandler);
  const smallViewHandler = handleInputChange(swapHandle);

  // BOTTOM BUTTONS
  const bottomButtonsView = useMemo(() => {
    return (
      <View style={styles.buttonView}>
        <TouchableOpacity
          onPress={smallViewHandler}
          activeOpacity={0.8}
          style={styles.cameraIconStyle}>
          {/* <SwitchCamera isFront={isFrontCamera} /> */}
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.cameraIconStyle}
          onPress={() => setShowPrompts(!showprompts)}>
          {/* <Image source={Images.promptIcon} style={styles.propmtIcons} /> */}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={mikeHandler}
          activeOpacity={0.8}
          style={styles.cameraIconStyle}>
          <Image
            source={isMute ? Images.mic_pink_new : Images.micUnMute}
            style={styles.bottomIcons}
          />
        </TouchableOpacity>
      </View>
    );
  }, [
    webRTCService.peerConnection,
    isMute,
    isFrontCamera,
    showprompts,
    localStream.current,
  ]);
  // BOTTOM CONTENT
  const screenBottomContent = useMemo(() => {
    return (
      <View style={styles.screenBottomView}>
        {/*SMALL CAMERA DESIGN  */}
        {smallCameraComponent}
        {/* BOTTOM BUTTONS */}
        {!isLoading && bottomButtonsView}
      </View>
    );
  }, [
    webRTCService.localStream,
    isLoading,
    isFrontCamera,
    isMute,
    swapCamera,
    showprompts,
    viewRef.current,
    localStream.current,
    webRTCViewRef.current,
  ]);

  console.log(" webRTCService.localStream" ,  webRTCService.localStream?.toURL())

  // MAIN RETURN
  return (
    <View style={styles.container}>
      {/* HEADER  */}
   
      {/* FULL SCREEN CAMERA  */}
      {remoteStreamView}
      {/* BOTTOM CONTENT */}
      {screenBottomContent}
    </View>
  );

};

export default VideoCallScreen;
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  text: {fontSize: 18, color: "#fff"},

  smallScreen: {
    width: 126,
    height: 164,
    borderWidth: 2,
    borderColor: "#fff",
    borderRadius: 12,
    backgroundColor: "#fff",
    overflow: 'hidden',
  },
  screenBottomView: {
    position: 'absolute',
    marginHorizontal: 16,
    bottom: 20,
    left: 0,
    right: 0,
  },
  headerWrapper: {
    position: 'absolute',
    zIndex: 11,
    top: 0,
    width: '94%',
    alignSelf: 'center',
  },
  headerContainer: {
    flex: 1,
  },
  modalContainer: {
    margin: 0,
  },
  modalItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  findingText: {
    color: "#fff",
  },
  buttonView: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    width: '80%',
    alignSelf: 'center',
    marginTop: 10,
  },
  bottomIcons: {
    width: 58,
    height: 58,
  },
  propmtIcons: {
    width: 86,
    height: 86,
    marginBottom: 10,
  },
  smallCameraContent: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  cameraBlackOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 11,
    backgroundColor:"#000",
  },
});
