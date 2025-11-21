import React, { useState } from 'react';
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
  const [newTag, setNewTag] = useState('');

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

  const addTag = (e) => {
    e.preventDefault();
    if (!newTag.trim()) return;

    const trimmedTag = newTag.trim();
    if (tags && tags.includes(trimmedTag)) {
      showMessage('Tag already added', 'error');
      return;
    }

    setTags(tags ? [...tags, trimmedTag] : [trimmedTag]);
    setNewTag('');
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };
  
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
        <div className={styles.recipeTagsWrapper}>
          <label className={styles.inputLabel}>
            Tags
          </label>
          <div className={styles.tagsContainer}>
            {tags && tags.length > 0 && (
              <div className={styles.tagsList}>
                {tags.map((tag, index) => (
                  <span key={index} className={styles.tag}>
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className={styles.tagRemoveButton}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className={styles.addTagWrapper}>
              <input
                className={styles.tagInput}
                type="text"
                placeholder="Add a tag..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    addTag(e);
                  }
                }}
              />
              <button
                type="button"
                onClick={addTag}
                className={styles.addTagButton}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
