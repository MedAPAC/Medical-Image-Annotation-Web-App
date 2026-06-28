import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Clock3, Cloud } from 'lucide-react';

const TaskTimer = ({ taskId, token }) => {
  const [seconds, setSeconds] = useState(0);
  const [status, setStatus] = useState('loading');
  const secondsRef = useRef(0);

  useEffect(() => {
    let isMounted = true;

    const fetchTimer = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/tasks/${taskId}/timer`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (isMounted) {
          const savedTime = response.data.seconds || 0;
          setSeconds(savedTime);
          secondsRef.current = savedTime;
          setStatus('active');
        }
      } catch (error) {
        console.error('[Timer] Error fetching:', error);
        setStatus('active');
      }
    };

    if (taskId && token) fetchTimer();
    return () => { isMounted = false; };
  }, [taskId, token]);

  useEffect(() => {
    if (status !== 'active') return undefined;
    const intervalId = setInterval(() => {
      setSeconds((previous) => {
        const next = previous + 1;
        secondsRef.current = next;
        return next;
      });
    }, 1000);
    return () => clearInterval(intervalId);
  }, [status]);

  useEffect(() => {
    if (status !== 'active') return undefined;

    const saveTime = async (isClosing = false) => {
      const currentTime = secondsRef.current;
      const url = `http://localhost:5000/api/tasks/${taskId}/timer`;
      const payload = { seconds: currentTime };

      try {
        if (isClosing) {
          await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
            keepalive: true,
          });
        } else {
          await axios.post(url, payload, {
            headers: { Authorization: `Bearer ${token}` },
          });
        }
      } catch (error) {
        console.error('[Timer] Save failed:', error);
      }
    };

    const saveInterval = setInterval(() => saveTime(false), 5000);
    const handleBeforeUnload = () => saveTime(true);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(saveInterval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      saveTime(false);
    };
  }, [status, taskId, token]);

  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const remainingSeconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${hours}:${minutes}:${remainingSeconds}`;
  };

  return (
    <div className={`task-session-timer ${status}`} aria-live='polite'>
      <span className='task-session-timer-icon' aria-hidden='true'>
        <Clock3 size={17} />
      </span>
      <span className='task-session-timer-copy'>
        <small>Session time</small>
        <strong>{status === 'loading' ? '--:--:--' : formatTime(seconds)}</strong>
      </span>
      <span className='task-session-save-state' title='Time is saved automatically'>
        <Cloud size={13} />
        Auto
      </span>
    </div>
  );
};

export default TaskTimer;
