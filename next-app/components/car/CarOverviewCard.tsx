import Image from 'next/image';
import { useRef, useState } from 'react';
import styles from '@/styles/car.module.css';
import { HOLD_TO_RESET_MS } from '@/lib/uiConfig';

interface CarOverviewCardProps {
  licensePlate: string | null;
  model: string | null;
  year: number | null;
  image: string | null;
  onEdit: () => void;
}

export default function CarOverviewCard({ licensePlate, model, year, image, onEdit }: CarOverviewCardProps) {
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didHold = useRef(false);
  const [isHolding, setIsHolding] = useState(false);
  const [imgError, setImgError] = useState(false);

  const imgSrc = (!imgError && image?.trim()) ? image.trim() : '/icons/car.png';

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
  }

  function handlePointerLeave() {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    setIsHolding(false);
  }

  const isEmpty = !licensePlate && !model && !year;

  return (
    <div
      className={styles.overviewWidget}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
    >
      {isHolding && <div className={styles.wHoldRipple} />}
      <Image
        className={styles.overviewImage}
        src={imgSrc}
        width={100}
        height={100}
        alt="Car"
        onError={() => setImgError(true)}
      />
      <div className={styles.overviewDetails}>
        {isEmpty ? (
          <p className={styles.overviewEmpty}>Hold to add your car details</p>
        ) : (
          <>
            {licensePlate && <p className={styles.carPlate}>{licensePlate}</p>}
            {model && <p className={styles.carModel}>{model}</p>}
            {year && <p className={styles.carYear}>{year}</p>}
          </>
        )}
      </div>
    </div>
  );
}
