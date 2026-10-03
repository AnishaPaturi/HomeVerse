# HomeVerse procedural baseline

Geometry is metric; polygon/bbox coordinates are normalized to the rendered image. One mask pixel value equals its room ID; zero is background. All variants of a layout share one split. Room polygons describe nominal floor regions bounded by wall centerlines; rendered wall strokes may cover boundary pixels.

Limitations: rectangular partition layouts, three rendering styles, no perspective transforms, and no audited building-code compliance. A 'none' scale mode is for relative geometry evaluation, not absolute metric accuracy.
