import React from "react";
import {
    View,
    Text
} from "react-native";
import { useSelector } from "react-redux";
import { RootState } from "./Store/Store";
import VideoCallScreen from "./VideoCallScreen";
import { SocketProvider } from "./SocketProvider";
import JoinCall from "./JoinCall";

const Route =()=>{
    const isLogIn = useSelector((state:RootState) => state.userReducer.isUserLogIn)
    return (
        <>
        {
            isLogIn?<SocketProvider>
                 <VideoCallScreen/>
            </SocketProvider> : <JoinCall/>
        }
        </>
    )
}

export default Route