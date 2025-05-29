import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Book {
  id: string;
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
}

interface BookCardProps {
  book: Book;
}

export default function BookCard({ book }: BookCardProps) {
  const [showModal, setShowModal] = useState(false);
  const [pdfCoverGenerated, setPdfCoverGenerated] = useState(false);
  const [generatedCover, setGeneratedCover] = useState<string>('');

  // Cookie helpers
  const getPageFromCookie = () => {
    if (typeof window !== 'undefined') {
      const cookies = document.cookie.split(';');
      const pageCookie = cookies.find(cookie => 
        cookie.trim().startsWith(`book_${book.id}_page=`)
      );
      if (pageCookie) {
        const page = parseInt(pageCookie.split('=')[1]);
        return isNaN(page) ? 1 : page;
      }
    }
    return 1;
  };

  const savePageToCookie = (page: number) => {
    if (typeof window !== 'undefined') {
      // Set cookie to expire in 30 days
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 30);
      document.cookie = `book_${book.id}_page=${page}; expires=${expirationDate.toUTCString()}; path=/`;
    }
  };

  // Generate PDF cover from first page
  const generatePdfCover = async (pdfUrl: string) => {
    try {
      // Create a canvas to render the first page of the PDF
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Use PDF.js to render the first page (if available)
      if (typeof window !== 'undefined' && (window as any).pdfjsLib) {
        const pdf = await (window as any).pdfjsLib.getDocument(pdfUrl).promise;
        const page = await pdf.getPage(1);
        
        const viewport = page.getViewport({ scale: 0.5 });
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        await page.render({
          canvasContext: ctx,
          viewport: viewport
        }).promise;
        
        const coverDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setGeneratedCover(coverDataUrl);
        setPdfCoverGenerated(true);
        
        // Save to localStorage for future use
        localStorage.setItem(`pdf_cover_${book.id}`, coverDataUrl);
      }
    } catch (error) {
      console.log('Could not generate PDF cover:', error);
      setPdfCoverGenerated(false);
    }
  };

  // Load saved PDF cover or generate new one
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check if we have a saved cover
      const savedCover = localStorage.getItem(`pdf_cover_${book.id}`);
      if (savedCover) {
        setGeneratedCover(savedCover);
        setPdfCoverGenerated(true);
      } else if (book.coverImage.includes('data:image/svg+xml')) {
        // Only generate cover if current cover is placeholder
        generatePdfCover(book.pdfUrl);
      }
    }
  }, [book.id, book.pdfUrl, book.coverImage]);

  // Update the handleReadBook function to navigate to the reading page
  const handleReadBook = () => {
    window.location.href = `/read/${book.id}`;
  };

  const handleViewThoughts = () => {
    setShowModal(true);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    savePageToCookie(page);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={`text-lg ${i < rating ? 'text-yellow-400' : 'text-base-content/30'}`}>
        ★
      </span>
    ));
  };

  // Determine which cover image to use
  const coverToUse = pdfCoverGenerated && generatedCover ? generatedCover : book.coverImage;

  return (
    <>
      {/* Load PDF.js library if not already loaded */}
      {typeof window !== 'undefined' && !(window as any).pdfjsLib && (
        <script
          src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"
          onLoad={() => {
            if ((window as any).pdfjsLib) {
              (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = 
                'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            }
          }}
        />
      )}

      <motion.div 
        className="bg-base-200 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer"
        whileHover={{ y: -5 }}
        transition={{ duration: 0.2 }}
        onClick={handleReadBook}
      >
        {/* Book Cover */}
        <div className="aspect-[3/4] relative overflow-hidden bg-base-300">
          <img 
            src={coverToUse} 
            alt={`${book.title} cover`}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = `data:image/svg+xml;charset=UTF-8,%3Csvg width='240' height='320' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='100%25' height='100%25' fill='%23374151'/%3E%3Ctext x='50%25' y='40%25' font-size='16' fill='%23ffffff' text-anchor='middle' dy='.3em'%3E📚%3C/text%3E%3Ctext x='50%25' y='60%25' font-size='12' fill='%23ffffff' text-anchor='middle' dy='.3em'%3E${encodeURIComponent(book.title)}%3C/text%3E%3C/svg%3E`;
            }}
          />
          
          {/* Hover overlay with action buttons */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-end">
            <div className="p-4 w-full">
              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReadBook();
                  }}
                  className="btn btn-primary btn-sm flex-1"
                >
                  📖 Read
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewThoughts();
                  }}
                  className="btn btn-secondary btn-sm flex-1"
                >
                  💭 Thoughts
                </button>
              </div>
            </div>
          </div>

          {/* PDF cover generation indicator */}
          {!pdfCoverGenerated && book.coverImage.includes('data:image/svg+xml') && (
            <div className="absolute top-2 right-2 bg-primary-accent text-primary-content text-xs px-2 py-1 rounded-full">
              Generating cover...
            </div>
          )}
        </div>

        {/* Book Info */}
        <div className="p-6">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-xl font-bold leading-tight" style={{ color: 'var(--primary-accent)' }}>
              {book.title}
            </h3>
            <div className="flex ml-2">
              {renderStars(book.rating)}
            </div>
          </div>
          
          <p className="text-base-content/80 font-medium mb-2">{book.author}</p>
          <p className="text-sm text-base-content/60 mb-4 line-clamp-2">{book.description}</p>
          
          <div className="flex items-center justify-between text-sm text-base-content/70 mb-4">
            <span>{book.year}</span>
            <span>{book.pages} pages</span>
            <span className="badge badge-outline badge-sm">{book.genre}</span>
          </div>

          <div className="flex flex-wrap gap-1 mb-4">
            {book.tags.slice(0, 3).map(tag => (
              <span key={tag} className="badge badge-sm" style={{ backgroundColor: 'var(--secondary-accent)', color: 'var(--base-100)' }}>
                #{tag}
              </span>
            ))}
            {book.tags.length > 3 && (
              <span className="badge badge-sm badge-outline">+{book.tags.length - 3}</span>
            )}
          </div>

          {/* Show last read page if exists */}
          {(() => {
            const savedPage = getPageFromCookie();
            return savedPage > 1 && (
              <div className="mt-2 text-xs text-base-content/60 text-center p-2 bg-base-300 rounded">
                📖 Continue from page {savedPage}
              </div>
            );
          })()}
        </div>
      </motion.div>

      {/* Thoughts Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div 
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowModal(false)}
          >
            <motion.div 
              className="bg-base-100 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-base-300">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--primary-accent)' }}>
                      {book.title}
                    </h2>
                    <p className="text-base-content/70">by {book.author}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex">
                        {renderStars(book.rating)}
                      </div>
                      <span className="text-sm text-base-content/60">
                        Read on {formatDate(book.dateRead)}
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowModal(false)}
                    className="btn btn-ghost btn-circle"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--secondary-accent)' }}>
                  My Thoughts & Takeaways
                </h3>
                
                <div className="prose max-w-none">
                  {book.myThoughts.split('\n').map((paragraph, index) => {
                    if (paragraph.trim() === '') return null;
                    
                    if (paragraph.trim().endsWith(':')) {
                      return (
                        <h4 key={index} className="font-medium mt-4 mb-2" style={{ color: 'var(--primary-accent)' }}>
                          {paragraph.trim()}
                        </h4>
                      );
                    }
                    
                    if (paragraph.trim().startsWith('-')) {
                      return (
                        <li key={index} className="ml-4 mb-1">
                          {paragraph.trim().substring(1).trim()}
                        </li>
                      );
                    }
                    
                    return (
                      <p key={index} className="mb-3 text-base-content">
                        {paragraph.trim()}
                      </p>
                    );
                  })}
                </div>

                {/* Tags */}
                <div className="mt-6 pt-4 border-t border-base-300">
                  <div className="flex flex-wrap gap-2">
                    {book.tags.map(tag => (
                      <span key={tag} className="badge" style={{ backgroundColor: 'var(--secondary-accent)', color: 'var(--base-100)' }}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowModal(false);
                      handleReadBook();
                    }}
                    className="btn btn-primary flex-1"
                  >
                    📖 Continue Reading
                  </button>
                  <button
                    onClick={() => setShowModal(false)}
                    className="btn btn-outline flex-1"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}