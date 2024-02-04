import styles from '@/styles/link.module.css';

export default function RecipeLink({ url }) {

  return (
    <a href={url} target='_blank' className={styles.link}>
      <div className={styles.wrapper}>
        <span className={styles.text}>
          See the original recipe
        </span>
      </div>
    </a>
  );
}