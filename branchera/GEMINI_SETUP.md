# Firebase AI Setup for AI-Anchored Replies

This application uses Firebase AI with Gemini to generate AI points for discussions. The AI functionality is integrated directly with Firebase, providing seamless AI capabilities.

## 1. Firebase AI Configuration

Firebase AI is automatically configured when you initialize your Firebase app. No additional API keys are required beyond your Firebase configuration.

## 2. How It Works

The application uses Firebase AI with the GoogleAIBackend to access Gemini models:

```javascript
import { getAI, getGenerativeModel, GoogleAIBackend } from "firebase/ai";

const ai = getAI(app, { backend: new GoogleAIBackend() });
const model = getGenerativeModel(ai, { model: "gemini-2.5-flash" });
```

## 3. Firebase Functions (Optional)

Firebase Functions provide server-side AI generation as a backup. The functions use a simple rule-based extraction system for server-side processing.

```bash
# Deploy the functions
firebase deploy --only functions
```

## 4. How It Works

- **Client-side Generation**: When a new discussion is created, the app automatically calls Gemini API to extract 2-4 key discussion points
- **Server-side Generation** (Optional): Firebase Functions can also generate points when discussions are created in Firestore
- **Point Types**: The AI categorizes points as:
  - `claim` - Main arguments or statements
  - `evidence` - Supporting facts or data
  - `recommendation` - Suggested actions
  - `question` - Questions or areas needing clarification
  - `topic` - General discussion topics

## 5. Error Handling

- If no API key is configured, the app will show an error message
- If the Gemini API fails, the error will be logged and displayed to the user
- All API responses are validated to ensure proper JSON structure

## 6. API Usage and Costs

- The app uses the `gemini-pro` model
- Each discussion generates one API call
- Check [Google AI pricing](https://ai.google.dev/pricing) for current rates
- The free tier includes generous usage limits for most applications

## 7. Customizing AI Prompts

You can modify the AI prompts in:
- `lib/aiService.js` - Client-side generation
- `functions/index.js` - Server-side generation

The prompts are designed to extract discussion-worthy points that users can reply to with specific response types (agree, challenge, expand, clarify).
