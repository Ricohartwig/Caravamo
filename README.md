# Caravamo

Caravamo by CarWo Marketplace

Grundgerüst eines Fahrzeug-Marktplatzes für Privat (B2C) und Händler (B2B). Die Angebote auf der Suche sind typisierte Platzhalter. Supabase ist vorbereitet, aber nicht mit einem echten Projekt verbunden.

## Start

```bash
npm install
cp .env.example .env.local
npm run dev
```

`.env.local` enthält `NEXT_PUBLIC_SUPABASE_URL` und `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Keine echten Schlüssel einchecken. `.env.example` zeigt nur Platzhalter.

Das Tabellenschema liegt in `supabase-schema.sql`. Fahrzeuge hängen an `auth.users`. Wohnmobile sind Zeilen in `vehicles` mit `type = 'Wohnmobil'`. Der öffentliche Storage-Bucket heißt `vehicle-images`. `/inserieren` ist nur angemeldet erreichbar. Die Google-Anmeldung braucht den Google-Provider im Supabase-Dashboard.
