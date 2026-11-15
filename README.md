# Caravamo

Caravamo by CarWo Marketplace

Grundgerüst eines Fahrzeug-Marktplatzes für Privat (B2C) und Händler (B2B). Startseite und Suche zeigen bezahlte Inserate aus Supabase. Angemeldete Nutzer stellen Fahrzeuge über `/inserieren` ein, bezahlen bei Stripe und finden unter `/dashboard` Merkliste, gespeicherte Suchen, Anfragen, Verlauf, Vergleich, eigene Inserate und das Profil.

Ein neues Inserat bleibt `entwurf`, bis der Webhook `/api/webhooks/stripe` eine bezahlte Checkout-Sitzung bestätigt. Danach steht der Status auf `aktiv` und `published_until` liegt 30 Tage in der Zukunft. Privat kostet 4,99 €, Händler 6,99 €. Die Schlüssel `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_PRIVAT`, `STRIPE_PRICE_HAENDLER` und `SUPABASE_SERVICE_ROLE_KEY` bleiben außerhalb von Git.

## Start

```bash
npm install
cp .env.example .env.local
npm run dev
```

`.env.local` enthält `NEXT_PUBLIC_SUPABASE_URL` und `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Keine echten Schlüssel einchecken. `.env.example` zeigt nur Platzhalter.

Das Tabellenschema liegt in `supabase-schema.sql`. Fahrzeuge hängen an `auth.users`. Wohnmobile sind Zeilen in `vehicles` mit `type = 'Wohnmobil'`. Der öffentliche Storage-Bucket heißt `vehicle-images`. `/inserieren` ist nur angemeldet erreichbar. Die Google-Anmeldung braucht den Google-Provider im Supabase-Dashboard.

Die Bestätigungsmail liegt in `supabase/templates/confirmation.html`. Betreff: „Caravamo: Bitte bestätige deine E-Mail“. Sie wird im Supabase-Dashboard unter Authentication → Email Templates → Confirm signup hinterlegt. Die Mail zum neuen Passwort liegt in `supabase/templates/recovery.html`. Betreff: „Caravamo: Setze dein Passwort neu“, Vorlage Reset password.

Eine neue Anfrage und jede Antwort schicken eine E-Mail an die andere Seite. Dafür stehen `RESEND_API_KEY` und `MAIL_FROM` in der Umgebung, zum Beispiel `Caravamo <anfragen@deine-domain.de>`. Die Absenderadresse muss bei Resend bestätigt sein. Fehlen die Werte, bleibt die Nachricht im Konto und es geht keine Mail hinaus.
