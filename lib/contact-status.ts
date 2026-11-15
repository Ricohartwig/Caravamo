const contactMessages: Record<string, string> = {
  name: "Trag deinen Namen ein.",
  email: "Die E-Mail-Adresse sieht nicht gültig aus.",
  phone: "Trag eine Telefonnummer ein, unter der der Anbieter dich erreicht.",
  message: "Schreib mindestens einen kurzen Satz, höchstens 2.000 Zeichen.",
  inserat: "Dieses Inserat nimmt gerade keine Anfrage an.",
  einrichtung: "Der Versand ist gerade nicht eingerichtet. Versuch es später noch einmal.",
  versand: "Die Nachricht konnte nicht gesendet werden.",
};

export function contactMessage(code: string | null): string | null {
  if (!code || code === "gesendet") {
    return null;
  }

  return contactMessages[code] ?? null;
}
