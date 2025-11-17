
import { GoogleGenAI, Type } from "@google/genai";
import { blobToBase64 } from "../utils/fileUtils";

const FRAME_COUNT = 16; // Number of frames to extract from the video

export interface AnalysisResult {
  transcricaoVisual: string;
  assuntoPrincipal: string;
  resumo: string;
  topicosChave: string[];
}

const extractFramesFromVideo = (videoFile: File): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const frames: string[] = [];

    if (!ctx) {
      return reject(new Error('Could not create canvas context.'));
    }

    video.preload = 'metadata';
    video.src = URL.createObjectURL(videoFile);
    video.muted = true;

    const revokeUrl = () => URL.revokeObjectURL(video.src);

    video.onloadeddata = async () => {
      if (video.duration === Infinity || video.duration === 0) {
        revokeUrl();
        return reject(new Error("Cannot process video stream or invalid duration. Please use a finite length video file."));
      }
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const duration = video.duration;
      const interval = duration / FRAME_COUNT;

      let framesExtracted = 0;

      const seekNext = () => {
        if (framesExtracted >= FRAME_COUNT) {
          revokeUrl();
          resolve(frames);
          return;
        }

        video.currentTime = framesExtracted * interval;
      };

      video.onseeked = async () => {
        ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        canvas.toBlob(async (blob) => {
          if (blob) {
            try {
              const base64 = await blobToBase64(blob);
              frames.push(base64);
            } catch (error) {
               // Ignore error for a single frame and continue
            }
          }
          framesExtracted++;
          seekNext();
        }, 'image/jpeg', 0.8);
      };
      
      // Start the process
      seekNext();
    };

    video.onerror = () => {
      revokeUrl();
      reject(new Error("Error loading video file. It might be corrupt or in an unsupported format."));
    };
  });
};


export const analyzeVideo = async (videoFile: File): Promise<AnalysisResult> => {
  if (!process.env.API_KEY) {
    throw new Error("API key is not configured. Please set the API_KEY environment variable.");
  }
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const frames = await extractFramesFromVideo(videoFile);
  if (frames.length === 0) {
    throw new Error("Could not extract any frames from the video.");
  }

  const imageParts = frames.map(frame => ({
    inlineData: {
      mimeType: 'image/jpeg',
      data: frame.split(',')[1],
    },
  }));

  const prompt = `
    Analise os seguintes frames de um vídeo. Com base nessas imagens, extraia as informações solicitadas.
    Sua resposta DEVE ser um objeto JSON bem-formado que corresponda ao esquema fornecido.
  `;

  const textPart = { text: prompt };

  const result = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: { parts: [textPart, ...imageParts] },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          transcricaoVisual: { 
            type: Type.STRING, 
            description: "Descrição detalhada em parágrafos do que está acontecendo cena por cena. Se houver texto visível, transcreva-o. Se houver pessoas, descreva suas ações e o ambiente." 
          },
          assuntoPrincipal: { 
            type: Type.STRING, 
            description: "O tema central ou o propósito principal do vídeo em uma única frase." 
          },
          resumo: { 
            type: Type.STRING, 
            description: "Um resumo conciso de 2-3 frases do conteúdo geral do vídeo."
          },
          topicosChave: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "Uma lista em marcadores (bullet points) dos principais tópicos, conceitos ou ações mostrados no vídeo."
          },
        },
        required: ["transcricaoVisual", "assuntoPrincipal", "resumo", "topicosChave"]
      },
    },
  });

  try {
    const jsonString = result.text.trim();
    return JSON.parse(jsonString) as AnalysisResult;
  } catch (e) {
    console.error("Failed to parse JSON response:", result.text);
    throw new Error("A resposta da IA não estava no formato JSON esperado. Por favor, tente novamente.");
  }
};
