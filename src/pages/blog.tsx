import { motion } from 'framer-motion';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import BlogCard from '../components/Blog/BlogCard';
import type { BlogPost } from '../models/BlogPost';

const samplePosts: BlogPost[] = [
  {
    id: '1',
    title: 'Getting Started with Three.js',
    excerpt: 'Learn how to create stunning 3D graphics for the web using Three.js',
    content: '... full content here ...',
    date: 'Feb 6, 2024',
    imageUrl: '/blog/threejs-tutorial.jpg',
    tags: ['Three.js', 'WebGL', 'JavaScript'],
    readTime: '5 min read'
  },
  {
    id: '2',
    title: 'Mastering React Hooks',
    excerpt: 'A deep dive into the most useful React hooks for building dynamic UIs',
    content: '... full content here ...',
    date: 'Jan 28, 2024',
    imageUrl: '/blog/react-hooks.jpg',
    tags: ['React', 'Hooks', 'Frontend'],
    readTime: '7 min read'
  },
  {
    id: '3',
    title: 'Styling with Material UI',
    excerpt: 'Explore the power and flexibility of Material UI for styling your React apps',
    content: '... full content here ...',
    date: 'Jan 15, 2024',
    imageUrl: '/blog/material-ui.png',
    tags: ['Material UI', 'React', 'Styling'],
    readTime: '6 min read'
  },
];

export default function Blog() {
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
            <BlogCard post={post} />
          </Grid>
        ))}
      </Grid>
    </motion.div>
  );
}