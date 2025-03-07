# Credolay - CV Buddy

A smart CV optimization tool that uses Azure OpenAI to analyze job descriptions and tailor CVs accordingly.

## Features

- Clean, modern UI
- Job description analysis using Azure OpenAI
- CV optimization that aligns your resume with job requirements
- PDF CV upload functionality
- Instantaneous AI-powered CV optimization
- Downloadable optimized CV results

## How It Works

1. Users enter a job description in the text area
2. Users upload their CV in PDF format
3. The Azure OpenAI API analyzes the job description to extract key requirements and skills
4. The system extracts text from the uploaded PDF CV
5. Azure OpenAI compares the CV with the job requirements and generates an optimized version
6. Users can view and download their optimized CV

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm or yarn
- Azure OpenAI API subscription

### Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```bash
# Azure OpenAI API Configuration
AZURE_OPENAI_API_KEY=your-api-key-here
AZURE_OPENAI_ENDPOINT=https://your-resource-name.openai.azure.com/
AZURE_OPENAI_API_VERSION=2023-05-15
AZURE_OPENAI_DEPLOYMENT_NAME=your-deployment-name
AZURE_OPENAI_MODEL_NAME=gpt-4
```

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd <repository-directory>
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

- `src/app/page.tsx` - Main page component with the job description form and CV upload
- `src/app/api/process-cv/route.ts` - API route that processes the job description and CV
- `src/services/openai-service.ts` - Service that integrates with Azure OpenAI
- `src/app/layout.tsx` - Root layout component
- `src/app/globals.css` - Global styles including Tailwind CSS directives

## Technologies Used

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Azure OpenAI
- PDF.js for PDF parsing

## Customization

You can customize the Azure OpenAI prompts in the `openai-service.ts` file to adjust how job descriptions are analyzed and how CVs are optimized.

## License

This project is licensed under the MIT License. 