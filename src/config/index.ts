import "dotenv/config";

export const config = {
    PORT: process.env.PORT ?? 3009,
        // AI
    Model: process.env.Model,
    ApiKey: process.env.ApiKey,
    
  
};
