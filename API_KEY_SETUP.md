# API Key Setup Instructions

## Step 1: Create .env.local file

Create a file named `.env.local` in the root of your project with the following content:

```env
# OpenAI API Key
OPENAI_API_KEY=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

# Friend's API endpoint (update with actual endpoint if different)
FRIEND_API_ENDPOINT=https://api.example.com/hand/bone
FRIEND_API_KEY=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
```

## Step 2: Update Friend's API Endpoint (if needed)

If your friend's API endpoint is different from the default, update the `FRIEND_API_ENDPOINT` in `.env.local` with the actual URL.

## How It Works

### API Route Created: `/api/hand/bone/[partId]`

When you click on a bone/part in the 3D skeleton:

1. **First**: Tries to call your friend's API at `${FRIEND_API_ENDPOINT}/${partId}` with the API key in headers
2. **Fallback**: If friend's API is unavailable, uses OpenAI to generate bone information

### Files Updated

- ✅ `app/api/hand/bone/[partId]/route.ts` - New API route that handles bone data requests
- ✅ `app/api/chat/route.js` - Already uses `OPENAI_API_KEY` from environment
- ✅ Components already configured to call `/api/hand/bone` endpoint

### Components Using the API

- `SkeletonArm3D` - Calls `/api/hand/bone/${partId}` when parts are clicked
- `useHandClickDetection` - Reusable hook for click detection and API calls
- `HandModel3D` - Alternative hand model component

## Testing

1. Make sure `.env.local` exists with your API key
2. Restart your dev server: `npm run dev`
3. Navigate to `/skeleton` page
4. Click on any bone/part
5. Check the console and UI for the bone data response

## Security Note

The `.env.local` file is already in `.gitignore`, so your API key won't be committed to git. Never commit API keys to version control!

