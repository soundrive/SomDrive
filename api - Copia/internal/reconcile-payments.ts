import { runAutomaticReconciliation } from '../mercadopago-webhook';

// Constant-time comparison to prevent timing attacks on secrets
function safeCompare(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export default async function handler(req: any, res: any) {
  const method = req.method;

  // Accept EXCLUSIVELY POST
  if (method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({
      error: "Method Not Allowed",
      message: "This endpoint only accepts POST requests for manual administrative reconciliation runs."
    });
  }

  // Check if there is any secret in query parameters
  if (req.query?.secret || req.query?.key || req.query?.token) {
    return res.status(400).json({
      error: "Bad Request",
      message: "Query parameters containing secrets or keys are strictly forbidden."
    });
  }

  // Validate dedicated secret authorization
  const configuredSecret = process.env.INTERNAL_RECONCILIATION_SECRET;
  if (!configuredSecret) {
    console.error("[Reconciliation Endpoint Error] INTERNAL_RECONCILIATION_SECRET environment variable is not configured on Vercel.");
    return res.status(500).json({
      error: "Configuration Error",
      message: "The server is missing necessary security configurations to run manual payment reconciliation."
    });
  }

  const reqSecret = req.headers["x-reconciliation-secret"];
  if (!reqSecret || !safeCompare(String(reqSecret), configuredSecret)) {
    console.warn("[Reconciliation Endpoint] Rejected unauthorized connection attempt (invalid secret).");
    return res.status(401).json({
      error: "Unauthorized",
      message: "Invalid or missing credentials."
    });
  }

  // Force option is NOT allowed
  if (req.body?.force === true || req.query?.force === "true") {
    return res.status(400).json({
      error: "Bad Request",
      message: "Force reconciliation execution is forbidden on this endpoint."
    });
  }

  try {
    // Trigger lock-protected, automatic alignment pass (force is always false)
    const result = await runAutomaticReconciliation(false);

    if (result.skipped) {
      return res.status(200).json({
        ok: true,
        skipped: true,
        reason: "reconciliation_already_running"
      });
    }

    if (result.success) {
      return res.status(200).json({
        ok: true,
        processed: result.processed,
        message: result.message
      });
    } else {
      return res.status(500).json({
        ok: false,
        error: result.message
      });
    }
  } catch (err: any) {
    console.error("[Reconciliation Endpoint Fatal Error]:", err);
    return res.status(500).json({
      ok: false,
      error: "Internal Server Error",
      message: err.message || String(err)
    });
  }
}
