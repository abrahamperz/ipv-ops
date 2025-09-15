import React, { useState, useEffect } from 'react';
import {
  Grid,
  Typography,
  Box,
  Card,
  CardContent,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
  Stack,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { TrendingUp, People, TrendingDown, CalendarMonth } from '@mui/icons-material';
import { format, parseISO, isSameDay, parse } from 'date-fns';
import { es } from 'date-fns/locale';
import { useLocation } from 'react-router-dom';
import { fetchAttendanceData, groupDataByMonth } from '../data/dataUtils';
import colors from '../theme/colors';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Default churches list
const DEFAULT_CHURCHES = ["IPV Brisas", "IPV Colima", "IPV Norte", "IPV Patria", "IPV Plantios", "IPV Tepeji", "IPV Tepetate", "Misión Playa del Carmen", "Misión Puerto Vallarta", "Misión Tapachula"];

const Asistencia = () => {
  const theme = useTheme();
  const location = useLocation();
  const [selectedChurch, setSelectedChurch] = useState('Todas');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedWeek, setSelectedWeek] = useState('');

  // Data states
  const [attendanceData, setAttendanceData] = useState(null);
  const [dataByMonth, setDataByMonth] = useState({});
  const [churches, setChurches] = useState(DEFAULT_CHURCHES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Current year and month for API calls
  const currentDate = new Date();
  const [currentYear, setCurrentYear] = useState(currentDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(currentDate.getMonth() + 1);

  // Determine tipo filter based on current route
  const getTipoFilter = () => {
    const path = location.pathname;
    if (path === '/servicios') {
      return 'Domingo';
    } else if (path === '/santa-cena') {
      return 'Santa Cena';
    }
    return null; // For /asistencia and other routes, show all
  };

  // Get the appropriate day label based on current route
  const getDayLabel = () => {
    const path = location.pathname;
    if (path === '/santa-cena') {
      return 'Viernes';
    }
    return 'Domingo'; // Default for servicios and asistencia
  };

  // Fetch data from API
  const fetchData = async (year, month, fetchAll = false) => {
    try {
      setLoading(true);
      setError(null);
      const tipoFilter = getTipoFilter();
      const data = await fetchAttendanceData(year, month, fetchAll, tipoFilter);
      setAttendanceData(data);
      setChurches(DEFAULT_CHURCHES);
      setDataByMonth(groupDataByMonth(data.attendanceData));
    } catch (err) {
      setError(err.message);
      console.error('Error fetching attendance data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial data load - fetch all available data
  useEffect(() => {
    fetchData(null, null, true); // fetchAll = true
  }, []);

  // Re-fetch data when location changes
  useEffect(() => {
    fetchData(null, null, true); // fetchAll = true
  }, [location.pathname]);

  // Update selected month when data changes
  useEffect(() => {
    if (Object.keys(dataByMonth).length > 0) {
      const latestMonth = Object.keys(dataByMonth).sort().pop();
      setSelectedMonth(latestMonth);
    }
  }, [dataByMonth]);

  // Handle month change - filter from already loaded data
  const handleMonthChange = (event) => {
    setSelectedMonth(event.target.value);
  };

  // Update selected week when month changes
  useEffect(() => {
    if (selectedMonth && dataByMonth[selectedMonth]) {
      const monthlyData = dataByMonth[selectedMonth];
      if (monthlyData.length > 0) {
        setSelectedWeek(monthlyData[monthlyData.length - 1].fullDate);
      } else {
        setSelectedWeek('');
      }
    }
  }, [selectedMonth, dataByMonth]);

  // Get available months for the dropdown
  const availableMonths = Object.keys(dataByMonth).sort((a, b) => {
    const dateA = parse(a, 'MMMM yyyy', new Date(), { locale: es });
    const dateB = parse(b, 'MMMM yyyy', new Date(), { locale: es });
    return dateA - dateB;
  });

  // Filter data for the selected month
  const monthlyData = dataByMonth[selectedMonth] || [];
  
  // Get the selected week data
  const selectedWeekData = monthlyData.find(week => week.fullDate === selectedWeek) || monthlyData[0] || {};
  
  // Get all weeks for the selected month
  const weeksInMonth = monthlyData.map(week => ({
    value: week.fullDate,
    label: week.name
  }));

  const handleChurchChange = (event) => {
    setSelectedChurch(event.target.value);
  };


  const handleWeekChange = (event) => {
    setSelectedWeek(event.target.value);
  };

  const handleYearMonthChange = (year, month) => {
    setCurrentYear(year);
    setCurrentMonth(month);
  };

  // Calculate metrics for the selected church and selected week
  const calculateMetrics = () => {
    if (!selectedWeekData || Object.keys(selectedWeekData).length === 0) {
      return {
        adultos: 0,
        jovenes: 0,
        ninos: 0,
        recienNacidos: 0,
        nuevos: 0,
        voluntarios: 0,
        total: 0,
        change: 0,
        isIncrease: false
      };
    }

    let currentAdultos = 0, currentJovenes = 0, currentNinos = 0, currentRecienNacidos = 0, currentNuevos = 0, currentVoluntarios = 0;

    if (selectedChurch === 'Todas') {
      // Sum up all churches' data for the selected week
      churches.forEach(church => {
        currentAdultos += (selectedWeekData[`${church} Adultos`] || 0);
        currentJovenes += (selectedWeekData[`${church} Jovenes`] || 0);
        currentNinos += (selectedWeekData[`${church} Niños`] || 0);
        currentRecienNacidos += (selectedWeekData[`${church} Recien nacidos`] || 0);
        currentNuevos += (selectedWeekData[`${church} Nuevos`] || 0);
        currentVoluntarios += (selectedWeekData[`${church} Voluntarios`] || 0);
      });
    } else {
      // Get selected church data for the selected week
      currentAdultos += (selectedWeekData[`${selectedChurch} Adultos`] || 0);
      currentJovenes += (selectedWeekData[`${selectedChurch} Jovenes`] || 0);
      currentNinos += (selectedWeekData[`${selectedChurch} Niños`] || 0);
      currentRecienNacidos += (selectedWeekData[`${selectedChurch} Recien nacidos`] || 0);
      currentNuevos += (selectedWeekData[`${selectedChurch} Nuevos`] || 0);
      currentVoluntarios += (selectedWeekData[`${selectedChurch} Voluntarios`] || 0);
    }

    let totalCurrent = currentAdultos + currentJovenes + currentNinos + currentRecienNacidos + currentNuevos + currentVoluntarios;

    // Para datos de semana seleccionada, no calculamos cambios porcentuales
    return {
      adultos: currentAdultos,
      jovenes: currentJovenes,
      ninos: currentNinos,
      recienNacidos: currentRecienNacidos,
      nuevos: currentNuevos,
      voluntarios: currentVoluntarios,
      total: totalCurrent,
      change: 0,
      isIncrease: false,
      adultosChange: 0,
      adultosIsIncrease: false,
      jovenesChange: 0,
      jovenesIsIncrease: false,
      ninosChange: 0,
      ninosIsIncrease: false,
      recienNacidosChange: 0,
      recienNacidosIsIncrease: false,
      nuevosChange: 0,
      nuevosIsIncrease: false,
      voluntariosChange: 0,
      voluntariosIsIncrease: false
    };
  };

  const metrics = calculateMetrics();

  // Prepare chart data for Chart.js
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: theme.palette.text.primary,
          font: {
            family: theme.typography.fontFamily,
            size: 14,
          },
        }
      },
      tooltip: {
        backgroundColor: theme.palette.background.paper,
        titleColor: '#000000',
        bodyColor: '#000000',
        borderColor: theme.palette.divider,
        borderWidth: 1,
        padding: 16,
        boxShadow: theme.shadows[3],
        titleFont: {
          size: 16,
          weight: 'bold',
        },
        bodyFont: {
          size: 14,
          weight: 'normal',
        },
        mode: 'index',
        intersect: false,
        callbacks: {
          title: function(tooltipItems) {
            const weekData = monthlyData[tooltipItems[0].dataIndex];
            if (weekData && weekData.fullDate) {
              const date = parseISO(weekData.fullDate);
              return format(date, 'PPP', { locale: es });
            }
            return tooltipItems[0].label;
          },
          label: function(context) {
            // Only show full tooltip for the first dataset to avoid duplication
            if (context.datasetIndex !== 0) {
              return null;
            }

            const weekData = monthlyData[context.dataIndex];
            if (!weekData) return ['No información'];

            // Check if there's any data for the selected church
            let hasData = false;
            if (selectedChurch === 'Todas') {
              hasData = churches.some(church =>
                weekData[`${church} Adultos`] !== undefined ||
                weekData[`${church} Jovenes`] !== undefined ||
                weekData[`${church} Niños`] !== undefined ||
                weekData[`${church} Recien nacidos`] !== undefined ||
                weekData[`${church} Nuevos`] !== undefined ||
                weekData[`${church} Voluntarios`] !== undefined
              );
            } else {
              hasData = weekData[`${selectedChurch} Adultos`] !== undefined ||
                        weekData[`${selectedChurch} Jovenes`] !== undefined ||
                        weekData[`${selectedChurch} Niños`] !== undefined ||
                        weekData[`${selectedChurch} Recien nacidos`] !== undefined ||
                        weekData[`${selectedChurch} Nuevos`] !== undefined ||
                        weekData[`${selectedChurch} Voluntarios`] !== undefined;
            }

            if (!hasData) {
              return ['No información'];
            }

            const labels = [`Predicador: ${selectedChurch === 'Todas' ? 'Varios predicadores' : (weekData[`${selectedChurch} Predicador`] || 'Sin predicador')}`];

            let adultos, jovenes, ninos, recienNacidos, nuevos, voluntarios;

            if (selectedChurch === 'Todas') {
              adultos = churches.reduce((sum, church) => {
                return sum + (weekData[`${church} Adultos`] || 0);
              }, 0);

              jovenes = churches.reduce((sum, church) => {
                return sum + (weekData[`${church} Jovenes`] || 0);
              }, 0);

              ninos = churches.reduce((sum, church) => {
                return sum + (weekData[`${church} Niños`] || 0);
              }, 0);

              recienNacidos = churches.reduce((sum, church) => {
                return sum + (weekData[`${church} Recien nacidos`] || 0);
              }, 0);

              nuevos = churches.reduce((sum, church) => {
                return sum + (weekData[`${church} Nuevos`] || 0);
              }, 0);

              voluntarios = churches.reduce((sum, church) => {
                return sum + (weekData[`${church} Voluntarios`] || 0);
              }, 0);
            } else {
              adultos = weekData[`${selectedChurch} Adultos`] || 0;
              jovenes = weekData[`${selectedChurch} Jovenes`] || 0;
              ninos = weekData[`${selectedChurch} Niños`] || 0;
              recienNacidos = weekData[`${selectedChurch} Recien nacidos`] || 0;
              nuevos = weekData[`${selectedChurch} Nuevos`] || 0;
              voluntarios = weekData[`${selectedChurch} Voluntarios`] || 0;
            }

            labels.push(`Adultos: ${adultos}`, `Jóvenes: ${jovenes}`, `Niños: ${ninos}`, `Recien nacidos: ${recienNacidos}`, `Nuevos: ${nuevos}`, `Voluntarios: ${voluntarios}`);

            // Add monthly totals for the selected month
            labels.push('');
            labels.push(`Total del mes (${selectedMonth}):`);

            let monthAdultos = 0, monthJovenes = 0, monthNinos = 0, monthRecienNacidos = 0, monthNuevos = 0, monthVoluntarios = 0;

            monthlyData.forEach(week => {
              if (selectedChurch === 'Todas') {
                churches.forEach(church => {
                  monthAdultos += (week[`${church} Adultos`] || 0);
                  monthJovenes += (week[`${church} Jovenes`] || 0);
                  monthNinos += (week[`${church} Niños`] || 0);
                  monthRecienNacidos += (week[`${church} Recien nacidos`] || 0);
                  monthNuevos += (week[`${church} Nuevos`] || 0);
                  monthVoluntarios += (week[`${church} Voluntarios`] || 0);
                });
              } else {
                monthAdultos += (week[`${selectedChurch} Adultos`] || 0);
                monthJovenes += (week[`${selectedChurch} Jovenes`] || 0);
                monthNinos += (week[`${selectedChurch} Niños`] || 0);
                monthRecienNacidos += (week[`${selectedChurch} Recien nacidos`] || 0);
                monthNuevos += (week[`${selectedChurch} Nuevos`] || 0);
                monthVoluntarios += (week[`${selectedChurch} Voluntarios`] || 0);
              }
            });

            labels.push(`Adultos: ${monthAdultos}`, `Jóvenes: ${monthJovenes}`, `Niños: ${monthNinos}`, `Recien nacidos: ${monthRecienNacidos}`, `Nuevos: ${monthNuevos}`, `Voluntarios: ${monthVoluntarios}`);

            return labels;
          },
          labelColor: function() {
            return {
              borderColor: 'transparent',
              backgroundColor: 'transparent',
              borderWidth: 0,
            };
          },
          labelPointStyle: function() {
            return {
              pointStyle: false,
            };
          }
        }
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: theme.palette.text.secondary,
          font: {
            size: 13,
          },
        },
      },
      y: {
        grid: {
          color: theme.palette.divider,
        },
        ticks: {
          color: theme.palette.text.secondary,
          font: {
            size: 13,
          },
        },
      },
    },
  };

  // Prepare chart data for the selected month
  const chartDataConfig = {
    labels: monthlyData.map(week => week.name),
    datasets: []
  };

    chartDataConfig.datasets.push({
      label: 'Adultos',
      data: monthlyData.map(week => {
        if (selectedChurch === 'Todas') {
          let hasData = false;
          let total = 0;
          churches.forEach(church => {
            const value = week[`${church} Adultos`];
            if (value !== undefined) {
              hasData = true;
              total += value || 0;
            }
          });
          return hasData ? total : null;
        } else {
          const value = week[`${selectedChurch} Adultos`];
          return value !== undefined ? (value || 0) : null;
        }
      }),
      borderColor: colors.gruposEnCasa.blue,
      backgroundColor: colors.gruposEnCasa.blueLight,
      tension: 0.4,
      fill: false,
      pointBackgroundColor: colors.gruposEnCasa.blue,
      pointBorderColor: '#fff',
      pointHoverRadius: 5,
      pointHoverBackgroundColor: colors.gruposEnCasa.blue,
      pointHoverBorderColor: '#fff',
      pointHitRadius: 10,
      pointBorderWidth: 2,
      pointRadius: 4,
      spanGaps: false,
    });

    chartDataConfig.datasets.push({
      label: 'Jóvenes',
      data: monthlyData.map(week => {
        if (selectedChurch === 'Todas') {
          let hasData = false;
          let total = 0;
          churches.forEach(church => {
            const value = week[`${church} Jovenes`];
            if (value !== undefined) {
              hasData = true;
              total += value || 0;
            }
          });
          return hasData ? total : null;
        } else {
          const value = week[`${selectedChurch} Jovenes`];
          return value !== undefined ? (value || 0) : null;
        }
      }),
      borderColor: colors.gruposEnCasa.pink,
      backgroundColor: colors.gruposEnCasa.pinkLight,
      tension: 0.4,
      fill: false,
      pointBackgroundColor: colors.gruposEnCasa.pink,
      pointBorderColor: '#fff',
      pointHoverRadius: 5,
      pointHoverBackgroundColor: colors.gruposEnCasa.pink,
      pointHoverBorderColor: '#fff',
      pointHitRadius: 10,
      pointBorderWidth: 2,
      pointRadius: 4,
      spanGaps: false,
    });

    chartDataConfig.datasets.push({
      label: 'Niños',
      data: monthlyData.map(week => {
        if (selectedChurch === 'Todas') {
          let hasData = false;
          let total = 0;
          churches.forEach(church => {
            const value = week[`${church} Niños`];
            if (value !== undefined) {
              hasData = true;
              total += value || 0;
            }
          });
          return hasData ? total : null;
        } else {
          const value = week[`${selectedChurch} Niños`];
          return value !== undefined ? (value || 0) : null;
        }
      }),
      borderColor: colors.gruposEnCasa.green,
      backgroundColor: colors.gruposEnCasa.greenLight,
      tension: 0.4,
      fill: false,
      pointBackgroundColor: colors.gruposEnCasa.green,
      pointBorderColor: '#fff',
      pointHoverRadius: 5,
      pointHoverBackgroundColor: colors.gruposEnCasa.green,
      pointHoverBorderColor: '#fff',
      pointHitRadius: 10,
      pointBorderWidth: 2,
      pointRadius: 4,
      spanGaps: false,
    });

    chartDataConfig.datasets.push({
      label: 'Recien nacidos',
      data: monthlyData.map(week => {
        if (selectedChurch === 'Todas') {
          let hasData = false;
          let total = 0;
          churches.forEach(church => {
            const value = week[`${church} Recien nacidos`];
            if (value !== undefined) {
              hasData = true;
              total += value || 0;
            }
          });
          return hasData ? total : null;
        } else {
          const value = week[`${selectedChurch} Recien nacidos`];
          return value !== undefined ? (value || 0) : null;
        }
      }),
      borderColor: colors.gruposEnCasa.yellow,
      backgroundColor: colors.gruposEnCasa.yellowLight,
      tension: 0.4,
      fill: false,
      pointBackgroundColor: colors.gruposEnCasa.yellow,
      pointBorderColor: '#fff',
      pointHoverRadius: 5,
      pointHoverBackgroundColor: colors.gruposEnCasa.yellow,
      pointHoverBorderColor: '#fff',
      pointHitRadius: 10,
      pointBorderWidth: 2,
      pointRadius: 4,
      spanGaps: false,
    });

    chartDataConfig.datasets.push({
      label: 'Nuevos',
      data: monthlyData.map(week => {
        if (selectedChurch === 'Todas') {
          let hasData = false;
          let total = 0;
          churches.forEach(church => {
            const value = week[`${church} Nuevos`];
            if (value !== undefined) {
              hasData = true;
              total += value || 0;
            }
          });
          return hasData ? total : null;
        } else {
          const value = week[`${selectedChurch} Nuevos`];
          return value !== undefined ? (value || 0) : null;
        }
      }),
      borderColor: '#009688',
      backgroundColor: '#80cbc4',
      tension: 0.4,
      fill: false,
      pointBackgroundColor: '#009688',
      pointBorderColor: '#fff',
      pointHoverRadius: 5,
      pointHoverBackgroundColor: '#009688',
      pointHoverBorderColor: '#fff',
      pointHitRadius: 10,
      pointBorderWidth: 2,
      pointRadius: 4,
      spanGaps: false,
    });

    chartDataConfig.datasets.push({
      label: 'Voluntarios',
      data: monthlyData.map(week => {
        if (selectedChurch === 'Todas') {
          let hasData = false;
          let total = 0;
          churches.forEach(church => {
            const value = week[`${church} Voluntarios`];
            if (value !== undefined) {
              hasData = true;
              total += value || 0;
            }
          });
          return hasData ? total : null;
        } else {
          const value = week[`${selectedChurch} Voluntarios`];
          return value !== undefined ? (value || 0) : null;
        }
      }),
      borderColor: colors.gruposEnCasa.purple || '#9c27b0',
      backgroundColor: colors.gruposEnCasa.purpleLight || '#e1bee7',
      tension: 0.4,
      fill: false,
      pointBackgroundColor: colors.gruposEnCasa.purple || '#9c27b0',
      pointBorderColor: '#fff',
      pointHoverRadius: 5,
      pointHoverBackgroundColor: colors.gruposEnCasa.purple || '#9c27b0',
      pointHoverBorderColor: '#fff',
      pointHitRadius: 10,
      pointBorderWidth: 2,
      pointRadius: 4,
      spanGaps: false,
    });

  // Show loading state
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Cargando datos de asistencia...
        </Typography>
      </Box>
    );
  }

  // Show error state
  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Error al cargar los datos: {error}
        </Alert>
        <Typography variant="body2" color="text.secondary">
          Verifica que el servidor backend esté ejecutándose y que la configuración de Airtable sea correcta.
        </Typography>
      </Box>
    );
  }

  const cardStyle = {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    minHeight: '150px',
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: 3,
    },
  };

  const cardContentStyle = {
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    height: '100%',
    padding: '16px !important',
  };

  return (
    <Box>
      <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5 }}>
        <Grid item xs={12}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
            <Typography variant="h5" fontWeight="bold">
              Resumen de Asistencia
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Mes</InputLabel>
                <Select
                  value={selectedMonth}
                  label="Mes"
                  onChange={handleMonthChange}
                  startAdornment={
                    <InputAdornment position="start">
                      <CalendarMonth fontSize="small" />
                    </InputAdornment>
                  }
                >
                  {availableMonths.map((month) => (
                    <MenuItem key={month} value={month}>
                      {month.charAt(0).toUpperCase() + month.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>{getDayLabel()}</InputLabel>
                <Select
                  value={selectedWeek}
                  label={getDayLabel()}
                  onChange={handleWeekChange}
                  disabled={weeksInMonth.length === 0}
                >
                  {weeksInMonth.map((week) => (
                    <MenuItem key={week.value} value={week.value}>
                      {week.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Iglesia</InputLabel>
                <Select
                  value={selectedChurch}
                  label="Iglesia"
                  onChange={handleChurchChange}
                >
                  <MenuItem value="Todas">Todas las iglesias</MenuItem>
                  {churches.map((church) => (
                    <MenuItem key={church} value={church}>
                      {church}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </Box>
        </Grid>


        <Grid item xs={6} sm={4} lg={2}>
          <Card sx={cardStyle}>
            <CardContent sx={cardContentStyle}>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                <Typography color="textSecondary" variant="body2" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.8rem' } }}>
                  Adultos
                </Typography>
                <People sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }} color="primary" />
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="h5" component="div" sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem' } }}>
                  {metrics.adultos}
                </Typography>
                {metrics.adultosChange !== 0 && (
                  <Box
                    component="span"
                    sx={{
                      color: metrics.adultosIsIncrease ? 'success.main' : 'error.main',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {metrics.adultosIsIncrease ? <TrendingUp fontSize="small" /> : <TrendingDown fontSize="small" />}
                    <Typography variant="caption" sx={{ ml: 0.25, fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                      {Math.abs(metrics.adultosChange)}%
                    </Typography>
                  </Box>
                )}
                {metrics.adultosChange === 0 && (
                  <Typography variant="caption" color="textSecondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                    Sin cambio
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={4} lg={2}>
          <Card sx={cardStyle}>
            <CardContent sx={cardContentStyle}>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                <Typography color="textSecondary" variant="body2" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.8rem' } }}>
                  Jóvenes
                </Typography>
                <People sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }} color="primary" />
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="h5" component="div" sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem' } }}>
                  {metrics.jovenes}
                </Typography>
                {metrics.jovenesChange !== 0 && (
                  <Box
                    component="span"
                    sx={{
                      color: metrics.jovenesIsIncrease ? 'success.main' : 'error.main',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {metrics.jovenesIsIncrease ? <TrendingUp fontSize="small" /> : <TrendingDown fontSize="small" />}
                    <Typography variant="caption" sx={{ ml: 0.25, fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                      {Math.abs(metrics.jovenesChange)}%
                    </Typography>
                  </Box>
                )}
                {metrics.jovenesChange === 0 && (
                  <Typography variant="caption" color="textSecondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                    Sin cambio
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={4} lg={2}>
          <Card sx={cardStyle}>
            <CardContent sx={cardContentStyle}>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                <Typography color="textSecondary" variant="body2" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.8rem' } }}>
                  Niños
                </Typography>
                <People sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }} color="primary" />
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="h5" component="div" sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem' } }}>
                  {metrics.ninos}
                </Typography>
                {metrics.ninosChange !== 0 && (
                  <Box
                    component="span"
                    sx={{
                      color: metrics.ninosIsIncrease ? 'success.main' : 'error.main',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {metrics.ninosIsIncrease ? <TrendingUp fontSize="small" /> : <TrendingDown fontSize="small" />}
                    <Typography variant="caption" sx={{ ml: 0.25, fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                      {Math.abs(metrics.ninosChange)}%
                    </Typography>
                  </Box>
                )}
                {metrics.ninosChange === 0 && (
                  <Typography variant="caption" color="textSecondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                    Sin cambio
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={4} lg={2}>
          <Card sx={cardStyle}>
            <CardContent sx={cardContentStyle}>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                <Typography color="textSecondary" variant="body2" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.8rem' } }}>
                  Recién Nacidos
                </Typography>
                <People sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }} color="primary" />
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="h5" component="div" sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem' } }}>
                  {metrics.recienNacidos}
                </Typography>
                {metrics.recienNacidosChange !== 0 && (
                  <Box
                    component="span"
                    sx={{
                      color: metrics.recienNacidosIsIncrease ? 'success.main' : 'error.main',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {metrics.recienNacidosIsIncrease ? <TrendingUp fontSize="small" /> : <TrendingDown fontSize="small" />}
                    <Typography variant="caption" sx={{ ml: 0.25, fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                      {Math.abs(metrics.recienNacidosChange)}%
                    </Typography>
                  </Box>
                )}
                {metrics.recienNacidosChange === 0 && (
                  <Typography variant="caption" color="textSecondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                    Sin cambio
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={4} lg={2}>
          <Card sx={cardStyle}>
            <CardContent sx={cardContentStyle}>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                <Typography color="textSecondary" variant="body2" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.8rem' } }}>
                  Nuevos
                </Typography>
                <People sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }} color="primary" />
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="h5" component="div" sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem' } }}>
                  {metrics.nuevos}
                </Typography>
                {metrics.nuevosChange !== 0 && (
                  <Box
                    component="span"
                    sx={{
                      color: metrics.nuevosIsIncrease ? 'success.main' : 'error.main',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {metrics.nuevosIsIncrease ? <TrendingUp fontSize="small" /> : <TrendingDown fontSize="small" />}
                    <Typography variant="caption" sx={{ ml: 0.25, fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                      {Math.abs(metrics.nuevosChange)}%
                    </Typography>
                  </Box>
                )}
                {metrics.nuevosChange === 0 && (
                  <Typography variant="caption" color="textSecondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                    Sin cambio
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={4} lg={2}>
          <Card sx={cardStyle}>
            <CardContent sx={cardContentStyle}>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                <Typography color="textSecondary" variant="body2" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.8rem' } }}>
                  Voluntarios
                </Typography>
                <People sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }} color="primary" />
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="h5" component="div" sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem' } }}>
                  {metrics.voluntarios}
                </Typography>
                {metrics.voluntariosChange !== 0 && (
                  <Box
                    component="span"
                    sx={{
                      color: metrics.voluntariosIsIncrease ? 'success.main' : 'error.main',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {metrics.voluntariosIsIncrease ? <TrendingUp fontSize="small" /> : <TrendingDown fontSize="small" />}
                    <Typography variant="caption" sx={{ ml: 0.25, fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                      {Math.abs(metrics.voluntariosChange)}%
                    </Typography>
                  </Box>
                )}
                {metrics.voluntariosChange === 0 && (
                  <Typography variant="caption" color="textSecondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                    Sin cambio
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Chart - Only show if there's any data at all */}
        {Object.keys(dataByMonth).length > 0 && Object.values(dataByMonth).some(monthData => monthData.length > 0) && (
          <Grid item xs={12}>
            <Card elevation={2}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
                  <Box>
                    <Typography variant="h6" component="div">
                      Tendencias de asistencia - {selectedMonth ? selectedMonth.charAt(0).toUpperCase() + selectedMonth.slice(1) : ''}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Datos por semana
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ height: 400 }}>
                  <Line 
                    data={chartDataConfig} 
                    options={chartOptions} 
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default Asistencia;
