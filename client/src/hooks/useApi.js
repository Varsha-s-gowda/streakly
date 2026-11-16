import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { todayInTimezone } from '../lib/dates.js';

export function useApi(request, deps = [], { enabled = true } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(null);
  const requestRef = useRef(request);
  requestRef.current = request;
  const mountedRef = useRef(true);

  const refresh = useCallback(
    async (options = {}) => {
      const { silent = false } = options;
      if (!silent) setLoading(true);
      setError(null);
      try {
        const result = await requestRef.current();
        if (mountedRef.current) setData(result);
        return result;
      } catch (err) {
        if (mountedRef.current) setError(err);
        throw err;
      } finally {
        if (mountedRef.current && !silent) setLoading(false);
      }
    },
    deps, // eslint-disable-line react-hooks/exhaustive-deps
  );

  useEffect(() => {
    mountedRef.current = true;
    if (enabled) {
      refresh().catch(() => {});
    } else {
      setLoading(false);
    }
    return () => {
      mountedRef.current = false;
    };
  }, [refresh, enabled]);

  return { data, setData, loading, error, refresh };
}

export function useToday() {
  const { user } = useAuth();
  const timezone = user?.timezone || 'Asia/Kolkata';
  const [today, setToday] = useState(() => todayInTimezone(timezone));

  useEffect(() => {
    setToday(todayInTimezone(timezone));
    const interval = window.setInterval(() => {
      setToday(todayInTimezone(timezone));
    }, 30_000);
    return () => window.clearInterval(interval);
  }, [timezone]);

  return today;
}
