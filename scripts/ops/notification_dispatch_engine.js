/**
 * MOTEUR DE NOTIFICATIONS AVEC DÉDOUBLONNAGE & RETRY (HORS PRODUCTION)
 * Fichier : scripts/ops/notification_dispatch_engine.js
 */

class NotificationDispatchEngine {
  constructor() {
    this.deliveredEvents = new Set();
    this.deadLetterQueue = [];
  }

  dispatchNotification(eventId, channel, recipient, message, maxRetries = 3) {
    if (this.deliveredEvents.has(eventId)) {
      return { status: "ALREADY_DELIVERED", eventId, duplicate: true };
    }

    let attempts = 0;
    let delivered = false;

    while (attempts < maxRetries && !delivered) {
      attempts++;
      // Simule un taux de succès (95%)
      if (recipient.startsWith("+229") || channel === "PUSH") {
        delivered = true;
      }
    }

    if (delivered) {
      this.deliveredEvents.add(eventId);
      return { status: "DELIVERED", eventId, attempts, channel };
    } else {
      this.deadLetterQueue.push({ eventId, recipient, message, failedAt: new Date().toISOString() });
      return { status: "FAILED_TO_DEAD_LETTER", eventId, attempts };
    }
  }
}

function testNotificationEngine() {
  const engine = new NotificationDispatchEngine();

  const notif1 = engine.dispatchNotification("EVT-NOTIF-01", "SMS", "+22997000000", "Votre code de retrait est 4829");
  const notifDup = engine.dispatchNotification("EVT-NOTIF-01", "SMS", "+22997000000", "Votre code de retrait est 4829");
  const notifInvalid = engine.dispatchNotification("EVT-NOTIF-02", "SMS", "INVALID-PHONE", "Message test");

  const passed = notif1.status === "DELIVERED" &&
                 notifDup.status === "ALREADY_DELIVERED" &&
                 notifInvalid.status === "FAILED_TO_DEAD_LETTER" &&
                 engine.deadLetterQueue.length === 1;

  return { suite: "Moteur Notifications & Dédoublonnage", status: passed ? "PASSED" : "FAILED", passed };
}

if (require.main === module) {
  console.log(testNotificationEngine());
}

module.exports = { NotificationDispatchEngine, testNotificationEngine };
