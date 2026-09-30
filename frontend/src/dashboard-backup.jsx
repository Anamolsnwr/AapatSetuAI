import React from "react";
import ReactDOM from "react-dom/client";

import Dashboard from "./dashboard.jsx";
import "./style.css";


ReactDOM.createRoot(
    document.getElementById("root")
).render(

    <React.StrictMode>
        <Dashboard />
    </React.StrictMode>

);

function Dashboard() {

    return (
        <div>
            <h1>
                AapatSetu AI Dashboard
            </h1>
        </div>
    );

}


export default Dashboard;