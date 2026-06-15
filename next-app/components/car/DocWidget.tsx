import Image from 'next/image';
import { useRef, useState } from 'react';
import { getExpiryStatus } from '@/utils/expiryStatus';
import styles from '@/styles/car.module.css';
import { HOLD_TO_RESET_MS } from '@/lib/uiConfig';

interface DocWidgetProps {
  icon: string;        // emoji fallback
  iconSrc?: string;    // static image path (takes priority)
  label: string;
  name: string;
  expiry: string | null;
  link: string | null;
  onEdit: () => void;
}

function getGradient(expiry: string | null): string {
  const s = getExpiryStatus(expiry);
  if (s === 'expired') return 'linear-gradient(145deg, #3d0a0a 0%, #5c1515 100%)';
  if (s === 'soon')    return 'linear-gradient(145deg, #3d2008 0%, #5c3412 100%)';
  if (s === 'ok')      return 'linear-gradient(145deg, #083d1a 0%, #0d5c28 100%)';
  return 'linear-gradient(145deg, #1c1c22 0%, #26262e 100%)';
}

const fmt = new Intl.DateTimeFormat('sk-SK', { day: '2-digit', month: '2-digit', year: 'numeric' });

export default function DocWidget({ icon, iconSrc, label, name, expiry, link, onEdit }: DocWidgetProps) {
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didHold = useRef(false);
  const [isHolding, setIsHolding] = useState(false);

  function handlePointerDown() {
    didHold.current = false;
    setIsHolding(true);
    holdTimer.current = setTimeout(() => {
      didHold.current = true;
      setIsHolding(false);
      onEdit();
    }, HOLD_TO_RESET_MS);
  }

  function handlePointerUp() {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    setIsHolding(false);
    if (!didHold.current && link) {
      window.open(link, '_blank', 'noopener,noreferrer');
    }
  }

  function handlePointerLeave() {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    setIsHolding(false);
  }

  const expiryLabel = expiry ? fmt.format(new Date(expiry)) : null;

  return (
    <div
      className={styles.docWidget}
      style={{ background: getGradient(expiry) }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
    >
      {isHolding && <div className={styles.wHoldRipple} />}

      <div className={styles.wDocIconWrap}>
        {iconSrc ? (
          <Image
            src={iconSrc}
            alt={label}
            fill
            className={styles.wDocImage}
            sizes="96px"
          />
        ) : (
          <span className={styles.wDocIconEmoji}>{icon}</span>
        )}
      </div>

      <div className={styles.wDocContent}>
        <div>
          <div className={styles.wLabel}>{label}</div>
          <div className={styles.wDescription}>{name}</div>
        </div>

        <div className={styles.wExpiryBadge}>
          {expiryLabel || "No date set"}
        </div>
      </div>
    </div>
  );
}
