from __future__ import annotations

import json
import subprocess
import sys
from datetime import datetime
from pathlib import Path


TEST_DIR = Path(__file__).resolve().parent
HARNESS = TEST_DIR / "api_harness.js"
LOG_DIR = TEST_DIR / "logs"


def run_harness() -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["node", str(HARNESS)],
        cwd=TEST_DIR,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )


def build_log(result: subprocess.CompletedProcess[str], started_at: datetime, finished_at: datetime) -> str:
    lines = [
        "API smoke tests",
        f"Inicio: {started_at.isoformat(timespec='seconds')}",
        f"Fin: {finished_at.isoformat(timespec='seconds')}",
        f"Comando: node {HARNESS.name}",
        f"Codigo salida: {result.returncode}",
        "",
    ]

    try:
      payload = json.loads(result.stdout)
    except json.JSONDecodeError:
      payload = None

    if payload:
        summary = payload.get("summary", {})
        lines.extend([
            f"Total: {summary.get('total', 0)}",
            f"OK: {summary.get('passed', 0)}",
            f"Fallos: {summary.get('failed', 0)}",
            "",
        ])

        warnings = payload.get("warnings", [])
        if warnings:
            lines.append("Avisos:")
            lines.extend(f"- {warning}" for warning in warnings)
            lines.append("")

        lines.append("Detalle:")
        for test in payload.get("results", []):
            line = f"- {test.get('status')}: {test.get('name')}"
            if test.get("error"):
                line += f" -> {test['error']}"
            lines.append(line)
    else:
        lines.extend([
            "No se pudo interpretar la salida JSON del arnes.",
            "",
            "STDOUT:",
            result.stdout.strip() or "(vacio)",
        ])

    if result.stderr.strip():
        lines.extend([
            "",
            "STDERR:",
            result.stderr.strip(),
        ])

    return "\n".join(lines) + "\n"


def main() -> int:
    LOG_DIR.mkdir(exist_ok=True)

    started_at = datetime.now()
    result = run_harness()
    finished_at = datetime.now()

    log_name = f"api-smoke-{finished_at.strftime('%Y-%m-%d_%H-%M-%S')}.log"
    log_path = LOG_DIR / log_name
    log_path.write_text(build_log(result, started_at, finished_at), encoding="utf-8")

    print(f"Log: {log_path}")

    if result.stdout.strip():
        print(result.stdout.strip())

    if result.stderr.strip():
        print(result.stderr.strip(), file=sys.stderr)

    return result.returncode


if __name__ == "__main__":
    raise SystemExit(main())
