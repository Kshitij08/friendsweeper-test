// Shared in-memory storage for images
export interface StoredImage {
  data: string;
  contentType: string;
  timestamp: number;
  metadata?: Record<string, string>;
}

// Use a global variable that persists across hot reloads
declare global {
  var __imageStorage: Map<string, StoredImage> | undefined;
}

// Initialize storage only once
function getStorage(): Map<string, StoredImage> {
  if (!global.__imageStorage) {
    global.__imageStorage = new Map<string, StoredImage>();
    console.log('Image storage initialized');
  }
  return global.__imageStorage;
}

// Clean up expired images (older than 1 hour)
function cleanupExpiredImages() {
  const storage = getStorage();
  const oneHourAgo = Date.now() - 3600000;
  for (const [key, value] of Array.from(storage.entries())) {
    if (value.timestamp < oneHourAgo) {
      storage.delete(key);
    }
  }
}

export function storeImage(key: string, image: StoredImage) {
  const storage = getStorage();
  cleanupExpiredImages();
  storage.set(key, image);
  console.log('Image stored in shared storage:', key);
  console.log('Current storage size:', storage.size);
}

export function getImage(key: string): StoredImage | undefined {
  const storage = getStorage();
  const image = storage.get(key);
  if (image) {
    // Check if image is expired
    if (Date.now() - image.timestamp > 3600000) {
      storage.delete(key);
      return undefined;
    }
  }
  return image;
}

export function deleteImage(key: string) {
  const storage = getStorage();
  storage.delete(key);
}

export function getStorageStats() {
  const storage = getStorage();
  return {
    totalImages: storage.size,
    keys: Array.from(storage.keys())
  };
}
