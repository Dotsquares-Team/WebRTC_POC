import {createSlice} from '@reduxjs/toolkit';
import type {PayloadAction} from '@reduxjs/toolkit';

export interface UserState {
  isUserLogIn: boolean;
  userDetails:any;
  "1":any;
  "2":any;
  topic:{
    _id:string,
    title:string
  }
}

const initialState: UserState = {
  isUserLogIn: false,
  topic:{
_id:"681b039b872582e6bfd06b5d",
title:"TATA MOTORS"
  },
  userDetails:{},
  "1":{
    _id:"67518b11fd402b511dca2ba5",
    token:"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImdoZmdoZ2ZAeW9wbWFpbC5jb20iLCJpZCI6IjY3NTE4YjExZmQ0MDJiNTExZGNhMmJhNSIsImlhdCI6MTc1MDQxMzc4NSwiZXhwIjoxNzgxOTQ5Nzg1fQ.33nEBfOMh9fIDZhX3qW7CZ_NuqjLYR2TLAe7T2cHDZs"

  },
  "2":{
    _id:"6752973efd402b511dca2faf",
    token:"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InJrZG90c3F1YXJlc0BnbWFpbC5jb20iLCJpZCI6IjY3NTI5NzNlZmQ0MDJiNTExZGNhMmZhZiIsImlhdCI6MTc1MDQxNDAxNywiZXhwIjoxNzgxOTUwMDE3fQ.zi_FlmNLv_3WDtBmB5xKXOPpcYZK0T-AbLFQjO8JnEE"
  }
  
};

export const userReducerSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUserLogIn: (state, action: PayloadAction<boolean>) => {
      state.isUserLogIn = action.payload;
    },
    setUserDetails: (state, action: PayloadAction<any>) => {
      state.userDetails = action.payload;
    },
  
  },
});

// Action creators are generated for each case reducer function
export const {
  setUserLogIn,
  setUserDetails
} = userReducerSlice.actions;

export default userReducerSlice.reducer;
