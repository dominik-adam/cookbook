import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import styles from '@/styles/subscriptions.module.css';

export type Periodicity = 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export interface SubscriptionFormData {
  title: string;
  description: string;
  price: string;
  periodicity: Periodicity;
  image: string;
}

interface SubscriptionModalProps {
  open: boolean;
  editingId: string | null;
  initialData: SubscriptionFormData | null;
  onClose: () => void;
  onSave: (data: SubscriptionFormData) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const EMPTY_FORM: SubscriptionFormData = {
  title: '',
  description: '',
  price: '',
  periodicity: 'monthly',
  image: '',
};

export default function SubscriptionModal({
  open,
  editingId,
  initialData,
  onClose,
  onSave,
  onDelete,
}: SubscriptionModalProps) {
  const [form, setForm] = useState<SubscriptionFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setForm(initialData ?? EMPTY_FORM);
    }
  }, [open, initialData]);

  if (!open) return null;

  const set = (field: keyof SubscriptionFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  async function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/car/upload-image', { method: 'POST', body: fd });
      if (res.ok) {
        const { filepath } = await res.json();
        setForm(prev => ({ ...prev, image: filepath }));
      }
    } finally {
      setUploading(false);
    }
  }

  const handleSave = async () => {
    if (!form.title.trim() || !form.price) return;
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editingId) return;
    setDeleting(true);
    try {
      await onDelete(editingId);
      onClose();
    } finally {
      setDeleting(false);
    }
  };

  const imageUrl = form.image.trim() || '/icons/subscriptions.png';
  const isEditing = editingId !== null;
  const canSave = form.title.trim() !== '' && form.price !== '' && !isNaN(parseFloat(form.price)) && parseFloat(form.price) > 0;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>{isEditing ? 'Edit Subscription' : 'Add Subscription'}</h2>
          <button className={styles.modalClose} onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Icon</label>
            <div className={styles.imageUploadRow}>
              {form.image && (
                <Image
                  className={styles.imagePreviewThumb}
                  src={imageUrl}
                  width={56}
                  height={56}
                  alt="Subscription icon"
                />
              )}
              <label className={`${styles.uploadButton} ${uploading ? styles.uploadButtonUploading : ''}`}>
                {uploading ? 'Uploading…' : form.image ? 'Change icon' : 'Upload icon'}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleImagePick}
                  disabled={uploading}
                />
              </label>
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Title *</label>
            <input
              className={styles.input}
              type="text"
              placeholder="Netflix, Spotify..."
              value={form.title}
              onChange={set('title')}
              maxLength={100}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Description</label>
            <textarea
              className={styles.textarea}
              placeholder="What's this subscription for?"
              value={form.description}
              onChange={set('description')}
              maxLength={500}
            />
          </div>

          <div className={styles.priceRow}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Price *</label>
              <input
                className={styles.input}
                type="number"
                placeholder="9.99"
                min="0.01"
                step="0.01"
                value={form.price}
                onChange={set('price')}
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Periodicity *</label>
              <select
                className={styles.select}
                value={form.periodicity}
                onChange={set('periodicity')}
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>
        </div>

        <div className={styles.modalFooter}>
          {isEditing && (
            <button
              className={styles.deleteButton}
              onClick={handleDelete}
              disabled={deleting || saving}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          )}
          <div className={styles.spacer} />
          <button className={styles.cancelButton} onClick={onClose} disabled={saving || deleting}>
            Cancel
          </button>
          <button className={styles.saveButton} onClick={handleSave} disabled={!canSave || saving || deleting || uploading}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
