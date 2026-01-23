from openai import AzureOpenAI
from app.config import settings
import base64
import re
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

    async def analyze_question_paper_batch(
        self,
        image_paths: List[str],
        subject: str,
        wrong_only: bool = True,
        model: str = "gpt-4o"
    ) -> Dict[str, Any]:
        """
        Analyze multiple question paper images to extract questions in a single API call

        Args:
            image_paths: List of paths to image files
            subject: The subject of the exam
            wrong_only: If True, extract only wrongly answered questions (default).
                       If False, extract ALL questions from the images.
            model: AI model to use - "gpt-4o" (default) or "gpt-5-chat"

        Returns:
            Dict containing:
            - wrong_questions: List of extracted questions with image_index field
            - total_questions: Total number of questions detected
            - analysis: Additional analysis from AI
            - tokens_used: Token usage info (prompt_tokens, completion_tokens, total_tokens)
        """
        try:
            # Encode all images to base64
            base64_images = [self.encode_image(path) for path in image_paths]

            # Create prompt for batch analysis
            if wrong_only:
                prompt = f"""You are an expert educational AI assistant analyzing {len(image_paths)} exam paper/worksheet images for {subject}.

TASK: Analyze these {len(image_paths)} images and identify ALL wrongly answered questions across ALL images.

INSTRUCTIONS:
1. Look through ALL {len(image_paths)} images for questions marked with crosses (✗, X, ✖), wrong marks, or red marks indicating incorrect answers
2. Ignore questions marked with check marks (✓, ✔) or correct marks
3. For each wrong question found, extract:
   - The complete question text
   - Question number (if visible)
   - Image index (0 for first image, 1 for second, etc.)
   - Any visible context or sub-parts
   - A brief explanation of what concept/topic it covers

4. Return your analysis as a JSON object with this EXACT structure:
{{
    "wrong_questions": [
        {{
            "image_index": 0,
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
- Include image_index (0 to {len(image_paths)-1}) for EACH question so we know which image it came from
- If question text is partially visible or unclear, include what you can see and note it in explanation
- Only include questions that are clearly marked as WRONG
- Be thorough and check ALL {len(image_paths)} images

Return ONLY valid JSON, no additional text."""
            else:
                # Extract ALL questions regardless of marks
                prompt = f"""You are an expert educational AI assistant analyzing {len(image_paths)} exam paper/worksheet images for {subject}.

TASK: Analyze these {len(image_paths)} images and extract ALL questions visible across ALL images.

INSTRUCTIONS:
1. Extract EVERY question visible in ALL {len(image_paths)} images, regardless of any marks (correct, incorrect, or no marks)
2. For each question found, extract:
   - The complete question text
   - Question number (if visible)
   - Image index (0 for first image, 1 for second, etc.)
   - Any visible context or sub-parts
   - A brief explanation of what concept/topic it covers

3. Return your analysis as a JSON object with this EXACT structure:
{{
    "wrong_questions": [
        {{
            "image_index": 0,
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
- Include image_index (0 to {len(image_paths)-1}) for EACH question
- Include ALL questions, whether marked correct, incorrect, or unmarked
- If question text is partially visible or unclear, include what you can see and note it in explanation
- Be thorough and check ALL {len(image_paths)} images

Return ONLY valid JSON, no additional text."""

            # Get appropriate client and deployment based on model choice
            client, deployment = self.get_client_and_deployment(model)

            # Build content array with text prompt and all images
            content = [{"type": "text", "text": prompt}]

            # Add all images to the content array
            for idx, base64_image in enumerate(base64_images):
                content.append({
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/jpeg;base64,{base64_image}",
                        "detail": "high"  # Use high detail for better OCR
                    }
                })

            # Call Azure OpenAI Vision API with all images
            response = client.chat.completions.create(
                model=deployment,
                messages=[
                    {
                        "role": "user",
                        "content": content
                    }
                ],
                max_tokens=3000,  # Increased for multiple images
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

                # Ensure all questions have image_index (default to 0 if missing)
                for q in result.get("wrong_questions", []):
                    if "image_index" not in q:
                        q["image_index"] = 0

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
            print(f"Error analyzing question papers batch: {e}")
            raise Exception(f"Failed to analyze images: {str(e)}")

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

            # Subject-specific output format
            subject_lower = subject.lower() if subject else ""
            is_science = subject_lower in ['biology', 'chemistry']
            is_math = subject_lower in ['mathematics', 'math', 'maths', 'additional mathematics', 'a math', 'e math']

            if is_science:
                output_format = f"""Question: {question_text}

Subject: {subject}{grade_context}

Output format - YOU MUST USE EXACTLY THIS STRUCTURE (copy it exactly):

## Question
Write ONE sentence restating the question.

## Key words
- **Term 1**: Brief definition or meaning
- **Term 2**: Brief definition or meaning
- **Term 3**: Brief definition or meaning
(List all key terms relevant to this question)

## Explanation
- Use key words above to explain the correct answer
- Connect the key terms to the question context
- State the correct reasoning using precise scientific terminology
- Point out common misconceptions if relevant

## Final answer
The correct answer with key word justification

STRICT RULES:
- DO NOT write long paragraphs
- DO NOT add extra sections
- Focus on SCIENTIFIC KEY WORDS and TERMINOLOGY
- Bold all key terms using **term**
- Keep each bullet point SHORT (max 20 words)
- Use $...$ for any formulas or chemical equations
- Example: "$CO_2$" for carbon dioxide, "$H_2O$" for water
- NEVER use parentheses () for math/formulas, ALWAYS use $...$"""
            elif is_math:
                output_format = f"""Question: {question_text}

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
- Show CRITICAL calculation steps clearly
- CRITICAL: Use $...$ for ALL math (variables, numbers, equations)
- Example: "Let $x = 5$" NOT "Let x = 5" or "Let ( x = 5 )"
- Example: "Calculate $92 - y$" NOT "Calculate ( 92 - y )"
- Example: "$y \\geq 19.2$" NOT "( y >= 19.2 )"
- NEVER use parentheses () for math, ALWAYS use $...$
- Show mathematical working clearly"""
            else:
                output_format = f"""Question: {question_text}

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

            prompt = output_format

            # Get appropriate client and deployment based on model choice
            client, deployment = self.get_client_and_deployment(model)

            if is_science:
                system_msg = "You are a tutor specializing in science subjects. Focus on KEY WORDS and scientific terminology. Output ONLY structured markdown with headers and bullet points. Bold all key terms. Use $...$ for formulas. Be concise and terminology-focused."
            elif is_math:
                system_msg = "You are a tutor. Output ONLY structured markdown with headers, bullet points, and numbered lists. NEVER write paragraphs. Show CRITICAL calculation steps. Use $...$ for ALL mathematical expressions. Be concise."
            else:
                system_msg = "You are a tutor. Output ONLY structured markdown with headers, bullet points, and numbered lists. NEVER write paragraphs. Use $...$ for ALL mathematical expressions. Be concise."

            response = client.chat.completions.create(
                model=deployment,
                messages=[
                    {"role": "system", "content": system_msg},
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

    def _get_diagram_guidance(self, subject: str) -> str:
        """Return subject-specific JSON diagram guidance for exam-paper style diagrams."""

        guidance = {
            'Physics': """PHYSICS DIAGRAM JSON FORMAT:

For CIRCUITS - use type "physics_circuit":
{
  "type": "physics_circuit",
  "title": "Series Circuit with Faulty Bulb",
  "width": 400,
  "height": 150,
  "elements": [
    {"id": "bat", "type": "battery", "position": {"x": 50, "y": 75}, "value": "6V"},
    {"id": "b1", "type": "bulb", "position": {"x": 150, "y": 75}, "label": "L1"},
    {"id": "b2", "type": "bulb", "position": {"x": 250, "y": 75}, "label": "L2", "state": "faulty"},
    {"id": "b3", "type": "bulb", "position": {"x": 350, "y": 75}, "label": "L3"}
  ],
  "connections": [
    {"from": "bat", "to": "b1", "fromPort": "right", "toPort": "left"},
    {"from": "b1", "to": "b2", "fromPort": "right", "toPort": "left"},
    {"from": "b2", "to": "b3", "fromPort": "right", "toPort": "left"},
    {"from": "b3", "to": "bat", "fromPort": "right", "toPort": "left"}
  ]
}

Available circuit element types: battery, bulb, resistor, switch, ammeter, voltmeter, capacitor, diode, led, motor, bell, fuse

For FORCE DIAGRAMS - use type "physics_force":
{
  "type": "physics_force",
  "title": "Forces on a Block",
  "width": 300,
  "height": 250,
  "elements": [
    {"id": "obj", "type": "object", "position": {"x": 150, "y": 125}, "shape": "rectangle", "width": 60, "height": 40, "label": "Block"},
    {"id": "w", "type": "force", "position": {"x": 150, "y": 125}, "direction": 270, "magnitude": 60, "label": "W = mg"},
    {"id": "n", "type": "force", "position": {"x": 150, "y": 125}, "direction": 90, "magnitude": 60, "label": "N"},
    {"id": "f", "type": "force", "position": {"x": 150, "y": 125}, "direction": 180, "magnitude": 40, "label": "f"}
  ]
}

Force direction: 0=right, 90=up, 180=left, 270=down""",

            'Chemistry': """CHEMISTRY DIAGRAM JSON FORMAT:

For MOLECULAR STRUCTURES - use type "chemistry_structure":
{
  "type": "chemistry_structure",
  "title": "Water Molecule (H2O)",
  "width": 200,
  "height": 150,
  "elements": [
    {"id": "o", "type": "atom", "symbol": "O", "position": {"x": 100, "y": 75}},
    {"id": "h1", "type": "atom", "symbol": "H", "position": {"x": 50, "y": 100}},
    {"id": "h2", "type": "atom", "symbol": "H", "position": {"x": 150, "y": 100}},
    {"id": "b1", "type": "bond", "from": "o", "to": "h1", "bondType": "single"},
    {"id": "b2", "type": "bond", "from": "o", "to": "h2", "bondType": "single"}
  ]
}

Bond types: single, double, triple, dashed, wedge
Ion charges: use "charge": "+1" or "charge": "-1" on atoms

For REACTION DIAGRAMS - use type "chemistry_reaction":
{
  "type": "chemistry_reaction",
  "title": "Combustion of Methane",
  "width": 400,
  "height": 100,
  "elements": [
    {"id": "r1", "type": "atom", "symbol": "CH4", "position": {"x": 50, "y": 50}},
    {"id": "r2", "type": "atom", "symbol": "O2", "position": {"x": 120, "y": 50}},
    {"id": "p1", "type": "atom", "symbol": "CO2", "position": {"x": 280, "y": 50}},
    {"id": "p2", "type": "atom", "symbol": "H2O", "position": {"x": 350, "y": 50}}
  ],
  "connections": [
    {"from": "r2", "to": "p1", "type": "arrow", "label": "heat"}
  ]
}""",

            'Mathematics': """MATHEMATICS DIAGRAM JSON FORMAT:

For GEOMETRY - use type "math_geometry":
{
  "type": "math_geometry",
  "title": "Triangle ABC",
  "width": 300,
  "height": 250,
  "elements": [
    {"id": "tri", "type": "triangle", "vertices": [{"x": 150, "y": 50}, {"x": 50, "y": 200}, {"x": 250, "y": 200}], "label": "A,B,C"},
    {"id": "angle_a", "type": "angle", "vertex": {"x": 150, "y": 50}, "ray1End": {"x": 50, "y": 200}, "ray2End": {"x": 250, "y": 200}, "angleDegrees": 40}
  ]
}

Geometry element types: point, segment, ray, line, angle, circle, arc, triangle, rectangle, square, polygon, parallel_mark, equal_mark, perpendicular_mark

Circle example:
{"id": "c1", "type": "circle", "center": {"x": 150, "y": 125}, "radius": 50, "label": "O"}

Segment with measurement:
{"id": "seg1", "type": "segment", "start": {"x": 50, "y": 100}, "end": {"x": 200, "y": 100}, "label": "5 cm", "showMeasurement": true}

Right angle (90 degrees shows small square):
{"id": "rt", "type": "angle", "vertex": {"x": 100, "y": 150}, "ray1End": {"x": 100, "y": 50}, "ray2End": {"x": 200, "y": 150}, "angleDegrees": 90}

For GRAPHS (coordinate systems) - use type "math_graph":
{
  "type": "math_graph",
  "title": "Linear Function",
  "width": 300,
  "height": 300,
  "elements": [
    {"id": "grid", "type": "grid", "spacing": 30},
    {"id": "xaxis", "type": "x_axis", "label": "x"},
    {"id": "yaxis", "type": "y_axis", "label": "y"},
    {"id": "line1", "type": "line", "equation": "y = 2x + 1", "label": "y = 2x + 1"},
    {"id": "pt1", "type": "point", "position": {"x": 0, "y": 1}, "label": "(0, 1)"},
    {"id": "pt2", "type": "point", "position": {"x": 2, "y": 5}, "label": "(2, 5)"}
  ]
}

Graph element types: grid, x_axis, y_axis, point, line, curve, parabola, circle, asymptote, shaded_region, arrow

Linear equation example (draws y = mx + c):
{"id": "l1", "type": "line", "equation": "y = 2x - 3", "label": "y = 2x - 3"}

Quadratic/Parabola example (draws y = ax² + bx + c):
{"id": "p1", "type": "parabola", "equation": "y = x² - 4", "label": "y = x² - 4"}

Plotting specific points:
{"id": "pt", "type": "point", "position": {"x": 3, "y": 2}, "label": "A(3, 2)"}

Curve through points (for custom curves):
{"id": "c1", "type": "curve", "points": [{"x": -3, "y": 2}, {"x": 0, "y": -1}, {"x": 3, "y": 2}]}

Shaded region (for inequalities):
{"id": "shade", "type": "shaded_region", "points": [{"x": 0, "y": 0}, {"x": 4, "y": 0}, {"x": 4, "y": 4}, {"x": 0, "y": 4}]}

Circle on graph:
{"id": "circ", "type": "circle", "position": {"x": 0, "y": 0}, "radius": 2}

IMPORTANT: Position values are in graph coordinates (not pixels). The origin (0,0) is at center.
- Positive x goes right, negative x goes left
- Positive y goes up, negative y goes down
- spacing in grid element is in pixels (default 30 = 1 unit)""",

            'Biology': """BIOLOGY DIAGRAM JSON FORMAT:

For CELL STRUCTURES - use type "biology_cell":
{
  "type": "biology_cell",
  "title": "Plant Cell",
  "width": 300,
  "height": 250,
  "elements": [
    {"id": "membrane", "type": "cell_membrane", "position": {"x": 150, "y": 125}, "width": 250, "height": 200, "shape": "rectangular"},
    {"id": "nucleus", "type": "nucleus", "position": {"x": 150, "y": 125}},
    {"id": "mito1", "type": "mitochondria", "position": {"x": 80, "y": 80}},
    {"id": "chloro1", "type": "chloroplast", "position": {"x": 220, "y": 80}},
    {"id": "vacuole", "type": "vacuole", "position": {"x": 150, "y": 180}, "width": 80, "height": 50}
  ]
}

Cell element types: cell_membrane, nucleus, mitochondria, chloroplast, vacuole, ribosome

For FOOD CHAINS/PROCESSES - use type "biology_process":
{
  "type": "biology_process",
  "title": "Simple Food Chain",
  "width": 500,
  "height": 100,
  "elements": [
    {"id": "sun", "type": "label_box", "position": {"x": 50, "y": 50}, "label": "Sun"},
    {"id": "plant", "type": "organism", "position": {"x": 150, "y": 50}, "label": "Grass"},
    {"id": "herb", "type": "organism", "position": {"x": 270, "y": 50}, "label": "Rabbit"},
    {"id": "carn", "type": "organism", "position": {"x": 390, "y": 50}, "label": "Fox"}
  ],
  "connections": [
    {"from": "sun", "to": "plant", "label": "energy"},
    {"from": "plant", "to": "herb"},
    {"from": "herb", "to": "carn"}
  ]
}"""
        }

        return guidance.get(subject, """GENERAL FLOWCHART JSON FORMAT:

Use type "flowchart" for generic diagrams:
{
  "type": "flowchart",
  "title": "Process Flow",
  "width": 350,
  "height": 200,
  "elements": [
    {"id": "start", "type": "oval", "position": {"x": 175, "y": 30}, "label": "Start"},
    {"id": "step1", "type": "box", "position": {"x": 175, "y": 90}, "label": "Process"},
    {"id": "end", "type": "oval", "position": {"x": 175, "y": 150}, "label": "End"}
  ],
  "connections": [
    {"from": "start", "to": "step1"},
    {"from": "step1", "to": "end"}
  ]
}

Flowchart element types: box, diamond, oval, parallelogram""")

    def _clean_mermaid_code(self, code: str) -> Optional[str]:
        """Clean and validate Mermaid diagram code."""
        if not code or not isinstance(code, str):
            return None

        # Replace escaped newlines with actual newlines
        code = code.replace('\\n', '\n')

        # Remove any markdown code block markers
        code = code.strip()
        if code.startswith('```mermaid'):
            code = code[10:]
        if code.startswith('```'):
            code = code[3:]
        if code.endswith('```'):
            code = code[:-3]
        code = code.strip()

        # Must start with valid Mermaid directive
        valid_starts = ['graph ', 'flowchart ', 'sequenceDiagram', 'classDiagram',
                       'stateDiagram', 'erDiagram', 'pie ', 'gantt']
        if not any(code.startswith(s) for s in valid_starts):
            return None

        # Check if diagram has Chinese - if so, it's likely invalid
        if re.search(r'[\u4e00-\u9fff]', code):
            # Try to continue anyway, but log warning
            print(f"Warning: Mermaid code contains Chinese characters")

        return code

    async def regenerate_with_feedback(
        self,
        question_text: str,
        current_explanation: str,
        feedback: str,
        subject: str,
        grade: Optional[str] = None,
        model: str = "gpt-4o"
    ) -> tuple[str, Dict[str, int]]:
        """
        Regenerate an explanation based on user feedback about what was wrong.

        Args:
            question_text: The original question
            current_explanation: The current AI explanation that user found incorrect
            feedback: User's feedback describing what was wrong or needs correction
            subject: The subject of the question
            grade: Optional grade level
            model: AI model to use - "gpt-4o" (default) or "gpt-5-chat"

        Returns:
            Tuple of (corrected explanation text, token_usage dict)
        """
        try:
            grade_context = f" for {grade} level" if grade else ""

            # Subject-specific output format for regeneration
            subject_lower = subject.lower() if subject else ""
            is_science = subject_lower in ['biology', 'chemistry']
            is_math = subject_lower in ['mathematics', 'math', 'maths', 'additional mathematics', 'a math', 'e math']

            if is_science:
                output_section = """Output format - YOU MUST USE EXACTLY THIS STRUCTURE (copy it exactly):

## Question
Write ONE sentence restating the question.

## Key words
- **Term 1**: Brief definition or meaning
- **Term 2**: Brief definition or meaning
- **Term 3**: Brief definition or meaning
(List all key terms relevant to this question)

## Explanation
- Use key words above to explain the correct answer
- Connect the key terms to the question context
- State the correct reasoning using precise scientific terminology
- Point out common misconceptions if relevant

## Final answer
The correct answer with key word justification

STRICT RULES:
- DO NOT write long paragraphs
- DO NOT add extra sections
- Focus on SCIENTIFIC KEY WORDS and TERMINOLOGY
- Bold all key terms using **term**
- Keep each bullet point SHORT (max 20 words)
- Use $...$ for any formulas or chemical equations
- NEVER use parentheses () for math/formulas, ALWAYS use $...$
- MAKE SURE to correct the errors mentioned in the student's feedback"""
            elif is_math:
                output_section = """Output format - YOU MUST USE EXACTLY THIS STRUCTURE (copy it exactly):

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
- Show CRITICAL calculation steps clearly
- CRITICAL: Use $...$ for ALL math (variables, numbers, equations)
- Example: "Let $x = 5$" NOT "Let x = 5" or "Let ( x = 5 )"
- Example: "Calculate $92 - y$" NOT "Calculate ( 92 - y )"
- Example: "$y \\geq 19.2$" NOT "( y >= 19.2 )"
- NEVER use parentheses () for math, ALWAYS use $...$
- Show mathematical working clearly
- MAKE SURE to correct the errors mentioned in the student's feedback"""
            else:
                output_section = """Output format - YOU MUST USE EXACTLY THIS STRUCTURE (copy it exactly):

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
- Show mathematical working clearly
- MAKE SURE to correct the errors mentioned in the student's feedback"""

            prompt = f"""Original Question: {question_text}

Subject: {subject}{grade_context}

Previous AI Explanation:
{current_explanation}

Student Feedback (what was wrong with the explanation):
{feedback}

TASK: Generate a CORRECTED explanation that addresses the student's feedback.
- Carefully analyze what the student said was wrong
- Fix any errors in the previous explanation
- Make sure the new explanation is accurate and addresses the feedback
- If the student pointed out a calculation error, correct it
- If the student said a concept was explained incorrectly, fix it

{output_section}"""

            # Get appropriate client and deployment based on model choice
            client, deployment = self.get_client_and_deployment(model)

            if is_science:
                system_msg = "You are a tutor who has received feedback that your previous explanation had errors. Carefully address the student's feedback and provide a corrected explanation. Focus on KEY WORDS and scientific terminology. Output ONLY structured markdown with headers and bullet points. Bold all key terms. Use $...$ for formulas. Be concise and terminology-focused."
            elif is_math:
                system_msg = "You are a tutor who has received feedback that your previous explanation had errors. Carefully address the student's feedback and provide a corrected explanation. Show CRITICAL calculation steps. Output ONLY structured markdown with headers, bullet points, and numbered lists. NEVER write paragraphs. Use $...$ for ALL mathematical expressions. Be concise."
            else:
                system_msg = "You are a tutor who has received feedback that your previous explanation had errors. Carefully address the student's feedback and provide a corrected explanation. Output ONLY structured markdown with headers, bullet points, and numbered lists. NEVER write paragraphs. Use $...$ for ALL mathematical expressions. Be concise."

            response = client.chat.completions.create(
                model=deployment,
                messages=[
                    {"role": "system", "content": system_msg},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=800,  # Slightly more tokens for corrected explanation
                temperature=0.2
            )

            tokens_used = {
                "prompt_tokens": response.usage.prompt_tokens,
                "completion_tokens": response.usage.completion_tokens,
                "total_tokens": response.usage.total_tokens
            }

            return response.choices[0].message.content.strip(), tokens_used

        except Exception as e:
            print(f"Error regenerating explanation with feedback: {e}")
            return "Unable to regenerate explanation at this time.", {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0}

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

            # Language requirement: Chinese subject uses Chinese, all others use English
            if subject == 'Chinese':
                language_instruction = "IMPORTANT: Generate all questions in Chinese (中文)."
            else:
                language_instruction = "IMPORTANT: Generate all questions in English only."

            if include_diagrams:
                # Build subject-specific diagram guidance
                diagram_guidance = self._get_diagram_guidance(subject)

                prompt = f"""Based on this {subject} question{grade_context}:

"{question_text}"

Generate 3 SIMILAR practice questions that test the SAME concepts and skills but with DIFFERENT numbers, scenarios, or contexts.

{language_instruction}

REQUIREMENTS:
1. Each question should be at the same difficulty level
2. Each question should test the same underlying concept/skill
3. Use different numbers, names, scenarios, or contexts
4. Questions should be clearly distinct from each other
5. Keep each question concise and clear

DIAGRAM INSTRUCTIONS:
For each question that would benefit from a visual diagram, generate a JSON diagram specification.
The diagram will be rendered as a BLACK & WHITE exam-paper style diagram with proper scientific symbols.
- Use ONLY English labels in diagrams (no Chinese characters)
- Keep labels SHORT (1-3 words max)
- Follow the exact JSON structure for the diagram type

{diagram_guidance}

Return your response as a JSON object with this EXACT structure:
{{
    "questions": [
        {{
            "text": "Full question text here",
            "diagram": {{"type": "physics_circuit", "title": "...", "width": 400, "height": 150, "elements": [...], "connections": [...]}}
        }},
        {{
            "text": "Second question text",
            "diagram": null
        }},
        {{
            "text": "Third question text",
            "diagram": {{"type": "math_geometry", "title": "...", "width": 300, "height": 250, "elements": [...]}}
        }}
    ]
}}

IMPORTANT: The "diagram" field should be a JSON OBJECT (not a string), or null if no diagram is needed.

Return ONLY valid JSON, no markdown code blocks."""
            else:
                prompt = f"""Based on this {subject} question{grade_context}:

"{question_text}"

Generate 3 SIMILAR practice questions that test the SAME concepts and skills but with DIFFERENT numbers, scenarios, or contexts.

{language_instruction}

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
                    diagram = q.get("diagram")
                    # Diagram is now a JSON object (dict) or null, not Mermaid string
                    # Convert dict to JSON string for frontend, or keep as null
                    if diagram and isinstance(diagram, dict):
                        diagrams.append(json.dumps(diagram))
                    elif diagram and isinstance(diagram, str):
                        # If AI returned a string, try to parse it as JSON
                        try:
                            parsed_diagram = json.loads(diagram)
                            diagrams.append(json.dumps(parsed_diagram))
                        except json.JSONDecodeError:
                            # If it's not valid JSON, skip it
                            diagrams.append(None)
                    else:
                        diagrams.append(None)

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
