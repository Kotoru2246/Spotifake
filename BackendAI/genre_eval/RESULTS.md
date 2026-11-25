# Genre classifier evaluation checkpoint

All labels are artist-level and UNREVIEWED (see `artist_genre_map.csv`). Accuracy = top-1 in acceptable set; macro-F1 uses first acceptable label as gold (over classes with support).

## Headline (accuracy / artist-balanced accuracy / macro-F1)

Acceptance bar: 75% accuracy. Artist-balanced = mean of per-artist accuracy, so large catalogues do not dominate.

| model | 10-class | 11-class |
|---|---|---|
| CNN baseline (current) | 0.609 / 0.575 / 0.456 | 0.492 / 0.515 / 0.352 (n=2391) |
| CLAP zero-shot | 0.012 / 0.010 / 0.023 | 0.013 / 0.010 / 0.023 (n=2391) |
| CLAP + LogReg (LOAO) | 0.568 / 0.546 / 0.533 | 0.527 / 0.523 / 0.498 (n=2391) |
| PANNs Cnn14 + LogReg (LOAO) | 0.774 / 0.778 / 0.751 | 0.714 / 0.740 / 0.692 (n=2391) |

n(10-class)=1932 (j-pop artists DECO*27, Ado, YOASOBI excluded), n(11-class)=2391. CNN has no j-pop output, so it scores 0 on every j-pop song in the 11-class set. CLAP zero-shot is broken with laion/larger_clap_music on transformers 5.24 (predicts jazz for almost everything even through the model own logits; weights load cleanly), so ignore that row.

## Best new model: `panns-lr-10` (acc 0.774)

### Per-artist accuracy (best vs CNN)

| artist | n | best | CNN |
|---|---|---|---|
| The Weeknd | 189 | 0.70 | 0.32 |
| Red Hot Chili Peppers | 179 | 0.94 | 0.81 |
| Drake | 122 | 0.95 | 0.72 |
| Taylor Swift | 112 | 0.54 | 0.46 |
| J. Cole | 108 | 0.94 | 0.85 |
| Arctic Monkeys | 103 | 0.75 | 0.88 |
| Kendrick Lamar | 98 | 0.90 | 0.84 |
| Foo Fighters | 94 | 0.96 | 0.96 |
| Shawn Mendes | 88 | 0.50 | 0.30 |
| Joji | 87 | 0.87 | 0.48 |
| Travis Scott | 85 | 0.79 | 0.66 |
| Avicii | 79 | 0.58 | 0.73 |
| SZA | 76 | 0.95 | 0.45 |
| Porter Robinson | 66 | 0.45 | 0.71 |
| Charlie Puth | 65 | 0.65 | 0.46 |
| H.E.R. | 64 | 0.58 | 0.00 |
| Ngọt | 57 | 0.70 | 0.70 |
| Jamie Paige | 56 | 0.98 | 1.00 |
| Daniel Caesar | 50 | 0.70 | 0.00 |
| Dreamville | 44 | 0.86 | 0.93 |
| Thắng | 33 | 0.24 | 0.39 |
| Thịnh Suy | 28 | 0.86 | 0.21 |
| Sam Smith | 18 | 0.89 | 0.39 |
| PARTYNEXTDOOR | 15 | 0.93 | 0.60 |
| Huncho Jack | 12 | 1.00 | 0.83 |
| Eddie Benjamin | 4 | 1.00 | 0.25 |

### Confusion matrix (rows gold, cols predicted)

| gold / pred | electronic | hip-hop | pop | rock | soul-rnb |
|---|---|---|---|---|---|
| electronic | 116 | 5 | 57 | 0 | 8 |
| hip-hop | 9 | 417 | 7 | 2 | 28 |
| pop | 98 | 16 | 312 | 41 | 51 |
| rock | 3 | 2 | 29 | 376 | 23 |
| soul-rnb | 8 | 11 | 26 | 13 | 274 |

### All configs: per-artist accuracy

- **cnn-10**: The Weeknd 0.32, Red Hot Chili Peppers 0.81, Drake 0.72, Taylor Swift 0.46, J. Cole 0.85, Arctic Monkeys 0.88, Kendrick Lamar 0.84, Foo Fighters 0.96, Shawn Mendes 0.30, Joji 0.48, Travis Scott 0.66, Avicii 0.73, SZA 0.45, Porter Robinson 0.71, Charlie Puth 0.46, H.E.R. 0.00, Ngọt 0.70, Jamie Paige 1.00, Daniel Caesar 0.00, Dreamville 0.93, Thắng 0.39, Thịnh Suy 0.21, Sam Smith 0.39, PARTYNEXTDOOR 0.60, Huncho Jack 0.83, Eddie Benjamin 0.25
- **cnn-11**: Ado 0.00, The Weeknd 0.32, Red Hot Chili Peppers 0.81, DECO*27 0.00, Drake 0.72, Taylor Swift 0.46, J. Cole 0.85, Arctic Monkeys 0.88, YOASOBI 0.00, Kendrick Lamar 0.84, Foo Fighters 0.96, Shawn Mendes 0.30, Joji 0.48, Travis Scott 0.66, Avicii 0.73, SZA 0.45, Porter Robinson 0.71, Charlie Puth 0.46, H.E.R. 0.00, Ngọt 0.70, Jamie Paige 1.00, Daniel Caesar 0.00, Dreamville 0.93, Thắng 0.39, Thịnh Suy 0.21, Sam Smith 0.39, PARTYNEXTDOOR 0.60, Huncho Jack 0.83, Eddie Benjamin 0.25
- **clap-zeroshot-10**: The Weeknd 0.00, Red Hot Chili Peppers 0.03, Drake 0.00, Taylor Swift 0.01, J. Cole 0.00, Arctic Monkeys 0.10, Kendrick Lamar 0.00, Foo Fighters 0.01, Shawn Mendes 0.00, Joji 0.00, Travis Scott 0.00, Avicii 0.00, SZA 0.00, Porter Robinson 0.00, Charlie Puth 0.00, H.E.R. 0.00, Ngọt 0.05, Jamie Paige 0.05, Daniel Caesar 0.00, Dreamville 0.00, Thắng 0.00, Thịnh Suy 0.00, Sam Smith 0.00, PARTYNEXTDOOR 0.00, Huncho Jack 0.00, Eddie Benjamin 0.00
- **clap-zeroshot-11**: Ado 0.02, The Weeknd 0.00, Red Hot Chili Peppers 0.03, DECO*27 0.02, Drake 0.00, Taylor Swift 0.01, J. Cole 0.00, Arctic Monkeys 0.10, YOASOBI 0.00, Kendrick Lamar 0.00, Foo Fighters 0.01, Shawn Mendes 0.00, Joji 0.00, Travis Scott 0.00, Avicii 0.00, SZA 0.00, Porter Robinson 0.00, Charlie Puth 0.00, H.E.R. 0.00, Ngọt 0.05, Jamie Paige 0.05, Daniel Caesar 0.00, Dreamville 0.00, Thắng 0.00, Thịnh Suy 0.00, Sam Smith 0.00, PARTYNEXTDOOR 0.00, Huncho Jack 0.00, Eddie Benjamin 0.00
- **clap-lr-10**: The Weeknd 0.53, Red Hot Chili Peppers 0.63, Drake 0.97, Taylor Swift 0.24, J. Cole 0.81, Arctic Monkeys 0.46, Kendrick Lamar 0.47, Foo Fighters 0.94, Shawn Mendes 0.22, Joji 0.90, Travis Scott 0.55, Avicii 0.23, SZA 0.86, Porter Robinson 0.30, Charlie Puth 0.37, H.E.R. 0.38, Ngọt 0.28, Jamie Paige 0.75, Daniel Caesar 0.48, Dreamville 0.70, Thắng 0.39, Thịnh Suy 0.68, Sam Smith 0.61, PARTYNEXTDOOR 0.80, Huncho Jack 0.67, Eddie Benjamin 0.00
- **clap-lr-11**: Ado 0.46, The Weeknd 0.48, Red Hot Chili Peppers 0.46, DECO*27 0.50, Drake 0.90, Taylor Swift 0.21, J. Cole 0.79, Arctic Monkeys 0.48, YOASOBI 0.71, Kendrick Lamar 0.43, Foo Fighters 0.82, Shawn Mendes 0.31, Joji 0.86, Travis Scott 0.55, Avicii 0.20, SZA 0.72, Porter Robinson 0.27, Charlie Puth 0.35, H.E.R. 0.38, Ngọt 0.39, Jamie Paige 0.54, Daniel Caesar 0.50, Dreamville 0.70, Thắng 0.39, Thịnh Suy 0.75, Sam Smith 0.56, PARTYNEXTDOOR 0.87, Huncho Jack 0.58, Eddie Benjamin 0.00
- **panns-lr-10**: The Weeknd 0.70, Red Hot Chili Peppers 0.94, Drake 0.95, Taylor Swift 0.54, J. Cole 0.94, Arctic Monkeys 0.75, Kendrick Lamar 0.90, Foo Fighters 0.96, Shawn Mendes 0.50, Joji 0.87, Travis Scott 0.79, Avicii 0.58, SZA 0.95, Porter Robinson 0.45, Charlie Puth 0.65, H.E.R. 0.58, Ngọt 0.70, Jamie Paige 0.98, Daniel Caesar 0.70, Dreamville 0.86, Thắng 0.24, Thịnh Suy 0.86, Sam Smith 0.89, PARTYNEXTDOOR 0.93, Huncho Jack 1.00, Eddie Benjamin 1.00
- **panns-lr-11**: Ado 0.50, The Weeknd 0.67, Red Hot Chili Peppers 0.93, DECO*27 0.61, Drake 0.95, Taylor Swift 0.36, J. Cole 0.94, Arctic Monkeys 0.76, YOASOBI 0.78, Kendrick Lamar 0.90, Foo Fighters 0.95, Shawn Mendes 0.50, Joji 0.87, Travis Scott 0.79, Avicii 0.51, SZA 0.92, Porter Robinson 0.42, Charlie Puth 0.65, H.E.R. 0.58, Ngọt 0.72, Jamie Paige 0.57, Daniel Caesar 0.68, Dreamville 0.89, Thắng 0.24, Thịnh Suy 0.89, Sam Smith 0.94, PARTYNEXTDOOR 0.93, Huncho Jack 1.00, Eddie Benjamin 1.00

### Artists per gold class (first acceptable label) and classes untestable artist-disjointly

- clap-lr-10: electronic: Avicii, Jamie Paige, Porter Robinson; hip-hop: Drake, J. Cole, Kendrick Lamar, Travis Scott; pop: Charlie Puth, Sam Smith, Shawn Mendes, Taylor Swift, The Weeknd, Thắng, Thịnh Suy; rock: Arctic Monkeys, Foo Fighters, Ngọt, Red Hot Chili Peppers; soul-rnb: Daniel Caesar, Eddie Benjamin, H.E.R., Joji, PARTYNEXTDOOR, SZA
  - classes with <2 artists (cannot be tested artist-disjointly; LOAO test of their only artist is necessarily wrong because the class is absent from training): 
  - classes with no library artist at all (never trainable/testable): blues, classical, country, folk, jazz
- clap-lr-11: electronic: Avicii, Jamie Paige, Porter Robinson; hip-hop: Drake, J. Cole, Kendrick Lamar, Travis Scott; pop: Charlie Puth, Sam Smith, Shawn Mendes, Taylor Swift, The Weeknd, Thắng, Thịnh Suy; rock: Arctic Monkeys, Foo Fighters, Ngọt, Red Hot Chili Peppers; soul-rnb: Daniel Caesar, Eddie Benjamin, H.E.R., Joji, PARTYNEXTDOOR, SZA; j-pop: Ado, DECO*27, YOASOBI
  - classes with <2 artists (cannot be tested artist-disjointly; LOAO test of their only artist is necessarily wrong because the class is absent from training): 
  - classes with no library artist at all (never trainable/testable): blues, classical, country, folk, jazz

## 30 random songs (seed 7), best = panns-lr-10

| title | artist | CNN | best-new | acceptable |
|---|---|---|---|---|
| False Alarm | The Weeknd | rock | electronic | pop/soul-rnb |
| Freedom of Speech (with J. Cole) | Dreamville | hip-hop | hip-hop | hip-hop |
| Is There Really No Happiness? | Porter Robinson | rock | electronic | electronic |
| Stadium Arcadium | Red Hot Chili Peppers | rock | rock | rock |
| Bunce Road Blues (with Future & Tems) | J. Cole | hip-hop | hip-hop | hip-hop |
| Dancing In The Flames - Acapella | The Weeknd | pop | soul-rnb | pop/soul-rnb |
| RHYNO (from GTAVI: The Album) | Travis Scott | electronic | electronic | hip-hop |
| Sign Of The Times | Daniel Caesar | pop | soul-rnb | soul-rnb |
| Knee Socks | Arctic Monkeys | rock | pop | rock |
| All I Know | The Weeknd | hip-hop | soul-rnb | pop/soul-rnb |
| Stacked Actors - Live | Foo Fighters | rock | rock | rock |
| It's 2013 Again | Jamie Paige | electronic | electronic | electronic/pop/rock |
| Forever Yours - Tim’s 2016 Ibiza Version | Avicii | electronic | electronic | electronic |
| Reanimator (feat. Yves Tumor) | Joji | electronic | pop | soul-rnb/pop/hip-hop |
| WHERE WAS YOU | Travis Scott | electronic | hip-hop | hip-hop |
| Lord Is Coming (feat. YBN Cordae) | H.E.R. | hip-hop | hip-hop | soul-rnb |
| White Braids & Pillow Chair | Red Hot Chili Peppers | rock | rock | rock |
| Secret Girlfriend - Dream Logic Version | Jamie Paige | electronic | electronic | electronic/pop/rock |
| 02 60mVuong0302 | Thắng | pop | rock | pop/folk |
| KTM | Thịnh Suy | folk | pop | pop/soul-rnb |
| Still Up (with EARTHGANG feat. REASON) | Dreamville | hip-hop | hip-hop | hip-hop |
| I Can See You (Taylor’s Version) (From The Vault) | Taylor Swift | pop | rock | pop/country/folk |
| Black Panther | Kendrick Lamar | hip-hop | hip-hop | hip-hop |
| Sad Machine | Porter Robinson | electronic | pop | electronic |
| After Hours - Live | The Weeknd | pop | soul-rnb | pop/soul-rnb |
| BLAHBLAHBLAH DEMO | Joji | pop | hip-hop | soul-rnb/pop/hip-hop |
| Pray | Sam Smith | pop | pop | pop/soul-rnb |
| Wavy (Interlude) (feat. James Fauntleroy) | SZA | pop | soul-rnb | soul-rnb/pop/hip-hop |
| u | Kendrick Lamar | hip-hop | hip-hop | hip-hop |
| Making A Fire | Foo Fighters | rock | rock | rock |

## Timings (CPU, per song)

- ffmpeg decode (48 kHz mono, full track) + crop selection: 0.71 s
- CLAP-music embedding (3 x 10 s crops): 0.87 s
- PANNs Cnn14 embedding (3 x 10 s crops, 32 kHz): 0.75 s
- (averaged over 1490 songs; CNN baseline ~0.5 s/song incl. decode, measured in an earlier run)

## Caveats

- Labels are artist-level guesses, unreviewed; many songs of an artist will not match the artist label (Joji, Jamie Paige, Taylor Swift, Drake, SZA, Thang, Thinh Suy are multi-genre).
- Classes with no library artist (blues, classical, jazz; country/folk only as secondary labels) can never be learned or tested here.
- Leave-one-artist-out: Dreamville is held out with J. Cole and Huncho Jack with Travis Scott (same voices).
- Library-only training, no external labelled clips; the CNN is evaluated as-is (trained on FMA).
- Crops: loudest 10 s window + windows at 25% / 75% of track, embeddings averaged. Zero-shot prompts: "a {genre} song" (hip-hop -> "hip hop", soul-rnb -> "soul and R&B", j-pop -> "J-pop (Japanese pop)").
