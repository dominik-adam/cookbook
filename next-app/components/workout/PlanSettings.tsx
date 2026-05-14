import { useState } from 'react';
import styles from '@/styles/planner.module.css';
import type { DailyPlanSettings, ExerciseType } from '@/types/planner';

interface PlanSettingsProps {
  isOpen: boolean;
  settings: DailyPlanSettings;
  onClose: () => void;
  onSaved: (newSettings: DailyPlanSettings) => void;
}

type FormValues = {
  waterTargetL: string;
  creatineTargetG: string;
  calorieTarget: string;
  sprintCount: string;
  sprintFrequencyDays: string;
  sprintStartDate: string;
  pullupWeightKg: string;
  pullupSets: string;
  pullupRepsPerSet: string;
  pullupFrequencyDays: string;
  pullupStartDate: string;
  dipWeightKg: string;
  dipSets: string;
  dipRepsPerSet: string;
  dipFrequencyDays: string;
  dipStartDate: string;
};

function dateToInputValue(iso: string | null): string {
  // Stored as noon UTC ISO string; slice to YYYY-MM-DD for <input type="date">
  if (!iso) return '';
  return iso.slice(0, 10);
}

function settingsToForm(s: DailyPlanSettings): FormValues {
  return {
    waterTargetL: String(s.waterTargetL),
    creatineTargetG: String(s.creatineTargetG),
    calorieTarget: String(s.calorieTarget),
    sprintCount: String(s.sprintCount),
    sprintFrequencyDays: String(s.sprintFrequencyDays),
    sprintStartDate: dateToInputValue(s.sprintStartDate),
    pullupWeightKg: String(s.pullupWeightKg),
    pullupSets: String(s.pullupSets),
    pullupRepsPerSet: String(s.pullupRepsPerSet),
    pullupFrequencyDays: String(s.pullupFrequencyDays),
    pullupStartDate: dateToInputValue(s.pullupStartDate),
    dipWeightKg: String(s.dipWeightKg),
    dipSets: String(s.dipSets),
    dipRepsPerSet: String(s.dipRepsPerSet),
    dipFrequencyDays: String(s.dipFrequencyDays),
    dipStartDate: dateToInputValue(s.dipStartDate),
  };
}

export default function PlanSettings({ isOpen, settings, onClose, onSaved }: PlanSettingsProps) {
  const [form, setForm] = useState<FormValues>(settingsToForm(settings));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [rescheduledMsg, setRescheduledMsg] = useState('');

  function field(name: keyof FormValues, label: string, step = '1') {
    return (
      <div className={styles.settingsField}>
        <label className={styles.settingsLabel}>{label}</label>
        <input
          className={styles.settingsInput}
          type="number"
          step={step}
          min="0"
          value={form[name]}
          onChange={(e) => setForm((prev) => ({ ...prev, [name]: e.target.value }))}
        />
      </div>
    );
  }

  function dateField(name: keyof FormValues, label: string) {
    return (
      <div className={styles.settingsField}>
        <label className={styles.settingsLabel}>{label}</label>
        <input
          className={styles.settingsInput}
          type="date"
          value={form[name]}
          onChange={(e) => setForm((prev) => ({ ...prev, [name]: e.target.value }))}
        />
      </div>
    );
  }

  async function handleSave() {
    setIsLoading(true);
    setError('');
    setRescheduledMsg('');

    const dateKeys = new Set<keyof FormValues>(['sprintStartDate', 'pullupStartDate', 'dipStartDate']);
    const payload: Record<string, number | string | null> = {};
    const entries = Object.entries(form) as [keyof FormValues, string][];
    for (const [key, val] of entries) {
      if (dateKeys.has(key)) {
        // Send as date string, or null to clear
        payload[key] = val.length === 10 ? val : null;
      } else {
        const num = parseFloat(val);
        if (!isNaN(num)) payload[key] = num;
      }
    }

    try {
      const res = await fetch('/api/planner/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to save settings');
      } else {
        if (data.rescheduled?.length > 0) {
          const names = (data.rescheduled as ExerciseType[])
            .map((t) => t.charAt(0) + t.slice(1).toLowerCase())
            .join(', ');
          setRescheduledMsg(`Schedule regenerated for: ${names}`);
        }
        onSaved(data.settings);
        setTimeout(onClose, data.rescheduled?.length > 0 ? 1500 : 0);
      }
    } catch {
      setError('Network error');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={`${styles.modalOverlay} ${isOpen ? styles.modalOverlayOpen : ''}`}>
      <div className={styles.modalBox}>
        <div className={styles.modalHead}>
          <span className={styles.modalHeadTitle}>Plan Settings</span>
          <button className={styles.modalCloseBtn} onClick={onClose}>×</button>
        </div>

        <div className={styles.modalBody}>
          {/* Daily habits */}
          <div className={styles.settingsSection}>
            <div className={styles.settingsSectionTitle}>Daily Habits</div>
            <div className={styles.settingsGrid}>
              {field('waterTargetL', 'Water target (L)', '0.5')}
              {field('creatineTargetG', 'Creatine dose (g)', '0.5')}
              {field('calorieTarget', 'Calorie target (kcal)')}
            </div>
          </div>

          {/* Sprints */}
          <div className={styles.settingsSection}>
            <div className={styles.settingsSectionTitle}>Sprints</div>
            <div className={styles.settingsGrid}>
              {field('sprintCount', 'Sprints per session')}
              {field('sprintFrequencyDays', 'Every N days')}
              {dateField('sprintStartDate', 'Schedule from date')}
            </div>
          </div>

          {/* Pullups */}
          <div className={styles.settingsSection}>
            <div className={styles.settingsSectionTitle}>Pullups</div>
            <div className={styles.settingsGrid}>
              {field('pullupWeightKg', 'Added weight (kg)', '0.5')}
              {field('pullupSets', 'Sets')}
              {field('pullupRepsPerSet', 'Reps per set')}
              {field('pullupFrequencyDays', 'Every N days')}
              {dateField('pullupStartDate', 'Schedule from date')}
            </div>
          </div>

          {/* Dips */}
          <div className={styles.settingsSection}>
            <div className={styles.settingsSectionTitle}>Dips</div>
            <div className={styles.settingsGrid}>
              {field('dipWeightKg', 'Added weight (kg)', '0.5')}
              {field('dipSets', 'Sets')}
              {field('dipRepsPerSet', 'Reps per set')}
              {field('dipFrequencyDays', 'Every N days')}
              {dateField('dipStartDate', 'Schedule from date')}
            </div>
          </div>

          {error && <div className={styles.errorMsg}>{error}</div>}
          {rescheduledMsg && <div className={styles.successMsg}>{rescheduledMsg}</div>}
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button className={styles.saveBtn} onClick={handleSave} disabled={isLoading}>
            {isLoading ? 'Saving…' : 'Save settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
