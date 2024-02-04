import React from 'react';
import styles from '@/styles/add-new-recipe/adminInfo.module.css';
import Image from 'next/image';
import { useFlashMessage } from '@/components/flashMessage/FlashMessageContext';

export default function AdminInfo({ 
  title,
  setTitle,
  slug,
  setSlug,
  thumbnail,
  setThumbnail,
  tags,
  setTags
}) {
  const { showMessage } = useFlashMessage();

  async function handleNewIngredientImageChange(e) {
    try {
      const formDataThumbnail = new FormData();
      formDataThumbnail.append('file', e.target.files[0]);

      const response = await fetch('/api/add-new-recipe-image', {
        method: 'POST',
        body: formDataThumbnail,
      });

      if (response.ok) {
        const { filepath } = await response.json();
        setThumbnail(filepath);
        showMessage('Image uploaded successfully', 'success');
      } else {
        const { error } = await response.json();
        showMessage(`Error uploading image: ${error}`, 'error');
      }
    } catch (error) {
      showMessage('Error uploading image', 'error');
    }
	}
  
  return (
    <div className={styles.wrapper}>
      <div className={styles.recipeThumbnailWrapper}>
        <label className={styles.inputLabel}>
          Thumbnail
        </label>
        <div className={styles.recipeThumbnailDragAndDrop}>
          <input 
            className={styles.recipeThumbnailInput}
            type="file" 
            id="thumbnail"
            onChange={handleNewIngredientImageChange} 
          />
          {thumbnail ? <Image
            className={styles.recipeThumbnailImage}
            src={thumbnail}
            style={{objectFit: "cover", cursor: "pointer"}}
            layout='fill'
            objectFit='cover'
            objectPosition='center'
            alt="New ingredient image"
          /> :
          <div 
            className={styles.recipeThumbnailPlaceholder}
          >
            <span>
              Click and select
            </span>
            <span>
              <b>OR</b>
            </span>
            <span>
              Drag & Drop
            </span>
          </div>
          }
        </div>
      </div>
      <div className={styles.inputsWrapper}>
        <div className={styles.recipeTitleWrapper}>
          <label className={styles.inputLabel}>
            Title
          </label>
          <input
            className={styles.recipeTitleInput}
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div className={styles.recipeSlugWrapper}>
          <label className={styles.inputLabel}>
            Slug
          </label>
          <input
            className={styles.recipeSlugInput}
            type="text"
            id="slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            required
          />
        </div>
      </div>
    </div>
  );
};
