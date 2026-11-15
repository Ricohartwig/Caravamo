# Caravamo

Caravamo by CarWo Marketplace

Grundgerüst eines Fahrzeug-Marktplatzes für Privat (B2C) und Händler (B2B). Die Angebote auf der Suche sind typisierte Platzhalter. Supabase ist vorbereitet, aber nicht mit einem echten Projekt verbunden.

## Start

```bash
npm install
cp .env.example .env.local
npm run dev
```

`.env.local` enthält nur Platzhalter für `NEXT_PUBLIC_SUPABASE_URL` und `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Keine echten Schlüssel einchecken.

Das Tabellenschema liegt in `supabase-schema.sql`. Row-Level-Security ist eingeschaltet, die Policies stehen als Kommentare im SQL.
