import DocWidget from './DocWidget';
import styles from '@/styles/car.module.css';

interface CarInsuranceSectionProps {
  pzpExpiry: string | null;
  pzpLink: string | null;
  havarijExpiry: string | null;
  havarijLink: string | null;
  onEditPzp: () => void;
  onEditHavarij: () => void;
}

export default function CarInsuranceSection({
  pzpExpiry, pzpLink, havarijExpiry, havarijLink, onEditPzp, onEditHavarij,
}: CarInsuranceSectionProps) {
  return (
    <>
      <p className={styles.sectionLabel}>Insurance</p>
      <div className={styles.widgetRow}>
        <DocWidget
          icon="🛡️"
          iconSrc="/icons/nalepka-tk.png"
          label="PZP"
          name="Povinné zmluvné poistenie"
          expiry={pzpExpiry}
          link={pzpLink}
          onEdit={onEditPzp}
        />
        <DocWidget
          icon="🚘"
          iconSrc="/icons/nalepka-tk.png"
          label="KASKO"
          name="Havarijné poistenie"
          expiry={havarijExpiry}
          link={havarijLink}
          onEdit={onEditHavarij}
        />
      </div>
    </>
  );
}
