import { motion } from 'framer-motion';
import { BlogPost } from '../../models/BlogPost';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

interface BlogCardProps {
  post: BlogPost;
}

export default function BlogCard({ post }: BlogCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          padding: '1rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          cursor: 'pointer',
          '&:hover': {
            '& .post-title': {
              color: 'var(--primary-accent)'
            }
          }
        }}
      >
        <Typography 
          className="post-title"
          sx={{ 
            color: 'var(--text-dark-bg)',
            transition: 'color 0.2s ease',
            fontSize: '1.1rem',
            fontWeight: 500
          }}
        >
          {post.title}
        </Typography>
        <Typography 
          sx={{ 
            color: 'var(--secondary-accent)',
            fontSize: '0.9rem',
            marginLeft: '2rem'
          }}
        >
          {post.date}
        </Typography>
      </Box>
    </motion.div>
  );
}