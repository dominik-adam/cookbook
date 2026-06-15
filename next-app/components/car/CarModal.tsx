import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import styles from '@/styles/car.module.css';

export interface OverviewFormData {
  licensePlate: string;
  model: string;
  year: string;
  image: string;
}

export interface DocFormData {
  expiry: string;
  link: string;
}

export interface HighwayPassFormData {
  country: string;
  expiry: string;
  link: string;
  image: string;
}

export type CarModalMode =
  | { kind: 'overview';   initialData: OverviewFormData }
  | { kind: 'pzp';        initialData: DocFormData }
  | { kind: 'havarij';    initialData: DocFormData }
  | { kind: 'stk';        initialData: DocFormData }
  | { kind: 'ek';         initialData: DocFormData }
  | { kind: 'highwayPass'; initialData: HighwayPassFormData | null; editingId: string | null };

interface CarModalProps {
  open: boolean;
  mode: CarModalMode | null;
  onClose: () => void;
  onSave: (mode: CarModalMode, data: OverviewFormData | DocFormData | HighwayPassFormData) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const EMPTY_OVERVIEW: OverviewFormData = { licensePlate: '', model: '', year: '', image: '' };
const EMPTY_DOC: DocFormData = { expiry: '', link: '' };
const EMPTY_PASS: HighwayPassFormData = { country: '', expiry: '', link: '', image: '' };

const MODE_TITLES: Record<string, string> = {
  overview:    'Edit Car',
  pzp:         'Edit PZP Insurance',
  havarij:     'Edit KASKO Insurance',
  stk:         'Edit STK Checkup',
  ek:          'Edit EK Checkup',
};

export default function CarModal({ open, mode, onClose, onSave, onDelete }: CarModalProps) {
  const [overviewForm, setOverviewForm] = useState<OverviewFormData>(EMPTY_OVERVIEW);
  const [docForm, setDocForm] = useState<DocFormData>(EMPTY_DOC);
  const [passForm, setPassForm] = useState<HighwayPassFormData>(EMPTY_PASS);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const overviewFileRef = useRef<HTMLInputElement>(null);
  const passFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && mode) {
      if (mode.kind === 'overview') setOverviewForm(mode.initialData);
      else if (mode.kind === 'highwayPass') setPassForm(mode.initialData ?? EMPTY_PASS);
      else setDocForm((mode as { kind: string; initialData: DocFormData }).initialData);
    }
  }, [open, mode]);

  if (!open || !mode) return null;

  async function uploadFile(file: File): Promise<string | null> {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/car/upload-image', { method: 'POST', body: fd });
    if (!res.ok) return null;
    const { filepath } = await res.json();
    return filepath as string;
  }

  async function handleOverviewImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const path = await uploadFile(file);
      if (path) setOverviewForm(p => ({ ...p, image: path }));
    } finally {
      setUploading(false);
    }
  }

  async function handlePassImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const path = await uploadFile(file);
      if (path) setPassForm(p => ({ ...p, image: path }));
    } finally {
      setUploading(false);
    }
  }

  const setO = (f: keyof OverviewFormData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => setOverviewForm(p => ({ ...p, [f]: e.target.value }));
  const setD = (f: keyof DocFormData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => setDocForm(p => ({ ...p, [f]: e.target.value }));
  const setP = (f: keyof HighwayPassFormData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => setPassForm(p => ({ ...p, [f]: e.target.value }));

  const canSave = mode.kind === 'highwayPass' ? passForm.country.trim() !== '' : true;

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = mode.kind === 'overview' ? overviewForm
        : mode.kind === 'highwayPass' ? passForm
        : docForm;
      await onSave(mode, data);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (mode.kind !== 'highwayPass' || !mode.editingId) return;
    setDeleting(true);
    try {
      await onDelete(mode.editingId);
      onClose();
    } finally {
      setDeleting(false);
    }
  };

  const title = mode.kind === 'highwayPass'
    ? (mode.editingId ? 'Edit Highway Pass' : 'Add Highway Pass')
    : (MODE_TITLES[mode.kind] ?? 'Edit');

  const isDoc = ['pzp', 'havarij', 'stk', 'ek'].includes(mode.kind);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>{title}</h2>
          <button className={styles.modalClose} onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className={styles.modalBody}>
          {mode.kind === 'overview' && (
            <>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Photo</label>
                <div className={styles.imageUploadRow}>
                  {overviewForm.image && (
                    <Image
                      className={styles.imagePreviewThumb}
                      src={overviewForm.image}
                      width={56}
                      height={56}
                      alt="Car"
                    />
                  )}
                  <label className={`${styles.uploadButton} ${uploading ? styles.uploadButtonUploading : ''}`}>
                    {uploading ? 'Uploading…' : overviewForm.image ? 'Change photo' : 'Upload photo'}
                    <input
                      ref={overviewFileRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleOverviewImagePick}
                      disabled={uploading}
                    />
                  </label>
                </div>
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>License Plate</label>
                <input className={styles.input} type="text" placeholder="BA123AB" maxLength={20}
                  value={overviewForm.licensePlate} onChange={setO('licensePlate')} />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Model</label>
                <input className={styles.input} type="text" placeholder="Volkswagen Golf" maxLength={100}
                  value={overviewForm.model} onChange={setO('model')} />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Year</label>
                <input className={styles.input} type="number" placeholder="2020" min={1900} max={2100}
                  value={overviewForm.year} onChange={setO('year')} />
              </div>
            </>
          )}

          {isDoc && (
            <>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Expiry Date</label>
                <input className={styles.input} type="date"
                  value={docForm.expiry} onChange={setD('expiry')} />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Verification Link (optional)</label>
                <input className={styles.input} type="text" placeholder="https://..."
                  value={docForm.link} onChange={setD('link')} />
              </div>
            </>
          )}

          {mode.kind === 'highwayPass' && (
            <>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Icon</label>
                <div className={styles.imageUploadRow}>
                  {passForm.image && (
                    <Image
                      className={styles.imagePreviewThumb}
                      src={passForm.image}
                      width={56}
                      height={56}
                      alt="Pass icon"
                    />
                  )}
                  <label className={`${styles.uploadButton} ${uploading ? styles.uploadButtonUploading : ''}`}>
                    {uploading ? 'Uploading…' : passForm.image ? 'Change icon' : 'Upload icon'}
                    <input
                      ref={passFileRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handlePassImagePick}
                      disabled={uploading}
                    />
                  </label>
                </div>
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Country *</label>
                <input className={styles.input} type="text" placeholder="Czech Republic, Austria…" maxLength={100}
                  value={passForm.country} onChange={setP('country')} />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Expiry Date</label>
                <input className={styles.input} type="date"
                  value={passForm.expiry} onChange={setP('expiry')} />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Verification Link (optional)</label>
                <input className={styles.input} type="text" placeholder="https://..."
                  value={passForm.link} onChange={setP('link')} />
              </div>
            </>
          )}
        </div>

        <div className={styles.modalFooter}>
          {mode.kind === 'highwayPass' && mode.editingId && (
            <button className={styles.deleteButton} onClick={handleDelete} disabled={deleting || saving}>
              {deleting ? 'Removing…' : 'Remove'}
            </button>
          )}
          <div className={styles.spacer} />
          <button className={styles.cancelButton} onClick={onClose} disabled={saving || deleting}>
            Cancel
          </button>
          <button className={styles.saveButton} onClick={handleSave} disabled={!canSave || saving || deleting || uploading}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
