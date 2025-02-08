import { motion } from 'framer-motion';
import Avatar from '../components/Avatar';
import ProfileCard from '../components/Profile/ProfileCard';

export default function Home() {
  const text = "Welcome to My Portfolio";

  return (
    <div className="home-container">
      <section className="hero-section">
        <div className="falling-text">
          {text.split('').map((char, index) => (
            <motion.span
              key={index}
              initial={{ y: 0 }}
              animate={{ y: "calc(100vh - 3rem)" }}
              transition={{
                delay: index * 0.1,
                duration: 2,
                ease: "easeIn"
              }}
            >
              {char}
            </motion.span>
          ))}
        </div>
        <Avatar />

        <motion.div
          className="profile-section"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.5, duration: 1 }}
        >
          <ProfileCard />
        </motion.div>
      </section>
    </div>
  );
}