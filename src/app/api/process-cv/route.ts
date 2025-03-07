import { NextRequest, NextResponse } from 'next/server';
import { analyzeJobDescription, compareAndOptimizeCV } from '@/services/openai-service';
import pdfParse from 'pdf-parse/lib/pdf-parse';

export async function POST(request: NextRequest) {
  try {
    // Log all environment variables for debugging (except API key)
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT || "";
    const apiVersion = process.env.AZURE_OPENAI_API_VERSION || "";
    const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "";
    const modelName = process.env.AZURE_OPENAI_MODEL_NAME || "";
    
    console.log("=== API ROUTE ENV VARIABLES ===");
    console.log("ENDPOINT:", endpoint);
    console.log("API VERSION:", apiVersion);
    console.log("DEPLOYMENT:", deploymentName);
    console.log("MODEL:", modelName);
    console.log("EXPECTED FULL URL:", `${endpoint.replace(/\/$/, '')}/openai/deployments/${deploymentName}/chat/completions?api-version=${apiVersion}`);
    console.log("=============================");

    const formData = await request.formData();
    const jobDescription = formData.get('jobDescription') as string;
    const cvFile = formData.get('cvFile') as File;

    if (!jobDescription) {
      return NextResponse.json(
        { error: 'Job description is required' },
        { status: 400 }
      );
    }

    if (!cvFile) {
      return NextResponse.json(
        { error: 'CV file is required' },
        { status: 400 }
      );
    }

    // Check if the file is a PDF
    if (cvFile.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'CV file must be a PDF' },
        { status: 400 }
      );
    }

    // Step 1: Analyze the job description
    let jobAnalysis;
    try {
      console.log("Starting job description analysis...");
      jobAnalysis = await analyzeJobDescription(jobDescription);
      console.log("Job analysis complete:", typeof jobAnalysis);
    } catch (error: any) {
      console.error('Error analyzing job description in API route:', error);
      const errorMessage = error.message || 'Error analyzing job description';
      const status = error.status || 500;
      console.log("Returning error:", errorMessage, status);
      
      // Special handling for common Azure errors
      if (errorMessage.includes('not found') || error.code === '404' || error.code === 'DeploymentNotFound') {
        return NextResponse.json(
          { 
            error: 'Azure OpenAI Resource Not Found: Please check your deployment configuration.',
            details: {
              message: errorMessage,
              code: error.code || 'ERROR',
              suggestedAction: "Verify that the deployment exists in Azure and that the endpoint URL is correct",
              expectedUrl: `${endpoint.replace(/\/$/, '')}/openai/deployments/${deploymentName}/chat/completions?api-version=${apiVersion}`
            }
          },
          { status }
        );
      }
      
      // Special handling for authentication errors
      if (errorMessage.includes('authenticate') || errorMessage.includes('API key') || error.status === 401 || error.code === 'InvalidAPIKey') {
        return NextResponse.json(
          { 
            error: 'Azure OpenAI Authentication Error: Invalid or missing API key.',
            details: {
              message: errorMessage,
              code: error.code || 'ERROR',
              suggestedAction: "Check that your API key is correct and active"
            }
          },
          { status }
        );
      }
      
      return NextResponse.json(
        { 
          error: errorMessage, 
          details: {
            message: errorMessage,
            code: error.code || 'ERROR',
            suggestedAction: "Check the error details and Azure OpenAI configuration",
            expectedUrl: `${endpoint.replace(/\/$/, '')}/openai/deployments/${deploymentName}/chat/completions?api-version=${apiVersion}`
          }
        },
        { status }
      );
    }

    if (!jobAnalysis) {
      return NextResponse.json(
        { error: 'Failed to analyze job description' },
        { status: 500 }
      );
    }

    // Step 2: Extract text from CV
    let cvText;
    try {
      console.log("Extracting text from CV PDF...");
      const cvBuffer = await cvFile.arrayBuffer();
      const cvPdfData = await pdfParse(Buffer.from(cvBuffer));
      cvText = cvPdfData.text;
    } catch (error: any) {
      console.error('Error extracting text from CV:', error);
      return NextResponse.json(
        { error: 'Error extracting text from CV: ' + error.message },
        { status: 500 }
      );
    }

    if (!cvText) {
      return NextResponse.json(
        { error: 'Failed to extract text from CV' },
        { status: 500 }
      );
    }

    // Step 3: Compare and optimize CV
    let optimizedCV;
    try {
      console.log("Optimizing CV based on job analysis...");
      optimizedCV = await compareAndOptimizeCV(jobAnalysis, cvText);
    } catch (error: any) {
      console.error('Error optimizing CV:', error);
      return NextResponse.json(
        { error: error.message || 'Error optimizing CV' },
        { status: 500 }
      );
    }

    console.log("All processing complete, returning results");
    return NextResponse.json({
      success: true,
      jobAnalysis,
      originalCV: cvText,
      optimizedCV
    });
  } catch (error: any) {
    console.error('Unexpected error processing CV:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred while processing the CV' },
      { status: 500 }
    );
  }
} 