import { createRequire } from "module";
import { logger } from "./logger";

const require = createRequire(import.meta.url);

type ATRecipient = {
  statusCode: number;
  status: string;
  number: string;
  cost: string;
  messageId: string;
};
type ATSendResult = {
  SMSMessageData: {
    Message: string;
    Recipients: ATRecipient[];
  };
};
type ATSmsClient = {
  send: (opts: { to: string[]; message: string; from?: string }) => Promise<ATSendResult>;
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
 * Throws with a descriptive message if delivery fails.
 */
export async function sendOtpSms(phone: string, code: string): Promise<void> {
  const client = getClient();

  let result: ATSendResult;
  try {
    result = await client.SMS.send({
      to: [phone],
      message: `Your Firebox verification code is: ${code}. It expires in 5 minutes. Do not share it with anyone.`,
    });
  } catch (err: any) {
    logger.error({ err, phone }, "AT SMS send() threw an error");
    throw new Error(`AT SDK error: ${err?.message ?? String(err)}`);
  }

  logger.info({ result, phone }, "AT SMS send() response");

  // AT SDK resolves even on delivery failure — check the recipient status
  const recipients = result?.SMSMessageData?.Recipients ?? [];
  if (recipients.length === 0) {
    throw new Error(`AT returned no recipients. Full response: ${JSON.stringify(result)}`);
  }

  const failed = recipients.filter((r) => r.statusCode !== 101);
  if (failed.length > 0) {
    const detail = failed.map((r) => `${r.number}: ${r.status} (code ${r.statusCode})`).join(", ");
    throw new Error(`AT delivery failed — ${detail}`);
  }
}
