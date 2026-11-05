// This isolated preview presents the implemented UI at a real phone viewport.
// Production configuration guards in the GitHub app remain unchanged.
import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./app-preview.css";
const inPhoneFrame =
  new URLSearchParams(window.location.search).has("appframe") ||
  window.self !== window.top;
function PreviewStage() {
  const [night, setNight] = useState(() => localStorage.getItem("theme") === "dark");
  useEffect(() => { const sync = () => setNight(localStorage.getItem("theme") === "dark"); window.addEventListener("storage", sync); return () => window.removeEventListener("storage", sync); }, []);
  return <div className={`app-preview-stage ${night ? "preview-night" : ""}`}><header className="app-preview-note"><span>TULUM · APP PREVIEW</span><span>Live services aren’t connected</span></header><div className="app-preview-phone"><iframe title="Stackd Tulum app preview" src="/?appframe=1" /></div></div>;
}
createRoot(document.getElementById("root")!).render(
  inPhoneFrame ? (
    <App />
  ) : (
    <PreviewStage />
  ),
);
