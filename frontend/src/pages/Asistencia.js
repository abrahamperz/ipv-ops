import React from 'react';
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
  InputAdornment
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
import { format, parseISO, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import asistenciaData from '../data/asistenciaData.json';
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

// Group data by month
const groupDataByMonth = (data) => {
  return data.reduce((acc, item) => {
    const monthYear = format(parseISO(item.date), 'MMMM yyyy', { locale: es });
    if (!acc[monthYear]) {
      acc[monthYear] = [];
    }
    acc[monthYear].push(item);
    return acc;
  }, {});
};

// Process the attendance data
const processAttendanceData = () => {
  return {
    allData: asistenciaData.attendanceData,
    dataByMonth: groupDataByMonth(asistenciaData.attendanceData),
    churches: asistenciaData.churches
  };
};

const { allData, dataByMonth, churches } = processAttendanceData();

const Asistencia = () => {
  const theme = useTheme();
  const [selectedChurch, setSelectedChurch] = React.useState('Todas');
  const [view, setView] = React.useState('adults');
  const [selectedMonth, setSelectedMonth] = React.useState(
    Object.keys(dataByMonth).sort().pop() || ''
  );
  
  // Get available months for the dropdown
  const availableMonths = Object.keys(dataByMonth).sort();
  
  // Filter data for the selected month
  const monthlyData = dataByMonth[selectedMonth] || [];
  
  // Get the selected week (default to the most recent week)
  const [selectedWeek, setSelectedWeek] = React.useState(
    monthlyData.length > 0 ? monthlyData[monthlyData.length - 1].fullDate : ''
  );
  
  // Update selected week when month changes
  React.useEffect(() => {
    if (monthlyData.length > 0) {
      setSelectedWeek(monthlyData[monthlyData.length - 1].fullDate);
    } else {
      setSelectedWeek('');
    }
  }, [selectedMonth]);
  
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
  
  const handleMonthChange = (event) => {
    setSelectedMonth(event.target.value);
  };
  
  const handleWeekChange = (event) => {
    setSelectedWeek(event.target.value);
  };

  // Calculate metrics for the selected church and week
  const calculateMetrics = () => {
    if (!selectedWeekData) {
      return {
        adults: 0,
        children: 0,
        total: 0,
        change: 0,
        isIncrease: false
      };
    }
    
    let currentAdults, currentChildren;
    
    if (selectedChurch === 'Todas') {
      // Sum up all churches' data
      currentAdults = churches.reduce((sum, church) => {
        return sum + (selectedWeekData[`${church} Adultos`] || 0);
      }, 0);
      
      currentChildren = churches.reduce((sum, church) => {
        return sum + (selectedWeekData[`${church} Niños`] || 0);
      }, 0);
    } else {
      currentAdults = selectedWeekData[`${selectedChurch} Adultos`] || 0;
      currentChildren = selectedWeekData[`${selectedChurch} Niños`] || 0;
    }
    
    const totalCurrent = currentAdults + currentChildren;
    
    // Find previous week data for comparison
    const currentIndex = monthlyData.findIndex(week => week.fullDate === selectedWeek);
    const previousWeekData = currentIndex > 0 ? monthlyData[currentIndex - 1] : null;
    
    let changePercentage = 0;
    if (previousWeekData) {
      let previousAdults, previousChildren;
      
      if (selectedChurch === 'Todas') {
        previousAdults = churches.reduce((sum, church) => {
          return sum + (previousWeekData[`${church} Adultos`] || 0);
        }, 0);
        
        previousChildren = churches.reduce((sum, church) => {
          return sum + (previousWeekData[`${church} Niños`] || 0);
        }, 0);
      } else {
        previousAdults = previousWeekData[`${selectedChurch} Adultos`] || 0;
        previousChildren = previousWeekData[`${selectedChurch} Niños`] || 0;
      }
      
      const totalPrevious = previousAdults + previousChildren;
      
      if (totalPrevious > 0) {
        changePercentage = ((totalCurrent - totalPrevious) / totalPrevious) * 100;
      }
    }
    
    return {
      adults: currentAdults,
      children: currentChildren,
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
            const date = new Date(tooltipItems[0].label);
            return format(date, 'PPP', { locale: es });
          },
          label: function(context) {
            const weekData = monthlyData[context.dataIndex];
            if (!weekData) return [];
            
            let preacher, adults, children;
            
            if (selectedChurch === 'Todas') {
              preacher = 'Varios predicadores';
              adults = weekData[`${churches[0]} Adultos`] || 0;
              children = weekData[`${churches[0]} Niños`] || 0;
            } else {
              preacher = weekData[`${selectedChurch} Predicador`] || 'Sin predicador';
              adults = weekData[`${selectedChurch} Adultos`] || 0;
              children = weekData[`${selectedChurch} Niños`] || 0;
            }
            
            return [
              `Predicador: ${preacher}`,
              `Adultos: ${adults}`,
              `Niños: ${children}`
            ];
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

  if (view === 'adults' || view === 'both') {
    chartDataConfig.datasets.push({
      label: 'Adultos',
      data: monthlyData.map(week => {
        if (selectedChurch === 'Todas') {
          return churches.reduce((sum, church) => {
            return sum + (week[`${church} Adultos`] || 0);
          }, 0);
        } else {
          return week[`${selectedChurch} Adultos`] || 0;
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
    });
  }
  
  if (view === 'children' || view === 'both') {
    chartDataConfig.datasets.push({
      label: 'Niños',
      data: monthlyData.map(week => {
        if (selectedChurch === 'Todas') {
          return churches.reduce((sum, church) => {
            return sum + (week[`${church} Niños`] || 0);
          }, 0);
        } else {
          return week[`${selectedChurch} Niños`] || 0;
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
    });
  }

  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
            <Typography variant="h5" fontWeight="bold">
              Resumen 
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
        <Grid item xs={12} md={4}>
          <Card elevation={2}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total de Asistentes
                  </Typography>
                  <Typography variant="h4" component="div">
                    {metrics.total}
                  </Typography>
                  <Box display="flex" alignItems="center" mt={1} flexWrap="wrap">
                    {metrics.change !== 0 && (
                      <>
                        {metrics.isIncrease ? (
                          <TrendingUp sx={{ color: 'success.main', mr: 0.5 }} />
                        ) : (
                          <TrendingDown sx={{ color: 'error.main', mr: 0.5 }} />
                        )}
                        <Typography 
                          variant="body2" 
                          color={metrics.isIncrease ? 'success.main' : 'error.main'}
                          fontWeight="medium"
                        >
                          {Math.abs(metrics.change)}% {metrics.isIncrease ? 'aumento' : 'disminución'}
                        </Typography>
                        <Typography variant="body2" color="textSecondary" ml={1}>
                          vs domingo anterior
                        </Typography>
                      </>
                    )}
                    {metrics.change === 0 && (
                      <Typography variant="body2" color="textSecondary">
                        Sin datos previos para comparar
                      </Typography>
                    )}
                  </Box>
                </Box>
                <People sx={{ fontSize: 40, color: 'primary.main', opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card elevation={2}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Adultos
                  </Typography>
                  <Typography variant="h4" component="div">
                    {metrics.adults}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" mt={1}>
                    {metrics.total > 0 ? `${Math.round((metrics.adults / metrics.total) * 100)}% del total` : 'Sin datos'}
                  </Typography>
                </Box>
                <People sx={{ fontSize: 40, color: 'secondary.main', opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card elevation={2}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Niños
                  </Typography>
                  <Typography variant="h4" component="div">
                    {metrics.children}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" mt={1}>
                    {metrics.total > 0 ? `${Math.round((metrics.children / metrics.total) * 100)}% del total` : 'Sin datos'}
                  </Typography>
                </Box>
                <People sx={{ fontSize: 40, color: 'warning.main', opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Chart */}
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
                  <ToggleButton value="adults">Adultos</ToggleButton>
                  <ToggleButton value="children">Niños</ToggleButton>
                  <ToggleButton value="both">Ambos</ToggleButton>
                </ToggleButtonGroup>
              </Box>
              
              <Box sx={{ height: 400 }}>
                {monthlyData.length > 0 ? (
                  <Line 
                    data={chartDataConfig} 
                    options={chartOptions} 
                  />
                ) : (
                  <Box display="flex" justifyContent="center" alignItems="center" height="100%" color="text.secondary">
                    No hay datos disponibles para este mes
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Asistencia;
