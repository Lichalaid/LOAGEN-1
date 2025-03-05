import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

const auth = new google.auth.GoogleAuth({
    credentials: {
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.GOOGLE_CLIENT_EMAIL
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
});

const spreadsheetId = process.env.SPREADSHEET_ID;

// Función para escribir datos en Google Sheets
async function writeToSheet(values: any[][], range: string) {
    const sheets = google.sheets({ version: 'v4', auth });
    try {
        const res = await sheets.spreadsheets.values.update({
            spreadsheetId,
            range,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values }
        });
        return res;
    } catch (error) {
        console.error('Error en writeToSheet:', error);
    }
}

// Función para leer datos de Google Sheets
async function readSheet(range: string) {
    const sheets = google.sheets({ version: 'v4', auth });
    try {
        const response = await sheets.spreadsheets.values.get({ spreadsheetId, range });
        return response.data.values || [];
    } catch (error) {
        console.error('Error en readSheet:', error);
        return [];
    }
}

// Función para agregar datos a Google Sheets
async function appendToSheet(values: any[][], range: string = 'AGENDA1!A2') {
    const sheets = google.sheets({ version: 'v4', auth });
    try {
        const res = await sheets.spreadsheets.values.append({
            spreadsheetId,
            range,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values }
        });
        return res;
    } catch (error) {
        console.error('Error en appendToSheet:', error);
    }
}

// Segunda función para agregar datos a otra hoja
async function appendToSheet2(values: any[][], range: string = 'AGENDA2!A2') {
    return appendToSheet(values, range);
}

// Función para obtener datos filtrados
async function getFilteredData(columnName: string, valueToSearch: string) {
    const sheets = google.sheets({ version: 'v4', auth });
    const columnIndex = columnName.toUpperCase().charCodeAt(0) - 65;

    try {
        const response = await sheets.spreadsheets.values.get({ spreadsheetId, range: 'A2:Z' });
        const rows = response.data.values || [];
        return rows.filter(row => row[columnIndex] === valueToSearch);
    } catch (error) {
        console.error('Error en getFilteredData:', error);
        return [];
    }
}

// Función para eliminar una fila de Google Sheets
async function deleteFromSheet(eventId: string, sheetName: string = 'AGENDA1') {
    const sheets = google.sheets({ version: 'v4', auth });
    try {
        const range = `${sheetName}!A2:Z`;
        const response = await sheets.spreadsheets.values.get({ spreadsheetId, range });
        const rows = response.data.values || [];

        const rowIndex = rows.findIndex(row => row[0] === eventId);
        if (rowIndex === -1) {
            console.log(`Evento con ID ${eventId} no encontrado.`);
            return;
        }

        await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: {
                requests: [{
                    deleteDimension: {
                        range: {
                            sheetId: 0, // Ajustar según el ID de la hoja
                            dimension: "ROWS",
                            startIndex: rowIndex + 1,
                            endIndex: rowIndex + 2
                        }
                    }
                }]
            }
        });

        console.log(`Evento con ID ${eventId} eliminado del sheets.`);
    } catch (error) {
        console.error('Error en deleteFromSheet:', error);
    }
}

async function deleteFromSheet2(eventId: string, sheetName: string = 'AGENDA2') {
    const sheets = google.sheets({ version: 'v4', auth });
    try {
        const range = `${sheetName}!A2:Z`;
        const response = await sheets.spreadsheets.values.get({ spreadsheetId, range });
        const rows = response.data.values || [];

        const rowIndex = rows.findIndex(row => row[0] === eventId);
        if (rowIndex === -1) {
            console.log(`Evento con ID ${eventId} no encontrado.`);
            return;
        }

        await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: {
                requests: [{
                    deleteDimension: {
                        range: {
                            sheetId: 123729805, // Ajustar según el ID de la hoja
                            dimension: "ROWS",
                            startIndex: rowIndex + 1,
                            endIndex: rowIndex + 2
                        }
                    }
                }]
            }
        });

        console.log(`Evento con ID ${eventId} eliminado del sheets.`);
    } catch (error) {
        console.error('Error en deleteFromSheet:', error);
    }
}

export { writeToSheet, readSheet, appendToSheet, appendToSheet2, getFilteredData, deleteFromSheet, deleteFromSheet2 };
