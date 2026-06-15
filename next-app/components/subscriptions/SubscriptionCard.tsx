import Image from 'next/image';
import { useState } from 'react';
import styles from '@/styles/subscriptions.module.css';
import type { Periodicity } from './SubscriptionModal';

interface Subscription {
  id: string;
  title: string;
  description?: string | null;
  price: number;
  periodicity: string;
  image?: string | null;
}

interface SubscriptionCardProps {
  subscription: Subscription;
  onEdit: (id: string) => void;
}

const MONTHLY_FACTOR: Record<string, number> = {
  weekly: 52 / 12,
  monthly: 1,
  quarterly: 1 / 3,
  yearly: 1 / 12,
};

export function toMonthly(price: number, periodicity: string): number {
  return price * (MONTHLY_FACTOR[periodicity] ?? 1);
}

export function toYearly(price: number, periodicity: string): number {
  return toMonthly(price, periodicity) * 12;
}

export default function SubscriptionCard({ subscription, onEdit }: SubscriptionCardProps) {
  const { id, title, description, price, periodicity, image } = subscription;
  const [imgSrc, setImgSrc] = useState(image?.trim() || '/icons/subscriptions.png');
  const monthly = toMonthly(price, periodicity);

  return (
    <div className={styles.card} onClick={() => onEdit(id)}>
      <span className={styles.editHint}>Edit</span>
      <Image
        className={styles.cardImage}
        src={imgSrc}
        width={56}
        height={56}
        alt={title}
        onError={() => setImgSrc('/icons/subscriptions.png')}
      />
      <div className={styles.cardBody}>
        <p className={styles.cardTitle}>{title}</p>
        {description && <p className={styles.cardDescription}>{description}</p>}
        <div className={styles.cardPriceRow}>
          <span className={styles.cardPrice}>€{price.toFixed(2)}</span>
          <span className={styles.cardPeriodicity}>{periodicity}</span>
        </div>
        {periodicity !== 'monthly' && (
          <p className={styles.cardMonthly}>≈ €{monthly.toFixed(2)} / month</p>
        )}
      </div>
    </div>
  );
}
