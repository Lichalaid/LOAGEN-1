import { addKeyword, EVENTS } from "@builderbot/bot";
import { formCancelFlow } from "../flows/form.cancel.flow.js";
import {formCancelFlow2} from "../flows/form.cancel.flow2.js";

import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// Definir __dirname en ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar el contenido del archivo menu.cancelar.txt
const pathMenu = path.join(__dirname, "../mensajes", "menu.cancelar.txt");
const menuText = fs.readFileSync(pathMenu, "utf8");

const flow1 = addKeyword("1") // Opción 1 del menú    
    .addAction(async (ctx, ctxFn) => {
        await ctxFn.gotoFlow(formCancelFlow);
    });

const flow2 = addKeyword("2") // Opción 2 del menú
    .addAction(async (ctx, ctxFn) => {
        await ctxFn.gotoFlow(formCancelFlow2);
    });

const menuFlow2 = addKeyword(EVENTS.ACTION)
    .addAnswer(
        menuText,
        { capture: true }, // Si quiere abrir el menú
        async (ctx, ctxFn) => {
            const opciones = ["1", "2"];
            if (!opciones.includes(ctx.body)) {
                return ctxFn.fallBack("No elegiste una opción correcta. Elige 1 o 2.");
            }
        },
        [flow1, flow2]
    );

export { menuFlow2 };
