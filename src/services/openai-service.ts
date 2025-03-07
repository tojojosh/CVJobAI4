import { OpenAI } from "openai";

// PDF parsing will be handled separately when we upload files

// Initialize Azure OpenAI client
const initializeOpenAIClient = () => {
  const apiKey = process.env.AZURE_OPENAI_API_KEY || "";
  const baseEndpoint = process.env.AZURE_OPENAI_ENDPOINT || ""; // Base endpoint without trailing slash
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION || "2024-12-01-preview";
  const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "";
  
  if (!baseEndpoint || !apiKey || !deploymentName) {
    throw new Error("Azure OpenAI endpoint, API key, and deployment name must be defined in environment variables");
  }
  
  // Construct the full endpoint URL exactly like in the Python example
  const fullEndpoint = `${baseEndpoint.replace(/\/$/, '')}/openai/deployments/${deploymentName}`;
  
  console.log("=== OPENAI CLIENT CONFIGURATION ===");
  console.log("Base endpoint:", baseEndpoint);
  console.log("Full endpoint URL:", fullEndpoint);
  console.log("API version:", apiVersion);
  console.log("Deployment name:", deploymentName);
  console.log("Expected final URL:", `${fullEndpoint}/chat/completions?api-version=${apiVersion}`);
  console.log("================================");
  
  // Create OpenAI client with Azure settings
  const client = new OpenAI({
    apiKey: apiKey,
    baseURL: fullEndpoint,
    defaultQuery: { "api-version": apiVersion },
    defaultHeaders: { 
      "api-key": apiKey,
      "Content-Type": "application/json"
    }
  });
  
  return client;
};

// Analyze job description to extract key requirements and skills
export const analyzeJobDescription = async (jobDescription: string) => {
  try {
    const client = initializeOpenAIClient();
    
    const prompt = `
      Analyze the following job description and extract the key requirements, skills, 
      and qualifications being sought:

      ${jobDescription}

      Return a structured JSON object with the following properties:
      1. requiredSkills: Array of technical skills required
      2. softSkills: Array of soft skills mentioned
      3. experience: Years or type of experience required
      4. education: Education requirements
      5. keyResponsibilities: Key job responsibilities
    `;

    // In Azure OpenAI, when using the deployments endpoint, the model is typically "gpt-4" or similar
    // not the deployment name itself
    const modelName = process.env.AZURE_OPENAI_MODEL_NAME || "gpt-4o-mini";
    
    console.log("Sending chat completion request...");
    // Send request to /chat/completions endpoint (this is implicit in the OpenAI SDK)
    const response = await client.chat.completions.create({
      model: modelName,
      messages: [
        { role: "system", content: "You are an expert HR assistant who analyzes job descriptions." },
        { role: "user", content: prompt }
      ],
      max_tokens: 800,
      temperature: 0.2
    });

    console.log("Response received:", response.choices[0]?.message?.content?.substring(0, 50) + "...");

    if (response.choices && response.choices.length > 0) {
      const content = response.choices[0].message?.content;
      try {
        return content ? JSON.parse(content) : null;
      } catch (e) {
        console.log("Could not parse JSON response:", content);
        return { rawContent: content };
      }
    }
    
    return null;
  } catch (error) {
    console.error("Error analyzing job description:", error);
    throw error;
  }
};

// Compare CV with job description and suggest optimizations
export const compareAndOptimizeCV = async (jobDescriptionAnalysis: any, cvText: string) => {
  try {
    const client = initializeOpenAIClient();
    const modelName = process.env.AZURE_OPENAI_MODEL_NAME || "gpt-4o-mini";

    const prompt = `
      I have analyzed a job description and extracted the following key requirements and skills:
      ${JSON.stringify(jobDescriptionAnalysis, null, 2)}

      Now, I need to optimize the following CV to better match these requirements:
      
      ${cvText}

      Please generate an optimized version of this CV that:
      1. Highlights experiences and skills that match the job requirements
      2. Reorganizes content to emphasize relevant qualifications
      3. Uses terminology from the job description where appropriate
      4. Adds any missing sections that would strengthen the application
      5. Keeps the overall length and structure similar to the original

      Return the optimized CV text.
    `;

    const response = await client.chat.completions.create({
      model: modelName,
      messages: [
        { role: "system", content: "You are an expert CV writer who tailors CVs to specific job descriptions." },
        { role: "user", content: prompt }
      ],
      max_tokens: 2000,
      temperature: 0.3
    });

    if (response.choices && response.choices.length > 0) {
      return response.choices[0].message?.content || "";
    }
    
    return "";
  } catch (error) {
    console.error("Error optimizing CV:", error);
    throw error;
  }
};

// Main function to process job description and CV
export const processJobApplicationMaterials = async (jobDescription: string, cvFile: File) => {
  try {
    // Step 1: Analyze the job description
    const jobAnalysis = await analyzeJobDescription(jobDescription);
    
    // Step 2: Extract text from CV (this will be implemented in the API route)
    // For now, we're assuming cvText is provided directly
    
    // Step 3: Return the job analysis for now
    return {
      jobAnalysis,
      message: "CV optimization will be implemented in the API route"
    };
  } catch (error) {
    console.error("Error processing job application materials:", error);
    throw error;
  }
}; 