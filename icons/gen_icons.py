#!/usr/bin/env python3
"""확장 아이콘(16/48/128 PNG) 생성 스크립트. 의존성 없음.

인디고→보라 그라데이션 배경에 흰색 다운로드 화살표(↓ + 받침대) 모양.
"""
import os
import struct
import zlib


def chunk(tag: bytes, data: bytes) -> bytes:
    payload = tag + data
    return struct.pack(">I", len(data)) + payload + struct.pack(">I", zlib.crc32(payload) & 0xFFFFFFFF)


def write_png(path: str, size: int) -> None:
    rows = b""
    for y in range(size):
        row = b"\x00"
        for x in range(size):
            row += bytes(pixel(x / size, y / size))
        rows += row
    png = b"\x89PNG\r\n\x1a\n"
    png += chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0))
    png += chunk(b"IDAT", zlib.compress(rows))
    png += chunk(b"IEND", b"")
    with open(path, "wb") as f:
        f.write(png)


def pixel(u: float, v: float):
    # 모서리 둥근 사각형 밖은 투명
    r = 0.22
    cx = min(max(u, r), 1 - r)
    cy = min(max(v, r), 1 - r)
    if (u - cx) ** 2 + (v - cy) ** 2 > r * r:
        return (0, 0, 0, 0)

    # 흰색 심볼: 화살표 몸통 + 화살촉 + 받침대
    white = False
    if abs(u - 0.5) < 0.075 and 0.20 < v < 0.50:
        white = True
    if 0.50 <= v < 0.68 and abs(u - 0.5) < (0.68 - v) * 1.15:
        white = True
    if 0.78 < v < 0.87 and 0.20 < u < 0.80:
        white = True
    if white:
        return (255, 255, 255, 255)

    # 배경: 대각선 그라데이션 인디고(#6366F1) → 보라(#A855F7)
    t = (u + v) / 2
    c1, c2 = (99, 102, 241), (168, 85, 247)
    return tuple(round(a + (b - a) * t) for a, b in zip(c1, c2)) + (255,)


if __name__ == "__main__":
    here = os.path.dirname(os.path.abspath(__file__))
    for s in (16, 48, 128):
        write_png(os.path.join(here, f"icon{s}.png"), s)
        print(f"icon{s}.png")
