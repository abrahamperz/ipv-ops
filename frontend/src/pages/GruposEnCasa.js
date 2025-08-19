import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  Stack,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import groupData from '../data/gruposEnCasaData.json';

// Use data from JSON file
const groupLeaders = groupData.groupLeaders;
const churches = groupData.churches;

const GruposEnCasa = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [churchFilter, setChurchFilter] = useState('Todas');
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [openModal, setOpenModal] = useState(false);

  const formatDate = (dateString) => {
    const options = { day: '2-digit', month: 'short', year: 'numeric' };
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', options).replace(/\s+/g, '-');
  };

  const filteredLeaders = groupLeaders.filter(leader => {
    const matchesSearch = leader.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        leader.groupName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesChurch = churchFilter === 'Todas' || leader.church === churchFilter;
    return matchesSearch && matchesChurch;
  });

  // Calculate total attendees and spiritual level counts
  const getSpiritualLevelStats = () => {
    const stats = {
      total: 0,
      bautizado: 0,
      conocioDios: 0,
      recienLlegado: 0
    };

    filteredLeaders.forEach(leader => {
      leader.membersList.forEach(member => {
        stats.total++;
        if (member.spiritualLevel === 'Se bautizó') stats.bautizado++;
        else if (member.spiritualLevel === 'Conoció a Dios') stats.conocioDios++;
        else if (member.spiritualLevel === 'Recién llegado') stats.recienLlegado++;
      });
    });

    return stats;
  };

  const spiritualStats = getSpiritualLevelStats();

  const getLevelColor = (level) => {
    switch(level) {
      case 'Se bautizó':
        return 'success';
      case 'Conoció a Dios':
        return 'primary';
      case 'Recién llegado':
        return 'info';
      default:
        return 'default';
    }
  };

  const handleGroupClick = (group) => {
    setSelectedGroup(group);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedGroup(null);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, gap: 2 }}>
        <TextField
          placeholder="Buscar líder o grupo..."
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 300 }}
        />
        
        <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Iglesia</InputLabel>
          <Select
            value={churchFilter}
            onChange={(e) => setChurchFilter(e.target.value)}
            label="Iglesia"
          >
            {churches.map((church) => (
              <MenuItem key={church} value={church}>
                {church}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Summary Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>Total de Miembros</Typography>
            <Typography variant="h5">{spiritualStats.total}</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>Se Bautizaron</Typography>
            <Typography variant="h5">
              {spiritualStats.bautizado} 
              <Typography component="span" color="text.secondary" sx={{ ml: 1 }}>
                ({spiritualStats.total > 0 ? Math.round((spiritualStats.bautizado / spiritualStats.total) * 100) : 0}%)
              </Typography>
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>Conocieron a Dios</Typography>
            <Typography variant="h5">
              {spiritualStats.conocioDios}
              <Typography component="span" color="text.secondary" sx={{ ml: 1 }}>
                ({spiritualStats.total > 0 ? Math.round((spiritualStats.conocioDios / spiritualStats.total) * 100) : 0}%)
              </Typography>
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>Recién Llegados</Typography>
            <Typography variant="h5">
              {spiritualStats.recienLlegado}
              <Typography component="span" color="text.secondary" sx={{ ml: 1 }}>
                ({spiritualStats.total > 0 ? Math.round((spiritualStats.recienLlegado / spiritualStats.total) * 100) : 0}%)
              </Typography>
            </Typography>
          </CardContent>
        </Card>
      </Box>

      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Líder</TableCell>
                  <TableCell>Grupo</TableCell>
                  <TableCell>Iglesia</TableCell>
                  <TableCell align="center">Miembros</TableCell>
                  <TableCell align="center">Asistencia</TableCell>
                  <TableCell>Última Reunión</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredLeaders.map((leader) => (
                  <TableRow 
                    key={leader.id} 
                    hover 
                    onClick={() => handleGroupClick(leader)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Avatar>{leader.name.charAt(0)}</Avatar>
                        <Box>
                          <Typography variant="subtitle2">{leader.name}</Typography>
                          <Typography variant="body2" color="textSecondary">
                            {leader.phone}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>{leader.groupName}</TableCell>
                    <TableCell>{leader.church}</TableCell>
                    <TableCell align="center">{leader.members}</TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Box sx={{ width: '100%', mr: 1 }}>
                          <Box 
                            sx={{
                              height: 6,
                              backgroundColor: 'grey.200',
                              borderRadius: 3,
                              overflow: 'hidden'
                            }}
                          >
                            <Box
                              sx={{
                                height: '100%',
                                width: `${leader.attendance}%`,
                                backgroundColor: leader.attendance > 70 ? '#81c784' : 
                                              leader.attendance > 50 ? '#64b5f6' : 
                                              'error.main',
                              }}
                            />
                          </Box>
                        </Box>
                        <Typography variant="body2" color="textSecondary" sx={{ ml: 1 }}>
                          {leader.attendance}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{formatDate(leader.lastMeeting)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Group Details Modal */}
      <Dialog open={openModal} onClose={handleCloseModal} maxWidth="md" fullWidth>
        {selectedGroup && (
          <>
            <DialogTitle>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  {selectedGroup.name.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="h6">{selectedGroup.groupName}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Líder: {selectedGroup.name} • {selectedGroup.members} miembros
                  </Typography>
                </Box>
              </Box>
            </DialogTitle>
            <DialogContent>
              <TableContainer component={Paper} sx={{ mt: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Miembro</TableCell>
                      <TableCell align="center">Nivel Espiritual</TableCell>
                      <TableCell align="center">Asistencia</TableCell>
                      <TableCell>Última Visita</TableCell>
                      <TableCell>Iglesia</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedGroup.membersList?.map((member, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={2}>
                            <Avatar>{member.name.charAt(0)}</Avatar>
                            <Typography>{member.name}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Chip 
                            label={member.spiritualLevel} 
                            color={getLevelColor(member.spiritualLevel)}
                            size="small"
                            sx={{
                              '&.MuiChip-colorSuccess': {
                                backgroundColor: '#81c784', // Light green for 'Se bautizó'
                                color: '#1b5e20' // Darker green text for contrast
                              },
                              '&.MuiChip-colorPrimary': {
                                backgroundColor: '#f48fb1', // Pink for 'Conoció a Dios'
                                color: '#880e4f' // Darker pink text for contrast
                              },
                              '&.MuiChip-colorInfo': {
                                backgroundColor: '#64b5f6', // Blue for 'Recién llegado'
                                color: '#0d47a1' // Darker blue text for contrast
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Box 
                              sx={{
                                width: '60px',
                                height: '6px',
                                backgroundColor: '#e0e0e0',
                                borderRadius: '3px',
                                overflow: 'hidden',
                                mr: 1
                              }}
                            >
                              <Box 
                                sx={{
                                  width: member.attendance,
                                  height: '100%',
                                  backgroundColor: parseInt(member.attendance) > 70 ? '#81c784' : 
                                                  parseInt(member.attendance) > 50 ? '#64b5f6' : '#f44336'
                                }}
                              />
                            </Box>
                            <Typography variant="body2" sx={{ ml: 1 }}>
                              {member.attendance}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{member.lastVisit}</TableCell>
                        <TableCell>{selectedGroup.church}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseModal} color="primary">
                Cerrar
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default GruposEnCasa;
