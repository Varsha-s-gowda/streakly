import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../lib/api.js';
import { mergeJournal } from '../lib/constants.js';

export function useJournalDraft(date, { onSaved } = {}) {
  const [form, setForm] = useState(() => mergeJournal(null));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [saveState, setSaveState] = useState('idle');
  const [savedAt, setSavedAt] = useState(null);

  const formRef = useRef(form);
  const dateRef = useRef(date);
  const versionRef = useRef(0);
  const savedVersionRef = useRef(0);
  const loadingRef = useRef(true);
  const onSavedRef = useRef(onSaved);
  onSavedRef.current = onSaved;

  useEffect(() => {
    let active = true;
    dateRef.current = date;
    loadingRef.current = true;
    setLoading(true);
    setError(null);
    setSaveState('idle');

    api
      .get(`/journal?date=${date}`)
      .then((data) => {
        if (!active) return;
        const merged = mergeJournal(data.entry);
        formRef.current = merged;
        setForm(merged);
        versionRef.current = 0;
        savedVersionRef.current = 0;
        setDirty(false);
        setSavedAt(data.entry?.updatedAt || null);
        setLoading(false);
        loadingRef.current = false;
      })
      .catch((err) => {
        if (!active) return;
        setError(err);
        setLoading(false);
        loadingRef.current = false;
      });

    return () => {
      active = false;
    };
  }, [date]);

  const updateGroup = useCallback((group, key, value) => {
    const next = {
      ...formRef.current,
      [group]: { ...formRef.current[group], [key]: value },
    };
    formRef.current = next;
    versionRef.current += 1;
    setForm(next);
    setDirty(true);
    setSaveState('pending');
  }, []);

  const updateAchievements = useCallback((value) => {
    const next = { ...formRef.current, achievements: value };
    formRef.current = next;
    versionRef.current += 1;
    setForm(next);
    setDirty(true);
    setSaveState('pending');
  }, []);

  const saveNow = useCallback(async ({ force = false } = {}) => {
    if (loadingRef.current) return null;
    if (!force && versionRef.current === savedVersionRef.current) return null;

    const version = versionRef.current;
    const payload = formRef.current;
    const entryDate = dateRef.current;
    setSaveState('saving');
    try {
      const data = await api.put(`/journal/${entryDate}`, payload);
      if (dateRef.current !== entryDate) return data;
      savedVersionRef.current = version;
      setSavedAt(data.savedAt);
      if (versionRef.current === version) {
        setDirty(false);
        setSaveState('saved');
      } else {
        setSaveState('pending');
      }
      onSavedRef.current?.(data);
      return data;
    } catch (err) {
      setSaveState('error');
      setError(err);
      throw err;
    }
  }, []);

  useEffect(() => {
    if (!dirty || loading) return undefined;
    const timer = window.setTimeout(() => {
      saveNow().catch(() => {});
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [dirty, form, loading, saveNow]);

  useEffect(() => {
    if (!dirty) return undefined;
    const handler = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  return {
    form,
    updateGroup,
    updateAchievements,
    loading,
    error,
    saveState,
    savedAt,
    dirty,
    saveNow,
  };
}
