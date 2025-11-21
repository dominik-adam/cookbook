import Head from 'next/head';
import Layout from '@/components/layout';
import { getServerSession } from "next-auth/next";
import { options } from 'app/api/auth/[...nextauth]/options';
import { prisma } from "@/utils/prisma";
import { isAdmin } from '@/utils/auth';
import { GetServerSidePropsContext } from 'next';
import { useState } from 'react';
import styles from '@/styles/ingredientsManagement.module.css';
import Image from 'next/image';
import { useFlashMessage } from '@/components/flashMessage/FlashMessageContext';

interface Ingredient {
  id: string;
  name: string;
  image: string;
  caloriesPer100g: number | null;
  proteinPer100g: number | null;
  carbsPer100g: number | null;
  fatPer100g: number | null;
}

interface IngredientsPageProps {
  ingredients: Ingredient[];
  isAdmin: boolean;
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { req, res } = context;
  const session = await getServerSession(req, res, options);

  if (!session || !session.user?.email || !isAdmin(session.user.email)) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  const ingredients = await prisma.ingredient.findMany({
    orderBy: {
      name: 'asc',
    },
  });

  return {
    props: {
      ingredients: JSON.parse(JSON.stringify(ingredients)),
      isAdmin: true,
    },
  };
}

export default function IngredientsPage({ ingredients: initialIngredients, isAdmin }: IngredientsPageProps) {
  const [ingredients, setIngredients] = useState<Ingredient[]>(initialIngredients);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Ingredient | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newImage, setNewImage] = useState<File | null>(null);
  const [newImagePreview, setNewImagePreview] = useState<string | null>(null);
  const { showMessage } = useFlashMessage();

  const startEdit = (ingredient: Ingredient) => {
    setEditingId(ingredient.id);
    setEditForm({ ...ingredient });
    setNewImage(null);
    setNewImagePreview(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
    setNewImage(null);
    setNewImagePreview(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewImage(file);
      setNewImagePreview(URL.createObjectURL(file));
    }
  };

  const saveEdit = async () => {
    if (!editForm) return;

    try {
      let imagePath = editForm.image;

      // If a new image was uploaded, upload it first
      if (newImage) {
        const formData = new FormData();
        formData.append('file', newImage);

        const uploadResponse = await fetch('/api/add-new-ingredient-image', {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          const { error } = await uploadResponse.json();
          showMessage(`Failed to upload image: ${error}`, 'error');
          return;
        }

        const { filepath } = await uploadResponse.json();
        imagePath = filepath;
      }

      const response = await fetch('/api/update-ingredient', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...editForm,
          image: imagePath,
        }),
      });

      if (response.ok) {
        const { ingredient: updatedIngredient } = await response.json();
        setIngredients(prev =>
          prev.map(ing => ing.id === updatedIngredient.id ? updatedIngredient : ing)
        );
        showMessage('Ingredient updated successfully', 'success');
        cancelEdit();
      } else {
        const error = await response.json();
        showMessage(error.error || 'Failed to update ingredient', 'error');
      }
    } catch (error) {
      showMessage('Error updating ingredient', 'error');
    }
  };

  const filteredIngredients = ingredients.filter(ing =>
    ing.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout pageTitle="Manage Ingredients" isAdmin={isAdmin}>
      <Head>
        <title>Manage Ingredients</title>
      </Head>

      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Manage Ingredients</h1>
          <p className={styles.subtitle}>
            Edit nutritional information for {ingredients.length} ingredients
          </p>
        </div>

        <div className={styles.searchBar}>
          <input
            type="text"
            placeholder="Search ingredients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.stats}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Total Ingredients</span>
            <span className={styles.statValue}>{ingredients.length}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>With Nutrition Data</span>
            <span className={styles.statValue}>
              {ingredients.filter(i => i.caloriesPer100g !== null).length}
            </span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Missing Data</span>
            <span className={styles.statValue}>
              {ingredients.filter(i => i.caloriesPer100g === null).length}
            </span>
          </div>
        </div>

        <div className={styles.ingredientList}>
          {filteredIngredients.map((ingredient) => (
            <div
              key={ingredient.id}
              className={`${styles.ingredientCard} ${editingId === ingredient.id ? styles.editing : ''}`}
            >
              <div className={styles.ingredientHeader}>
                <Image
                  src={ingredient.image}
                  alt={ingredient.name}
                  width={60}
                  height={60}
                  className={styles.ingredientImage}
                  style={{ objectFit: 'cover' }}
                />
                <div className={styles.ingredientInfo}>
                  <h3>{ingredient.name}</h3>
                  {ingredient.caloriesPer100g === null && (
                    <span className={styles.missingDataBadge}>Missing nutrition data</span>
                  )}
                </div>
                {editingId !== ingredient.id && (
                  <button
                    onClick={() => startEdit(ingredient)}
                    className={styles.editButton}
                  >
                    Edit
                  </button>
                )}
              </div>

              {editingId === ingredient.id && editForm ? (
                <div className={styles.editForm}>
                  <div className={styles.formWithImage}>
                    <div className={styles.imageUploadWrapperSmall}>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className={styles.imageInput}
                      />
                      {(newImagePreview || editForm.image) ? (
                        <Image
                          src={newImagePreview || editForm.image}
                          alt="Ingredient preview"
                          fill
                          className={styles.imagePreview}
                        />
                      ) : (
                        <div className={styles.imagePlaceholder}>
                          <span>Click</span>
                        </div>
                      )}
                    </div>
                    <div className={styles.formGrid}>
                      <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                        <label>Name</label>
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className={styles.formInput}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Calories (per 100g)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={editForm.caloriesPer100g ?? ''}
                          onChange={(e) => setEditForm({
                            ...editForm,
                            caloriesPer100g: e.target.value ? parseFloat(e.target.value) : null
                          })}
                          className={styles.formInput}
                          placeholder="e.g., 250"
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Protein (g per 100g)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={editForm.proteinPer100g ?? ''}
                          onChange={(e) => setEditForm({
                            ...editForm,
                            proteinPer100g: e.target.value ? parseFloat(e.target.value) : null
                          })}
                          className={styles.formInput}
                          placeholder="e.g., 15.5"
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Carbs (g per 100g)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={editForm.carbsPer100g ?? ''}
                          onChange={(e) => setEditForm({
                            ...editForm,
                            carbsPer100g: e.target.value ? parseFloat(e.target.value) : null
                          })}
                          className={styles.formInput}
                          placeholder="e.g., 30.2"
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Fat (g per 100g)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={editForm.fatPer100g ?? ''}
                          onChange={(e) => setEditForm({
                            ...editForm,
                            fatPer100g: e.target.value ? parseFloat(e.target.value) : null
                          })}
                          className={styles.formInput}
                          placeholder="e.g., 8.5"
                        />
                      </div>
                    </div>
                  </div>
                  <div className={styles.formActions}>
                    <button onClick={cancelEdit} className={styles.cancelButton}>
                      Cancel
                    </button>
                    <button onClick={saveEdit} className={styles.saveButton}>
                      Save Changes
                    </button>
                  </div>
                </div>
              ) : (
                <div className={styles.nutritionDisplay}>
                  <div className={styles.nutritionGrid}>
                    <div className={styles.nutritionItem}>
                      <span className={styles.nutritionLabel}>Calories</span>
                      <span className={styles.nutritionValue}>
                        {ingredient.caloriesPer100g ?? 'N/A'}
                      </span>
                    </div>
                    <div className={styles.nutritionItem}>
                      <span className={styles.nutritionLabel}>Protein</span>
                      <span className={styles.nutritionValue}>
                        {ingredient.proteinPer100g ? `${ingredient.proteinPer100g}g` : 'N/A'}
                      </span>
                    </div>
                    <div className={styles.nutritionItem}>
                      <span className={styles.nutritionLabel}>Carbs</span>
                      <span className={styles.nutritionValue}>
                        {ingredient.carbsPer100g ? `${ingredient.carbsPer100g}g` : 'N/A'}
                      </span>
                    </div>
                    <div className={styles.nutritionItem}>
                      <span className={styles.nutritionLabel}>Fat</span>
                      <span className={styles.nutritionValue}>
                        {ingredient.fatPer100g ? `${ingredient.fatPer100g}g` : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredIngredients.length === 0 && (
          <div className={styles.emptyState}>
            <p>No ingredients found matching "{searchTerm}"</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
