"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { crmNotifications, crmCustomerContacts } from "@/lib/db/schema";
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

    // Resolve Telegram Channels based on routing rules
    const telegramChatIds: string[] = [];
    const eventUpper = eventType.toUpperCase();

    if (eventUpper.includes("EMERGENCIA") || eventUpper.includes("PARADA_PLANTA")) {
      if (process.env.TELEGRAM_CHAT_ID_SERVICIO) telegramChatIds.push(process.env.TELEGRAM_CHAT_ID_SERVICIO);
      if (process.env.TELEGRAM_CHAT_ID_DIRECCION) telegramChatIds.push(process.env.TELEGRAM_CHAT_ID_DIRECCION);
    } else if (eventUpper.includes("GARANTIA") || eventUpper.includes("POSTVENTA")) {
      const postVentaId = process.env.TELEGRAM_CHAT_ID_POSTVENTA || process.env.TELEGRAM_CHAT_ID_SERVICIO;
      if (postVentaId) telegramChatIds.push(postVentaId);
    } else if (eventUpper.includes("COMERCIAL") || eventUpper.includes("VENTAS") || eventUpper.includes("PROPOSAL") || eventUpper.includes("MEETING")) {
      if (process.env.TELEGRAM_CHAT_ID_VENTAS) telegramChatIds.push(process.env.TELEGRAM_CHAT_ID_VENTAS);
    } else if (eventUpper.includes("INGENIERIA") || eventUpper.includes("DIAGNOSTIC") || eventUpper.includes("DIAGNOSTICO")) {
      if (process.env.TELEGRAM_CHAT_ID_INGENIERIA) telegramChatIds.push(process.env.TELEGRAM_CHAT_ID_INGENIERIA);
    } else {
      // Default fallback
      if (process.env.TELEGRAM_CHAT_ID_SERVICIO) telegramChatIds.push(process.env.TELEGRAM_CHAT_ID_SERVICIO);
    }

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
      dispatchExternalNotification(notifRecord.id, channel, clientEmail, clientPhone, telegramChatIds, title, message);
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
 */
function dispatchExternalNotification(
  notifId: string,
  channel: string,
  email: string,
  phone: string,
  telegramChatIds: string[],
  title: string,
  message: string
) {
  // Execute asynchronously, catching exceptions to avoid crashing main thread
  (async () => {
    let success = false;

    try {
      if (channel === "telegram") {
        if (telegramChatIds.length === 0) {
          // Fallback to servicio if no mapping matched
          const fallbackId = process.env.TELEGRAM_CHAT_ID_SERVICIO || "";
          success = await sendTelegramMessage(fallbackId, `<b>${title}</b>\n\n${message}`);
        } else {
          // Send to all matched chats
          const results = await Promise.all(
            telegramChatIds.map(chatId => sendTelegramMessage(chatId, `<b>${title}</b>\n\n${message}`))
          );
          success = results.some(r => r === true);
        }
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
        success = await sendEmailMessage(email, subject, html);
      } else if (channel === "whatsapp") {
        const cleanMsg = message.replace(/<[^>]*>/g, "");
        success = await sendWhatsAppMessage(phone || "+573001234567", `⚠️ *${title}*\n\n${cleanMsg}`);
      }

      // Update delivery status in DB
      if (success) {
        await db
          .update(crmNotifications)
          .set({ isRead: true }) // Set as processed/read internally for external delivery audit
          .where(eq(crmNotifications.id, notifId));
      }
    } catch (err) {
      console.error(`[Async Dispatch Exception] channel=${channel}:`, err);
    }
  })();
}

// Telegram Sender API
async function sendTelegramMessage(chatId: string, text: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
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
async function sendEmailMessage(to: string, subject: string, html: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
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
async function sendWhatsAppMessage(phone: string, text: string): Promise<boolean> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNum = process.env.TWILIO_WHATSAPP_FROM || "whatsapp:+14155238886";
  
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
