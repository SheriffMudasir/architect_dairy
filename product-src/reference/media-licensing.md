# Stock media: choosing and licensing

## Accept only
CC0 · Public Domain Mark · CC BY · CC BY-SA · Pexels License · Pixabay Content License.
Never ND (we crop, tint and animate) or NC (videos are usually monetised). The search command
already filters Openverse and Wikimedia results to these.

## Reject even if labelled CC
- Re-uploads of professional work: "Portrait by <famous photographer>" posted by an aggregator,
  agency photos (REUTERS, AP, Getty, AFP), screenshots, magazine scans, other people's artwork
  photographed and re-licensed.
- Recognisable private individuals as the main subject; watermarked or heavily filtered images.
- Photos of architectural renders/drawings by the original architects (copyrighted) — use your own
  3D reconstruction for unbuilt designs instead.

Prefer prolific original photographers, government/public-domain sources and museum open-access.

## Always look before use
Titles lie. Build a labelled contact sheet and inspect it:
```bash
S=/tmp/m; mkdir -p $S; i=0; for f in public/ep01/media/*.jpg; do ffmpeg -v error -y -i $f -vf "scale=300:300:force_original_aspect_ratio=decrease,pad=300:300:(ow-iw)/2:(oh-ih)/2:white,drawtext=text='$i':x=4:y=4:fontsize=18:fontcolor=red" $S/$(printf %02d $i).png; i=$((i+1)); done; ffmpeg -v error -y -pattern_type glob -i "$S/*.png" -vf tile=6x2 $S/sheet.jpg
```
For video, grab a frame: `ffmpeg -ss 2 -i clip.mp4 -frames:v 1 frame.jpg`.

## Credits
`public/<ep>/media/credits.json` is written on download and drives the credit line on every photo
and the end-card. Only media used by `inserts` is credited in the video. Delete rejected files and
their credits entries. Paste `npm run media -- <ep> credits` into the video description.
