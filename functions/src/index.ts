
import { genkit, z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

const ai = genkit({
  plugins: [
    googleAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY }),
  ],
});

export const stoneSurfaceFlow = ai.defineFlow(
  {
    name: 'stoneSurfaceFlow',
    inputSchema: z.object({
      userImageBase64: z.string(),
      materialType: z.enum(['Quartz', 'Granite', 'Dekton']),
      finish: z.string(),
    }),
    outputSchema: z.string(),
  },
  async (input) => {
    const response = await ai.generate({
      model: 'gemini-2.0-flash',
      system: `
        You are the Lead Visualizer for LJ Stone Surfaces LTD. 
        Your task is to identify markers in the user\'s image and replace those specific surfaces with the chosen ${input.materialType}.
        
        REFERENCE OUR WORK QUALITY:
        - Maintain the exact perspective and lighting seen in our portfolio.
        - Ensure the ${input.finish} finish reflects light realistically.
      `,
      prompt: [
        { text: "Reference 1 (Quartz Kitchen):" },
        { media: { url: 'https://i.postimg.cc/R6K2HKqg/Whats-App-Image-2026-01-01-at-23-40-43.jpg', contentType: 'image/jpeg' } },

        { text: "Reference 2 (Granite Island):" },
        { media: { url: 'https://i.postimg.cc/34mzvmWc/Whats-App-Image-2026-01-01-at-23-40-43-2.jpg', contentType: 'image/jpeg' } },

        { text: "Reference 3 (Dekton Feature):" },
        { media: { url: 'https://i.postimg.cc/7J4dMh2N/Whats-App-Image-2026-01-01-at-23-40-44.jpg', contentType: 'image/jpeg' } },

        { text: "USER REQUEST: Apply the stone to the marked areas in this image:" },
        { media: { url: input.userImageBase64, contentType: 'image/jpeg' } },
      ],
    });

    return response.text;
  }
);
