import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ScheduleItem, TimeboxPlan, BlockType } from "../types";

const apiKey = process.env.API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey });

const scheduleSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    schedule: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          startTime: { type: Type.STRING, description: "ISO 8601 Date time string (local time, no Z)" },
          endTime: { type: Type.STRING, description: "ISO 8601 Date time string (local time, no Z)" },
          type: { type: Type.STRING, enum: [
            BlockType.FOCUS, 
            BlockType.BREAK, 
            BlockType.ROUTINE, 
            BlockType.SOCIAL, 
            BlockType.ADMIN
          ]},
          description: { type: Type.STRING },
          notes: { type: Type.STRING }
        },
        required: ["title", "startTime", "endTime", "type"]
      }
    },
    summary: { type: Type.STRING, description: "A brief encouraging summary of the plan." },
    feedback: { type: Type.STRING, description: "Succinct response (<100 words) explaining specific changes made or acknowledging the setup." },
    suggestions: { type: Type.STRING, description: "Approximately 100 words of freestanding suggestions for schedule improvement or productivity advice specific to this user's task list." }
  },
  required: ["schedule", "summary", "feedback", "suggestions"]
};

export const generateSchedule = async (
  startDate: string,
  endDate: string,
  tasks: string,
  preferences: string,
  currentPlan?: TimeboxPlan,
  refinementInstruction?: string
): Promise<TimeboxPlan> => {
  
  const model = "gemini-3-flash-preview";
  let prompt = "";
  
  if (currentPlan && refinementInstruction) {
    prompt = `
      You are an expert scheduler. Update the following JSON schedule based on the user's request.
      
      IMPORTANT: Treat all times as LOCAL TIME. Do not shift them based on UTC. 
      The period is ${startDate} to ${endDate}.
      
      User Refinement Request: "${refinementInstruction}"
      
      Current Schedule JSON: ${JSON.stringify(currentPlan.schedule)}
    `;
  } else {
    prompt = `
      Create a detailed, ADHD-friendly timeboxed schedule in LOCAL TIME. 
      Do not add UTC offsets or assume Z (Zulu) time.
      
      Window: ${startDate} to ${endDate}
      Tasks: "${tasks}"
      Preferences: "${preferences}"
      
      Guidelines:
      1. Break tasks into manageable blocks.
      2. Provide 15m buffers between high-intensity blocks.
      3. Use ISO 8601 strings for times (e.g. 2025-12-30T09:00:00).
    `;
  }

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: scheduleSchema,
        systemInstruction: "You are a productivity coach specializing in ADHD and Executive Function. You generate schedules strictly in the user's local time context without UTC adjustments.",
        thinkingConfig: { thinkingBudget: 1024 }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const data = JSON.parse(text);
    const processedSchedule = data.schedule.map((item: any, index: number) => ({
      ...item,
      id: `block-${Date.now()}-${index}`
    }));

    return {
      schedule: processedSchedule,
      summary: data.summary,
      feedback: data.feedback,
      suggestions: data.suggestions
    };
  } catch (error) {
    console.error("Gemini Scheduling Error:", error);
    throw new Error("Failed to generate schedule. Please try again.");
  }
};
