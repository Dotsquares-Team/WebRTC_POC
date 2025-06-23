import React from "react";
import Route from "./src/Route";
import { store } from "./src/Store/Store";
import { Provider } from "react-redux";

const App =()=>{
  return(
     <Provider store={store}>
    <Route/>
    </Provider>
  )
}

export default App