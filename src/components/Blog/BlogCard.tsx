import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import { BlogPost } from '../../models/BlogPost';
import { motion } from 'framer-motion';

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
      <Card 
        sx={{ 
          maxWidth: 345,
          backgroundColor: 'var(--primary-bg)',
          borderRadius: '16px',
          transition: 'transform 0.2s',
          '&:hover': {
            transform: 'translateY(-4px)'
          }
        }}
      >
        {post.imageUrl && (
          <CardMedia
            component="img"
            height="140"
            image={post.imageUrl}
            alt={post.title}
            sx={{ objectFit: 'cover' }}
          />
        )}
        <CardContent>
          <Typography 
            gutterBottom 
            variant="h5" 
            component="div"
            sx={{ color: 'var(--text-dark-bg)' }}
          >
            {post.title}
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ color: 'var(--secondary-accent)', mb: 2 }}
          >
            {post.date} · {post.readTime}
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ color: 'var(--text-dark-bg)', mb: 2 }}
          >
            {post.excerpt}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {post.tags.map(tag => (
              <Chip 
                key={tag}
                label={tag}
                size="small"
                sx={{ 
                  backgroundColor: 'var(--primary-accent)',
                  color: 'var(--primary-bg)'
                }}
              />
            ))}
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
}