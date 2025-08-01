
import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  mediaDevices,
  RTCAudioSession,
  MediaStream,
} from 'react-native-webrtc';
import {NativeModules} from 'react-native';
const TURN_SERVER = "turn:13.48.136.24:8547?transport=udp" 
const TURN_SERVER2 = "turn:13.48.136.24:8547?transport=tcp"
const TURN_SERVER_USER_NAME = "turnuser"
const TURN_SERVER_PASSWORD = "Dots@123" 

class WebRTCService {
  constructor() {
    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = new MediaStream();
    this.configuration = {
      iceServers: [
        // {
        //   urls: STUN_SERVER,
        // },
        {
          urls: [
            TURN_SERVER,
            TURN_SERVER2
          ],
          username: TURN_SERVER_USER_NAME,
          credential: TURN_SERVER_PASSWORD,
        },
      ],
    };
  }

  /**
   * Initialize PeerConnection
   */
  createPeerConnection(onIceCandidate, onTrack) {
    this.peerConnection = new RTCPeerConnection(this.configuration);
  // Handle ICE candidates
    this.peerConnection.onicecandidate = event => {
      if (event.candidate && onIceCandidate) {
        onIceCandidate(event.candidate);
        // this.remoteStream.addTrack(event.track);
      }
    };

    // Handle remote track (when remote stream is added)
    this.peerConnection.ontrack = event => {
      if (event.streams && onTrack) {
        onTrack(event.streams[0]);
      }
    };
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        this.peerConnection.addTrack(track, this.localStream);
      });
    }
    return this.peerConnection;
  }

  // configureAudio = () => {
  //   const session = RTCAudioSession.sharedInstance();
  //   session.setCategory('AVAudioSessionCategoryPlayAndRecord');
  //   session.setMode('AVAudioSessionModeVoiceChat');
  //   session.overrideOutputAudioPort(AVAudioSessionPortOverrideSpeaker);
  // };

  configureAudio = () => {
    const session = RTCAudioSession.sharedInstance();
    session.setCategory('AVAudioSessionCategoryPlayAndRecord', {
      mode: 'AVAudioSessionModeVoiceChat',
      options: [
        'AVAudioSessionCategoryOptionAllowBluetooth',
        'AVAudioSessionCategoryOptionDefaultToSpeaker',
      ],
    });
    session.setMode('AVAudioSessionModeVoiceChat');
    session.overrideOutputAudioPort(AVAudioSessionPortOverrideSpeaker);
  };

  /**
   * Get User Media (Local Stream)
   */
  async getLocalStream(isVideoEnabled = true, isAudioEnabled = true) {
    try {
      const sourceInfos = await mediaDevices.enumerateDevices();
      let videoSourceId;
      for (let i = 0; i < sourceInfos.length; i++) {
        const sourceInfo = sourceInfos[i];
        if (sourceInfo.kind == 'videoinput' && sourceInfo.facing == 'user') {
          videoSourceId = sourceInfo.deviceId;
        }
      }
      let mediaConstraints = {
        // audio: {
        //   echoCancellation: true,
        //   noiseSuppression: true,
        //   autoGainControl: true,
        // },
        // audio: {
        //   // sampleRate: 16000,
        //   // echoCancellation: true, // Reduces echo
        //   // noiseSuppression: true, // Reduces background noise
        //   // autoGainControl: true, // Normalizes audio levels
        //   // sampleRate: 48000, // Higher sample rate for better quality (common default)
        //   // channelCount: 1,
        //   // volume: 0.7,
        //   // advanced: [
        //   //   {googEchoCancellation: true},
        //   //   {googNoiseSuppression: true},
        //   //   {googAutoGainControl: true},
        //   // ],
        //   deviceId: await getDevice(),
        //   echoCancellation: true,
        //   echoCancellationType: {ideal: ' system '},
        //   channelCount: 1,
        //   sampleRate: {ideal: 48000},
        //   noiseSuppression: false,
        //   autoGainControl: true,
        //   googEchoCancellation: true,
        //   googAutoGainControl: true,
        //   googExperimentalAutoGainControl: true,
        //   googNoiseSuppression: true,
        //   googExperimentalNoiseSuppression: true,
        //   googHighpassFilter: true,
        //   googTypingNoiseDetection: true,
        //   googBeamforming: false,
        //   googArrayGeometry: false,
        //   googAudioMirroring: true,
        //   googNoiseReduction: true,
        //   mozNoiseSuppression: true,
        //   mozAutoGainControl: false,
        //   latency: 0.01,
        // },
        audio: {
          echoCancellation: true,
          noiseSuppression: false, // Disable noise suppression if it's causing issues
          autoGainControl: false, // Disable automatic gain control to prevent distortions
        },
        video: {
          width: {ideal: 1920, max: 3840}, // Prefer 1080p+ resolution
          height: {ideal: 1080, max: 2160}, // Allow up to 4K if possible
          frameRate: {ideal: 60, max: 60}, // Prefer 60 FPS for smoother video
          facingMode: 'user', // Use front camera
          aspectRatio: 16 / 9, // Standard widescreen format
          advanced: [
            {googCpuOveruseDetection: false}, // Prevent automatic quality drops
            {googHighDynamicRange: true}, // Improve color accuracy
          ],
          optional: videoSourceId ? [{sourceId: videoSourceId}] : [],
        },
        // audio: true,
        // video: {
        //   width: 3840,
        //   height: 2160,
        //   frameRate: 60,
        //   facingMode: 'user',
        //   noiseSuppression: false, // Disable extra processing
        //   echoCancellation: false,
        //   autoGainControl: false,
        // },
        // video: true,
      };

      const stream = await mediaDevices.getUserMedia(mediaConstraints);
      // Reduce microphone sensitivity
      const audioTrack = stream.getAudioTracks()[0];
     
      this.localStream = stream;
      return stream;
    } catch (error) {
      console.error('Error accessing local media devices:', error);
      throw error;
    }
  }

  /**
   * Add Local Stream to Peer Connection
   */
  addLocalStreamToConnection() {
    if (this.localStream && this.peerConnection) {
      this.localStream.getTracks().forEach(track => {
        this.peerConnection.addTrack(track, this.localStream);
      });
    }
  }

  /**
   * Create an SDP Offer
   */
  async createOffer() {
    try {
      let sessionConstraints = {
        mandatory: {
          OfferToReceiveAudio: true,
          OfferToReceiveVideo: true,
          VoiceActivityDetection: true,
        },
      };
      const offer = await this.peerConnection.createOffer(sessionConstraints);
      if (this.peerConnection.localDescription == null) {
        await this.peerConnection.setLocalDescription(offer);
      }

      return offer;
    } catch (error) {
      console.error('Error creating offer:', error);
      throw error;
    }
  }

  async reconnect() {
    try {
      if (this.peerConnection) {
        this.peerConnection.restartIce();
      }
    } catch (error) {
      console.error('Error during reconnection:', error);
    }
  }

  /**
   * Create an SDP Answer
   */
  async createAnswer() {
    try {
      const answer = await this.peerConnection.createAnswer({iceRestart: true});
      await this.peerConnection.setLocalDescription(answer);
      return answer;
    } catch (error) {
      console.error('Error creating answer:', error);
      throw error;
    }
  }

  /**
   * Set Remote Description
   */
  async setRemoteDescription(sdp) {
    try {
      const remoteDescription = new RTCSessionDescription(sdp);
      await this.peerConnection.setRemoteDescription(remoteDescription);
    } catch (error) {
      console.error('Error setting remote description:', error);
      throw error;
    }
  }

  /**
   * Add ICE Candidate
   */
  async addIceCandidate(candidate) {
    try {
      if (this.peerConnection == null || !this.peerConnection.remoteDescription) return false;
      const iceCandidate = new RTCIceCandidate(candidate);
      await this.peerConnection.addIceCandidate(iceCandidate);
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
      throw error;
    }
  }

  /**
   * Reset remote description
   */
  resetRemoteDescription() {
    if (this.remoteStream) {
      this.remoteStream = null;
      this.remoteStream.getTracks().forEach(t => t.stop());
      this.remoteStream.release();
    }
  }
  /**
   * Close PeerConnection
   */
  closeConnection() {
    if (this.localStream) {
      this.localStream?.getTracks().forEach(t => t.stop());
      this.localStream.release();
      this.localStream = null;
    }
    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach(t => t.stop());
      this.remoteStream.release();
      this.remoteStream = null;
    }
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection.restartIce();
      this.peerConnection = null;
    }
  }
}

export default WebRTCService;
