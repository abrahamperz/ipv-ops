import { format, parseISO, startOfWeek, getWeek } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Transforma datos de Airtable al formato esperado por el dashboard de asistencia
 * @param {Array} airtableRecords - Registros obtenidos de Airtable
 * @returns {Object} Datos transformados con estructura compatible
 */
export const transformAirtableData = (airtableRecords) => {
  // Lista de iglesias disponibles
  const churches = ["Patria", "Norte", "Brisas", "Tepeji", "Colima", "Plantios", "Arca", "Camino de Vida"];

  // Agrupar registros por fecha
  const recordsByDate = {};

  airtableRecords.forEach(record => {
    const fields = record.fields;
    let dateStr = fields.Date;
    const church = fields.Campus;

    if (!dateStr || !church) return;

    // Handle MM/DD/YYYY format by converting to YYYY-MM-DD
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
      dateStr = dateStr.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$3-$1-$2');
    }

    const date = parseISO(dateStr);

    if (!recordsByDate[dateStr]) {
      recordsByDate[dateStr] = {};
    }

    // Extraer campos individuales
    const hombres = parseInt(fields.Hombres || 0);
    const mujeres = parseInt(fields.Mujeres || 0);
    const ninos = parseInt(fields.Niños || 0);
    const recienNacidos = parseInt(fields['Recien nacidos'] || 0);
    const totalAsistencia = parseInt(fields.Asistencia || 0);

    recordsByDate[dateStr][church] = {
      hombres,
      mujeres,
      ninos,
      recienNacidos,
      predicador: fields.Predicador || 'Sin predicador',
      total: totalAsistencia
    };
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
        weekData[`${church} Hombres`] = churchData.hombres;
        weekData[`${church} Mujeres`] = churchData.mujeres;
        weekData[`${church} Niños`] = churchData.ninos;
        weekData[`${church} Recien nacidos`] = churchData.recienNacidos;
        weekData[`${church} Asistencia`] = churchData.total;
        weekData[`${church} Predicador`] = churchData.predicador;
        // Mantener Adultos como suma para compatibilidad
        weekData[`${church} Adultos`] = churchData.hombres + churchData.mujeres;
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
 * @returns {Promise<Object>} Datos transformados
 */
export const fetchAttendanceData = async (year, month, fetchAll = false) => {
  try {
    let url;
    if (fetchAll) {
      url = `http://localhost:8001/api/airtable/all`;
    } else {
      url = `http://localhost:8001/api/airtable/?year=${year}&month=${month}`;
    }

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Error en la API: ${response.status}`);
    }

    const data = await response.json();
    return transformAirtableData(data);
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