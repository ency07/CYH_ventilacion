"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { crmNotifications, crmCustomerContacts, crmTenantIntegrations, crmNotificationEvents } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth/permissions";
import { eq } from "drizzle-orm";
import { Resend } from "resend";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export interface NotificationInput {
  customerId: string | null;
  userId: string | null;
  eventType: "emergencia" | "garantia" | "comercial" | "ingenieria" | "ticket_comment" | "lead_created" | "proposal_accepted" | "request_created" | string;
  title: string;
  message: string;
  severity: "info" | "warning" | "critical";
}

export interface NotificationCredentials {
  telegramBotToken: string;
  telegramChatIdServicio: string;
  resendApiKey: string;
  twilioAccountSid: string;
  twilioAuthToken: string;
  twilioWhatsappFrom: string;
}

/**
 * Decoupled notification sender. Inserts persistent rows in `crm_notifications`
 * and schedules async third-party dispatches (Email, Telegram, WhatsApp) without blocking.
 */
export async function sendNotificationActionInternal(
  txOrDb: any,
  input: NotificationInput
): Promise<boolean> {
  const { customerId, userId, eventType, title, message, severity } = input;

  try {
    // 1. Always insert a 'bell' notification for the Notification Center 🔔 (if customerId or userId exists)
    if (customerId || userId) {
      await txOrDb.insert(crmNotifications).values({
        customerId,
        userId,
        title,
        message,
        channel: "bell",
        severity,
        isRead: false,
      });
    }

    // Determine additional channels based on severity
    // - critical: Email + Telegram + WhatsApp
    // - warning: Email + Telegram
    // - info: Email
    const channels: string[] = ["email"];
    if (severity === "critical") {
      channels.push("telegram", "whatsapp");
    } else if (severity === "warning") {
      channels.push("telegram");
    }

    // Fetch client contact info for delivery
    let clientEmail = "cyhingenieria5@gmail.com";
    let clientPhone = "";

    if (customerId) {
      const contacts = await txOrDb
        .select()
        .from(crmCustomerContacts)
        .where(eq(crmCustomerContacts.customerId, customerId))
        .limit(1);
      
      if (contacts.length > 0) {
        if (contacts[0].email) clientEmail = contacts[0].email;
        if (contacts[0].phone) clientPhone = contacts[0].phone;
      }
    }

    // Query active integrations config from DB
    let dbIntegrations = null;
    try {
      const integrationsList = await txOrDb.select().from(crmTenantIntegrations).limit(1);
      if (integrationsList.length > 0) {
        dbIntegrations = integrationsList[0];
      }
    } catch (e) {
      console.warn("Could not query crm_tenant_integrations:", e);
    }

    // Resolve integration credentials with fallback to process.env
    const telegramBotToken = dbIntegrations?.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN || "";
    const telegramChatIdVentas = dbIntegrations?.telegramChatIdVentas || process.env.TELEGRAM_CHAT_ID_VENTAS || "";
    const telegramChatIdServicio = dbIntegrations?.telegramChatIdServicio || process.env.TELEGRAM_CHAT_ID_SERVICIO || "";
    const telegramChatIdIngenieria = dbIntegrations?.telegramChatIdIngenieria || process.env.TELEGRAM_CHAT_ID_INGENIERIA || "";
    const telegramChatIdDireccion = dbIntegrations?.telegramChatIdDireccion || process.env.TELEGRAM_CHAT_ID_DIRECCION || "";
    const telegramChatIdPostventa = dbIntegrations?.telegramChatIdPostventa || process.env.TELEGRAM_CHAT_ID_POSTVENTA || "";

    const resendApiKey = dbIntegrations?.resendApiKey || process.env.RESEND_API_KEY || "";

    const twilioAccountSid = dbIntegrations?.twilioAccountSid || process.env.TWILIO_ACCOUNT_SID || "";
    const twilioAuthToken = dbIntegrations?.twilioAuthToken || process.env.TWILIO_AUTH_TOKEN || "";
    const twilioWhatsappFrom = dbIntegrations?.twilioWhatsappFrom || process.env.TWILIO_WHATSAPP_FROM || "whatsapp:+14155238886";

    // Resolve Telegram Channels based on routing rules
    const telegramChatIds: string[] = [];
    const eventUpper = eventType.toUpperCase();

    if (eventUpper.includes("EMERGENCIA") || eventUpper.includes("PARADA_PLANTA")) {
      if (telegramChatIdServicio) telegramChatIds.push(telegramChatIdServicio);
      if (telegramChatIdDireccion) telegramChatIds.push(telegramChatIdDireccion);
    } else if (eventUpper.includes("GARANTIA") || eventUpper.includes("POSTVENTA")) {
      const postVentaId = telegramChatIdPostventa || telegramChatIdServicio;
      if (postVentaId) telegramChatIds.push(postVentaId);
    } else if (eventUpper.includes("COMERCIAL") || eventUpper.includes("VENTAS") || eventUpper.includes("PROPOSAL") || eventUpper.includes("MEETING")) {
      if (telegramChatIdVentas) telegramChatIds.push(telegramChatIdVentas);
    } else if (eventUpper.includes("INGENIERIA") || eventUpper.includes("DIAGNOSTIC") || eventUpper.includes("DIAGNOSTICO")) {
      if (telegramChatIdIngenieria) telegramChatIds.push(telegramChatIdIngenieria);
    } else {
      // Default fallback
      if (telegramChatIdServicio) telegramChatIds.push(telegramChatIdServicio);
    }

    const credentials: NotificationCredentials = {
      telegramBotToken,
      telegramChatIdServicio,
      resendApiKey,
      twilioAccountSid,
      twilioAuthToken,
      twilioWhatsappFrom,
    };

    // Insert persistent records for other channels
    for (const channel of channels) {
      const [notifRecord] = await txOrDb
        .insert(crmNotifications)
        .values({
          customerId,
          userId,
          title,
          message,
          channel,
          severity,
          isRead: false,
        })
        .returning();

      // Trigger asynchronous dispatch (non-blocking)
      dispatchExternalNotification(
        customerId,
        eventType,
        "crm_notifications",
        notifRecord.id,
        severity === "critical" ? "P1" : severity === "warning" ? "P2" : "P4",
        notifRecord.id,
        channel,
        clientEmail,
        clientPhone,
        telegramChatIds,
        title,
        message,
        credentials
      );
    }

    return true;
  } catch (err) {
    console.error("Error inserting persistent notification:", err);
    return false;
  }
}

/**
 * Public action exporter
 */
export async function sendNotificationAction(input: NotificationInput): Promise<ActionResult<{ success: boolean }>> {
  try {
    await requireRole(["admin", "tecnico", "vendedor", "cliente"]);
    const success = await sendNotificationActionInternal(db, input);
    return { success: true, data: { success } };
  } catch (error: any) {
    console.error("Notification Action Error:", error);
    return { success: false, error: error.message || "Fallo en el servicio de notificaciones." };
  }
}

/**
 * Non-blocking dispatch function that updates database status once resolved
 * Tracks attempts, errors, and retries in crm_notification_events (Fase 12+)
 */
function dispatchExternalNotification(
  customerId: string | null,
  eventType: string,
  entityType: string,
  entityId: string,
  priority: string,
  notifId: string,
  channel: string,
  email: string,
  phone: string,
  telegramChatIds: string[],
  title: string,
  message: string,
  credentials: NotificationCredentials
) {
  // Execute asynchronously, catching exceptions to avoid crashing main thread
  (async () => {
    let success = false;
    let lastError = "";
    let retries = 0;
    const maxRetries = 3;
    let eventRecordId = "";

    try {
      // 1. Log initial state in crm_notification_events
      const [eventRecord] = await db
        .insert(crmNotificationEvents)
        .values({
          customerId,
          eventType,
          entityType,
          entityId,
          priority: priority || "P4",
          channel,
          status: "pending",
          messageText: `${title}\n${message}`,
          retries: 0,
        })
        .returning();
      
      eventRecordId = eventRecord.id;

      while (retries < maxRetries && !success) {
        try {
          if (channel === "telegram") {
            if (telegramChatIds.length === 0) {
              const fallbackId = credentials.telegramChatIdServicio || "";
              success = await sendTelegramMessage(credentials.telegramBotToken, fallbackId, `<b>${title}</b>\n\n${message}`);
            } else {
              const results = await Promise.all(
                telegramChatIds.map(chatId => sendTelegramMessage(credentials.telegramBotToken, chatId, `<b>${title}</b>\n\n${message}`))
              );
              success = results.some(r => r === true);
            }
            if (!success) lastError = "Mensaje no pudo ser entregado a ningún chat de Telegram.";
          } else if (channel === "email") {
            const subject = `Notificación CYH: ${title}`;
            const html = `
              <div style="font-family: sans-serif; padding: 25px; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px;">
                <h2 style="color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; font-size: 18px;">CYH OS — Centro de Alertas</h2>
                <p style="font-size: 14px; font-weight: bold; color: #0f172a; margin-top: 15px;">${title}</p>
                <div style="background-color: #f8fafc; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; font-size: 13px; line-height: 1.6; border-radius: 4px;">
                  ${message}
                </div>
                <p style="font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px; margin-top: 25px;">
                  Este es un correo automatizado enviado por CYH OS. Por favor no responda a esta dirección.
                </p>
              </div>
            `;
            success = await sendEmailMessage(credentials.resendApiKey, email, subject, html);
            if (!success) lastError = "Resend falló al despachar el correo electrónico.";
          } else if (channel === "whatsapp") {
            const cleanMsg = message.replace(/<[^>]*>/g, "");
            success = await sendWhatsAppMessage(credentials.twilioAccountSid, credentials.twilioAuthToken, credentials.twilioWhatsappFrom, phone || "+573001234567", `⚠️ *${title}*\n\n${cleanMsg}`);
            if (!success) lastError = "Twilio falló al despachar el WhatsApp.";
          }
        } catch (dispatchErr: any) {
          lastError = dispatchErr.message || "Excepción no controlada durante el envío.";
        }

        if (success) {
          break;
        }

        retries++;
        if (retries < maxRetries) {
          // Wait 1 second before retrying (exponential backoff simulated)
          await new Promise(resolve => setTimeout(resolve, 1000));
          await db
            .update(crmNotificationEvents)
            .set({
              retries,
              error: lastError,
              status: "sending"
            })
            .where(eq(crmNotificationEvents.id, eventRecordId));
        }
      }

      // 2. Finalize status tracking in db
      if (success) {
        await db
          .update(crmNotificationEvents)
          .set({
            status: "success",
            sentAt: new Date(),
            retries,
            error: null
          })
          .where(eq(crmNotificationEvents.id, eventRecordId));

        await db
          .update(crmNotifications)
          .set({ isRead: true })
          .where(eq(crmNotifications.id, notifId));
      } else {
        await db
          .update(crmNotificationEvents)
          .set({
            status: "failed",
            retries,
            error: lastError || "Número máximo de reintentos alcanzado sin éxito."
          })
          .where(eq(crmNotificationEvents.id, eventRecordId));
      }
    } catch (err: any) {
      console.error(`[Async Dispatch Exception] channel=${channel}:`, err);
      if (eventRecordId) {
        try {
          await db
            .update(crmNotificationEvents)
            .set({
              status: "failed",
              error: err.message || "Fallo crítico en el proceso de despacho."
            })
            .where(eq(crmNotificationEvents.id, eventRecordId));
        } catch (dbErr) {
          console.error("Failed to update final crash status in crm_notification_events:", dbErr);
        }
      }
    }
  })();
}

// Telegram Sender API
async function sendTelegramMessage(token: string, chatId: string, text: string): Promise<boolean> {
  if (!token || !chatId) {
    console.warn(`[TELEGRAM MOCK] Chat ID ${chatId} or Bot Token not configured. Message: ${text}`);
    return true; // Mock success in dev
  }
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
    });
    return res.ok;
  } catch (err) {
    console.error("[TELEGRAM EXCEPTION]", err);
    return false;
  }
}

// Resend Email Sender API
async function sendEmailMessage(apiKey: string, to: string, subject: string, html: string): Promise<boolean> {
  if (!apiKey || apiKey.includes("placeholder")) {
    console.warn(`[EMAIL MOCK] Resend API key not configured. To: ${to}. Subject: ${subject}`);
    return true;
  }
  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: "CYH Ingeniería <onboarding@resend.dev>",
      to: [to],
      subject: subject,
      html: html,
    });
    return !error;
  } catch (err) {
    console.error("[EMAIL EXCEPTION]", err);
    return false;
  }
}

// Twilio WhatsApp Sender API
async function sendWhatsAppMessage(accountSid: string, authToken: string, fromNum: string, phone: string, text: string): Promise<boolean> {
  if (!accountSid || !authToken || !phone) {
    console.warn(`[WHATSAPP MOCK] Credentials or phone missing. Phone: ${phone}. Message: ${text}`);
    return true;
  }
  
  try {
    const toNum = phone.startsWith("whatsapp:") ? phone : `whatsapp:${phone}`;
    const basicAuth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        From: fromNum,
        To: toNum,
        Body: text,
      }),
    });
    return res.ok;
  } catch (err) {
    console.error("[WHATSAPP EXCEPTION]", err);
    return false;
  }
}

/**
 * Mark a persistent notification as read in the database
 */
export async function markNotificationAsReadAction(
  notificationId: string
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const user = await requireRole(["admin", "tecnico", "vendedor", "cliente"]);
    
    await db
      .update(crmNotifications)
      .set({ isRead: true })
      .where(eq(crmNotifications.id, notificationId));

    revalidatePath("/portal/inicio");
    return { success: true, data: { success: true } };
  } catch (error: any) {
    console.error("Mark Notification Read Error:", error);
    return { success: false, error: error.message || "Fallo al marcar notificación como leída." };
  }
}
