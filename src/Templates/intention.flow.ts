import { createFlowRouting } from "@builderbot-plugins/langchain";
import { EVENTS } from "@builderbot/bot";
import {manicureflow} from "./flows/manicureflow"
import {pestañasflow} from "./flows/pestañas.flow"
import {maquillajeflow} from "./flows/maquillaje.flow"
import {coloracionflow} from "./flows/coloracion.flow"
import {cortecabelloflow} from "./flows/corte.cabello.flow"
import {facialflow} from "./flows/facial.flow"
import {menuFlow2 } from "./flows/menu.flow2.js";
import { faqFlow } from "../Templates/faqflow";
import { config } from "../config";
import path from "path";
import fs from "fs";

const Prompt_DETECTED = path.join(
  process.cwd(),
  "public/assets/prompts",
  "prompt_Detection.txt"
);

const promptDetected = fs.readFileSync(Prompt_DETECTED, "utf8");

export const DetectIntention = createFlowRouting
  .setKeyword(EVENTS.ACTION)
  .setIntentions({
    intentions: ["MANICURE", "MAQUILLAJE","PESTAÑAS","COLORACION","CORTECABLLO","FACIAL", "FAQ", "CANCELAR", "NO_DETECTED"],
    description: promptDetected,
  })
  .setAIModel({
    modelName: "openai" as any,
    args: {
      modelName: config.Model,
      apikey: config.ApiKey,
    },
  })
  .create({
    afterEnd(flow) {
      return flow.addAction(async (ctx, { state, endFlow, gotoFlow }) => {
        try {
          console.log("INTENCION DETECT ", await state.get("intention"));

          if ((await state.get("intention")) === "NO_DETECTED") {
            return gotoFlow(faqFlow);
          }

          if ((await state.get("intention")) === "MANICURE") {
            return gotoFlow(manicureflow);
          }

          if ((await state.get("intention")) === "MAQUILLAJE") {
            return gotoFlow(maquillajeflow);
          }

          if ((await state.get("intention")) === "PESTAÑAS") {
            return gotoFlow(pestañasflow);
          }

          if ((await state.get("intention")) === "COLORACION") {
            return gotoFlow(coloracionflow);
          }

          if ((await state.get("intention")) === "CORTECABLLO") {
            return gotoFlow(cortecabelloflow);
          }

          if ((await state.get("intention")) === "FACIAL") {
            return gotoFlow(facialflow);
          }

          if ((await state.get("intention")) === "CANCELAR") {
            return gotoFlow(menuFlow2);
          }

          if ((await state.get("intention")) === "FAQ") {
            return gotoFlow(faqFlow);
          }
        } catch (error) {
          console.error("Error en DetectIntention: ", error);
        }
      });
    },
  });
