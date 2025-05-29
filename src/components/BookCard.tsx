import React, { useState } from 'react';
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
  const [showPdfReader, setShowPdfReader] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

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

  const handleReadBook = () => {
    const savedPage = getPageFromCookie();
    setCurrentPage(savedPage);
    setShowPdfReader(true);
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

  return (
    <>
      <motion.div 
        className="bg-base-200 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
        whileHover={{ y: -5 }}
        transition={{ duration: 0.2 }}
      >
        {/* Book Cover */}
        <div className="aspect-[3/4] relative overflow-hidden bg-base-300">
          <img 
            src={book.coverImage} 
            alt={`${book.title} cover`}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = `data:image/svg+xml;charset=UTF-8,%3Csvg width='240' height='320' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='100%25' height='100%25' fill='%23374151'/%3E%3Ctext x='50%25' y='50%25' font-size='16' fill='%23ffffff' text-anchor='middle' dy='.3em'%3E${encodeURIComponent(book.title)}%3C/text%3E%3C/svg%3E`;
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300">
            <div className="absolute bottom-4 left-4 right-4">
              <div className="flex gap-2">
                <button
                  onClick={handleReadBook}
                  className="btn btn-primary btn-sm flex-1"
                >
                  📖 Read
                </button>
                <button
                  onClick={handleViewThoughts}
                  className="btn btn-secondary btn-sm flex-1"
                >
                  💭 Thoughts
                </button>
              </div>
            </div>
          </div>
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

          <div className="flex gap-2">
            <button
              onClick={handleReadBook}
              className="btn btn-primary btn-sm flex-1"
            >
              📖 Read
            </button>
            <button
              onClick={handleViewThoughts}
              className="btn btn-outline btn-sm flex-1"
            >
              💭 Thoughts
            </button>
          </div>

          {/* Show last read page if exists */}
          {(() => {
            const savedPage = getPageFromCookie();
            return savedPage > 1 && (
              <div className="mt-2 text-xs text-base-content/60 text-center">
                Last read: Page {savedPage}
              </div>
            );
          })()}
        </div>
      </motion.div>

      {/* PDF Reader Modal - Using iframe for better compatibility */}
      <AnimatePresence>
        {showPdfReader && (
          <motion.div 
            className="fixed inset-0 bg-black/90 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="bg-base-100 rounded-xl w-full h-full max-w-6xl max-h-[95vh] flex flex-col"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              {/* PDF Reader Header */}
              <div className="p-4 border-b border-base-300 flex items-center justify-between bg-base-200 rounded-t-xl">
                <div>
                  <h2 className="text-lg font-bold" style={{ color: 'var(--primary-accent)' }}>
                    {book.title}
                  </h2>
                  <p className="text-sm text-base-content/70">by {book.author}</p>
                </div>
                
                {/* PDF Controls */}
                <div className="flex items-center gap-3">
                  {/* Page Navigation */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const newPage = Math.max(1, currentPage - 1);
                        handlePageChange(newPage);
                      }}
                      disabled={currentPage <= 1}
                      className="btn btn-ghost btn-sm"
                    >
                      ← Prev
                    </button>
                    
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={currentPage}
                        onChange={(e) => {
                          const page = parseInt(e.target.value) || 1;
                          handlePageChange(page);
                        }}
                        className="input input-bordered input-xs w-16 text-center"
                        min="1"
                      />
                      <span className="text-sm">/ {book.pages}</span>
                    </div>
                    
                    <button
                      onClick={() => {
                        const newPage = Math.min(book.pages, currentPage + 1);
                        handlePageChange(newPage);
                      }}
                      disabled={currentPage >= book.pages}
                      className="btn btn-ghost btn-sm"
                    >
                      Next →
                    </button>
                  </div>

                  <button
                    onClick={() => window.open(book.pdfUrl, '_blank')}
                    className="btn btn-outline btn-sm"
                  >
                    Open in New Tab
                  </button>

                  <button 
                    onClick={() => setShowPdfReader(false)}
                    className="btn btn-ghost btn-circle"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* PDF Viewer - Using iframe */}
              <div className="flex-1 overflow-hidden">
                <iframe
                  src={`${book.pdfUrl}#page=${currentPage}&toolbar=1&navpanes=0&scrollbar=1`}
                  className="w-full h-full border-0"
                  title={`${book.title} - Page ${currentPage}`}
                  onLoad={() => {
                    // Save current page when PDF loads
                    savePageToCookie(currentPage);
                  }}
                />
              </div>

              {/* Bottom Navigation Bar */}
              <div className="p-3 border-t border-base-300 bg-base-200 rounded-b-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-base-content/70">
                      Page {currentPage} of {book.pages}
                    </span>
                    <div className="w-32 bg-base-300 rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(currentPage / book.pages) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleViewThoughts}
                      className="btn btn-secondary btn-sm"
                    >
                      💭 My Thoughts
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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