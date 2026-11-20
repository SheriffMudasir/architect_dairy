#!/usr/bin/env bash
# Synthesised, license-free sound effects (FFmpeg only).
set -euo pipefail
D=public/sfx
mkdir -p "$D"
# soft airy whoosh for camera moves
ffmpeg -v error -y -f lavfi -i "anoisesrc=d=1.1:c=pink:a=0.5" \
  -af "highpass=f=300,lowpass=f=3500,afade=t=in:d=0.45:curve=qsin,afade=t=out:st=0.45:d=0.65:curve=qsin,volume=0.8" -ar 48000 -ac 2 "$D/whoosh.wav"
# deep soft thud (plan scrapped)
ffmpeg -v error -y -f lavfi -i "sine=f=52:d=1.8" -f lavfi -i "anoisesrc=d=0.08:c=brown:a=0.6" \
  -filter_complex "[0]afade=t=out:st=0.05:d=1.7:curve=exp,volume=1.6[a];[1]lowpass=f=400,volume=0.7[b];[a][b]amix=inputs=2:normalize=0,alimiter=limit=0.9" -ar 48000 -ac 2 "$D/thud.wav"
# rising swell (a building goes up)
ffmpeg -v error -y -f lavfi -i "anoisesrc=d=2.2:c=pink:a=0.35" -f lavfi -i "sine=f=110:d=2.2" \
  -filter_complex "[0]bandpass=f=900:w=1.2,volume=0.7[n];[1]volume=0.25[s];[n][s]amix=inputs=2:normalize=0,afade=t=in:d=1.8:curve=exp,afade=t=out:st=1.9:d=0.3" -ar 48000 -ac 2 "$D/swell.wav"
# soft paper tick (cards, numbers, name plates)
ffmpeg -v error -y -f lavfi -i "anoisesrc=d=0.09:c=white:a=0.9" -f lavfi -i "sine=f=1800:d=0.09" \
  -filter_complex "[0]bandpass=f=2400:w=0.9,volume=0.8[n];[1]volume=0.25[s];[n][s]amix=inputs=2:normalize=0,afade=t=out:st=0.005:d=0.08:curve=exp" -ar 48000 -ac 2 "$D/tick.wav"
echo "sfx ready"
