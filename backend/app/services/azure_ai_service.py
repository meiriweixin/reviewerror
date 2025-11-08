from openai import AzureOpenAI
from app.config import settings
import base64
from typing import List, Dict, Any, Optional
import json

class AzureAIService:
    def __init__(self):
        self.client = AzureOpenAI(
            api_key=settings.AZURE_OPENAI_API_KEY,
            api_version=settings.AZURE_OPENAI_API_VERSION,
            azure_endpoint=settings.AZURE_OPENAI_ENDPOINT
        )
        self.deployment_name = settings.AZURE_OPENAI_DEPLOYMENT_NAME

    def encode_image(self, image_path: str) -> str:
        """Encode image to base64"""
        with open(image_path, "rb") as image_file:
            return base64.b64encode(image_file.read()).decode('utf-8')

    async def analyze_question_paper(
        self,
        image_path: str,
        subject: str
    ) -> Dict[str, Any]:
        """
        Analyze question paper image to extract wrongly answered questions

        Returns:
            Dict containing:
            - wrong_questions: List of wrongly answered questions
            - total_questions: Total number of questions detected
            - analysis: Additional analysis from AI
        """
        try:
            # Encode image
            base64_image = self.encode_image(image_path)

            # Create prompt for GPT-4o Vision
            prompt = f"""You are an expert educational AI assistant analyzing exam papers and worksheets.

TASK: Analyze this {subject} exam paper/worksheet image and identify ALL wrongly answered questions.

INSTRUCTIONS:
1. Look for questions marked with crosses (✗, X, ✖), wrong marks, or red marks indicating incorrect answers
2. Ignore questions marked with check marks (✓, ✔) or correct marks
3. For each wrong question found, extract:
   - The complete question text
   - Question number (if visible)
   - Any visible context or sub-parts
   - A brief explanation of what concept/topic it covers

4. Return your analysis as a JSON object with this EXACT structure:
{{
    "wrong_questions": [
        {{
            "question_number": "1a" or null if not visible,
            "question_text": "Complete question text here",
            "topic": "Brief topic/concept covered",
            "explanation": "Brief explanation of what this question tests"
        }}
    ],
    "total_questions_detected": <number>,
    "total_wrong_questions": <number>,
    "analysis_notes": "Any additional observations"
}}

IMPORTANT:
- Extract the COMPLETE question text, not just a summary
- If question text is partially visible or unclear, include what you can see and note it in explanation
- Only include questions that are clearly marked as WRONG
- Be thorough and check the entire image

Return ONLY valid JSON, no additional text."""

            # Call Azure OpenAI GPT-4o Vision
            response = self.client.chat.completions.create(
                model=self.deployment_name,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": prompt
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{base64_image}"
                                }
                            }
                        ]
                    }
                ],
                max_tokens=2000,
                temperature=0.3
            )

            # Parse response
            result_text = response.choices[0].message.content.strip()

            # Try to parse JSON from response
            try:
                # Remove markdown code blocks if present
                if result_text.startswith("```json"):
                    result_text = result_text[7:]
                if result_text.startswith("```"):
                    result_text = result_text[3:]
                if result_text.endswith("```"):
                    result_text = result_text[:-3]

                result = json.loads(result_text.strip())
            except json.JSONDecodeError:
                # If JSON parsing fails, create a structured response
                result = {
                    "wrong_questions": [],
                    "total_questions_detected": 0,
                    "total_wrong_questions": 0,
                    "analysis_notes": result_text
                }

            return result

        except Exception as e:
            print(f"Error analyzing question paper: {e}")
            raise Exception(f"Failed to analyze image: {str(e)}")

    async def generate_embedding(self, text: str) -> List[float]:
        """Generate embedding vector for text using Azure OpenAI"""
        try:
            response = self.client.embeddings.create(
                model="text-embedding-ada-002",  # or your deployed embedding model
                input=text
            )

            return response.data[0].embedding

        except Exception as e:
            print(f"Error generating embedding: {e}")
            # Return a dummy embedding if fails
            return [0.0] * 1536

    async def explain_question(
        self,
        question_text: str,
        subject: str,
        grade: Optional[str] = None
    ) -> str:
        """Generate an explanation/solution for a question"""
        try:
            grade_context = f" for {grade} level" if grade else ""

            prompt = f"""You are a helpful {subject} tutor. A student got this question wrong{grade_context}:

Question: {question_text}

Provide a clear, concise explanation that:
1. Explains the key concept being tested
2. Shows the correct approach to solve it
3. Highlights common mistakes students make
4. Gives tips to remember for similar questions

Keep it friendly and encouraging, around 150-200 words."""

            response = self.client.chat.completions.create(
                model=self.deployment_name,
                messages=[
                    {"role": "system", "content": "You are a patient and encouraging tutor who helps students learn from their mistakes."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=500,
                temperature=0.7
            )

            return response.choices[0].message.content.strip()

        except Exception as e:
            print(f"Error generating explanation: {e}")
            return "Unable to generate explanation at this time."

# Create a singleton instance
azure_ai_service = AzureAIService()
