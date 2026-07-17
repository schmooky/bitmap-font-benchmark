import ReactDOM from "react-dom/client";
import App from "./App";
import "./globals.css";

// NB: no StrictMode — double-invoked effects would init two PixiJS
// Applications onto the same canvas.
ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
