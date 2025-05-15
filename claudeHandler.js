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

async function sendImageToClaude(base64Image) {
  try {
    const command = new InvokeModelCommand({
      modelId: "anthropic.claude-3-5-sonnet-20240620-v1:0",
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
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
                  media_type: "image/jpeg",
                  data: base64Image,
                },
              },
              {
                type: "text",
                text: "car",
              },
            ],
          },
        ],
      }),
    });

    const response = await client.send(command);
    const responseBody = new TextDecoder().decode(response.body);
    const json = JSON.parse(responseBody);

    return { success: true, result: json.content };
  } catch (error) {
    console.error("Claude error:", error);
    return { success: false, error: error.message || "Something went wrong" };
  }
}

module.exports = { sendImageToClaude };
