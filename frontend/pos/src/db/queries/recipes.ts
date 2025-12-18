/**
 * Recipes queries for IndexedDB.
 */
import { IDBPDatabase } from 'idb'
import { POSDatabase } from '../indexeddb'

export async function saveRecipes(db: IDBPDatabase<POSDatabase>, recipes: POSDatabase['recipes']['value'][]) {
  const tx = db.transaction('recipes', 'readwrite')
  await Promise.all(recipes.map((r) => tx.store.put(r)))
  await tx.done
}

export async function saveRecipeMaterials(db: IDBPDatabase<POSDatabase>, materials: POSDatabase['recipe_materials']['value'][]) {
  const tx = db.transaction('recipe_materials', 'readwrite')
  await Promise.all(materials.map((m) => tx.store.put(m)))
  await tx.done
}

export async function getRecipeByProductId(db: IDBPDatabase<POSDatabase>, productId: number): Promise<POSDatabase['recipes']['value'] | undefined> {
  const index = db.transaction('recipes', 'readonly').store.index('by-product')
  const recipes = await index.getAll(productId)
  // Return the first active recipe
  return recipes.find((r) => r.is_active) || recipes[0]
}

export async function getRecipeMaterials(db: IDBPDatabase<POSDatabase>, recipeId: number): Promise<POSDatabase['recipe_materials']['value'][]> {
  const index = db.transaction('recipe_materials', 'readonly').store.index('by-recipe')
  return index.getAll(recipeId)
}

