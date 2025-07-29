import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet
} from "react-native";
import { useSelector } from "react-redux";
import { RootState } from "./Store/Store";
import VideoCallScreen from "./VideoCallScreen";
import { SocketProvider } from "./SocketProvider";
import JoinCall from "./JoinCall";

const LoadingView =()=>{
    const [isLoaded,setIsLoaded] = useState(false);

    useEffect(()=>{
        setTimeout(() => {
            setIsLoaded(true)
        }, 2000);
    },[])
    return (
        <View style={styles.container}>
            {!isLoaded ?<View style={{flex:1,alignItems:"center",justifyContent:"center"}}><Text style={{color:"#000"}}>Loading...</Text></View> :<VideoCallScreen/> }
        </View>
    )
}
const Route =()=>{
    const isLogIn = useSelector((state:RootState) => state.userReducer.isUserLogIn)
    return  isLogIn?<SocketProvider>
                 <LoadingView/>
            </SocketProvider> : <JoinCall/>
    
}

export default Route;
const styles = StyleSheet.create({
    container:{
        flex:1
    }
})