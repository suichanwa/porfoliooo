import { ThemeProvider } from './context/ThemeContext';
import Home from './pages/index';
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <Home />
    </ThemeProvider>
  );
}

export default App;