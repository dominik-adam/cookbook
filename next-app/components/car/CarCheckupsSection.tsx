import DocWidget from './DocWidget';
import styles from '@/styles/car.module.css';

interface CarCheckupsSectionProps {
  stkExpiry: string | null;
  stkLink: string | null;
  ekExpiry: string | null;
  ekLink: string | null;
  onEditStk: () => void;
  onEditEk: () => void;
}

export default function CarCheckupsSection({
  stkExpiry, stkLink, ekExpiry, ekLink, onEditStk, onEditEk,
}: CarCheckupsSectionProps) {
  return (
    <>
      <p className={styles.sectionLabel}>Mandatory Checkups</p>
      <div className={styles.widgetRow}>
        <DocWidget
          icon="🔧"
          iconSrc="/icons/nalepka-tk.png"
          label="STK"
          name="Technická kontrola"
          expiry={stkExpiry}
          link={stkLink}
          onEdit={onEditStk}
        />
        <DocWidget
          icon="💨"
          iconSrc="/icons/nelepka-ek.png"
          label="EK"
          name="Emisná kontrola"
          expiry={ekExpiry}
          link={ekLink}
          onEdit={onEditEk}
        />
      </div>
    </>
  );
}
