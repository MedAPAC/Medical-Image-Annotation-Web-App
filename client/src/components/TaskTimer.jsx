// components/TaskTimer.jsx
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

const TaskTimer = ({ taskId, token }) => {
  const [seconds, setSeconds] = useState(0);
  // 'loading' prevents the timer from ticking/saving 0 before we fetch the real time
  const [status, setStatus] = useState("loading"); 
  const secondsRef = useRef(0);

  // 1. Fetch Initial Time
  useEffect(() => {
    let isMounted = true;

    const fetchTimer = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/tasks/${taskId}/timer`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (isMounted) {
          const savedTime = response.data.seconds || 0;
          console.log(`[Timer] Loaded from DB: ${savedTime}s`);
          setSeconds(savedTime);
          secondsRef.current = savedTime;
          setStatus("active"); // Only NOW do we allow counting/saving
        }
      } catch (error) {
        console.error("[Timer] Error fetching:", error);
        // Even on error, we enable the timer so user can track new time, 
        // but ideally you might want to handle retry here.
        setStatus("active"); 
      }
    };

    if (taskId && token) {
      fetchTimer();
    }

    return () => { isMounted = false; };
  }, [taskId, token]);

  // 2. Ticking Logic (Only runs when status is 'active')
  useEffect(() => {
    if (status !== "active") return;

    const intervalId = setInterval(() => {
      setSeconds(prev => {
        const next = prev + 1;
        secondsRef.current = next;
        return next;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [status]);

  // 3. Save Logic (Auto-save + Tab Close)
  useEffect(() => {
    if (status !== "active") return;

    const saveTime = async (isClosing = false) => {
      const currentTime = secondsRef.current;
      const url = `http://localhost:5000/api/tasks/${taskId}/timer`;
      const payload = { seconds: currentTime };

      try {
        if (isClosing) {
          // 'keepalive' allows the request to complete even if the browser tab closes
          // This supports headers, unlike sendBeacon
          await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload),
            keepalive: true 
          });
        } else {
          // Standard auto-save
          await axios.post(url, payload, {
            headers: { Authorization: `Bearer ${token}` }
          });
        }
        console.log(`[Timer] Saved: ${currentTime}s`);
      } catch (error) {
        console.error("[Timer] Save failed:", error);
      }
    };

    // Auto-save every 5 seconds (Safer than 30s)
    const saveInterval = setInterval(() => saveTime(false), 5000);

    // Save on Window Close / Refresh
    const handleBeforeUnload = () => saveTime(true);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      clearInterval(saveInterval);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      // Save on component unmount (React navigation)
      saveTime(false);
    };
  }, [status, taskId, token]);

  // Format Helper
  const formatTime = (totalSeconds) => {
    const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  if (status === "loading") {
    return <div className="p-2 text-gray-500">Loading Time...</div>;
  }

  return (
    <div style={{
      fontFamily: "monospace", fontSize: "16px", fontWeight: "bold",
      color: "#0f172a", background: "#f1f5f9", padding: "8px 12px",
      borderRadius: "6px", border: "1px solid #e2e8f0", display: "flex", gap: "8px"
    }}>
      <span>⏱️</span> {formatTime(seconds)}
    </div>
  );
};

export default TaskTimer;
