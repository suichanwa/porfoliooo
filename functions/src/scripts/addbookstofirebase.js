// Script to add programming books to Firebase for your books module
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

// Programming books to add to your collection
const programmingBooks = [
  {
    title: "Clean Code: A Handbook of Agile Software Craftsmanship",
    author: "Robert C. Martin",
    description: "A comprehensive guide to writing clean, maintainable code that will make you a better programmer.",
    genre: "Programming",
    year: 2008,
    pages: 464,
    myThoughts: `This book completely transformed how I approach writing code. Uncle Bob's principles aren't just theoretical - they're practical guidelines that I use every single day.

Key takeaways:
• Code should be readable like well-written prose
• Functions should be small and do one thing well
• Meaningful names make code self-documenting
• Comments should explain "why", not "what"
• The Boy Scout Rule: always leave code better than you found it

Martin's examples are mostly in Java, but the principles apply to any language. Some of the formatting rules feel a bit dated now with modern IDEs, but the core philosophy is timeless.

This isn't just a book about syntax - it's about craftsmanship and taking pride in your work. Every developer should read this at least once.`,
    rating: 5,
    dateRead: "2024-03-15",
    tags: ["programming", "clean-code", "best-practices", "software-engineering", "craftsmanship"],
    coverImage: "https://images-na.ssl-images-amazon.com/images/I/515iEcDr1GL._SX376_BO1,204,203,200_.jpg",
    pdfUrl: "https://example.com/clean-code.pdf"
  },
  {
    title: "You Don't Know JS: Scope & Closures",
    author: "Kyle Simpson",
    description: "A deep dive into one of JavaScript's most fundamental and misunderstood concepts.",
    genre: "JavaScript",
    year: 2014,
    pages: 98,
    myThoughts: `Kyle Simpson's approach to teaching JavaScript is phenomenal. This short book cleared up years of confusion about how scope really works in JavaScript.

Mind-blowing insights:
• How lexical scope is determined at compile time, not runtime
• The difference between function scope and block scope
• Why 'var' hoisting works the way it does
• How closures are actually just functions remembering their lexical scope
• Module patterns using closures for encapsulation

The examples build perfectly on each other. By the end, I finally understood why certain JS behaviors that seemed "weird" actually make perfect sense.

If you work with JavaScript and don't understand closures, start here. It's a quick read but incredibly valuable.`,
    rating: 5,
    dateRead: "2024-02-20",
    tags: ["javascript", "scope", "closures", "fundamentals", "web-development"],
    coverImage: "https://github.com/getify/You-Dont-Know-JS/blob/2nd-ed/scope-closures/images/cover.png",
    pdfUrl: "https://github.com/getify/You-Dont-Know-JS/tree/2nd-ed/scope-closures"
  },
  {
    title: "JavaScript: The Good Parts",
    author: "Douglas Crockford",
    description: "Unearthing the excellence in JavaScript by focusing on its best features.",
    genre: "JavaScript",
    year: 2008,
    pages: 176,
    myThoughts: `A classic that every JavaScript developer should read, even though some parts feel dated now.

What I learned:
• Why JavaScript's flexibility can be both a blessing and a curse
• The importance of avoiding the "bad parts" of the language
• Functional programming concepts in JavaScript
• Why prototypal inheritance is actually elegant
• How to write more reliable, predictable JavaScript

Crockford's writing is dense but precise. Some of his strong opinions (like avoiding ++ and --) seem extreme, but understanding his reasoning made me a more thoughtful programmer.

With modern ES6+ features, some problems he addresses are solved differently now, but the core principles about avoiding pitfalls still hold true.`,
    rating: 4,
    dateRead: "2024-01-10",
    tags: ["javascript", "programming", "functional-programming", "web-development", "classic"],
    coverImage: "https://images-na.ssl-images-amazon.com/images/I/5166ztxOm9L._SX381_BO1,204,203,200_.jpg",
    pdfUrl: "https://example.com/js-good-parts.pdf"
  },
  {
    title: "Eloquent JavaScript",
    author: "Marijn Haverbeke",
    description: "A modern introduction to programming using JavaScript.",
    genre: "JavaScript",
    year: 2018,
    pages: 472,
    myThoughts: `This book is perfect for anyone who wants to truly understand programming, not just learn syntax.

What makes it special:
• Explains programming concepts through JavaScript rather than just teaching JS
• Excellent progression from basics to advanced topics
• Real projects that actually make sense
• Great exercises that reinforce learning
• Covers both browser and Node.js environments

The writing style is engaging and the examples are practical. Haverbeke doesn't just show you how to do something - he explains why it works that way.

The chapters on higher-order functions and asynchronous programming are particularly well done. Even as an experienced developer, I picked up new insights.

Available free online, but worth buying the physical copy. Great reference to keep coming back to.`,
    rating: 5,
    dateRead: "2024-01-05",
    tags: ["javascript", "programming", "beginner-friendly", "web-development", "fundamentals"],
    coverImage: "https://eloquentjavascript.net/img/cover.jpg",
    pdfUrl: "https://eloquentjavascript.net/"
  },
  {
    title: "The Pragmatic Programmer",
    author: "David Thomas & Andrew Hunt",
    description: "From journeyman to master - practical advice for software developers.",
    genre: "Programming",
    year: 2019,
    pages: 352,
    myThoughts: `The updated 20th anniversary edition is even better than the original. This isn't about any specific technology - it's about thinking like a programmer.

Life-changing concepts:
• DRY (Don't Repeat Yourself) principle
• Orthogonality in design
• The importance of automation
• Debugging mindset and techniques
• Version control as a safety net
• The broken window theory applied to code

The authors share decades of experience in bite-sized, practical tips. Each chapter has exercises that make you think differently about your work.

This book changed how I approach software development. I now automate more, test earlier, and think more systematically about design decisions.

If you only read one programming book, make it this one.`,
    rating: 5,
    dateRead: "2024-02-05",
    tags: ["programming", "best-practices", "software-engineering", "career", "methodology"],
    coverImage: "https://images-na.ssl-images-amazon.com/images/I/51cUVaBWZzL._SX380_BO1,204,203,200_.jpg",
    pdfUrl: "https://example.com/pragmatic-programmer.pdf"
  },
  {
    title: "Design Patterns",
    author: "Gang of Four",
    description: "Elements of Reusable Object-Oriented Software",
    genre: "Programming",
    year: 1994,
    pages: 395,
    myThoughts: `The classic GoF book that introduced design patterns to the masses. Dense and academic, but incredibly valuable.

Patterns I use regularly:
• Observer pattern (especially in React/Vue apps)
• Factory pattern for object creation
• Strategy pattern for interchangeable algorithms
• Decorator pattern for extending functionality
• Singleton pattern (though I use it sparingly now)

Some patterns feel over-engineered for modern languages with better abstractions, but understanding them helps you recognize these concepts in frameworks and libraries.

The examples are in C++/Smalltalk, so translating to modern languages takes effort, but the concepts are universal.

Not an easy read, but essential for understanding how experienced developers think about code organization.`,
    rating: 4,
    dateRead: "2024-01-25",
    tags: ["programming", "design-patterns", "oop", "software-architecture", "classic"],
    coverImage: "https://images-na.ssl-images-amazon.com/images/I/51Q+IRDb9nL._SX326_BO1,204,203,200_.jpg",
    pdfUrl: "https://example.com/design-patterns.pdf"
  }
];

async function addProgrammingBooks() {
  try {
    console.log('🚀 Adding programming books to Firestore...');
    
    for (let i = 0; i < programmingBooks.length; i++) {
      const book = programmingBooks[i];
      console.log(`📚 Adding "${book.title}" (${i + 1}/${programmingBooks.length})...`);
      
      const docRef = await addDoc(collection(db, 'books'), {
        ...book,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log(`✅ Successfully added "${book.title}" with ID: ${docRef.id}`);
      
      // Small delay to avoid overwhelming Firebase
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('\n🎉 All programming books added successfully!');
    console.log('📚 Check your Firebase Console: https://console.firebase.google.com/project/porfoliooo/firestore');
    console.log('🌐 Visit your /books page to see them live!');
    
  } catch (error) {
    console.error('❌ Error adding books:', error);
    console.error('Make sure your Firebase project is set up correctly.');
  }
}

// Run the script
addProgrammingBooks();