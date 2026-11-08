"""Offline-only product similarity helpers. No database or network access."""

import math
from collections import defaultdict


def normalize(values):
    vector = tuple(float(value) for value in values)
    if not vector or not all(math.isfinite(value) for value in vector):
        raise ValueError("Embedding must contain finite numbers")
    length = math.sqrt(sum(value * value for value in vector))
    if length <= 0:
        raise ValueError("Embedding must have nonzero length")
    return tuple(value / length for value in vector)


def aggregate_articles(rows, method="representative"):
    """Map verified article vectors to their Product, never across Products."""
    if method not in ("representative", "mean"):
        raise ValueError("Unknown aggregation method")
    grouped = defaultdict(list)
    seen = set()
    dimension = None
    for row in rows:
        article = row["article_id"]
        if not isinstance(article, str) or len(article) != 10 or not article.isascii() or not article.isdigit():
            raise ValueError("Invalid article ID")
        if article in seen:
            raise ValueError("Duplicate article embedding")
        seen.add(article)
        if not row.get("product_id"):
            raise ValueError("Missing Product mapping")
        vector = normalize(row["vector"])
        if dimension is None:
            dimension = len(vector)
        elif dimension != len(vector):
            raise ValueError("Embedding dimension mismatch")
        grouped[row["product_id"]].append((article, vector))
    output = {}
    for product, article_vectors in grouped.items():
        article_vectors.sort()
        if method == "representative":
            output[product] = article_vectors[0][1]
        else:
            output[product] = normalize(
                sum(vector[i] for _, vector in article_vectors) / len(article_vectors)
                for i in range(dimension)
            )
    return output


def cosine(left, right):
    if len(left) != len(right):
        raise ValueError("Embedding dimension mismatch")
    return max(-1.0, min(1.0, sum(a * b for a, b in zip(left, right))))


def scaled_popularity(counts, universe):
    """Log scaling and a 0.5 cap keep a head item from owning the score."""
    maximum = max((max(0.0, float(counts.get(item, 0))) for item in universe), default=0)
    denominator = math.log1p(maximum) if maximum else 1
    return {item: min(0.5, math.log1p(max(0.0, float(counts.get(item, 0)))) / denominator)
            for item in universe}


def weighted_rank(context, targets, metadata, vectors, popularity, weights=(0.40, 0.45, 0.15),
                  minimum_metadata=0.0):
    if len(weights) != 3 or any(not math.isfinite(w) or w < 0 for w in weights) or sum(weights) <= 0:
        raise ValueError("Invalid weights")
    universe = sorted(set(targets) - {context})
    prior = scaled_popularity(popularity, universe)
    result = {}
    for target in universe:
        meta = float(metadata.get(target, 0))
        if not math.isfinite(meta) or meta < minimum_metadata or meta <= 0:
            continue
        if context not in vectors or target not in vectors:
            result[target] = meta
            continue
        scores = [(weights[0], meta), (weights[2], prior[target]),
                  (weights[1], (cosine(vectors[context], vectors[target]) + 1) / 2)]
        denominator = sum(weight for weight, _ in scores)
        result[target] = sum(weight * score for weight, score in scores) / denominator
    return sorted(result.items(), key=lambda item: (-item[1], item[0]))


def rrf_rank(context, targets, metadata, vectors, popularity, k=60, minimum_metadata=0.0):
    if not isinstance(k, int) or k < 1:
        raise ValueError("Invalid RRF k")
    universe = sorted(set(targets) - {context})
    universe = [item for item in universe if math.isfinite(float(metadata.get(item, 0)))
                and float(metadata.get(item, 0)) >= minimum_metadata and float(metadata.get(item, 0)) > 0]
    if not universe:
        return []
    if context not in vectors:
        return sorted(((item, metadata[item]) for item in universe), key=lambda item: (-item[1], item[0]))
    rankings = [sorted(universe, key=lambda item: (-metadata[item], item)),
                sorted(universe, key=lambda item: (-popularity.get(item, 0), item))]
    if context in vectors:
        visual = [item for item in universe if item in vectors]
        if visual:
            rankings.append(sorted(visual, key=lambda item: (-cosine(vectors[context], vectors[item]), item)))
    scores = defaultdict(float)
    for index, ranking in enumerate(rankings):
        weight = (0.15 if index == 1 else 1.0)
        for rank, item in enumerate(ranking, 1):
            scores[item] += weight / (k + rank)
    maximum = max(scores.values())
    return sorted(((item, metadata[item] if item not in vectors else value / maximum)
                   for item, value in scores.items()),
                  key=lambda item: (-item[1], item[0]))
