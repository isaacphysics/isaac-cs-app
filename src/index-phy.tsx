import "core-js/stable";
import './scss/isaac-phy.scss';
import React from 'react';
import ReactDOM from 'react-dom';
import {Provider} from "react-redux";
import {store} from "./app/state/store";
import {IsaacApp} from './app/components/navigation/IsaacApp';

ReactDOM.render(
    <React.StrictMode>
        <Provider store={store}>
            <IsaacApp />
        </Provider>
    </React.StrictMode>,
    document.getElementById('root')
);