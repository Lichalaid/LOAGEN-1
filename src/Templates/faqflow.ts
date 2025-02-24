import { addKeyword, EVENTS } from "@builderbot/bot";
import aiServices from "~/services/aiServices";
import { config } from "../config";
import path from "path";
import fs from "fs";
import pdf from "pdf-parse";

// Ruta del archivo con el prompt
const pathPrompt = path.join(
  process.cwd(),
  "public/assets/prompts",
  "prompt_OpenAi.txt"
);
const promptBase = fs.readFileSync(pathPrompt, "utf8");

// Función para leer el contenido del archivo PDF
const extractPdfText = (pdfPath) => {
  return new Promise((resolve, reject) => {
    const pdfBuffer = fs.readFileSync(pdfPath);
    pdf(pdfBuffer)
      .then((data) => resolve(data.text))
      .catch(reject);
  });
};

export const faqFlow = addKeyword(EVENTS.ACTION).addAction(
  async (ctx, { endFlow, state }) => {
    try {
      // Ruta del PDF que quieres leer
      const pdfPath = path.join(process.cwd(), "test/data", "05-versions-space.pdf");
      const pdfText = await extractPdfText(pdfPath);

      // Recuperar el historial de las dos últimas interacciones
      const userState = (await state.getMyState()) || {};
      userState.conversations = userState.conversations ?? [];
      const conversations = userState.conversations;

      // Construcción del contexto con historial
      const contextMessages = conversations.flatMap((conv) => [
        { role: "user", content: conv.question },
        { role: "assistant", content: conv.answer },
      ]);

      // Añadir la nueva consulta al contexto
      contextMessages.push({ role: "user", content: ctx.body });

      // Crear la entrada completa para la IA
      const extendedPrompt = `${promptBase}\n\nInformación del PDF:\n${pdfText}\n\nConversación previa:\n${JSON.stringify(contextMessages, null, 2)}\n\nUsuario: ${ctx.body}\nRespuesta:`;

      // Obtener la respuesta de ChatGPT
      const AI = new aiServices(config.ApiKey);
      const response = await AI.chat(extendedPrompt, contextMessages);

      // Actualizar el historial de conversación
      const newConversations = [...conversations, { question: ctx.body, answer: response }];
      if (newConversations.length > 2) {
        newConversations.shift(); // Mantener solo las dos últimas
      }
      await state.update({ conversations: newConversations });

      return endFlow(response);
    } catch (error) {
      console.log("Error en la lectura del PDF o en la llamada GPT", error);
      return endFlow("Por favor, intenta de nuevo.");
    }
  }
);
