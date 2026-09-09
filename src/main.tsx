import React, { Component, ErrorInfo, ReactNode } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

try {
  if (!performance.getEntriesByName("syncnote-start").length) {
    performance.mark("syncnote-start");
  }
} catch (e) {}

console.time("app-start");
console.time("startup");
console.log("[Startup] App initialization started");

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught SyncNote error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-[#191919] text-[#f3f3f3] p-6 select-none font-sans">
          <div className="w-full max-w-md bg-[#252525] border border-red-500/30 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-2 text-red-400 text-sm font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <span>SyncNote Startup Error</span>
            </div>
            <p className="text-xs text-neutral-300">
              An error occurred while launching the desktop application:
            </p>
            <div className="p-3 bg-[#181818] border border-white/[0.06] rounded-lg text-[11px] font-mono text-red-300 overflow-x-auto max-h-40">
              {this.state.error?.message || "Unknown error"}
            </div>
            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 py-2 bg-sky-500 hover:bg-sky-400 text-black font-semibold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Reload App
              </button>
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.reload();
                }}
                className="px-4 py-2 bg-white/[0.08] hover:bg-white/[0.12] text-neutral-300 text-xs rounded-lg transition-colors cursor-pointer"
              >
                Reset Cache
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const rootElement = document.getElementById("root") as HTMLElement;
const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

try {
  performance.mark("react-mounted");
  performance.measure("start-to-react", "syncnote-start", "react-mounted");
  const measure = performance.getEntriesByName("start-to-react")[0];
  if (measure) {
    console.log(`[Startup Profiling] WebView start → React mounted: ${measure.duration.toFixed(2)} ms`);
  }
} catch (e) {}

console.timeLog("startup", "React mounted");
