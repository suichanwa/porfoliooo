// This script adds sample books to Firebase for testing
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBw67UWqoH-tQVyEqPDUlAjZWASJFHc5DA",
  authDomain: "porfoliooo.firebaseapp.com",
  projectId: "porfoliooo",
  storageBucket: "porfoliooo.appspot.com",
  messagingSenderId: "627269340192",
  appId: "1:627269340192:web:566592916d2be3e0090045"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const sampleBooks = [
  {
    title: "Clean Code",
    author: "Robert C. Martin",
    description: "A handbook of agile software craftsmanship",
    genre: "Programming",
    year: 2008,
    pages: 464,
    myThoughts: `This book completely changed how I think about writing code. Martin's emphasis on 
readability and maintainability resonates deeply with me. The examples are practical 
and the principles are timeless.

Key takeaways:
- Code should be readable like prose
- Functions should be small and do one thing
- Comments should explain why, not what

Would definitely recommend to any developer looking to level up their craft.`,
    rating: 5,
    dateRead: "2024-03-15",
    tags: ["programming", "best-practices", "software-engineering"],
    coverImage: "https://images-na.ssl-images-amazon.com/images/I/515iEcDr1GL._SX376_BO1,204,203,200_.jpg",
    pdfUrl: "https://example.com/clean-code.pdf" // You'll replace this with actual Firebase Storage URLs
  },
  {
    title: "JavaScript: The Good Parts",
    author: "Douglas Crockford",
    description: "Unearthing the Excellence in JavaScript",
    genre: "Programming",
    year: 2008,
    pages: 176,
    myThoughts: `Short but powerful. Crockford's insights into JavaScript helped me understand
the language on a deeper level. Some parts feel outdated now with ES6+, but
the core principles about avoiding the bad parts still hold true.

Essential read for any JavaScript developer who wants to write better code.`,
    rating: 4,
    dateRead: "2024-02-10",
    tags: ["javascript", "programming", "web-development"],
    coverImage: "https://images-na.ssl-images-amazon.com/images/I/5166ztxOm9L._SX381_BO1,204,203,200_.jpg",
    pdfUrl: "https://example.com/js-good-parts.pdf"
  },
  {
    title: "Design Patterns",
    author: "Gang of Four",
    description: "Elements of Reusable Object-Oriented Software",
    genre: "Programming",
    year: 1994,
    pages: 395,
    myThoughts: `A classic that every developer should read at least once. While some patterns 
feel dated in modern JavaScript/TypeScript, the core concepts are invaluable.

The Observer and Factory patterns have been particularly useful in my React projects.`,
    rating: 4,
    dateRead: "2024-01-20",
    tags: ["programming", "design-patterns", "oop"],
    coverImage: "https://images-na.ssl-images-amazon.com/images/I/51Q+IRDb9nL._SX326_BO1,204,203,200_.jpg",
    pdfUrl: "https://example.com/design-patterns.pdf"
  }
];

async function addSampleBooks() {
  try {
    console.log('Adding sample books to Firestore...');
    
    for (const book of sampleBooks) {
      const docRef = await addDoc(collection(db, 'books'), {
        ...book,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      console.log(`✅ Added "${book.title}" with ID: ${docRef.id}`);
    }
    
    console.log('🎉 All sample books added successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding books:', error);
    process.exit(1);
  }
}

addSampleBooks();