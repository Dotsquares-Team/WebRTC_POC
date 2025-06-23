import {
  activateKeepAwake,
  deactivateKeepAwake,
} from '@sayem314/react-native-keep-awake';
import { store } from './Store/Store';
import InCallManager from 'react-native-incall-manager';

export const pauseProcessing = (time = 6) => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve('success');
    }, time * 100);
    
  });
};
export const activeScreenAwake = () => activateKeepAwake();
export const deActiveScreenAwake = () => deactivateKeepAwake();

export const getUserId = () =>
  store.getState()?.userReducer?.userDetails?._id || null;


export async function startInCallManage() {
  try {
    InCallManager.start({media: 'video', auto: true}); // or _DEFAULT_ or _DTMF_
    InCallManager.setSpeakerphoneOn(true);
    InCallManager.setMicrophoneMute(false);
    return await pauseProcessing(1);
  } catch (error) {
    throw error;
  }
}
export const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    if (timeoutId) {
      clearTimeout(timeoutId); // Clear the previous timeout if there's a new input
    }
    timeoutId = setTimeout(() => {
      func(...args); // Call the function after the delay
    }, delay);
  };
}


export const Images ={
  mic_pink_new:require('./images/mike_pink.png'),
  micUnMute:require('./images/mic.png'),
}