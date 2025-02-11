import { useState } from 'react';
import { motion } from 'framer-motion';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import BlogCard from '../components/Blog/BlogCard';
import BlogPostView from '../components/Blog/BlogPostView';
import type { BlogPost } from '../models/BlogPost';

const samplePosts: BlogPost[] = [
  {
    id: '1',
    title: 'Getting Started with Three.js',
    excerpt: 'Learn how to create stunning 3D graphics for the web using Three.js',
    content: 'Full article content here...',
    date: 'Feb 6, 2024',
    imageUrl: '/blog/threejs-tutorial.jpg',
    tags: ['Three.js', 'WebGL', 'JavaScript'],
    readTime: '5 min read'
  },
  // ... other posts
];

export default function Blog() {
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

  const handlePostClick = (post: BlogPost) => {
    setSelectedPost(post);
  };

  const handleBack = () => {
    setSelectedPost(null);
  };

  if (selectedPost) {
    return (
      <Box sx={{ position: 'relative' }}>
        <motion.button
          onClick={handleBack}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          sx={{
            position: 'fixed',
            top: '2rem',
            left: '2rem',
            background: 'none',
            border: 'none',
            color: 'var(--primary-accent)',
            cursor: 'pointer',
            fontSize: '1.1rem'
          }}
        >
          ← Back to posts
        </motion.button>
        <BlogPostView post={selectedPost} />
      </Box>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{ padding: '2rem' }}
    >
      <Typography 
        variant="h2" 
        sx={{ 
          color: 'var(--text-dark-bg)',
          mb: 4,
          textAlign: 'center'
        }}
      >
        Blog
      </Typography>
      <Grid container spacing={3}>
        {samplePosts.map(post => (
          <Grid item xs={12} sm={6} md={4} key={post.id}>
            <div onClick={() => handlePostClick(post)} style={{ cursor: 'pointer' }}>
              <BlogCard post={post} />
            </div>
          </Grid>
        ))}
      </Grid>
    </motion.div>
  );
}