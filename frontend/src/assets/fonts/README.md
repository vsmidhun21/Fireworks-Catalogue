# Noto Sans Tamil (embedded PDF font)

`NotoSansTamil-Regular.js` and `NotoSansTamil-Bold.js` each export a base64
string of a static TrueType instance of **Noto Sans Tamil**, used to embed
real, selectable Tamil glyphs into generated PDFs (see
`../../utils/pdfGenerator.js`).

## Why these files exist

jsPDF cannot rely on fonts installed on the user's OS and only understands
static (non-variable) TrueType/OpenType fonts. These files were produced
from Google's original variable font so that the price-list PDF can
`doc.addFont()` a single static weight per style.

## Provenance / how to regenerate

1. Source: the variable font published at
   `https://raw.githubusercontent.com/google/fonts/main/ofl/notosanstamil/NotoSansTamil%5Bwdth,wght%5D.ttf`
   (Noto Project, licensed under the SIL Open Font License 1.1 — see
   `OFL-LICENSE.txt`).
2. Pin a static instance per weight with fontTools:
   `fonttools varLib.instancer -o NotoSansTamil-400.ttf NotoSansTamil[wdth,wght].ttf wght=400 wdth=100`
   (and `wght=700` for bold).
3. Drop the now-unused `STAT` table.
4. Base64-encode the resulting `.ttf` and wrap it in an `export const ... = "...";`
   JS module (this avoids relying on a bundler's binary-asset loader).

The font covers the Tamil Unicode block plus Basic Latin (so digits,
punctuation and English text mixed into Tamil fields render correctly too).

## License

SIL Open Font License 1.1 — see `OFL-LICENSE.txt`. Free to embed/redistribute.
