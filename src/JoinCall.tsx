import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    Button
} from "react-native";
import { useSelector } from "react-redux";
import { RootState, store } from "./Store/Store";
import { setUserDetails, setUserLogIn } from "./Store/Reducer";
import { pauseProcessing } from "./Helper";

const JoinCall =()=>{
    const state = useSelector((state:RootState) => state.userReducer)
    const [value,setValue] = useState("")
    function onJoinPress(){
        try {
            const useD = state[value]
            if(useD){
                store.dispatch(setUserDetails(useD))
                pauseProcessing()
                store.dispatch(setUserLogIn(true))
            }
        } catch (error) {
           console.log("Error on join" , error) 
        }
    }
    return(
        <View style={styles.container}>
            <View style={{marginHorizontal:16}}>
                <TextInput 
                value={value}
                placeholder="Please enter code (1 & 2)"
                style={styles.input}
                onChangeText={setValue}
                placeholderTextColor={"#000"}
                />
                <Button
                title="JOIN"
                onPress={onJoinPress}
                 />
                </View>
        </View>
    )
}
export default JoinCall;
const styles = StyleSheet.create({
    container:{
        flex:1,
        backgroundColor:"#ffff",
        justifyContent:"center"
    },
    input:{
        height:47,
        borderWidth:1,
        borderRadius:16,
        backgroundColor:"#f2f2f2",
        paddingHorizontal:15,
        color:"#000"
    }
})