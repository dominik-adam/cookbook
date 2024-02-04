import React from 'react';
import styles from '@/styles/add-new-recipe/adminContent.module.css';

export default function AdminContent({ 
  instructions,
  setInstructions,
  video,
  setVideo,
  link,
  setLink
}) {

  const handleTextareaResize = (event) => {
    event.target.style.height = 'auto';
    event.target.style.height = event.target.scrollHeight + 'px';
  };

  return (
    <div>
      <div className={styles.recipeInstructionsWrapper}>
        <label className={styles.inputLabel}>
          Instructions  
        </label>
        <textarea
          className={styles.recipeInstructionsInput}
          id="instructions"
          value={instructions}
          onInput={handleTextareaResize}
          onChange={(e) => setInstructions(e.target.value)}
        />
      </div>
      <div className={styles.recipeVideoWrapper}>
        <label className={styles.inputLabel}>
          Video url
        </label>
        <input
          className={styles.recipeVideoInput}
          type="text"
          id="video"
          value={video}
          onChange={(e) => setVideo(e.target.value)}
        />
      </div>
      <div className={styles.recipeLinkWrapper}>
        <label className={styles.inputLabel}>
          External link
        </label>
        <input
          className={styles.recipeLinkInput}
          type="text"
          id="link"
          value={link}
          onChange={(e) => setLink(e.target.value)}
        />
      </div>
    </div>
  );
};