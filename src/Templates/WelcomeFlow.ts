import { addKeyword, EVENTS } from "@builderbot/bot";
import { DetectIntention } from "./intention.flow";

const welcomeFlow = addKeyword([EVENTS.WELCOME]).addAction(async (ctx, ctxFn) => {
    return ctxFn.gotoFlow(DetectIntention);
});

export { welcomeFlow };

