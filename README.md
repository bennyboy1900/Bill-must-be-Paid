# 🐷🔨 Bill Must Be Paid – Pixel Edition

Ein Active-Incremental-Game im Pixelart-Stil: **Bill** hat Rechnungen. Viele Rechnungen.
Aber er hat auch Sparschweine. *Sehr viele* Sparschweine.

Zerschlage Sparschweine, sammle Münzen, bezahle deine Rechnungen – oder geh bankrott
und starte mit mächtigen Ringen neu.

> Fan-Klon inspiriert von „Bills Must Be Paid". Alle Grafiken werden prozedural als
> Pixelart erzeugt, alle Sounds und die Musik werden live per WebAudio synthetisiert –
> keine externen Assets, keine Abhängigkeiten.

## ▶️ Spielen

Einfach `index.html` im Browser öffnen – fertig. Läuft auf Desktop **und** Tablet/Handy (Touch).

Oder über GitHub Pages: *Settings → Pages → Branch auswählen* und die Seite aufrufen.

Lokal mit Server (optional):

```bash
npx serve .
```

## 🎮 Steuerung

| Aktion | Maus / Touch | Tastatur |
|---|---|---|
| Zuschlagen | Gedrückt halten / tippen | – |
| Steinregen | Button unten links | `Leertaste` |
| Pause | Pause-Button | `Esc` / `P` |
| Skillbaum verschieben | Ziehen | Pfeiltasten / WASD |
| Ton an/aus | Einstellungen | `M` |
| Vollbild | Hauptmenü | `F` |

## 🧾 Spielprinzip

1. **Sparschweine zerschlagen** – In der Holzkiste auf Bills Schreibtisch. Jeder Schlag kostet Ausdauer. Wenn deine Hand müde ist, ist Feierabend.
2. **Rechnungen bezahlen** – Jede Rechnung hat eine Frist in Tagen (1 Run = 1 Tag). Verpasst du sie: **Bankrott**.
   Wer **vor der Frist** zahlt, bekommt **Skonto in Diamanten** (pro übrigem Tag) – steht direkt auf der Rechnung und am Bezahlen-Knopf.
3. **Perks wählen** – Nach jeder bezahlten Rechnung: Wähle 1 von 3+ Karten (Gewöhnlich / Selten / Episch / Legendär).
4. **Zwei Skillbäume**
   - **Geld-Baum** – Über 100 Knoten in 11 Pfaden: Griffkraft, Handgelenk, Steinregen, Elektro, Frost, Glück, Gier, Schweinezucht, Fitnessstudio, Koffein, Feuerwerk. Wird beim Bankrott zurückgesetzt.
   - **Diamanten-Baum** – 40 dauerhafte Knoten in 6 Pfaden: Werkstatt, Glücksspiel, Buchhaltung, Kondition, Schweinestall, Kartentisch. Kostet Diamanten und bleibt für immer.
5. **Bankrott & Prestige** – Neue Rekorde geben Vermächtnispunkte (Rechnung #5 = 5 VP). Gib sie im Schmuckkasten für 20 Ringe, 5 Armbänder und 23 **Perk-Karten** aus (zweiter Tab) – freigeschaltete Karten tauchen danach in der Perk-Auswahl auf. Beim Bankrott verlierst du Geld, Geld-Skills, Perks und deine Hämmer (zurück zum Holzhammer) – Diamanten, Diamanten-Skills, Verzauberungen, Sammlung, Ringe und Perk-Karten bleiben.

## ✨ Inhalte

- **27 Sparschweine** mit eigenem Verhalten: Flitzer laufen weg, Schlafmützen pennen, Schwarzgeld-Schweine
  hauen ab, Tresorschweine sind gepanzert, Geisterschweine werden unsichtbar, Ninjas weichen aus,
  Mama-Schweine werfen Ferkel, Clowns teilen sich, Vampire regenerieren, das Finanzamt pfändet…
- **15 Hämmer** (Holzhammer, Baguette, Bratpfanne, Mjölnir, Banhammer, BEZAHLT-Stempel …) –
  aufwertbar bis Stufe 25 mit **5 Sternen** und leuchtenden Auren (werden beim Bankrott zurückgesetzt)
- **6 Verzauberungen** in der Schmiede: Flammenschlag, Vampirschlag, Echo-Geisterhammer, Goldener Schlag, Schockwelle, Juwelier
- **55 Perks** (23 davon als Perk-Karten mit VP freischaltbar), **20 Ringe + 5 Armbänder**
- **24 seltene Sammelmünzen** mit dauerhaften Boni und Set-Boni im Münzalbum
- **Schweinedex**, **39 Erfolge**, Statistiken
- **Gerichtsvollzieher-Boss** am letzten Tag vor der Fälligkeit und **26 Tagesereignisse** (Ferkel-Flut, Zirkus in der Stadt, Geisterstunde, Silvester, Schwergewichte, Montagmorgen, Razzia, Happy Hour, Hitzewelle, Gewitter …)
- Jackpots, Goldrausch, Raserei, Party- & Disco-Buffs, Lottoscheine, Kaffee & Energy-Drinks
- **30 echte Rechnungen** von der Handyrechnung bis zur BER-Nachzahlung und **24 lustige Sonderrechnungen**, die es wirklich gibt (Schlüsseldienst, Minibar, Blitzer-Strafe, Inkasso, Bücherei-Mahnung …) – sie ersetzen zufällig normale Rechnungen, gleicher Betrag, gleiche Frist, mit Posten-Liste
- Bill mit 9 Gesichtsausdrücken, Sprechblasen und über 60 Sprüchen
- Juice: Hitstop, Screenshake, Squash-&-Stretch-Federphysik, Sprite-Bruchstücke, Münzregen, Schwungspuren

## 🛠 Technik

Reines HTML5-Canvas + Vanilla-JavaScript (keine Build-Tools):

```
index.html
js/util.js       Mathe, Zufall, Easing, Farben, Zahlenformat
js/font.js       eigene Bitmap-Pixelschrift (inkl. Umlaute, Fettschnitt)
js/audio.js      synthetisierte Soundeffekte + Chiptune-Sequencer
js/sprites.js    prozedurale Pixelart (Schweine, Hämmer, Münzen, Bill, Tisch …)
js/data.js       sämtlicher Spielinhalt
js/state.js      Spielstand (localStorage) & Werteberechnung
js/ui.js         Input, Pixel-UI, Toasts, Übergänge
js/run.js        Gameplay
js/scenes.js     Titel, Intro, Hub, Perks, Bankrott, Schmuckkasten
js/hub_views.js  Skillbaum, Schmiede, Sammlung, Erfolge
js/main.js       Loop, Skalierung, Einstellungen
```

Gerendert wird in nativer Bildschirmauflösung (ganzzahliger Pixel-Faktor), wodurch sich
Objekte subpixel-genau und flüssig bewegen, während die Pixel knackig bleiben.

Der Spielstand wird automatisch im Browser gespeichert.
