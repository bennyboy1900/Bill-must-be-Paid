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

1. **Sparschweine zerschlagen** – Jeder Schlag kostet Ausdauer. Wenn deine Hand müde ist, ist Feierabend.
2. **Rechnungen bezahlen** – Jede Rechnung hat eine Frist in Tagen (1 Run = 1 Tag). Verpasst du sie: **Bankrott**.
3. **Perks wählen** – Nach jeder bezahlten Rechnung: Wähle 1 von 3 Karten (Gewöhnlich / Selten / Episch).
4. **Skillbaum** – Über 90 Knoten in 10 Pfaden: Griffkraft, Handgelenk, Steinregen, Elektro, Frost, Glück, Gier, Schweinezucht, Fitnessstudio, Koffein.
5. **Bankrott & Prestige** – Neue Rekorde geben Vermächtnispunkte (Rechnung #5 = 5 VP). Gib sie im Schmuckkasten für 20 Ringe und 5 Armbänder aus.

## ✨ Inhalte

- **27 Sparschweine** mit eigenem Verhalten: Flitzer laufen weg, Schlafmützen pennen, Schwarzgeld-Schweine
  hauen ab, Tresorschweine sind gepanzert, Geisterschweine werden unsichtbar, Ninjas weichen aus,
  Mama-Schweine werfen Ferkel, Clowns teilen sich, Vampire regenerieren, das Finanzamt pfändet…
- **15 Hämmer** (Holzhammer, Baguette, Bratpfanne, Mjölnir, Banhammer, BEZAHLT-Stempel …) –
  aufwertbar bis Stufe 25 mit **5 Sternen** und leuchtenden Auren
- **6 Verzauberungen** in der Schmiede: Flammenschlag, Vampirschlag, Echo-Geisterhammer, Goldener Schlag, Schockwelle, Juwelier
- **33 Perks**, **20 Ringe + 5 Armbänder**
- **24 seltene Sammelmünzen** mit dauerhaften Boni und Set-Boni im Münzalbum
- **Schweinedex**, **35 Erfolge**, Statistiken
- Jackpots, Goldrausch, Raserei, Party- & Disco-Buffs, Lottoscheine, Kaffee & Energy-Drinks
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
