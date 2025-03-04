import { addKeyword, EVENTS } from "@builderbot/bot";
import { text2iso, iso2text } from "../../services/scripts/utils.js";
import { isDateAvailable, getNextAvailableSlot,createEvent } from "../../services/scripts/calendar.js";
import AiServices from "../../services/aiServices";
import { config } from "~/config";

const aiServiceInstance = new AiServices(config.ApiKey);
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const DEFAULT_PROFESIONAL = "Rudimar";
const DEFAULT_DURATION = 3; // 3 hora
const DEFAULT_SERVICIO = "MICROPIGMENTACION DE LABIOS"
const promptBase = `Eres un asistente virtual diseñado para ayudar a los usuarios a agendar citas mediante una conversación. 
Tu objetivo es únicamente ayudar al usuario a elegir un horario y una fecha para sacar turno. 
Te voy a dar la fecha solicitada por el usuario y la disponibilidad de la misma. 
Esta fecha la tiene que confirmar el usuario.

Si la fecha y hora solicitadas son válidas y la disponibilidad es true, responde con algo como: 
"La fecha solicitada está disponible. El turno sería el Jueves 30 de mayo 2024 a las 2:00 pm."

Si la fecha y hora son inválidas (por ejemplo, en el pasado), responde con: 
"La fecha y hora proporcionadas no son válidas, ya que han pasado. Por favor, elige otra fecha y hora."

Si la disponibilidad es false, ofrece la siguiente fecha disponible, diciendo: 
"La fecha y horario solicitados no están disponibles. Te puedo ofrecer el Jueves 30 de mayo 2024 a las 2:00 pm."

Bajo ninguna circunstancia hagas consultas y mantén el tono natural y amigable.`;

const cortecabelloflow = addKeyword(EVENTS.ACTION)
    .addAction(async (ctx, ctxFn) => {
        await delay(3000);
        await ctxFn.flowDynamic("¿Para qué fecha deseas agendar tu cita?");
    })
    .addAnswer("", { capture: true }, async (ctx, ctxFn) => {
        await delay(3000);
        await ctxFn.flowDynamic("Revisando disponibilidad...");
    })
    .addAction(async (ctx, ctxFn) => {
        await delay(5000);
        const currentDate = new Date();
        const solicitedDate = await text2iso(ctx.body);

        if (solicitedDate.includes("false")) {
            return ctxFn.endFlow("No se pudo deducir la fecha. Vuelve a intentarlo.");
        }

        const startDate = new Date(solicitedDate);
        if (startDate < currentDate) {
            return ctxFn.endFlow("La fecha y hora proporcionadas no son válidas, ya que han pasado. Por favor, elige otra fecha y hora.");
        }

        const dateAvailable = await isDateAvailable(startDate);
        if (!dateAvailable) {
            const nextAvailable = await getNextAvailableSlot(startDate);
            const isoString = nextAvailable.start.toISOString();
            const dateText = await iso2text(isoString);

            const messages = [{ role: "user", content: `${ctx.body}` }];
            const response = await aiServiceInstance.chat(
                `${promptBase}\nHoy es el día: ${currentDate}\nLa fecha solicitada es: ${solicitedDate}\nLa disponibilidad de esa fecha: false.\nEl próximo espacio disponible que tienes que ofrecer es: ${dateText}\nDa la fecha siempre en español.`,
                messages
            );

            await ctxFn.flowDynamic(response);
            await ctxFn.state.update({ date: nextAvailable.start });
        } else {
            const isoString = startDate.toISOString();
            const dateText = await iso2text(isoString);

            const messages = [{ role: "user", content: `${ctx.body}` }];
            const response = await aiServiceInstance.chat(
                `${promptBase}\nHoy es el día: ${currentDate}\nLa fecha solicitada es: ${solicitedDate}\nLa disponibilidad de esa fecha: true.\nConfirmación del cliente: No confirmo.`,
                messages
            );

            await ctxFn.flowDynamic(response);
            await ctxFn.state.update({ date: startDate });
        }
    })
    .addAnswer("Confirmas la fecha propuesta? Responde únicamente con un 'si' o 'no'", { capture: true }, async (ctx, ctxFn) => {
        const userResponse = ctx.body.trim().toLowerCase();

        if (userResponse !== "si") {
            return ctxFn.endFlow("Entendido. Puedes solicitar otra fecha cuando desees.");
        }

        
        return ctxFn.gotoFlow(cita5);
    });

const cita5 = addKeyword(EVENTS.ACTION)
    .addAnswer("Por favor, dime tu nombre completo:", { capture: true }, async (ctx, ctxFn) => {
        const userName = ctx.body.trim();
        await ctxFn.state.update({ userName });

        await delay(3000);
        const userInfo = await ctxFn.state.getMyState();
        const { date } = userInfo;
        const phoneNumber = ctx.from;
        const eventName = `Cita para ${DEFAULT_SERVICIO} con el cliente  ${userName}`;
        const description = `Cliente: ${userName}\nProfesional: ${DEFAULT_PROFESIONAL}\nServicio:${DEFAULT_SERVICIO}\nDuración: ${DEFAULT_DURATION} hora(s)`;

        await createEvent(eventName, description, date, phoneNumber, DEFAULT_DURATION);

        await ctxFn.flowDynamic(`Tu cita ha sido agendada con éxito, ${userName} con el profesional ${DEFAULT_PROFESIONAL} . Recuerda llegar con 15 minutos de anticipación.`);
        await ctxFn.state.clear();
    });

export { cortecabelloflow,cita5 };
