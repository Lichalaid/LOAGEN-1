import AiServices from "../../services/aiServices";
import { config } from "~/config";

const aiServiceInstance = new AiServices(config.ApiKey);
import { DateTime }  from'luxon'

/**
 * Convierte una fecha en formato ISO a un texto legible
 * @param {string} iso - Fecha en formato ISO
 * @returns {string} - Fecha en formato legible
 */
function iso2text(iso) {
    try {
        //Convertir la fecha a DateTime de Luxon
        const dateTIme = DateTime.fromISO(iso, { zone: 'utc' }).setZone('America/Bogota');

        //Formatear la fecha
        const formattedDate = dateTIme.toLocaleString({
            weekday: 'long',
            day: '2-digit',
            month: 'long',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
            timeZoneName: 'short'
        });

        return formattedDate;
    } catch (error) {
        console.error('Error al convertir la fecha', error);
        return 'Formato de fecha no válido';
    }
}


/**
 * Convierte una fecha en texto a formato ISO utilizando ChatGPT.
 * @param {string} text - Fecha en formato texto
 * @returns {Promise<string>} - Fecha en formato ISO
 */
async function text2iso(text) {
    const currentDate = new Date();
    const prompt = "La fecha de hoy es: " + currentDate + `Te voy a dar un texto.
        Necesito que de ese texto extraigas la fecha y la hora del texto que te voy a dar y respondas con la misma en formato ISO.
        Me tenes que responder EXCLUSIVAMENTE con esa fecha y horarios en formato ISO, usando el horario 10:00 en caso de que no este especificada la hora.
        Por ejemplo, el texto puede ser algo como "el jueves 30 de mayo a las 12hs". En ese caso tu respuesta tiene que ser 2024-06-30T12:00:00.000.
        Por ejemplo, el texto puede ser algo como "Este viernes 31". En ese caso tu respuesta tiene que ser 2024-06-31T10:00:00.000.
        Si el texto es algo como: Mañana 10am, sumarle un dia a la fecha actual y dar eso como resultado.
        Si el texto no tiene sentido, responde 'false' `;
    const messages = [{ role: "user", content: `${text}` }];

    const response = await aiServiceInstance.chat(prompt, messages);

    return response.trim(); //Asegurar que no haya espacios en blanco adicionales
}




export { text2iso, iso2text };
