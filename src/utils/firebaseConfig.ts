import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, getDocs, addDoc, serverTimestamp, query, orderBy } from "firebase/firestore";
import { getAuth } from "firebase/auth";

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
// Check if any Firebase apps are already initialized
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

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
  name?: string;
  message: string;
  date: string | Date;
}

// Add a letter
export async function addLetter(letter: Omit<Letter, "id" | "date">) {
  try {
    console.log("Attempting to add letter:", letter);
    const docRef = await addDoc(lettersRef, {
      ...letter,
      date: serverTimestamp()
    });
    console.log("Letter added successfully with ID:", docRef.id);
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

export { db, auth };