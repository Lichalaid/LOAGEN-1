import { createFlow } from "@builderbot/bot";
import { DetectIntention } from ".//intention.flow";
import {welcomeFlow} from "./WelcomeFlow";
import {menuFlow2 } from "./flows/menu.flow2.js";
import {manicureflow,cita} from "./flows/manicureflow"
import {pestañasflow,cita2} from "./flows/pestañas.flow"
import {maquillajeflow,cita3} from "./flows/maquillaje.flow"
import {coloracionflow,cita4} from "./flows/coloracion.flow"
import {cortecabelloflow,cita5} from "./flows/corte.cabello.flow"
import {facialflow,cita6} from "./flows/facial.flow"
import { faqFlow } from "./faqflow";
import {formCancelFlow}  from"./flows/form.cancel.flow.js";
import {formCancelFlow2} from"./flows/form.cancel.flow2.js"



export default createFlow([
  DetectIntention,
  welcomeFlow,
  menuFlow2,
  faqFlow,
  manicureflow,
  cita,
  pestañasflow,
  cita2,
  maquillajeflow,
  cita3,
  coloracionflow,
  cita4,
  cortecabelloflow,
  cita5,
  facialflow,
  cita6,
  formCancelFlow,
  formCancelFlow2,
  
  ]);
