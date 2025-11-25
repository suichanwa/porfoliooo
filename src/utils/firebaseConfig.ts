import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, getDocs, addDoc, serverTimestamp, query, orderBy, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBw67UWqoH-tQVyEqPDUlAjZWASJFHc5DA",
  authDomain: "porfoliooo.firebaseapp.com",
  projectId: "porfoliooo",
  storageBucket: "porfoliooo.appspot.com",
  messagingSenderId: "627269340192",
  appId: "1:627269340192:web:566592916d2be3e0090045",
  measurementId: "G-QSTD7G1DWC"
};

// Initialize Firebase only once (singleton pattern)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// Diary entries collection reference
const diaryEntriesRef = collection(db, "diaryEntries");

// Interface for diary entries
export interface DiaryEntry {
  id?: string;
  title: string;
  content: string;
  date: string | Date;
}

// Get diary entries
export async function getDiaryEntries() {
  try {
    const q = query(diaryEntriesRef, orderBy("date", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as DiaryEntry[];
  } catch (error) {
    console.error("Error getting diary entries:", error);
    return [];
  }
}

// Add diary entry
export async function addDiaryEntry(entry: Omit<DiaryEntry, "id" | "date">) {
  try {
    const docRef = await addDoc(diaryEntriesRef, {
      ...entry,
      date: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding diary entry:", error);
    throw error;
  }
}

// Letters collection reference
const lettersRef = collection(db, "letters");

// Interface for letters
export interface Letter {
  id?: string;
  name: string;
  message: string;
  date: any;
}

// Add a letter
export async function addLetter(letter: Omit<Letter, "id" | "date">) {
  try {
    const docRef = await addDoc(lettersRef, {
      ...letter,
      date: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding letter:", error);
    throw error;
  }
}

// Get all letters
export async function getLetters() {
  try {
    console.log("Fetching letters from Firestore...");
    const q = query(lettersRef, orderBy("date", "desc"));
    const snapshot = await getDocs(q);
    const letters = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Letter[];
    console.log("Retrieved letters:", letters.length);
    return letters;
  } catch (error) {
    console.error("Error getting letters:", error);
    throw error;
  }
}

// Books collection reference
const booksRef = collection(db, "books");

// Interface for books
export interface Book {
  id?: string;
  title: string;
  author: string;
  coverImage: string;
  pdfUrl: string;
  description: string;
  genre: string;
  year: number;
  pages: number;
  myThoughts: string;
  rating: number;
  dateRead: string;
  tags: string[];
  createdAt?: any;
  updatedAt?: any;
}

// Add a book
export async function addBook(book: Omit<Book, "id" | "createdAt" | "updatedAt">) {
  try {
    const docRef = await addDoc(booksRef, {
      ...book,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding book:", error);
    throw error;
  }
}

// Get all books - SIMPLIFIED VERSION for quick fix
export async function getBooks() {
  try {
    console.log("Fetching books from Firestore...");
    
    // Use simple query without multiple orderBy (no index needed)
    const q = query(booksRef, orderBy("createdAt", "desc"));
    
    const snapshot = await getDocs(q);
    const books = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Book[];
    
    // Sort in JavaScript instead of Firestore
    books.sort((a, b) => {
      if (a.rating !== b.rating) {
        return b.rating - a.rating; // Sort by rating desc
      }
      return new Date(b.dateRead).getTime() - new Date(a.dateRead).getTime(); // Then by date desc
    });
    
    console.log("Retrieved books:", books.length);
    return books;
  } catch (error) {
    console.error("Error getting books:", error);
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
    throw error;
  }
}

// Update a book
export async function updateBook(bookId: string, updates: Partial<Book>) {
  try {
    const bookDoc = doc(db, "books", bookId);
    await updateDoc(bookDoc, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    return bookId;
  } catch (error) {
    console.error("Error updating book:", error);
    throw error;
  }
}

// Delete a book
export async function deleteBook(bookId: string) {
  try {
    const bookDoc = doc(db, "books", bookId);
    await deleteDoc(bookDoc);
    return bookId;
  } catch (error) {
    console.error("Error deleting book:", error);
    throw error;
  }
}

// Upload file to Firebase Storage
export async function uploadFile(file: File, path: string) {
  try {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
}

// Reading progress collection reference
const readingProgressRef = collection(db, "readingProgress");

// Interface for reading progress
export interface ReadingProgress {
  id?: string;
  bookId: string;
  currentPage: number;
  totalPages: number;
  lastReadAt: any;
  userId?: string; // For future user authentication
}

// Save reading progress
export async function saveReadingProgress(progress: Omit<ReadingProgress, "id" | "lastReadAt">) {
  try {
    const docRef = await addDoc(readingProgressRef, {
      ...progress,
      lastReadAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error saving reading progress:", error);
    throw error;
  }
}

// Get reading progress for a book
export async function getReadingProgress(bookId: string) {
  try {
    const q = query(readingProgressRef, orderBy("lastReadAt", "desc"));
    const snapshot = await getDocs(q);
    const progress = snapshot.docs.find(doc => doc.data().bookId === bookId);
    
    if (progress) {
      return {
        id: progress.id,
        ...progress.data()
      } as ReadingProgress;
    }
    return null;
  } catch (error) {
    console.error("Error getting reading progress:", error);
    return null;
  }
}

// ========================= STARRY BACKGROUND FUNCTIONS =========================

// Starry background preferences and interactions collections
const starryBackgroundRef = collection(db, "starryBackground");
const starryAnalyticsRef = collection(db, "starryAnalytics");

// Interface for starry background preferences
export interface StarryBackgroundPreferences {
  id?: string;
  userId?: string;
  showConstellations: boolean;
  enableTrails: boolean;
  enableNebulae: boolean;
  hideGUI: boolean;
  starCount: number;
  lastUpdated: any;
  sessionDuration: number;
  interactions: number;
}

// Interface for starry background analytics
export interface StarryBackgroundAnalytics {
  id?: string;
  sessionId: string;
  startTime: any;
  endTime?: any;
  duration?: number;
  interactions: {
    constellationToggles: number;
    trailToggles: number;
    nebulaeToggles: number;
    guiToggles: number;
    panelOpens: number;
  };
  deviceInfo: {
    isMobile: boolean;
    isLowEnd: boolean;
    prefersReducedMotion: boolean;
    screenResolution: string;
  };
  starSettings: {
    totalStars: number;
    layerDistribution: number[];
    meteorCount: number;
  };
}

// Save starry background preferences
export async function saveStarryPreferences(preferences: Omit<StarryBackgroundPreferences, "id" | "lastUpdated">) {
  try {
    const docRef = await addDoc(starryBackgroundRef, {
      ...preferences,
      lastUpdated: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error saving starry preferences:", error);
    throw error;
  }
}

// Get starry background preferences
export async function getStarryPreferences(userId?: string) {
  try {
    const q = query(starryBackgroundRef, orderBy("lastUpdated", "desc"));
    const snapshot = await getDocs(q);
    const preferences = snapshot.docs.find(doc => {
      const data = doc.data();
      return userId ? data.userId === userId : !data.userId;
    });
    
    if (preferences) {
      return {
        id: preferences.id,
        ...preferences.data()
      } as StarryBackgroundPreferences;
    }
    return null;
  } catch (error) {
    console.error("Error getting starry preferences:", error);
    return null;
  }
}

// Update starry background preferences
export async function updateStarryPreferences(preferencesId: string, updates: Partial<StarryBackgroundPreferences>) {
  try {
    const preferencesDoc = doc(db, "starryBackground", preferencesId);
    await updateDoc(preferencesDoc, {
      ...updates,
      lastUpdated: serverTimestamp()
    });
    return preferencesId;
  } catch (error) {
    console.error("Error updating starry preferences:", error);
    throw error;
  }
}

// Save starry background analytics
export async function saveStarryAnalytics(analytics: Omit<StarryBackgroundAnalytics, "id">) {
  try {
    const docRef = await addDoc(starryAnalyticsRef, analytics);
    return docRef.id;
  } catch (error) {
    console.error("Error saving starry analytics:", error);
    throw error;
  }
}

// Get starry background analytics
export async function getStarryAnalytics(limit: number = 100) {
  try {
    const q = query(starryAnalyticsRef, orderBy("startTime", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.slice(0, limit).map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as StarryBackgroundAnalytics[];
  } catch (error) {
    console.error("Error getting starry analytics:", error);
    return [];
  }
}

export { db, auth, storage };