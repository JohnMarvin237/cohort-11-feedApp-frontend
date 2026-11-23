import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { BrowserRouter as Router } from "react-router-dom";
import AppRoutes from "./appRoutes/AppRoutes";

// 1. The Type Assertion ('as HTMLElement')
const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);

root.render(
  <Router>
    <AppRoutes />
  </Router>
);