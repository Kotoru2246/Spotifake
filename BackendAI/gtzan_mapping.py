"""
GTZAN -> 18-Genre Taxonomy mapping

Provides utilities to map GTZAN 10-class probabilities into
the user's 18-genre taxonomy. This file is intended as a
quick compatibility layer while a full retrain is prepared.

Usage:
    from gtzan_mapping import map_gtzan_scores, TARGET_GENRES
    mapped = map_gtzan_scores({'rock':0.6,'pop':0.4})
    # mapped -> {'Rock':0.6, 'Pop':0.4, ...} normalized
"""
from typing import Dict

# Canonical 18-genre target list (display names as provided by user)
TARGET_GENRES = [
    'Hip-Hop / Rap',
    'Pop',
    'Rock',
    'Electronic Dance Music (EDM)',
    'R&B (Rhythm and Blues)',
    'Country',
    'Jazz',
    'Classical',
    'Reggae',
    'Latin Music',
    'K-Pop',
    'J-Pop',
    'Metal',
    'Afrobeats',
    'Folk',
    'Blues',
    'Soul',
    'Funk',
    'Indie / Alternative',
    'Anime / Vocaloid',
]

# A lightweight, hand-crafted mapping from GTZAN labels -> target genres
# Each GTZAN key maps to a dict of target genres with relative weights.
# These weights are heuristic and can be refined with validation data.
GTZAN_TO_18 = {
    'blues': {'Blues': 1.0, 'Soul': 0.25, 'Folk': 0.1},
    'classical': {'Classical': 1.0},
    'country': {'Country': 1.0, 'Folk': 0.35},
    'disco': {'Funk': 0.8, 'Pop': 0.4, 'Electronic Dance Music (EDM)': 0.15},
    'hiphop': {'Hip-Hop / Rap': 1.0, 'R&B (Rhythm and Blues)': 0.4},
    'jazz': {'Jazz': 1.0, 'Soul': 0.3},
    'metal': {'Metal': 1.0, 'Rock': 0.4},
    'pop': {'Pop': 1.0, 'K-Pop': 0.25, 'Indie / Alternative': 0.3},
    'j-pop': {'J-Pop': 1.0, 'Pop': 0.35, 'K-Pop': 0.15},
    'reggae': {'Reggae': 1.0, 'Afrobeats': 0.2},
    'rock': {'Rock': 1.0, 'Indie / Alternative': 0.45},
    'vocaloid': {'Anime / Vocaloid': 1.0, 'J-Pop': 0.25, 'Pop': 0.1},
}


def map_gtzan_scores(gtzan_scores: Dict[str, float]) -> Dict[str, float]:
    """Map GTZAN-class probabilities to the 18-genre taxonomy.

    Args:
        gtzan_scores: dict mapping GTZAN label -> probability (not necessarily normalized)

    Returns:
        Dict mapping target genre -> normalized score (sums to 1.0 when input non-zero)
    """
    mapped = {g: 0.0 for g in TARGET_GENRES}

    # Accumulate weighted contributions
    for gtz_label, score in (gtzan_scores or {}).items():
        if score is None:
            continue
        score = float(score)
        mapping = GTZAN_TO_18.get(gtz_label.lower())
        if mapping:
            for tgt, weight in mapping.items():
                if tgt not in mapped:
                    # ignore unknown targets but keep going
                    continue
                mapped[tgt] += score * float(weight)
        else:
            # If no mapping exists, try to place the GTZAN label verbatim
            if gtz_label in mapped:
                mapped[gtz_label] += score

    total = sum(mapped.values())
    if total <= 0:
        # fallback: if input had a single GTZAN primary, map it directly
        # pick highest input key and try to map deterministically
        if gtzan_scores:
            primary = max(gtzan_scores.items(), key=lambda x: float(x[1]) if x[1] is not None else 0)[0]
            primary_map = GTZAN_TO_18.get(primary.lower(), None)
            if primary_map:
                for tgt, w in primary_map.items():
                    if tgt in mapped:
                        mapped[tgt] = float(w)
                total = sum(mapped.values())

    if total > 0:
        for k in mapped:
            mapped[k] = mapped[k] / total

    return mapped


def get_target_genres() -> list:
    return TARGET_GENRES
