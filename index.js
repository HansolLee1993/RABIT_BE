const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const bodyParser = require("body-parser");
const {
  BedrockRuntimeClient,
  InvokeModelCommand,
} = require("@aws-sdk/client-bedrock-runtime");

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

const client = new BedrockRuntimeClient({
  region: "us-east-1", // Change if you're using a different region
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

app.post("/api/claude", async (req, res) => {
  const { prompt } = req.body;

  const command = new InvokeModelCommand({
    modelId: "anthropic.claude-3.5-sonnet",
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify({
      prompt: `Human: ${prompt}\nAssistant:`,
      max_tokens_to_sample: 300,
    }),
  });

  try {
    const response = await client.send(command);
    const responseBody = new TextDecoder().decode(response.body);
    const json = JSON.parse(responseBody);
    res.json({ completion: json.completion });
  } catch (error) {
    // Log full error to console for debugging
    console.error("Full Bedrock error:", error);
    // Send detailed error message in response
    res.status(500).json({ error: error.message || "Something went wrong" });
  }
});

app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});
