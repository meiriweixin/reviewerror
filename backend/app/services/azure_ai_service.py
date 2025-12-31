from openai import AzureOpenAI
from app.config import settings
import base64
from typing import List, Dict, Any, Optional
import json

class AzureAIService:
    def __init__(self):
        # GPT-4o client (always available)
        self.gpt4o_client = AzureOpenAI(
            api_key=settings.AZURE_OPENAI_API_KEY,
            api_version=settings.AZURE_OPENAI_API_VERSION,
            azure_endpoint=settings.AZURE_OPENAI_ENDPOINT
        )
        self.gpt4o_deployment = settings.AZURE_OPENAI_DEPLOYMENT_NAME

        # GPT-5 Chat client (optional - only if configured)
        self.gpt5_available = all([
            settings.AZURE_OPENAI_GPT5_ENDPOINT,
            settings.AZURE_OPENAI_GPT5_API_KEY,
            settings.AZURE_OPENAI_GPT5_DEPLOYMENT_NAME,
            settings.AZURE_OPENAI_GPT5_API_VERSION
        ])

        if self.gpt5_available:
            self.gpt5_client = AzureOpenAI(
                api_key=settings.AZURE_OPENAI_GPT5_API_KEY,
                api_version=settings.AZURE_OPENAI_GPT5_API_VERSION,
                azure_endpoint=settings.AZURE_OPENAI_GPT5_ENDPOINT
            )
            self.gpt5_deployment = settings.AZURE_OPENAI_GPT5_DEPLOYMENT_NAME
            print("✅ GPT-5 Chat model configured and available")
        else:
            self.gpt5_client = None
            self.gpt5_deployment = None
            print("⚠️  GPT-5 Chat not configured - will fall back to GPT-4o")

    def get_client_and_deployment(self, model: str = "gpt-4o"):
        """
        Get the appropriate client and deployment name based on model choice

        Args:
            model: Either "gpt-4o" or "gpt-5-chat" (default: "gpt-5-chat")

        Returns:
            Tuple of (client, deployment_name)
        """
        # If GPT-5 requested but not available, fall back to GPT-4o
        if model == "gpt-5-chat" and not self.gpt5_available:
            print(f"⚠️  GPT-5 requested but not configured, falling back to GPT-4o")
            return self.gpt4o_client, self.gpt4o_deployment

        if model == "gpt-4o":
            return self.gpt4o_client, self.gpt4o_deployment
        else:
            return self.gpt5_client, self.gpt5_deployment

    def encode_image(self, image_path: str) -> str:
        """Encode image to base64"""
        with open(image_path, "rb") as image_file:
            return base64.b64encode(image_file.read()).decode('utf-8')

    async def analyze_question_paper(
        self,
        image_path: str,
        subject: str,
        wrong_only: bool = True,
        model: str = "gpt-4o"
    ) -> Dict[str, Any]:
        """
        Analyze question paper image to extract questions

        Args:
            image_path: Path to the image file
            subject: The subject of the exam
            wrong_only: If True, extract only wrongly answered questions (default).
                       If False, extract ALL questions from the image.
            model: AI model to use - "gpt-4o" (default) or "gpt-5-chat"

        Returns:
            Dict containing:
            - wrong_questions: List of extracted questions
            - total_questions: Total number of questions detected
            - analysis: Additional analysis from AI
            - tokens_used: Token usage info (prompt_tokens, completion_tokens, total_tokens)
        """
        try:
            # Encode image
            base64_image = self.encode_image(image_path)

            # Create prompt for GPT-4o Vision based on extraction mode
            if wrong_only:
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
            else:
                # Extract ALL questions regardless of marks
                prompt = f"""You are an expert educational AI assistant analyzing exam papers and worksheets.

TASK: Analyze this {subject} exam paper/worksheet image and extract ALL questions visible.

INSTRUCTIONS:
1. Extract EVERY question visible in the image, regardless of any marks (correct, incorrect, or no marks)
2. For each question found, extract:
   - The complete question text
   - Question number (if visible)
   - Any visible context or sub-parts
   - A brief explanation of what concept/topic it covers

3. Return your analysis as a JSON object with this EXACT structure:
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
- Include ALL questions, whether marked correct, incorrect, or unmarked
- If question text is partially visible or unclear, include what you can see and note it in explanation
- Be thorough and check the entire image

Return ONLY valid JSON, no additional text."""

            # Get appropriate client and deployment based on model choice
            client, deployment = self.get_client_and_deployment(model)

            # Call Azure OpenAI Vision API
            response = client.chat.completions.create(
                model=deployment,
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

            # Extract token usage
            tokens_used = {
                "prompt_tokens": response.usage.prompt_tokens,
                "completion_tokens": response.usage.completion_tokens,
                "total_tokens": response.usage.total_tokens
            }

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

            # Add token usage to result
            result["tokens_used"] = tokens_used

            return result

        except Exception as e:
            print(f"Error analyzing question paper: {e}")
            raise Exception(f"Failed to analyze image: {str(e)}")

    async def generate_embedding(self, text: str) -> tuple[List[float], Dict[str, int]]:
        """
        Generate embedding vector for text using Azure OpenAI

        Returns:
            Tuple of (embedding vector, token_usage dict)
        """
        try:
            response = self.client.embeddings.create(
                model="text-embedding-ada-002",  # or your deployed embedding model
                input=text
            )

            tokens_used = {
                "prompt_tokens": response.usage.prompt_tokens,
                "completion_tokens": 0,  # Embeddings don't have completion tokens
                "total_tokens": response.usage.total_tokens
            }

            return response.data[0].embedding, tokens_used

        except Exception as e:
            print(f"Error generating embedding: {e}")
            # Return a dummy embedding if fails
            return [0.0] * 1536, {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0}

    async def explain_question(
        self,
        question_text: str,
        subject: str,
        grade: Optional[str] = None,
        model: str = "gpt-4o"
    ) -> tuple[str, Dict[str, int]]:
        """
        Generate an explanation/solution for a question

        Args:
            question_text: The question to explain
            subject: The subject of the question
            grade: Optional grade level
            model: AI model to use - "gpt-4o" (default) or "gpt-5-chat"

        Returns:
            Tuple of (explanation text, token_usage dict)
        """
        try:
            grade_context = f" for {grade} level" if grade else ""

            prompt = f"""Question: {question_text}

Subject: {subject}{grade_context}

Output format - YOU MUST USE EXACTLY THIS STRUCTURE (copy it exactly):

## Question
Write ONE sentence restating the question.

## Key ideas
- First key concept or formula
- Second key concept or formula
- Third key concept (if needed)

## Step-by-step solution
1. First step - show the calculation
2. Second step - show the calculation
3. Third step - show the calculation
(Continue numbering until complete)

## Final answer
The final answer in a box or clear statement

STRICT RULES:
- DO NOT write paragraphs or long text
- DO NOT add extra sections
- ONLY use bullet points under "Key ideas"
- ONLY use numbered list under "Step-by-step solution"
- Keep each line SHORT (max 15 words)
- CRITICAL: Use $...$ for ALL math (variables, numbers, equations)
- Example: "Let $x = 5$" NOT "Let x = 5" or "Let ( x = 5 )"
- Example: "Calculate $92 - y$" NOT "Calculate ( 92 - y )"
- Example: "$y \\geq 19.2$" NOT "( y >= 19.2 )"
- NEVER use parentheses () for math, ALWAYS use $...$
- Show mathematical working clearly"""

            # Get appropriate client and deployment based on model choice
            client, deployment = self.get_client_and_deployment(model)

            response = client.chat.completions.create(
                model=deployment,
                messages=[
                    {"role": "system", "content": "You are a tutor. Output ONLY structured markdown with headers, bullet points, and numbered lists. NEVER write paragraphs. Use $...$ for ALL mathematical expressions. Be concise."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=600,
                temperature=0.2
            )

            tokens_used = {
                "prompt_tokens": response.usage.prompt_tokens,
                "completion_tokens": response.usage.completion_tokens,
                "total_tokens": response.usage.total_tokens
            }

            return response.choices[0].message.content.strip(), tokens_used

        except Exception as e:
            print(f"Error generating explanation: {e}")
            return "Unable to generate explanation at this time.", {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0}

    async def generate_similar_questions(
        self,
        question_text: str,
        subject: str,
        grade: Optional[str] = None,
        model: str = "gpt-4o"
    ) -> tuple[Dict[str, Any], Dict[str, int]]:
        """
        Generate 3 similar practice questions based on the original question,
        with optional Mermaid.js diagrams when beneficial.

        Returns:
            Tuple of (dict with questions and diagrams, token_usage dict)
            The dict contains:
            - questions: list of question text strings
            - diagrams: list of Mermaid diagram code strings (or null for each)
        """
        try:
            grade_context = f" for {grade} level" if grade else ""

            # Subjects that commonly benefit from diagrams
            diagram_subjects = ['Mathematics', 'Physics', 'Chemistry', 'Biology',
                              'Computer Science', 'Geography', 'Economics']

            include_diagrams = subject in diagram_subjects

            if include_diagrams:
                prompt = f"""Based on this {subject} question{grade_context}:

"{question_text}"

Generate 3 SIMILAR practice questions that test the SAME concepts and skills but with DIFFERENT numbers, scenarios, or contexts.

REQUIREMENTS:
1. Each question should be at the same difficulty level
2. Each question should test the same underlying concept/skill
3. Use different numbers, names, scenarios, or contexts
4. Questions should be clearly distinct from each other
5. Keep each question concise and clear

FOR EACH QUESTION, decide if a DIAGRAM would help visualize the concept:
- For flowcharts, processes, relationships: Use Mermaid.js flowchart syntax
- For sequences, timelines: Use Mermaid.js sequence diagram syntax
- For hierarchies, trees: Use Mermaid.js graph TD syntax
- If no diagram needed, leave it null

Return your response as a JSON object with this EXACT structure:
{{
    "questions": [
        {{
            "text": "Full question text here",
            "diagram": "graph TD; A[Start]-->B[End]"
        }},
        {{
            "text": "Second question text",
            "diagram": null
        }},
        {{
            "text": "Third question text",
            "diagram": "flowchart LR; A-->B-->C"
        }}
    ]
}}

MERMAID SYNTAX TIPS:
- Flowchart: graph TD; A[Box]-->B[Box]; or graph LR for left-to-right
- Use brackets for boxes: A[Text], B[More text]
- Use arrows: -->, --text-->, -.->
- For math: use simple text, no LaTeX
- Keep diagrams SIMPLE with 3-6 nodes maximum
- Use semicolons to separate statements

Return ONLY valid JSON, no markdown code blocks."""
            else:
                prompt = f"""Based on this {subject} question{grade_context}:

"{question_text}"

Generate 3 SIMILAR practice questions that test the SAME concepts and skills but with DIFFERENT numbers, scenarios, or contexts.

REQUIREMENTS:
1. Each question should be at the same difficulty level
2. Each question should test the same underlying concept/skill
3. Use different numbers, names, scenarios, or contexts
4. Questions should be clearly distinct from each other
5. Keep each question concise and clear

Return your response as a JSON object with this EXACT structure:
{{
    "questions": [
        {{"text": "Full question text here", "diagram": null}},
        {{"text": "Second question text", "diagram": null}},
        {{"text": "Third question text", "diagram": null}}
    ]
}}

Return ONLY valid JSON, no markdown code blocks."""

            # Get appropriate client and deployment based on model choice
            client, deployment = self.get_client_and_deployment(model)

            response = client.chat.completions.create(
                model=deployment,
                messages=[
                    {"role": "system", "content": "You are an expert educational question generator. Create practice questions that help students master concepts through varied practice. When diagrams are requested, generate valid Mermaid.js syntax. Always return valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=1200,  # Increased for diagram content
                temperature=0.7
            )

            tokens_used = {
                "prompt_tokens": response.usage.prompt_tokens,
                "completion_tokens": response.usage.completion_tokens,
                "total_tokens": response.usage.total_tokens
            }

            result_text = response.choices[0].message.content.strip()

            # Parse JSON response
            try:
                # Remove markdown code blocks if present
                if result_text.startswith("```json"):
                    result_text = result_text[7:]
                if result_text.startswith("```"):
                    result_text = result_text[3:]
                if result_text.endswith("```"):
                    result_text = result_text[:-3]

                parsed = json.loads(result_text.strip())
                questions_data = parsed.get("questions", [])

                # Extract questions and diagrams
                questions = []
                diagrams = []
                for q in questions_data[:3]:
                    questions.append(q.get("text", "Unable to generate question."))
                    diagrams.append(q.get("diagram"))

                # Pad if needed
                while len(questions) < 3:
                    questions.append("Unable to generate question. Please try again.")
                    diagrams.append(None)

                return {
                    "questions": questions[:3],
                    "diagrams": diagrams[:3]
                }, tokens_used

            except json.JSONDecodeError:
                # Fallback: parse as plain text (old format)
                questions = []
                lines = result_text.split('\n')
                current_question = []

                for line in lines:
                    line = line.strip()
                    if line.startswith(('1)', '2)', '3)')):
                        if current_question:
                            questions.append(' '.join(current_question).strip())
                            current_question = []
                        current_question.append(line[2:].strip())
                    elif current_question:
                        current_question.append(line)

                if current_question:
                    questions.append(' '.join(current_question).strip())

                if len(questions) < 3:
                    parts = result_text.split('\n\n')
                    questions = [p.strip() for p in parts if p.strip()][:3]

                while len(questions) < 3:
                    questions.append("Unable to generate question. Please try again.")

                return {
                    "questions": questions[:3],
                    "diagrams": [None, None, None]
                }, tokens_used

        except Exception as e:
            print(f"Error generating similar questions: {e}")
            return {
                "questions": [
                    "Unable to generate similar question 1.",
                    "Unable to generate similar question 2.",
                    "Unable to generate similar question 3."
                ],
                "diagrams": [None, None, None]
            }, {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0}

# Create a singleton instance
azure_ai_service = AzureAIService()
