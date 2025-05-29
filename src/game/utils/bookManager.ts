import { addBook, uploadFile, type Book } from './firebaseConfig';

export async function addBookToFirebase(bookData: {
  title: string;
  author: string;
  description: string;
  genre: string;
  year: number;
  pages: number;
  myThoughts: string;
  rating: number;
  dateRead: string;
  tags: string[];
  pdfFile: File;
  coverFile?: File;
}) {
  try {
    console.log('Uploading PDF...');
    const pdfUrl = await uploadFile(bookData.pdfFile, `pdfs/${bookData.title}.pdf`);
    
    let coverImage = '';
    if (bookData.coverFile) {
      console.log('Uploading cover image...');
      coverImage = await uploadFile(bookData.coverFile, `covers/${bookData.title}.jpg`);
    } else {
      // Generate placeholder cover
      coverImage = `data:image/svg+xml;charset=UTF-8,%3Csvg width='240' height='320' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='100%25' height='100%25' fill='%23374151'/%3E%3Ctext x='50%25' y='40%25' font-size='16' fill='%23ffffff' text-anchor='middle' dy='.3em'%3E📚%3C/text%3E%3Ctext x='50%25' y='60%25' font-size='12' fill='%23ffffff' text-anchor='middle' dy='.3em'%3E${encodeURIComponent(bookData.title)}%3C/text%3E%3C/svg%3E`;
    }

    console.log('Adding book to Firestore...');
    const bookId = await addBook({
      title: bookData.title,
      author: bookData.author,
      coverImage,
      pdfUrl,
      description: bookData.description,
      genre: bookData.genre,
      year: bookData.year,
      pages: bookData.pages,
      myThoughts: bookData.myThoughts,
      rating: bookData.rating,
      dateRead: bookData.dateRead,
      tags: bookData.tags
    });

    console.log('Book added successfully with ID:', bookId);
    return bookId;
  } catch (error) {
    console.error('Error adding book:', error);
    throw error;
  }
}