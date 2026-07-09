import { createRequire } from "module";

const require = createRequire(import.meta.url);

type ATSmsClient = {
  send: (opts: { to: string[]; message: string; from?: string }) => Promise<unknown>;
};
type ATInstance = { SMS: ATSmsClient };
type ATFactory = (opts: { apiKey: string; username: string }) => ATInstance;

// africastalking is a CJS module — load via createRequire so ESM bundler handles it
const AfricasTalking = require("africastalking") as ATFactory;

let _client: ATInstance | null = null;

function getClient(): ATInstance {
  if (_client) return _client;

  const apiKey = process.env.AFRICASTALKING_API_KEY;
  const username = process.env.AFRICASTALKING_USERNAME;

  if (!apiKey || !username) {
    throw new Error(
      "AFRICASTALKING_API_KEY and AFRICASTALKING_USERNAME environment variables are required for SMS.",
    );
  }

  _client = AfricasTalking({ apiKey, username });
  return _client;
}

/**
 * Send an OTP code to the given E.164 phone number via Africa's Talking SMS.
 */
export async function sendOtpSms(phone: string, code: string): Promise<void> {
  const client = getClient();
  await client.SMS.send({
    to: [phone],
    message: `Your Firebox verification code is: ${code}. It expires in 5 minutes. Do not share it with anyone.`,
  });
}
