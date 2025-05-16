const {
  BedrockRuntimeClient,
  InvokeModelCommand,
} = require("@aws-sdk/client-bedrock-runtime");

const client = new BedrockRuntimeClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
  },
});

function detectImageMediaType(base64) {
  if (base64.startsWith("/9j/")) return "image/jpeg";
  if (base64.startsWith("iVBOR")) return "image/png";
  throw new Error("Unsupported image format");
}

function buildClaudeRequestBody(base64Image, mediaType) {
  return JSON.stringify({
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: 1000,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mediaType,
              data: base64Image,
            },
          },
          {
            type: "text",
            text: 'Look at the image and return ONLY JSON like {"model":"...", "make":"...", "year":"..."} with no extra explanation.',
          },
        ],
      },
    ],
  });
}

function safeJsonParse(input) {
  try {
    return JSON.parse(input);
  } catch {
    return null;
  }
}

function extractTextFromClaudeResponse(json) {
  if (!json || !Array.isArray(json.content)) return null;
  return json.content.find((c) => c.type === "text")?.text || null;
}

function isValidCarData(data) {
  return (
    data && typeof data === "object" && (data.model || data.make || data.year)
  );
}

async function sendImageToClaude(base64Image) {
  const mediaType = detectImageMediaType(base64Image);

  try {
    const command = new InvokeModelCommand({
      modelId: "anthropic.claude-3-5-sonnet-20240620-v1:0",
      contentType: "application/json",
      accept: "application/json",
      body: buildClaudeRequestBody(base64Image, mediaType),
    });

    const response = await client.send(command);
    const responseBody = new TextDecoder().decode(response.body);

    const responseJson = safeJsonParse(responseBody);
    const textResponse = extractTextFromClaudeResponse(responseJson);
    const parsedJson = safeJsonParse(textResponse);

    if (!isValidCarData(parsedJson)) {
      return { success: true, result: {} };
    }

    return { success: true, result: parsedJson };
  } catch (error) {
    console.error("Claude error:", error);
    return { success: false, error: error.message || "Something went wrong" };
  }
}

module.exports = { sendImageToClaude };
