import React, { useState, useEffect } from 'react';
import {
  Grid,
  Typography,
  Box,
  Card,
  CardContent,
  Divider,
  ToggleButton,
  ToggleButtonGroup,
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
const DEFAULT_CHURCHES = ["Patria", "Norte", "Brisas", "Tepeji", "Colima", "Plantios", "Arca", "Camino de Vida"];

const Asistencia = () => {
  const theme = useTheme();
  const [selectedChurch, setSelectedChurch] = useState('Todas');
  const [view, setView] = useState('detailed');
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

  // Fetch data from API
  const fetchData = async (year, month, fetchAll = false) => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAttendanceData(year, month, fetchAll);
      setAttendanceData(data);
      setChurches(data.churches || DEFAULT_CHURCHES);
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

  const handleViewChange = (event, newView) => {
    if (newView !== null) {
      setView(newView);
    }
  };

  const handleWeekChange = (event) => {
    setSelectedWeek(event.target.value);
  };

  const handleYearMonthChange = (year, month) => {
    setCurrentYear(year);
    setCurrentMonth(month);
  };

  // Calculate metrics for the selected church and week
  const calculateMetrics = () => {
    if (!selectedWeekData) {
      return {
        hombres: 0,
        mujeres: 0,
        ninos: 0,
        recienNacidos: 0,
        total: 0,
        change: 0,
        isIncrease: false
      };
    }

    let currentHombres, currentMujeres, currentNinos, currentRecienNacidos;

    if (selectedChurch === 'Todas') {
      // Sum up all churches' data
      currentHombres = churches.reduce((sum, church) => {
        return sum + (selectedWeekData[`${church} Hombres`] || 0);
      }, 0);

      currentMujeres = churches.reduce((sum, church) => {
        return sum + (selectedWeekData[`${church} Mujeres`] || 0);
      }, 0);

      currentNinos = churches.reduce((sum, church) => {
        return sum + (selectedWeekData[`${church} Niños`] || 0);
      }, 0);

      currentRecienNacidos = churches.reduce((sum, church) => {
        return sum + (selectedWeekData[`${church} Recien nacidos`] || 0);
      }, 0);
    } else {
      currentHombres = selectedWeekData[`${selectedChurch} Hombres`] || 0;
      currentMujeres = selectedWeekData[`${selectedChurch} Mujeres`] || 0;
      currentNinos = selectedWeekData[`${selectedChurch} Niños`] || 0;
      currentRecienNacidos = selectedWeekData[`${selectedChurch} Recien nacidos`] || 0;
    }

    let totalCurrent;
    if (selectedChurch === 'Todas') {
      totalCurrent = churches.reduce((sum, church) => {
        return sum + (selectedWeekData[`${church} Asistencia`] || 0);
      }, 0);
    } else {
      totalCurrent = selectedWeekData[`${selectedChurch} Asistencia`] || 0;
    }

    // Find previous week data for comparison
    const currentIndex = monthlyData.findIndex(week => week.fullDate === selectedWeek);
    const previousWeekData = currentIndex > 0 ? monthlyData[currentIndex - 1] : null;

    let changePercentage = 0;
    if (previousWeekData) {
      let previousHombres, previousMujeres, previousNinos, previousRecienNacidos;

      if (selectedChurch === 'Todas') {
        previousHombres = churches.reduce((sum, church) => {
          return sum + (previousWeekData[`${church} Hombres`] || 0);
        }, 0);

        previousMujeres = churches.reduce((sum, church) => {
          return sum + (previousWeekData[`${church} Mujeres`] || 0);
        }, 0);

        previousNinos = churches.reduce((sum, church) => {
          return sum + (previousWeekData[`${church} Niños`] || 0);
        }, 0);

        previousRecienNacidos = churches.reduce((sum, church) => {
          return sum + (previousWeekData[`${church} Recien nacidos`] || 0);
        }, 0);
      } else {
        previousHombres = previousWeekData[`${selectedChurch} Hombres`] || 0;
        previousMujeres = previousWeekData[`${selectedChurch} Mujeres`] || 0;
        previousNinos = previousWeekData[`${selectedChurch} Niños`] || 0;
        previousRecienNacidos = previousWeekData[`${selectedChurch} Recien nacidos`] || 0;
      }

      let totalPrevious;
      if (selectedChurch === 'Todas') {
        totalPrevious = churches.reduce((sum, church) => {
          return sum + (previousWeekData[`${church} Asistencia`] || 0);
        }, 0);
      } else {
        totalPrevious = previousWeekData[`${selectedChurch} Asistencia`] || 0;
      }

      if (totalPrevious > 0) {
        changePercentage = ((totalCurrent - totalPrevious) / totalPrevious) * 100;
      }
    }

    return {
      hombres: currentHombres,
      mujeres: currentMujeres,
      ninos: currentNinos,
      recienNacidos: currentRecienNacidos,
      total: totalCurrent,
      change: Math.round(changePercentage * 10) / 10,
      isIncrease: changePercentage >= 0
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
            const weekData = monthlyData[context.dataIndex];
            if (!weekData) return ['No información'];

            // Check if there's any data for the selected church
            let hasData = false;
            if (selectedChurch === 'Todas') {
              hasData = churches.some(church =>
                weekData[`${church} Hombres`] !== undefined ||
                weekData[`${church} Mujeres`] !== undefined ||
                weekData[`${church} Niños`] !== undefined ||
                weekData[`${church} Recien nacidos`] !== undefined
              );
            } else {
              hasData = weekData[`${selectedChurch} Hombres`] !== undefined ||
                       weekData[`${selectedChurch} Mujeres`] !== undefined ||
                       weekData[`${selectedChurch} Niños`] !== undefined ||
                       weekData[`${selectedChurch} Recien nacidos`] !== undefined;
            }

            if (!hasData) {
              return ['No información'];
            }

            const labels = [`Predicador: ${selectedChurch === 'Todas' ? 'Varios predicadores' : (weekData[`${selectedChurch} Predicador`] || 'Sin predicador')}`];

            if (view === 'summary') {
              let adults, children;
              if (selectedChurch === 'Todas') {
                adults = churches.reduce((sum, church) => sum + ((weekData[`${church} Hombres`] || 0) + (weekData[`${church} Mujeres`] || 0)), 0);
                children = churches.reduce((sum, church) => sum + ((weekData[`${church} Niños`] || 0) + (weekData[`${church} Recien nacidos`] || 0)), 0);
              } else {
                adults = (weekData[`${selectedChurch} Hombres`] || 0) + (weekData[`${selectedChurch} Mujeres`] || 0);
                children = (weekData[`${selectedChurch} Niños`] || 0) + (weekData[`${selectedChurch} Recien nacidos`] || 0);
              }
              labels.push(`Adultos: ${adults}`, `Niños: ${children}`);
            } else if (view === 'detailed') {
              let hombres, mujeres, ninos, recienNacidos;

              if (selectedChurch === 'Todas') {
                hombres = churches.reduce((sum, church) => {
                  return sum + (weekData[`${church} Hombres`] || 0);
                }, 0);

                mujeres = churches.reduce((sum, church) => {
                  return sum + (weekData[`${church} Mujeres`] || 0);
                }, 0);

                ninos = churches.reduce((sum, church) => {
                  return sum + (weekData[`${church} Niños`] || 0);
                }, 0);

                recienNacidos = churches.reduce((sum, church) => {
                  return sum + (weekData[`${church} Recien nacidos`] || 0);
                }, 0);
              } else {
                hombres = weekData[`${selectedChurch} Hombres`] || 0;
                mujeres = weekData[`${selectedChurch} Mujeres`] || 0;
                ninos = weekData[`${selectedChurch} Niños`] || 0;
                recienNacidos = weekData[`${selectedChurch} Recien nacidos`] || 0;
              }

              labels.push(`Hombres: ${hombres}`, `Mujeres: ${mujeres}`, `Niños: ${ninos}`, `Recien nacidos: ${recienNacidos}`);
            }

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

  if (view === 'summary') {
    chartDataConfig.datasets.push({
      label: 'Adultos',
      data: monthlyData.map(week => {
        let hasData = false;
        let total = 0;

        if (selectedChurch === 'Todas') {
          churches.forEach(church => {
            const hombres = week[`${church} Hombres`];
            const mujeres = week[`${church} Mujeres`];
            if (hombres !== undefined || mujeres !== undefined) {
              hasData = true;
              total += (hombres || 0) + (mujeres || 0);
            }
          });
        } else {
          const hombres = week[`${selectedChurch} Hombres`];
          const mujeres = week[`${selectedChurch} Mujeres`];
          if (hombres !== undefined || mujeres !== undefined) {
            hasData = true;
            total = (hombres || 0) + (mujeres || 0);
          }
        }

        return hasData ? total : null;
      }),
      borderColor: colors.gruposEnCasa.blue,
      backgroundColor: colors.gruposEnCasa.blueLight,
      tension: 0.4,
      fill: true,
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
      label: 'Niños',
      data: monthlyData.map(week => {
        let hasData = false;
        let total = 0;

        if (selectedChurch === 'Todas') {
          churches.forEach(church => {
            const ninos = week[`${church} Niños`];
            const recienNacidos = week[`${church} Recien nacidos`];
            if (ninos !== undefined || recienNacidos !== undefined) {
              hasData = true;
              total += (ninos || 0) + (recienNacidos || 0);
            }
          });
        } else {
          const ninos = week[`${selectedChurch} Niños`];
          const recienNacidos = week[`${selectedChurch} Recien nacidos`];
          if (ninos !== undefined || recienNacidos !== undefined) {
            hasData = true;
            total = (ninos || 0) + (recienNacidos || 0);
          }
        }

        return hasData ? total : null;
      }),
      borderColor: colors.gruposEnCasa.green,
      backgroundColor: colors.gruposEnCasa.greenLight,
      tension: 0.4,
      fill: true,
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
  } else if (view === 'detailed') {
    chartDataConfig.datasets.push({
      label: 'Hombres',
      data: monthlyData.map(week => {
        if (selectedChurch === 'Todas') {
          let hasData = false;
          let total = 0;
          churches.forEach(church => {
            const value = week[`${church} Hombres`];
            if (value !== undefined) {
              hasData = true;
              total += value || 0;
            }
          });
          return hasData ? total : null;
        } else {
          const value = week[`${selectedChurch} Hombres`];
          return value !== undefined ? (value || 0) : null;
        }
      }),
      borderColor: colors.gruposEnCasa.blue,
      backgroundColor: colors.gruposEnCasa.blueLight,
      tension: 0.4,
      fill: true,
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
      label: 'Mujeres',
      data: monthlyData.map(week => {
        if (selectedChurch === 'Todas') {
          let hasData = false;
          let total = 0;
          churches.forEach(church => {
            const value = week[`${church} Mujeres`];
            if (value !== undefined) {
              hasData = true;
              total += value || 0;
            }
          });
          return hasData ? total : null;
        } else {
          const value = week[`${selectedChurch} Mujeres`];
          return value !== undefined ? (value || 0) : null;
        }
      }),
      borderColor: colors.gruposEnCasa.pink,
      backgroundColor: colors.gruposEnCasa.pinkLight,
      tension: 0.4,
      fill: true,
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
      fill: true,
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
      fill: true,
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
  }

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
                <InputLabel>Domingo</InputLabel>
                <Select
                  value={selectedWeek}
                  label="Domingo"
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

        {/* Metrics Cards */}
        <Grid item xs={6} sm={4} lg={2.4}>
          <Card sx={cardStyle}>
            <CardContent sx={cardContentStyle}>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                <Typography color="textSecondary" variant="body2" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.8rem' } }}>
                  Total Asistencia
                </Typography>
                <People sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }} color="primary" />
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="h5" component="div" sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem' } }}>
                  {metrics.total}
                </Typography>
                {metrics.change !== 0 && (
                  <Box
                    component="span"
                    sx={{
                      color: metrics.isIncrease ? 'success.main' : 'error.main',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {metrics.isIncrease ? <TrendingUp fontSize="small" /> : <TrendingDown fontSize="small" />}
                    <Typography variant="caption" sx={{ ml: 0.25, fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                      {Math.abs(metrics.change)}%
                    </Typography>
                  </Box>
                )}
                {metrics.change === 0 && (
                  <Typography variant="caption" color="textSecondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                    Sin cambio
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={4} lg={2.4}>
          <Card sx={cardStyle}>
            <CardContent sx={cardContentStyle}>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                <Typography color="textSecondary" variant="body2" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.8rem' } }}>
                  Hombres
                </Typography>
                <People sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }} color="primary" />
              </Box>
              <Typography variant="h5" component="div" sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem' } }}>
                {metrics.hombres}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={4} lg={2.4}>
          <Card sx={cardStyle}>
            <CardContent sx={cardContentStyle}>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                <Typography color="textSecondary" variant="body2" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.8rem' } }}>
                  Mujeres
                </Typography>
                <People sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }} color="primary" />
              </Box>
              <Typography variant="h5" component="div" sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem' } }}>
                {metrics.mujeres}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={4} lg={2.4}>
          <Card sx={cardStyle}>
            <CardContent sx={cardContentStyle}>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                <Typography color="textSecondary" variant="body2" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.8rem' } }}>
                  Niños
                </Typography>
                <People sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }} color="primary" />
              </Box>
              <Typography variant="h5" component="div" sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem' } }}>
                {metrics.ninos}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={4} lg={2.4}>
          <Card sx={cardStyle}>
            <CardContent sx={cardContentStyle}>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                <Typography color="textSecondary" variant="body2" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.8rem' } }}>
                  Recién Nacidos
                </Typography>
                <People sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }} color="primary" />
              </Box>
              <Typography variant="h5" component="div" sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem' } }}>
                {metrics.recienNacidos}
              </Typography>
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
                      Datos por domingo
                    </Typography>
                  </Box>
                  <ToggleButtonGroup
                    color="primary"
                    value={view}
                    exclusive
                    onChange={handleViewChange}
                    size="small"
                  >
                    <ToggleButton value="summary">Resumen</ToggleButton>
                    <ToggleButton value="detailed">Detallado</ToggleButton>
                  </ToggleButtonGroup>
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
