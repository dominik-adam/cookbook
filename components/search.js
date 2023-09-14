import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/router'
import styles from './search.module.css';

export default function SearchBar() {

  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState(router.query.s);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== undefined) {
        router.push(`?s=${encodeURIComponent(searchTerm)}`);
      }
    }, 300)

    return () => {
      clearTimeout(timer)
    }
  }, [searchTerm])

  useEffect(() => {
    setSearchTerm(router.query.s);
  }, [router.query.s])

  return (
    <div className={styles.searchWrapper}>
      <div className={styles.searchBar}>
        <span>
          <Image
            className={styles.searchIcon}
            src={`/images/searchIcon.png`}
            alt='search icon'
            width={50}
            height={50}
            quality={100}
          />
        </span>
        <input 
          className={styles.searchInput}
          type="text" 
          placeholder="Search..." 
          value={searchTerm}
          onChange={event => setSearchTerm(event.target.value)}
        />
      </div>
    </div>
  );
}