import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { BrowserRouter as Router } from "react-router-dom";
import AppRoutes from "./appRoutes/AppRoutes";
import AppContextProvider from "./context/applicationContext";
import { CookiesProvider } from "react-cookie";
// import { CookiesProvider } from "react-cookie";

// 1. The Type Assertion ('as HTMLElement')
const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);

root.render(
  <StrictMode>
    <CookiesProvider>
      <AppContextProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AppContextProvider>
    </CookiesProvider>
  </StrictMode>
);