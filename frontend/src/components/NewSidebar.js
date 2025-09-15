import React, { useState } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Paper,
  Typography,
  useTheme,
  Collapse,
  ListItemButton
} from '@mui/material';
import { blue } from '@mui/material/colors';
import PeopleIcon from '@mui/icons-material/People';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import ChurchIcon from '@mui/icons-material/Church';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import SetMealIcon from '@mui/icons-material/SetMeal';
import ipvLogo from '../assets/ipv_circle.png';

const menuItems = [
  {
    text: 'Asistencia',
    icon: <PeopleIcon />,
    value: 'asistencia',
    submenu: [
      {
        text: 'Servicios',
        icon: <ChurchIcon />,
        value: 'servicios'
      },
      {
        text: 'Santa Cena',
        icon: <SetMealIcon />,
        value: 'santa-cena'
      }
    ]
  },
  // Removed Grupos en Casa menu item
];

const NewSidebar = ({ activeTab, onTabChange }) => {
  const theme = useTheme();
  const [openSubmenu, setOpenSubmenu] = useState(null);

  return (
    <Box
      sx={{
        width: 280,
        height: '100vh',
        bgcolor: 'background.paper',
        borderRight: `1px solid ${theme.palette.divider}`,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Logo Section */}
      <Box 
        sx={{ 
          p: 3, 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Box
          sx={{
            width: 80,
            height: 80,
            p: 0,
            mb: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'transparent',
            borderRadius: '50%',
            overflow: 'hidden'
          }}
        >
          <img 
            src={ipvLogo}
            alt="IPV Logo"
            style={{ 
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              display: 'block'
            }}
          />
        </Box>
        <Typography 
          variant="h6" 
          component="div"
          sx={{ 
            fontWeight: 'bold',
            color: 'primary.main',
            '&:hover': {
              color: blue[700],
              cursor: 'pointer'
            },
          }}
        >
          IPV - Operaciones
        </Typography>
      </Box>

      <Divider />

      {/* Navigation Links */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        <List>
          {menuItems.map((item) => (
            <React.Fragment key={item.value}>
              <ListItemButton
                selected={activeTab === item.value}
                onClick={() => {
                  if (item.submenu) {
                    setOpenSubmenu(openSubmenu === item.value ? null : item.value);
                  } else {
                    onTabChange(item.value);
                  }
                }}
                sx={{
                  '&.Mui-selected': {
                    backgroundColor: 'action.selected',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                  },
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                }}
              >
                <ListItemIcon sx={{ color: activeTab === item.value ? 'primary.main' : 'inherit' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontWeight: activeTab === item.value ? 'bold' : 'normal',
                  }}
                />
                {item.submenu && (
                  openSubmenu === item.value ? <ExpandLess /> : <ExpandMore />
                )}
              </ListItemButton>

              {item.submenu && (
                <Collapse in={openSubmenu === item.value} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {item.submenu.map((subItem) => (
                      <ListItemButton
                        key={subItem.value}
                        selected={activeTab === subItem.value}
                        onClick={() => onTabChange(subItem.value)}
                        sx={{
                          pl: 4,
                          '&.Mui-selected': {
                            backgroundColor: 'action.selected',
                            '&:hover': {
                              backgroundColor: 'action.hover',
                            },
                          },
                          '&:hover': {
                            backgroundColor: 'action.hover',
                          },
                        }}
                      >
                        <ListItemIcon sx={{ color: activeTab === subItem.value ? 'primary.main' : 'inherit' }}>
                          {subItem.icon}
                        </ListItemIcon>
                        <ListItemText
                          primary={subItem.text}
                          primaryTypographyProps={{
                            fontWeight: activeTab === subItem.value ? 'bold' : 'normal',
                          }}
                        />
                      </ListItemButton>
                    ))}
                  </List>
                </Collapse>
              )}
            </React.Fragment>
          ))}
        </List>
      </Box>
    </Box>
  );
};

export default NewSidebar;
