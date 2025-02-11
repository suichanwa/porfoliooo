import * as React from 'react';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import CardActions from '@mui/material/CardActions';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import { Share, MoreVert, Facebook, Twitter, LinkedIn, Article } from '@mui/icons-material';
import pfp from '../../assets/images/pfp.jpg';
import { Link } from 'react-router-dom';

export default function ProfileCard() {
  const socialLinks = {
    facebook: "https://facebook.com/yourusername",
    twitter: "https://twitter.com/yourusername",
    linkedin: "https://linkedin.com/in/yourusername"
  };

  return (
    <Card
      sx={{
        maxWidth: 345,
        margin: '2rem auto',
        borderRadius: '16px',
        boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.2)',
        background: 'var(--primary-bg)',
        '&:hover': {
          boxShadow: '0px 6px 25px rgba(0, 0, 0, 0.3)',
        },
        transition: 'all 0.3s ease'
      }}
    >
      <CardHeader
        avatar={
          <Avatar
            src={pfp}
            sx={{ 
              width: 60, 
              height: 60, 
              border: '2px solid var(--primary-accent)',
              transition: 'transform 0.3s ease',
              '&:hover': {
                transform: 'scale(1.1)'
              }
            }}
          />
        }
        title={
          <Typography variant="h6" sx={{ color: 'var(--text-dark-bg)', fontWeight: 'bold' }}>
            Your Name
          </Typography>
        }
        subheader={
          <Typography variant="body2" sx={{ color: 'var(--secondary-accent)' }}>
            Frontend Developer
          </Typography>
        }
      />
      <CardContent sx={{ backgroundColor: 'var(--secondary-bg)', padding: '1rem' }}>
        <Typography variant="body2" sx={{ color: 'var(--text-light-bg)' }}>
          A passionate developer focused on creating beautiful and interactive web experiences. 
          Specializing in React, TypeScript, and creative animations.
        </Typography>
      </CardContent>
      <CardActions 
        sx={{ 
          backgroundColor: 'var(--primary-bg)',
          padding: '1rem',
          display: 'flex',
          justifyContent: 'space-between'
        }}
      >
        <div>
          {Object.entries(socialLinks).map(([platform, url]) => (
            <IconButton 
              key={platform}
              aria-label={platform}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ 
                color: 'var(--primary-accent)',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  color: 'var(--secondary-accent)'
                },
                transition: 'all 0.2s ease'
              }}
            >
              {platform === 'facebook' && <Facebook />}
              {platform === 'twitter' && <Twitter />}
              {platform === 'linkedin' && <LinkedIn />}
            </IconButton>
          ))}
        </div>
        <Button
          component={Link}
          to="/blog"
          startIcon={<Article />}
          sx={{
            color: 'var(--text-dark-bg)',
            backgroundColor: 'var(--primary-accent)',
            '&:hover': {
              backgroundColor: 'var(--secondary-accent)',
              transform: 'translateY(-2px)'
            },
            transition: 'all 0.2s ease'
          }}
        >
          View Blog
        </Button>
      </CardActions>
    </Card>
  );
}