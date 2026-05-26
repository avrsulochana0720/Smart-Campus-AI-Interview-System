import time
import logging
from collections import defaultdict

logger = logging.getLogger("profiler")
logger.setLevel(logging.INFO)
handler = logging.StreamHandler()
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
logger.addHandler(handler)

metrics = defaultdict(list)

def record_metric(name: str, duration: float):
    metrics[name].append(duration)
    logger.info(f"[PROFILER] {name} took {duration:.4f}s")

def get_average_metrics():
    return {k: sum(v)/len(v) for k, v in metrics.items() if v}

def get_all_metrics():
    return dict(metrics)

def print_benchmarks():
    logger.info("========== BENCHMARK REPORT ==========")
    for k, v in get_average_metrics().items():
        logger.info(f"{k} -> Average: {v:.4f}s (Total runs: {len(metrics[k])})")
    logger.info("======================================")
