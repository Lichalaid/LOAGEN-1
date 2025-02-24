import { addKeyword, EVENTS } from "@builderbot/bot";
import { deleteEvent } from "../../services/scripts/calendar.js";
import { welcomeFlow } from "../../Templates/WelcomeFlow.js";
import { deleteFromSheet, readSheet } from "../../services/sheetsService.js";

async function findAppointmentsByPhone(userNumber) {
    const range = "AGENDA1!A2:C";
    const rows = await readSheet(range);
    if (!rows || rows.length === 0) return [];

    const now = new Date(); // Fecha y hora actual

    return rows
        .filter(row => {
            const fechaCita = new Date(row[2]);
            return row[1] === userNumber && fechaCita > now; // Solo citas futuras
        })
        .map(row => ({ eventId: row[0], fecha: row[2] }));
}


const formCancelFlow = addKeyword("cancelar cita")
    .addAction(async (ctx, ctxFn) => {
        const userNumber = ctx.from;
        const results = await findAppointmentsByPhone(userNumber);

        if (results.length > 0) {
            await ctxFn.state.update({ citas: results });

            let mensaje = "Estas son tus citas programadas:\n";
            results.forEach((row, index) => {
                const fechaHora = new Date(row.fecha).toLocaleString("es-ES", {
                    weekday: "long", year: "numeric", month: "long", day: "numeric",
                    hour: "2-digit", minute: "2-digit", hour12: true
                });
                mensaje += `➡️ ${index + 1}. ${fechaHora}\n`;
            });
            mensaje += "\nPor favor, responde con el número de la cita que deseas cancelar.";

            await ctxFn.flowDynamic([{ body: mensaje }]);
        } else {
            await ctxFn.flowDynamic([{ body: "No tienes citas programadas." }]);
            await ctxFn.gotoFlow(welcomeFlow);
        }
    })
    .addAnswer("Por favor, ingresa el número de la cita que deseas cancelar:", { capture: true }, async (ctx, ctxFn) => {
        const userInput = parseInt(ctx.body);
        const userState = await ctxFn.state.getMyState();
        const citas = userState.citas;

        if (!citas) {
            await ctxFn.flowDynamic([{ body: "Parece que no tienes citas disponibles para cancelar. Intenta de nuevo." }]);
            return;
        }

        if (!isNaN(userInput) && userInput > 0 && userInput <= citas.length) {
            const citaSeleccionada = citas[userInput - 1];
            const eventId = citaSeleccionada.eventId;

            try {
                await deleteEvent(eventId);
                await deleteFromSheet(eventId);
                await ctxFn.flowDynamic([{ body: "La cita seleccionada ha sido cancelada correctamente." }]);
                await ctxFn.state.update({ citas: null });
            } catch (error) {
                await ctxFn.flowDynamic([{ body: "Hubo un problema al cancelar tu cita. Intenta nuevamente más tarde." }]);
            }
        } else {
            await ctxFn.flowDynamic([{ body: "Por favor, selecciona un número válido." }]);
        }
    });

export { formCancelFlow };
