# Worked example — "The Church That Took 144 Years" (Sagrada Família)

A complete, shipped episode (2:02). Use it as a pattern: the script data, how inserts are placed,
and how the storyboard drives a building by a `year` variable (time-lapse in the hook, rewind to
1883, slow growth during Gaudí's life, a fire scene, reassembly, growth to 2026, a hill comparison).
Media files and audio are not included — only the code.

Key techniques to copy:
- `year` per beat → `sagrada({ year })` model shows the building's state in that year.
- A ghost "plan" of all 18 towers popping in one by one (`planTowers`) while the narration counts.
- Moving the camera to a separate part of the world for a side scene (the tram on Gran Via) and
  hiding the occluding block row for that beat only.
- Stamps for the breaks ("BURNED", "PERMIT GRANTED"), counters for the hard numbers.
