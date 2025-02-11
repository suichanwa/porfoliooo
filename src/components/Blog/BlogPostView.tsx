import { motion } from 'framer-motion';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import { BlogPost } from '../../models/BlogPost';

interface BlogPostViewProps {
  post: BlogPost;
}

export default function BlogPostView({ post }: BlogPostViewProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Box sx={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
        <Box className="title" sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h3" sx={{ color: 'var(--text-dark-bg)' }}>
            {post.title}
          </Typography>
          <Typography 
            variant="subtitle1" 
            sx={{ color: 'var(--secondary-accent)', mt: 1 }}
          >
            {post.date}
          </Typography>
          <Divider sx={{ my: 2 }} />
        </Box>
        
        <Typography 
          variant="body1" 
          sx={{ 
            color: 'var(--text-dark-bg)',
            lineHeight: 1.8,
            fontSize: '1.1rem'
          }}
        >
          {post.content}
        </Typography>
      </Box>
    </motion.div>
  );
}