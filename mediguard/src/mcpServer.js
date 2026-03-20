// src/mcpServer.js
import { Clerk } from '@clerk/clerk-sdk-node';
import { parse } from 'url';

// Initialise Clerk with secret key (read from env)
Clerk.configure({
  secretKey: process.env.CLERK_SECRET_KEY,
  apiVersion: 'v1',
});

/**
 * Simple MCP handler that follows the Clerk MCP spec.
 * It expects a JSON POST body with { method: string, params?: object }.
 */
async function handleMcpRequest(req, res) {
  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Method not allowed' }));
  }

  let body = '';
  req.on('data', chunk => (body += chunk));
  req.on('end', async () => {
    try {
      const { method, params } = JSON.parse(body);

      // ---- Core MCP methods ----
      if (method === 'list_users') {
        const users = await Clerk.users.getUserList(params);
        return res.end(JSON.stringify({ users }));
      }
      if (method === 'get_user') {
        const user = await Clerk.users.getUser(params.userId);
        return res.end(JSON.stringify({ user }));
      }
      if (method === 'list_sdk_snippets') {
        const snippets = await import('../.agents/skills/clerk/skills.md');
        return res.end(JSON.stringify({ snippets: snippets.default }));
      }

      // ---- Billing MCP methods ----
      if (method === 'list_plans') {
        const plans = await Clerk.billing.plans.list();
        return res.end(JSON.stringify({ plans }));
      }
      if (method === 'get_subscription') {
        const subscription = await Clerk.billing.subscriptions.get(params.subscriptionId);
        return res.end(JSON.stringify({ subscription }));
      }
      if (method === 'cancel_subscription') {
        const result = await Clerk.billing.subscriptions.cancel(params.subscriptionId);
        return res.end(JSON.stringify({ result }));
      }
      if (method === 'create_price_transition') {
        const result = await Clerk.billing.subscriptions.createPriceTransition(
          params.subscriptionId,
          { from_price_id: params.from_price_id, to_price_id: params.to_price_id }
        );
        return res.end(JSON.stringify({ result }));
      }

      // ---- Unknown method ----
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: `Unsupported MCP method: ${method}` }));
    } catch (e) {
      console.error('MCP handler error:', e);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
  });
}

/** Vite middleware – intercept /mcp requests */
export function mcpMiddleware(req, res, next) {
  const { pathname } = parse(req.url);
  if (pathname === '/mcp') {
    return handleMcpRequest(req, res);
  }
  next();
}
