import React, { useState, useEffect } from 'react';
import { 
  Box, 
  CssBaseline, 
  ThemeProvider, 
  createTheme,
  useMediaQuery
} from '@mui/material';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import NewSidebar from './components/NewSidebar';
import Asistencia from './pages/Asistencia';
// import GruposEnCasa from './pages/GruposEnCasa';

const theme = createTheme({
  palette: {
    primary: {
      main: '#000000',
    },
    secondary: {
      main: '#3f51b5',
    },
    warning: {
      main: '#ff9800',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  components: {
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#ffffff',
          borderRight: 'none',
          boxShadow: '0 0 10px rgba(0,0,0,0.1)',
        },
      },
    },
  },
});

function AppContent() {
  const [activeTab, setActiveTab] = useState('asistencia');
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Update active tab based on current path
    const path = location.pathname.substring(1); // Remove leading '/'
    if (path && path !== activeTab) {
      setActiveTab(path);
    }
  }, [location.pathname]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    navigate(`/${tab}`);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />
      
      {/* New Sidebar */}
      <Box
        component="nav"
        sx={{
          width: { sm: 280 },
          flexShrink: { sm: 0 },
          display: { xs: 'none', sm: 'block' },
        }}
      >
        <NewSidebar 
          activeTab={activeTab} 
          onTabChange={handleTabChange} 
        />
      </Box>

      {/* Mobile Drawer */}
      <Box
        component="nav"
        sx={{
          width: { sm: 280 },
          flexShrink: { sm: 0 },
          display: { xs: 'block', sm: 'none' },
        }}
      >
        <NewSidebar 
          activeTab={activeTab} 
          onTabChange={handleTabChange}
          mobileOpen={mobileOpen}
          onClose={() => setMobileOpen(false)}
        />
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - 280px)` },
          backgroundColor: '#f5f5f5',
          minHeight: '100vh',
        }}
      >
        <Routes>
          <Route path="/asistencia" element={<Asistencia />} />
          <Route path="/servicios" element={<Asistencia />} />
          <Route path="/santa-cena" element={<Asistencia />} />
          {/* <Route path="/grupos" element={<GruposEnCasa />} /> */}
          <Route path="/" element={<Asistencia />} />
        </Routes>
      </Box>
    </Box>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Router>
        <AppContent />
      </Router>
    </ThemeProvider>
  );
}

export default App;
