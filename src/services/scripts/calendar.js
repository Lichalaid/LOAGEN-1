import { google } from 'googleapis';
import {appendToSheet} from "../sheetsService"
import moment from 'moment-timezone'; 
import dotenv from 'dotenv';

dotenv.config();

const auth = new google.auth.GoogleAuth({
    credentials: {
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.GOOGLE_CLIENT_EMAIL
    },
    scopes: ['https://www.googleapis.com/auth/calendar'] //Alcance para la API de Google Calendar.
});

const calendar = google.calendar({ version: "v3" });

//Constantes configurables
const calendarID = 'e226ea3e74debe53f6a1a5945234b36b20054f162f93109c495a9b45189c8125@group.calendar.google.com';
const timeZone = 'America/Montevideo';

const rangeLimit = {
    days: {
        1: { startHour: 12, endHour: 16 },  // Lunes
        2: { startHour: 10, endHour: 14 },  // Martes
        3: { startHour: 12, endHour: 16 },  // Miércoles
        4: { startHour: 10, endHour: 14 },  // Jueves
        5: { startHour: 10, endHour: 15 }, // Viernes
        6: { startHour: 13, endHour: 17 }, // Sábado
    }
};


const standardDuration = 2.0; //Duracion por defecto de las citas 
const dateLimit = 30; //Maximo de dias a taer la lista de Next Events

/**
 * Crea un evento en el calendario
 * @param {string} eventName - Nombre del Evento
 * @param {string} description -Descripcion del evento
 * @param {string} date - Fecha y hora de inicio del evento en formato ISO
 * @param {string} phoneNumber - Número de teléfono del usuario
 * @param {number} [duration=standardDuration] - Duracion del evento en horas. 
 * @returns {string} - URL de la invitacion al evento.
 */
async function createEvent(eventName, description, date, phoneNumber, duration = standardDuration) {
    try {
        //Autenticacion
        const authClient = await auth.getClient();
        google.options({ auth: authClient });        

        //Fecha y hora de inicio del evento
        const startDateTime = new Date(date);
        // Calcular minutos totales para la duración del evento
        const durationMinutes = duration * 60;
        //Fecha y hora de fin del evento
        const endDateTime = new Date(startDateTime);
        endDateTime.setMinutes(startDateTime.getMinutes() + durationMinutes);


        const event = {
            summary: eventName,
            description: description,
            start: {
                dateTime: startDateTime.toISOString(),
                timeZone: timeZone,
            },
            end: {
                dateTime: endDateTime.toISOString(),
                timeZone: timeZone,
            },
            colorId: '2'//El ID del color verde en Google Calendar es '11'
        };

        const response = await calendar.events.insert({
            calendarId: calendarID,
            resource: event,
        });

        //Generar la URL de la Invitacion
        const eventId = response.data.id;
        
        //const fechaHora = endDateTime.toISOString();
        // Convertir a la zona horaria deseada
        const localDateTime = moment(date).tz('America/Montevideo').format('YYYY-MM-DD HH:mm:ss');
        // Insertar en Google Sheets
        await appendToSheet([[eventId, phoneNumber, localDateTime]]);

        console.log('Evento Creado con éxito:', eventId);
        return eventId;
    } catch (err) {
        console.error('Hubo un error al crear el evento en Google Calendar', err);
        throw err;
    }
}

/**
 * Lista los slots disponibles entre las fechas dadas.
 * @param {Date} [startDate=new Date()] - Fecha de Inicio para buscar slots disponibles.
 * @param {Date} [endDate] - Fecha de fin par abuscar slots disponibles. Default es el maximo definido
 * @returns {Array} - Lista de slots disponibles
 */
async function listAvailableSlots(startDate = new Date(), endDate) {
    try {
        const authClient = await auth.getClient();
        google.options({ auth: authClient });

        //Definir fecha de fin si no se proporciona
        if (!endDate) {
            endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + dateLimit);
        }

        const response = await calendar.events.list({
            calendarId: calendarID,
            timeMin: startDate.toISOString(),
            timeMax: endDate.toISOString(),
            timeZone: timeZone,
            singleEvents: true,
            orderBy: 'startTime'
        });

        const events = response.data.items;
        const slots = [];
        let currentDate = new Date(startDate);

        //Generar slots disponibles basados en rangeLimit
        while (currentDate < endDate) {
            const dayOfWeek = currentDate.getDay();
                if (dayOfWeek in rangeLimit.days) {
                    const { startHour, endHour } = rangeLimit.days[dayOfWeek];
                    for (let hour = startHour; hour < endHour; hour++) {
                    for (let minute = 0; minute < 60; minute += standardDuration * 60) {
                        const slotStart = new Date(currentDate);
                        slotStart.setHours(hour, minute, 0, 0);
                        const slotEnd = new Date(slotStart);
                        slotEnd.setMinutes(slotStart.getMinutes() + (standardDuration * 60));

                    const isBusy = events.some(event => {
                        const eventStart = new Date(event.start.dateTime || event.start.date);
                        const eventEnd = new Date(event.end.dateTime || event.end.date);
                        return (slotStart < eventEnd && slotEnd > eventStart);
                    });

                    if (!isBusy) {
                        slots.push({ start: slotStart, end: slotEnd });
                    }
                }
            }
        }
            currentDate.setDate(currentDate.getDate() + 1);
        }

        return slots;
    } catch (err) {
        console.error('Hubo un error al crear el evento en el servicio de Calendar', err);
        throw err;
    }
}



// Función para eliminar un evento en Google Calendar
async function deleteEvent(eventId) {
    try {
        // Autenticación
        const authClient = await auth.getClient();
        google.options({ auth: authClient });

        // Eliminar el evento
        await calendar.events.delete({
            calendarId: calendarID,
            eventId: eventId,
        });

        console.log('Evento eliminado del calendar con éxito:', eventId);
    } catch (err) {
        console.error('Hubo un error al eliminar el evento en Google Calendar:', err);
        throw err;
    }
}





/**
 * Obtiene el proximo slot disponible a partir de la fecha dada
 * @param {string|Date} date - Fecha a partir de la cual buscar el proximo slot disponible
 * @returns {Object|null} - El proximo slot disponible o null si no hay ninguno
 */
async function getNextAvailableSlot(date) {
    try {
        //Verificar si 'date' es un string en formato ISO
        if (typeof date === 'string') {
            //Convertir el string ISO en un objeto Date
            date = new Date(date);
        } else if (!(date instanceof Date) || isNaN(date)) {
            throw new Error('La fecha proporcionada no es valida');
        }

        // Obtener el proximo slot disponible
        const availableSlots = await listAvailableSlots(date);

        //Filtrar slot disponibles que comience despues de la fecha proporcionada
        const filteredSlots = availableSlots.filter(slot => new Date(slot.start) > date);

        //Ordenar los slots por su hora de inicio en orden ascendente
        const sortedSlots = filteredSlots.sort((a, b) => new Date(a.start) - new Date(b.start));

        //tomar el primer slot de la lista resultante, que sera el proximo slot disponible
        return sortedSlots.length > 0 ? sortedSlots[0] : null;
    } catch (err) {
        console.error('Hubo un error al obtener el proximo slot disponible', err);
        throw err;
    }
}

/**
 * Verifica si hay slot disponibles para una fecha dada
 * @param {Date} date - Fecha a verificar
 * @returns {boolean} - Devuelve true si hay slot disponibles dentro del rango permitido
 */
async function isDateAvailable(date) {
    try {
        // Validar que la fecha esté dentro del rango permitido
        const currentDate = new Date();
        const maxDate = new Date(currentDate);
        maxDate.setDate(currentDate.getDate() + dateLimit);

        if (date < currentDate || date > maxDate) {
            return false; // La fecha está fuera del rango permitido
        }

        // Verificar que la fecha caiga en un día permitido
        const dayOfWeek = date.getDay();
        if (!(dayOfWeek in rangeLimit.days)) {
            return false; // El día no está permitido
        }

        // Verificar que la hora esté dentro del rango permitido
        const { startHour, endHour } = rangeLimit.days[dayOfWeek];
        const hour = date.getHours(); // Definir la variable hour correctamente

        if (hour < startHour || hour >= endHour) {
            return false; // La hora no está dentro del rango permitido
        }

        // Obtener todos los slots disponibles desde la fecha actual hasta el límite definido
        const availableSlots = await listAvailableSlots(currentDate);

        // Filtrar slots disponibles basados en la fecha dada
        const slotsOnGivenDate = availableSlots.filter(slot => 
            new Date(slot.start).toDateString() === date.toDateString()
        );

        // Verificar si hay slots disponibles en la fecha dada
        const isSlotAvailable = slotsOnGivenDate.some(slot =>
            new Date(slot.start).getTime() === date.getTime() &&
            new Date(slot.end).getTime() === date.getTime() + standardDuration * 60 * 60 * 1000
        );

        return isSlotAvailable;
    } catch (err) {
        console.error('Hubo un error al verificar disponibilidad de la fecha', err);
        throw err;
    }
}


export { createEvent, isDateAvailable, getNextAvailableSlot, deleteEvent };
