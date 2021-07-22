import "core-js/stable";
import "regenerator-runtime/runtime";
import './scss/cs/isaac.scss';
import React from 'react';
import ReactDOM from 'react-dom';
import {Provider} from "react-redux";
import {store} from "./app/state/store";
import {IsaacApp} from './app/components/navigation/IsaacApp';
import {printAsciiArtLogoToConsole} from "./app/services/easterEggs/csLogoAsciiArt";
import * as highlightJsConfig from "./app/services/highlightJs";

printAsciiArtLogoToConsole();
highlightJsConfig.registerLanguages();

ReactDOM.render(
    <React.StrictMode>
        <Provider store={store}>
            <IsaacApp />
        </Provider>
    </React.StrictMode>,
    document.getElementById('root')
);
