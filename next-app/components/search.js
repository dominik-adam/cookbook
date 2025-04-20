import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/router'
import styles from '@/styles/search.module.css';

export default function SearchBar({fetchResults}) {

  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState(router.query.s);

  const handleInputChange = (event) => {
    const { value } = event.target;
    setSearchTerm(value);
    fetchResults(value);
  };

  return (
    <div className={styles.searchWrapper}>
      <div className={styles.searchBar}>
        <span>
          <Image
            className={styles.searchIcon}
            src={`/images/searchIcon.jpg`}
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
          onChange={handleInputChange}
        />
      </div>
    </div>
  );
}