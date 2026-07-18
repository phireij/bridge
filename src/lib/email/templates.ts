import "server-only";

import { DATE_LABELS, SHOP, to12h } from "@/lib/reservations/config";
import type { Reservation } from "@/lib/reservations/types";

export type EmailKind = "received" | "confirmed" | "cancelled";

interface Composed {
  subject: string;
  html: string;
  text: string;
}

/**
 * Bilingual JP/EN transactional templates. Matches the on-site copy Hermes
 * drafted: reservation ref, date/time, party, shop name, JP address, phone.
 * Transactional only — no marketing content, no unsubscribe requirement.
 */
export function buildEmail(kind: EmailKind, r: Reservation): Composed {
  const dateEn = DATE_LABELS[r.reservation_date] ?? r.reservation_date;
  const timeEn = `${to12h(r.start_time)} – ${to12h(r.end_time)}`;
  const guestsEn = `${r.guests} guest${r.guests > 1 ? "s" : ""}`;
  const guestsJa = `${r.guests}名`;

  const meta = COPY[kind];
  const subject = `${meta.subjectEn} — ${r.ref}｜${meta.subjectJa} ${r.ref}`;

  const text = [
    meta.headlineEn,
    "",
    `Reference: ${r.ref}`,
    `Date: ${dateEn}`,
    `Time: ${timeEn}`,
    `Party: ${guestsEn}`,
    `Name: ${r.customer_name}`,
    "",
    meta.bodyEn,
    "",
    `Ruby's Cake Delights`,
    `${SHOP.addressJa}`,
    `${SHOP.areaEn}`,
    `Tel: ${SHOP.phone}`,
    "",
    "———————————————",
    "",
    meta.headlineJa,
    "",
    `予約番号: ${r.ref}`,
    `日付: ${dateEn}`,
    `時間: ${timeEn}`,
    `人数: ${guestsJa}`,
    `お名前: ${r.customer_name}`,
    "",
    meta.bodyJa,
    "",
    `Ruby's Cake Delights（ルビーズ ケーキ デライツ）`,
    SHOP.addressJa,
    `電話: ${SHOP.phone}`,
  ].join("\n");

  const html = `<!doctype html>
<html><head><meta charset="utf-8" /><meta name="color-scheme" content="light" /></head>
<body style="margin:0;padding:0;background:#fdf5f3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Noto Sans JP',Helvetica,Arial,sans-serif;color:#0a0a0a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fdf5f3;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #ffe0da;">
        <tr><td style="padding:20px 24px;border-bottom:1px solid #ffe0da;">
          <div style="font-size:14px;font-weight:600;">Ruby's Cake Delights</div>
          <div style="font-size:12px;color:#d3405b;margin-top:2px;">3rd Anniversary · July 25–26</div>
        </td></tr>
        <tr><td style="padding:24px;">
          <h1 style="font-size:18px;margin:0 0 8px 0;">${escapeHtml(meta.headlineEn)}</h1>
          <p style="margin:0 0 12px 0;color:#4b5563;font-size:14px;">${escapeHtml(meta.bodyEn)}</p>
          ${renderRefBlock(r, dateEn, timeEn, guestsEn)}
          <p style="margin:16px 0 0 0;font-size:12px;color:#6b7280;">Change or cancel? Call
            <a href="tel:${SHOP.phone.replace(/[^0-9]/g, "")}" style="color:#d3405b;text-decoration:none;font-weight:600;">${SHOP.phone}</a>
            with your reference.</p>

          <hr style="border:none;border-top:1px solid #ffe0da;margin:20px 0;" />

          <h2 style="font-size:16px;margin:0 0 8px 0;">${escapeHtml(meta.headlineJa)}</h2>
          <p style="margin:0 0 12px 0;color:#4b5563;font-size:14px;">${escapeHtml(meta.bodyJa)}</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fdf5f3;border-radius:12px;">
            <tr><td style="padding:14px 16px;">
              <div style="font-size:12px;color:#6b7280;">予約番号</div>
              <div style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:16px;font-weight:600;color:#d3405b;">${escapeHtml(r.ref)}</div>
              <div style="height:8px"></div>
              <table role="presentation" width="100%"><tbody>
                <tr><td style="font-size:13px;color:#6b7280;padding:2px 0;">日付</td><td style="font-size:13px;text-align:right;padding:2px 0;">${escapeHtml(dateEn)}</td></tr>
                <tr><td style="font-size:13px;color:#6b7280;padding:2px 0;">時間</td><td style="font-size:13px;text-align:right;padding:2px 0;">${escapeHtml(timeEn)}</td></tr>
                <tr><td style="font-size:13px;color:#6b7280;padding:2px 0;">人数</td><td style="font-size:13px;text-align:right;padding:2px 0;">${escapeHtml(guestsJa)}</td></tr>
                <tr><td style="font-size:13px;color:#6b7280;padding:2px 0;">お名前</td><td style="font-size:13px;text-align:right;padding:2px 0;">${escapeHtml(r.customer_name)}</td></tr>
              </tbody></table>
            </td></tr>
          </table>
          <p style="margin:16px 0 0 0;font-size:12px;color:#6b7280;">変更・キャンセルはお電話でお願いします（<a href="tel:${SHOP.phone.replace(/[^0-9]/g, "")}" style="color:#d3405b;text-decoration:none;font-weight:600;">${SHOP.phone}</a>）。</p>
        </td></tr>
        <tr><td style="padding:16px 24px;background:#fdf5f3;font-size:12px;color:#6b7280;border-top:1px solid #ffe0da;">
          Ruby's Cake Delights · ${escapeHtml(SHOP.addressJa)} · ${escapeHtml(SHOP.areaEn)}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  return { subject, html, text };
}

// ── copy per kind ────────────────────────────────────────────────────────────
const COPY = {
  received: {
    subjectEn: "Reservation received",
    subjectJa: "ご予約を受け付けました",
    headlineEn: "Reservation received!",
    headlineJa: "ご予約を受け付けました",
    bodyEn:
      "Your booking is pending confirmation — our team will review it shortly. Nothing more to do for now.",
    bodyJa:
      "ご予約は「承認待ち」の状態です。スタッフの確認後に確定します。追加のご対応は必要ございません。",
  },
  confirmed: {
    subjectEn: "Reservation confirmed",
    subjectJa: "ご予約が確定しました",
    headlineEn: "Your reservation is confirmed",
    headlineJa: "ご予約が確定しました",
    bodyEn:
      "We look forward to seeing you! Please arrive on time — seatings are 60 minutes.",
    bodyJa:
      "ご来店を心よりお待ちしております。お時間に遅れないようご注意ください（ご予約時間の60分間のお席です）。",
  },
  cancelled: {
    subjectEn: "Reservation cancelled",
    subjectJa: "ご予約がキャンセルされました",
    headlineEn: "Your reservation was cancelled",
    headlineJa: "ご予約がキャンセルされました",
    bodyEn:
      "This reservation has been cancelled. If this was unexpected, please call us and we'll get it sorted.",
    bodyJa:
      "こちらのご予約はキャンセルされました。お心当たりのない場合はお電話にてご連絡ください。",
  },
} as const;

function renderRefBlock(r: Reservation, dateEn: string, timeEn: string, guestsEn: string) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fdf5f3;border-radius:12px;">
    <tr><td style="padding:14px 16px;">
      <div style="font-size:12px;color:#6b7280;">Reference</div>
      <div style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:16px;font-weight:600;color:#d3405b;">${escapeHtml(r.ref)}</div>
      <div style="height:8px"></div>
      <table role="presentation" width="100%"><tbody>
        <tr><td style="font-size:13px;color:#6b7280;padding:2px 0;">Date</td><td style="font-size:13px;text-align:right;padding:2px 0;">${escapeHtml(dateEn)}</td></tr>
        <tr><td style="font-size:13px;color:#6b7280;padding:2px 0;">Time</td><td style="font-size:13px;text-align:right;padding:2px 0;">${escapeHtml(timeEn)}</td></tr>
        <tr><td style="font-size:13px;color:#6b7280;padding:2px 0;">Party</td><td style="font-size:13px;text-align:right;padding:2px 0;">${escapeHtml(guestsEn)}</td></tr>
        <tr><td style="font-size:13px;color:#6b7280;padding:2px 0;">Name</td><td style="font-size:13px;text-align:right;padding:2px 0;">${escapeHtml(r.customer_name)}</td></tr>
      </tbody></table>
    </td></tr>
  </table>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
