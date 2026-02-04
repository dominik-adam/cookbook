import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/router'
import styles from '@/styles/search.module.css';

type SearchBarProps = {
  fetchResults: (searchTerm: string) => void;
};

export default function SearchBar({ fetchResults }: SearchBarProps) {

  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState<string | undefined>(router.query.s as string | undefined);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
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
