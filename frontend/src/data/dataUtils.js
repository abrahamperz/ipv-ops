import { format, parseISO, startOfWeek, getWeek } from 'date-fns';
import { es } from 'date-fns/locale';

// API Base URL from environment (React automatically loads .env files)
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://ipv-ops.pro';

/**
 * Transforma datos de Airtable al formato esperado por el dashboard de asistencia
 * @param {Array} airtableRecords - Registros obtenidos de Airtable
 * @param {string} tipoFilter - Filtro por tipo ('Domingo', 'Santa Cena', o null para todos)
 * @returns {Object} Datos transformados con estructura compatible
 */
export const transformAirtableData = (airtableRecords, tipoFilter = null) => {
  // Lista de iglesias disponibles
  const churches = ["IPV Brisas", "IPV Colima", "IPV Norte", "IPV Patria", "IPV Plantios", "IPV Tepeji", "IPV Tepetate", "Misión Playa del Carmen", "Misión Puerto Vallarta", "Misión Tapachula"];

  // Agrupar registros por fecha
  const recordsByDate = {};

  airtableRecords.forEach(record => {
    const fields = record.fields;
    let dateStr = fields.Fecha;
    const church = fields.Campus;
    const tipo = fields.Tipo;

    if (!dateStr || !church) return;

    // Filter by tipo if specified
    if (tipoFilter && tipo !== tipoFilter) return;

    // Las fechas ya vienen en formato YYYY-MM-DD desde la API

    const date = parseISO(dateStr);

    if (!recordsByDate[dateStr]) {
      recordsByDate[dateStr] = {};
    }

    // Extraer campos individuales
    const adultos = parseInt(fields.Adultos || 0);
    const jovenes = parseInt(fields.Jovenes || 0);
    const ninos = parseInt(fields.Niños || 0);
    const recienNacidos = parseInt(fields['Recien nacidos'] || 0);
    const nuevos = parseInt(fields.Nuevos || 0);
    const voluntarios = parseInt(fields.Voluntarios || 0);

    // Si ya existe un registro para esta fecha e iglesia, sumar los valores
    if (recordsByDate[dateStr][church]) {
      recordsByDate[dateStr][church].adultos += adultos;
      recordsByDate[dateStr][church].jovenes += jovenes;
      recordsByDate[dateStr][church].ninos += ninos;
      recordsByDate[dateStr][church].recienNacidos += recienNacidos;
      recordsByDate[dateStr][church].nuevos += nuevos;
      recordsByDate[dateStr][church].voluntarios += voluntarios;
      recordsByDate[dateStr][church].total += (adultos + jovenes + ninos + recienNacidos + nuevos + voluntarios);
      // Mantener el último predicador
      recordsByDate[dateStr][church].predicador = fields.Predicador || recordsByDate[dateStr][church].predicador;
    } else {
      // Crear nuevo registro
      const totalAsistencia = adultos + jovenes + ninos + recienNacidos + nuevos + voluntarios;
      recordsByDate[dateStr][church] = {
        adultos,
        jovenes,
        ninos,
        recienNacidos,
        nuevos,
        voluntarios,
        predicador: fields.Predicador || 'Sin predicador',
        total: totalAsistencia
      };
    }
  });

  // Convertir a formato de dashboard
  const attendanceData = [];

  Object.keys(recordsByDate).sort().forEach(dateStr => {
    const originalDate = parseISO(dateStr);
    // Use the actual date from the data
    const date = new Date(originalDate.getFullYear(), originalDate.getMonth(), originalDate.getDate());
    const weekStart = startOfWeek(date, { weekStartsOn: 0 });
    const weekNumber = getWeek(date, { weekStartsOn: 0 });

    const weekData = {
      date: date.toISOString().split('T')[0], // Format as YYYY-MM-DD
      name: `Semana ${weekNumber} (${format(date, 'd MMM', { locale: es })})`,
      monthName: format(date, 'MMMM yyyy', { locale: es }), // Now uses actual month and year
      weekNumber,
      fullDate: date.toISOString()
    };

    // Agregar datos por iglesia
    churches.forEach(church => {
      const churchData = recordsByDate[dateStr][church];
      if (churchData) {
        weekData[`${church} Adultos`] = churchData.adultos;
        weekData[`${church} Jovenes`] = churchData.jovenes;
        weekData[`${church} Niños`] = churchData.ninos;
        weekData[`${church} Recien nacidos`] = churchData.recienNacidos;
        weekData[`${church} Nuevos`] = churchData.nuevos;
        weekData[`${church} Voluntarios`] = churchData.voluntarios;
        weekData[`${church} Asistencia`] = churchData.total;
        weekData[`${church} Predicador`] = churchData.predicador;
      }
      // Si no hay datos para esta iglesia, dejar undefined (no poner 0)
    });

    attendanceData.push(weekData);
  });

  return {
    churches,
    attendanceData
  };
};

/**
 * Obtiene datos de asistencia desde la API
 * @param {number} year - Año para filtrar (opcional)
 * @param {number} month - Mes para filtrar (opcional, 1-12)
 * @param {boolean} fetchAll - Si es true, obtiene todos los datos disponibles
 * @param {string} tipoFilter - Filtro por tipo ('Domingo', 'Santa Cena', o null para todos)
 * @returns {Promise<Object>} Datos transformados
 */
export const fetchAttendanceData = async (year, month, fetchAll = false, tipoFilter = null) => {
  try {
    let url;
    if (fetchAll) {
      url = `${API_BASE_URL}/api/airtable/all`;
    } else {
      url = `${API_BASE_URL}/api/airtable/?year=${year}&month=${month}`;
    }

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Error en la API: ${response.status}`);
    }

    const data = await response.json();
    return transformAirtableData(data, tipoFilter);
  } catch (error) {
    console.error('Error fetching attendance data:', error);
    throw error;
  }
};

/**
 * Agrupa datos por mes
 * @param {Array} data - Datos de asistencia
 * @returns {Object} Datos agrupados por mes
 */
export const groupDataByMonth = (data) => {
  return data.reduce((acc, item) => {
    const monthYear = item.monthName;
    if (!acc[monthYear]) {
      acc[monthYear] = [];
    }
    acc[monthYear].push(item);
    return acc;
  }, {});
};