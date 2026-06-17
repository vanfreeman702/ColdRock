import type { APIRoute } from "astro";

// Run this route on-demand (serverless), not prerendered. The rest of
// the site stays static.
export const prerender = false;

interface ContactPayload {
  name?: string;
  email?: string;
  message?: string;
  company?: string; // honeypot — humans never see/fill this
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

// Accept either JSON (from the site's fetch) or a classic form POST.
async function readPayload(request: Request): Promise<ContactPayload> {
  const type = request.headers.get("content-type") || "";
  if (type.includes("application/json")) {
    return (await request.json()) as ContactPayload;
  }
  const form = await request.formData();
  return {
    name: form.get("name")?.toString(),
    email: form.get("email")?.toString(),
    message: form.get("message")?.toString(),
    company: form.get("company")?.toString(),
  };
}

export const POST: APIRoute = async ({ request }) => {
  let payload: ContactPayload;
  try {
    payload = await readPayload(request);
  } catch {
    return json({ ok: false, error: "Invalid request." }, 400);
  }

  // Honeypot: if a bot filled the hidden field, pretend everything's fine.
  if (payload.company && payload.company.trim() !== "") {
    return json({ ok: true });
  }

  const name = (payload.name || "").trim();
  const email = (payload.email || "").trim();
  const message = (payload.message || "").trim();

  // Validation
  if (!name || !email || !message) {
    return json({ ok: false, error: "Please fill in every field." }, 400);
  }
  if (!isEmail(email)) {
    return json(
      { ok: false, error: "Please enter a valid email address." },
      400,
    );
  }
  if (message.length > 5000) {
    return json({ ok: false, error: "That message is a bit too long." }, 400);
  }

  const submittedAt = new Date().toISOString();
  const failures: string[] = [];

  // --- 1) Email via Resend (primary: must reach the inbox) -------------
  const resendKey = import.meta.env.RESEND_API_KEY;
  const toEmail = import.meta.env.CONTACT_TO_EMAIL;
  const fromEmail = import.meta.env.CONTACT_FROM_EMAIL;

  if (resendKey && toEmail && fromEmail) {
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(resendKey);
      const { error } = await resend.emails.send({
        from: fromEmail,
        to: [toEmail],
        replyTo: email,
        subject: `New website inquiry — ${name}`,
        text:
          `New contact form submission from coldrock.co\n\n` +
          `Name:    ${name}\n` +
          `Email:   ${email}\n` +
          `When:    ${submittedAt}\n\n` +
          `Message:\n${message}\n`,
      });
      if (error) throw new Error(error.message);
    } catch (err) {
      console.error("[contact] Resend error:", err);
      failures.push("email");
    }
  } else {
    console.error("[contact] Resend env vars missing.");
    failures.push("email");
  }

  // --- 2) Notion (best-effort request tracking) -----------------------
  const notionToken = import.meta.env.NOTION_TOKEN;
  const notionDb = import.meta.env.NOTION_DATABASE_ID;

  if (notionToken && notionDb) {
    try {
      const { Client } = await import("@notionhq/client");
      const notion = new Client({ auth: notionToken });

      type CreateArgs = Parameters<
        InstanceType<typeof Client>["pages"]["create"]
      >[0];

      // Core properties — names/types must match the Notion DB exactly.
      const baseProperties = {
        Name: { title: [{ text: { content: name } }] },
        Email: { email },
        Message: { rich_text: [{ text: { content: message } }] },
        Status: { select: { name: "New" } },
        Source: {
          rich_text: [{ text: { content: "Website contact form" } }],
        },
        Submitted: { date: { start: submittedAt } },
      };

      // Area relation → ties each request to the "Cold Rock" Area record so
      // it surfaces in the hub's Area-filtered views. Overridable via env.
      const areaPageId =
        import.meta.env.NOTION_AREA_PAGE_ID ||
        "35fe9184-8572-81c6-ac19-da14ce00f7bf";

      try {
        await notion.pages.create({
          parent: { database_id: notionDb },
          properties: {
            ...baseProperties,
            Area: { relation: [{ id: areaPageId }] },
          },
        } as CreateArgs);
      } catch (areaErr) {
        // Writing the relation requires the integration to also have access
        // to the Areas database. If that isn't granted yet, still record the
        // request (without the Area link) rather than losing it entirely.
        console.error(
          "[contact] Notion create with Area failed; retrying without it:",
          areaErr,
        );
        await notion.pages.create({
          parent: { database_id: notionDb },
          properties: baseProperties,
        } as CreateArgs);
      }
    } catch (err) {
      console.error("[contact] Notion error:", err);
      // Non-fatal: the email is what matters most. Just log it.
    }
  } else {
    console.error("[contact] Notion env vars missing (tracking skipped).");
  }

  // The email is the must-have. If it failed, tell the user to reach out
  // directly rather than silently dropping their message.
  if (failures.includes("email")) {
    return json(
      {
        ok: false,
        error:
          "Something went wrong sending your message. Please email hello@coldrock.co directly.",
      },
      502,
    );
  }

  return json({ ok: true });
};
