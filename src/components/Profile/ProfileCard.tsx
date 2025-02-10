import * as React from 'react';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import CardActions from '@mui/material/CardActions';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import { Share, MoreVert, Facebook, Twitter, LinkedIn } from '@mui/icons-material';
import pfp from '../../assets/images/pfp.jpg';
import { Link } from 'react-router-dom'; // Import the Link component

export default function ProfileCard() {
  return (
    <Card
      sx={{
        maxWidth: 345,
        margin: '2rem auto',
        borderRadius: '16px',
        boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.2)',
        background: 'var(--primary-bg)',
      }}
    >
      <CardHeader
        avatar={
          <Avatar
            src={pfp}
            sx={{ width: 60, height: 60, border: '2px solid var(--primary-accent)' }}
          />
        }
        action={
          <IconButton aria-label="settings">
            <MoreVert sx={{ color: 'var(--text-dark-bg)' }} />
          </IconButton>
        }
        title={
          <Typography variant="h6" sx={{ color: 'var(--text-dark-bg)', fontWeight: 'bold' }}>
            Your Name
          </Typography>
        }
        subheader={
          <Typography variant="body2" sx={{ color: 'var(--secondary-accent)' }}>
            @yourusername
          </Typography>
        }
      />
      <CardMedia
        component="img"
        height="200"
        image={pfp}
        alt="Profile cover"
        sx={{ objectFit: 'cover' }}
      />
      <CardContent
        sx={{
          backgroundColor: 'var(--secondary-bg)',
          padding: '1rem',
        }}
      >
        <Typography variant="body2" sx={{ color: 'var(--text-light-bg)' }}>
          This is a brief bio about yourself. Describe your skills, passions, and interests in a way
          that connects with your audience.
        </Typography>
      </CardContent>
      <CardActions disableSpacing sx={{ backgroundColor: 'var(--primary-bg)' }}>
        <IconButton aria-label="share" sx={{ color: 'var(--primary-accent)' }}>
          <Share />
        </IconButton>
        <IconButton aria-label="facebook" sx={{ color: 'var(--primary-accent)' }}>
          <Facebook />
        </IconButton>
        <IconButton aria-label="twitter" sx={{ color: 'var(--primary-accent)' }}>
          <Twitter />
        </IconButton>
        <IconButton aria-label="linkedin" sx={{ color: 'var(--primary-accent)' }}>
          <LinkedIn />
        </IconButton>
         {/* Add a link to your blog */}
         <Link to="/blog" style={{ color: 'var(--primary-accent)', textDecoration: 'none' }}>
            View Blog
          </Link>
      </CardActions>
    </Card>
  );
}