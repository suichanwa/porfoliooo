import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { saveReadingProgress, getReadingProgress, type Book, type ReadingProgress } from '../utils/firebaseConfig';

interface BookReaderProps {
  book: Book;
}

export default function BookReader({ book }: BookReaderProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [showThoughts, setShowThoughts] = useState(false);
  const [scale, setScale] = useState(1.0);
  const [readingProgress, setReadingProgress] = useState<ReadingProgress | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Load saved reading progress
  useEffect(() => {
    const loadProgress = async () => {
      if (book.id) {
        const progress = await getReadingProgress(book.id);
        if (progress) {
          setCurrentPage(progress.currentPage);
          setReadingProgress(progress);
        }
      }
      setIsLoading(false);
    };

    loadProgress();
  }, [book.id]);

  // Auto-save reading progress
  useEffect(() => {
    const saveProgress = async () => {
      if (book.id && currentPage > 1) {
        try {
          await saveReadingProgress({
            bookId: book.id,
            currentPage,
            totalPages: book.pages
          });
          setLastSaved(new Date());
        } catch (error) {
          console.error('Failed to save reading progress:', error);
        }
      }
    };

    // Debounce saving (save after 2 seconds of no page changes)
    const timeoutId = setTimeout(saveProgress, 2000);
    return () => clearTimeout(timeoutId);
  }, [currentPage, book.id, book.pages]);

  const handlePageChange = (page: number) => {
    const validPage = Math.max(1, Math.min(book.pages, page));
    setCurrentPage(validPage);
  };

  const goToPrevPage = () => handlePageChange(currentPage - 1);
  const goToNextPage = () => handlePageChange(currentPage + 1);

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-base-100">
        <div className="text-center">
          <div className="loading loading-dots loading-lg text-primary-accent mb-4"></div>
          <p className="text-base-content/70">Loading your book...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100 flex flex-col">
      {/* Header */}
      <header className="bg-base-200 border-b border-base-300 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Book Info */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => window.history.back()}
                className="btn btn-ghost btn-circle"
                title="Go back"
              >
                ←
              </button>
              <div>
                <h1 className="text-xl font-bold" style={{ color: 'var(--primary-accent)' }}>
                  {book.title}
                </h1>
                <p className="text-sm text-base-content/70">by {book.author}</p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3">
              {/* Zoom Controls */}
              <div className="hidden md:flex items-center gap-1">
                <button
                  onClick={() => setScale(Math.max(0.5, scale - 0.25))}
                  className="btn btn-ghost btn-xs"
                  disabled={scale <= 0.5}
                >
                  🔍-
                </button>
                <span className="text-xs px-2">{Math.round(scale * 100)}%</span>
                <button
                  onClick={() => setScale(Math.min(3, scale + 0.25))}
                  className="btn btn-ghost btn-xs"
                  disabled={scale >= 3}
                >
                  🔍+
                </button>
              </div>

              {/* Page Navigation */}
              <div className="flex items-center gap-2">
                <button
                  onClick={goToPrevPage}
                  disabled={currentPage <= 1}
                  className="btn btn-ghost btn-sm"
                >
                  ← Prev
                </button>
                
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={currentPage}
                    onChange={(e) => handlePageChange(parseInt(e.target.value) || 1)}
                    className="input input-bordered input-xs w-16 text-center"
                    min="1"
                    max={book.pages}
                  />
                  <span className="text-sm">/ {book.pages}</span>
                </div>
                
                <button
                  onClick={goToNextPage}
                  disabled={currentPage >= book.pages}
                  className="btn btn-ghost btn-sm"
                >
                  Next →
                </button>
              </div>

              {/* Action Buttons */}
              <button
                onClick={() => setShowThoughts(true)}
                className="btn btn-secondary btn-sm"
              >
                💭 Thoughts
              </button>

              <button
                onClick={() => window.open(book.pdfUrl, '_blank')}
                className="btn btn-outline btn-sm"
              >
                🔗 Open PDF
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* PDF Viewer */}
      <main className="flex-1 bg-gray-100">
        <div className="max-w-7xl mx-auto p-4">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <iframe
              key={currentPage}
              src={`${book.pdfUrl}#page=${currentPage}&toolbar=1&navpanes=0&scrollbar=1&view=FitH&zoom=${Math.round(scale * 100)}`}
              className="w-full border-0"
              style={{ height: 'calc(100vh - 200px)' }}
              title={`${book.title} - Page ${currentPage}`}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-base-200 border-t border-base-300 py-3">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm text-base-content/70">
                Page {currentPage} of {book.pages}
              </span>
              <div className="w-48 bg-base-300 rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(currentPage / book.pages) * 100}%` }}
                ></div>
              </div>
              <span className="text-xs text-base-content/60">
                {Math.round((currentPage / book.pages) * 100)}% complete
              </span>
            </div>

            {lastSaved && (
              <span className="text-xs text-base-content/50">
                Progress saved {lastSaved.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
      </footer>

      {/* Thoughts Modal */}
      <AnimatePresence>
        {showThoughts && (
          <motion.div 
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowThoughts(false)}
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
                    onClick={() => setShowThoughts(false)}
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

                {/* Close Button */}
                <div className="flex justify-center mt-6">
                  <button
                    onClick={() => setShowThoughts(false)}
                    className="btn btn-outline"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}