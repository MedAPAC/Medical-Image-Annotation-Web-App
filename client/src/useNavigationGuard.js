import { useState, useEffect, useCallback, useRef } from "react";

/**
 * useNavigationGuard
 *
 * Works with <BrowserRouter> (declarative routing) where useBlocker /
 * unstable_usePrompt are not available.
 *
 * Strategy
 * --------
 * React Router's <Link> and navigate() both ultimately call
 * window.history.pushState / replaceState. We replace those methods so
 * every in-app navigation passes through our guard before the URL changes.
 *
 * Key fixes vs. the naive patch approach
 * ----------------------------------------
 * 1. Same-URL filter  — React Router calls replaceState constantly to
 *    keep its internal state in sync (e.g. on every render in dev mode,
 *    on scroll-restoration, etc.). Those calls always target the CURRENT
 *    URL. We let them through unconditionally.
 *
 * 2. Activation delay — React Router performs its own initial pushState /
 *    replaceState burst during mount (history normalization, StrictMode
 *    double-invoke). We wait one tick (setTimeout 0) before arming the
 *    guard, so those startup calls are never intercepted.
 *
 * 3. isDirtyRef is always current — the closure captures the ref, not the
 *    state value, so we never need to re-install the patch when isDirty
 *    changes.
 *
 * For real page unloads (refresh / tab close) we use the standard
 * `beforeunload` event — the browser's native dialog is the only
 * available mechanism there.
 *
 * Usage
 * -----
 *   const {
 *     isDirty, setIsDirty, markClean,
 *     showUnsavedModal,
 *     handleConfirmLeave, handleCancelLeave,
 *     guardedNavigate,
 *   } = useNavigationGuard({ isDirtyExternal, onMarkClean });
 *
 * Parameters
 * ----------
 *   isDirtyExternal  – optional boolean you control externally.
 *                      When provided, the hook uses it instead of its
 *                      own internal isDirty state.
 *   onMarkClean      – optional callback fired when markClean() is called
 *                      (useful to set skipNextDirtyCheck refs, etc.).
 */
export default function useNavigationGuard({ isDirtyExternal, onMarkClean } = {}) {
  const [_isDirty, _setIsDirty] = useState(false);
  const isDirty = isDirtyExternal !== undefined ? isDirtyExternal : _isDirty;

  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);

  // The patch closure reads this ref so it always sees the latest value
  // without needing to be reinstalled on every isDirty change.
  const isDirtyRef = useRef(isDirty);
  useEffect(() => { isDirtyRef.current = isDirty; }, [isDirty]);

  // Whether the patch is "armed" — false during the initial burst of
  // React Router startup calls, true after the first event-loop tick.
  const armedRef = useRef(false);

  // ── markClean ──────────────────────────────────────────────────────
  const markClean = useCallback(() => {
    isDirtyRef.current = false;
    _setIsDirty(false);
    onMarkClean?.();
  }, [onMarkClean]);

  const setIsDirty = useCallback((v) => {
    if (isDirtyExternal === undefined) _setIsDirty(v);
  }, [isDirtyExternal]);

  // ── beforeunload (tab close / refresh / typed URL) ────────────────
  useEffect(() => {
    const handler = (e) => {
      if (!isDirtyRef.current) return;
      e.preventDefault();
      e.returnValue = "";
      return "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  // ── history patch ─────────────────────────────────────────────────
  useEffect(() => {
    const origPush    = window.history.pushState.bind(window.history);
    const origReplace = window.history.replaceState.bind(window.history);

    // Arm after one tick so React Router's mount-time navigation calls
    // (history normalization, StrictMode double-invoke) are ignored.
    const armTimer = setTimeout(() => { armedRef.current = true; }, 0);

    function isSameUrl(url) {
      if (url == null) return true; // replaceState(state, title) with no URL arg
      try {
        const next = new URL(String(url), window.location.href);
        return (
          next.pathname === window.location.pathname &&
          next.search   === window.location.search &&
          next.hash     === window.location.hash
        );
      } catch {
        return false;
      }
    }

    function intercept(origFn, state, unused, url) {
      // Always let through: not armed yet, or same-URL call.
      if (!armedRef.current || isSameUrl(url)) {
        origFn(state, unused, url);
        return;
      }

      if (!isDirtyRef.current) {
        origFn(state, unused, url);
        return;
      }

      // Block and show modal.
      setShowUnsavedModal(true);
      setPendingNavigation(() => () => origFn(state, unused, url));
    }

    window.history.pushState    = (s, u, url) => intercept(origPush,    s, u, url);
    window.history.replaceState = (s, u, url) => intercept(origReplace, s, u, url);

    return () => {
      clearTimeout(armTimer);
      armedRef.current = false;
      window.history.pushState    = origPush;
      window.history.replaceState = origReplace;
    };
  }, []);

  // ── modal handlers ────────────────────────────────────────────────
  const handleConfirmLeave = useCallback(() => {
    setShowUnsavedModal(false);
    const fn = pendingNavigation;
    setPendingNavigation(null);
    markClean();
    fn?.();
  }, [pendingNavigation, markClean]);

  const handleCancelLeave = useCallback(() => {
    setShowUnsavedModal(false);
    setPendingNavigation(null);
  }, []);

  /**
   * guardedNavigate(fn)
   * -------------------
   * Optional helper for explicit button/link handlers you control.
   * The history patch already covers <Link> and navigate() automatically —
   * this is only needed for custom imperative navigation.
   */
  const guardedNavigate = useCallback((fn) => {
    if (isDirtyRef.current) {
      setPendingNavigation(() => fn);
      setShowUnsavedModal(true);
    } else {
      fn();
    }
  }, []);

  return {
    isDirty,
    setIsDirty,
    markClean,
    showUnsavedModal,
    pendingNavigation,
    handleConfirmLeave,
    handleCancelLeave,
    guardedNavigate,
  };
}
