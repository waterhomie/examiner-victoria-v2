import { useEffect, useRef } from "react";

import { sendTelemetryEvent } from "../api.js";


export function useAutoScrollToLatest(panelRef, bottomRef, triggers) {
  useEffect(() => {
    const panel = panelRef.current;
    if (panel) {
      panel.scrollTo({ top: panel.scrollHeight, behavior: "smooth" });
    } else {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
    // The caller owns the trigger list.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, triggers);
}


export function useRecordingTimer(recording, startedAtRef, setElapsed) {
  useEffect(() => {
    if (!recording) return undefined;
    const timer = window.setInterval(() => {
      setElapsed((Date.now() - startedAtRef.current) / 1000);
    }, 120);
    return () => window.clearInterval(timer);
  }, [recording, setElapsed, startedAtRef]);
}


export function usePrepCountdown(prepEndsAt, setPrepEndsAt, setClockTick) {
  useEffect(() => {
    if (!prepEndsAt) return undefined;
    const timer = window.setInterval(() => {
      const now = Date.now();
      setClockTick(now);
      if (prepEndsAt <= now) {
        setPrepEndsAt(null);
      }
    }, 500);
    return () => window.clearInterval(timer);
  }, [prepEndsAt, setClockTick, setPrepEndsAt]);
}


export function usePagehideCleanup(cleanup) {
  const cleanupRef = useRef(cleanup);

  useEffect(() => {
    cleanupRef.current = cleanup;
  }, [cleanup]);

  useEffect(() => {
    function handlePagehide() {
      cleanupRef.current?.();
    }

    window.addEventListener("pagehide", handlePagehide);
    return () => window.removeEventListener("pagehide", handlePagehide);
  }, []);
}


export function useFrontendErrorTelemetry() {
  useEffect(() => {
    function handleWindowError(event) {
      sendTelemetryEvent("frontend-error", {
        message: event.message || "window error",
        source: event.filename || "",
        line: event.lineno || 0,
        column: event.colno || 0,
      });
    }

    function handleUnhandledRejection(event) {
      sendTelemetryEvent("frontend-error", {
        message: String(event.reason?.message || event.reason || "unhandled rejection"),
      });
    }

    window.addEventListener("error", handleWindowError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    return () => {
      window.removeEventListener("error", handleWindowError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);
}
