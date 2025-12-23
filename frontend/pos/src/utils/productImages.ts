/**
 * Utility functions for downloading and managing product images.
 * Images are stored in IndexedDB as blobs for offline access.
 */
import apiClient from '../api/client'

const DB_NAME = 'product_images_db'
const IMAGE_STORE_NAME = 'product_images'
const IMAGE_SIZE = '110'
const DB_VERSION = 1

interface ImageData {
  key: string
  blob: Blob
  productId: number
  productCode: string
  downloadedAt: string
}

/**
 * Download a product image and store it in IndexedDB.
 * @param productId Product ID
 * @param productCode Product code (used as filename)
 * @returns Promise that resolves when image is downloaded and stored
 */
export async function downloadProductImage(
  productId: number,
  productCode: string
): Promise<void> {
  try {
    // Download image from API
    const response = await apiClient.get(
      `/api/v1/products/${productId}/images`,
      {
        params: { size: IMAGE_SIZE },
        responseType: 'blob',
        metadata: {
          isSyncRequest: true,
        },
      } as any
    )

    // Store image blob in IndexedDB
    const db = await openImageDatabase()
    const imageKey = `${productCode}.png` // Use product code as filename
    
    const imageData: ImageData = {
      key: imageKey,
      blob: response.data as Blob,
      productId,
      productCode,
      downloadedAt: new Date().toISOString(),
    }
    
    const tx = db.transaction(IMAGE_STORE_NAME, 'readwrite')
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
      tx.objectStore(IMAGE_STORE_NAME).put(imageData)
    })
  } catch (error: any) {
    // If image doesn't exist (404), silently skip
    if (error.response?.status === 404) {
      console.log(`[downloadProductImage] No image found for product ${productId} (${productCode})`)
      return
    }
    // Log other errors but don't fail the sync
    console.error(`[downloadProductImage] Error downloading image for product ${productId}:`, error)
  }
}

/**
 * Get product image blob URL from IndexedDB.
 * @param productCode Product code
 * @returns Blob URL or null if image not found
 */
export async function getProductImageUrl(productCode: string): Promise<string | null> {
  try {
    const db = await openImageDatabase()
    const imageKey = `${productCode}.png`
    const tx = db.transaction(IMAGE_STORE_NAME, 'readonly')
    const store = tx.objectStore(IMAGE_STORE_NAME)
    
    const imageData = await new Promise<ImageData | undefined>((resolve, reject) => {
      const request = store.get(imageKey)
      request.onsuccess = () => resolve(request.result as ImageData | undefined)
      request.onerror = () => reject(request.error)
    })
    
    if (imageData && imageData.blob) {
      // Create blob URL from stored blob
      return URL.createObjectURL(imageData.blob)
    }
    
    return null
  } catch (error) {
    console.error(`[getProductImageUrl] Error getting image for product ${productCode}:`, error)
    return null
  }
}

/**
 * Open IndexedDB database for product images.
 */
async function openImageDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      
      // Create object store if it doesn't exist
      if (!db.objectStoreNames.contains(IMAGE_STORE_NAME)) {
        const store = db.createObjectStore(IMAGE_STORE_NAME, { keyPath: 'key' })
        store.createIndex('by-product-id', 'productId', { unique: false })
        store.createIndex('by-product-code', 'productCode', { unique: false })
      }
    }
  })
}

/**
 * Clear all product images from IndexedDB.
 */
export async function clearProductImages(): Promise<void> {
  try {
    const db = await openImageDatabase()
    const tx = db.transaction(IMAGE_STORE_NAME, 'readwrite')
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
      tx.objectStore(IMAGE_STORE_NAME).clear()
    })
  } catch (error) {
    console.error('[clearProductImages] Error clearing images:', error)
  }
}

