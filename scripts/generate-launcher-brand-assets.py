from __future__ import annotations

import math
import struct
import zlib
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / "electron" / "assets"
SUPERSAMPLE = 4


def clamp(value: float) -> int:
    return max(0, min(255, int(round(value))))


def blend(bottom: tuple[int, int, int, int], top: tuple[int, int, int, int]) -> tuple[int, int, int, int]:
    br, bg, bb, ba = bottom
    tr, tg, tb, ta = top
    alpha = ta / 255.0
    inv = 1.0 - alpha
    out_alpha = ta + ba * inv
    return (
        clamp(tr * alpha + br * inv),
        clamp(tg * alpha + bg * inv),
        clamp(tb * alpha + bb * inv),
        clamp(out_alpha),
    )


def empty_canvas(width: int, height: int, color: tuple[int, int, int, int]) -> list[list[tuple[int, int, int, int]]]:
    return [[color for _ in range(width)] for _ in range(height)]


def fill_rect(canvas, x: int, y: int, w: int, h: int, color):
    width = len(canvas[0])
    height = len(canvas)
    for py in range(max(0, y), min(height, y + h)):
        row = canvas[py]
        for px in range(max(0, x), min(width, x + w)):
            row[px] = blend(row[px], color)


def fill_circle(canvas, cx: int, cy: int, radius: int, color):
    width = len(canvas[0])
    height = len(canvas)
    r2 = radius * radius
    for py in range(max(0, cy - radius), min(height, cy + radius + 1)):
        for px in range(max(0, cx - radius), min(width, cx + radius + 1)):
            dx = px - cx
            dy = py - cy
            if dx * dx + dy * dy <= r2:
                canvas[py][px] = blend(canvas[py][px], color)


def fill_ring(canvas, cx: int, cy: int, radius: int, thickness: int, color):
    outer2 = radius * radius
    inner = max(0, radius - thickness)
    inner2 = inner * inner
    width = len(canvas[0])
    height = len(canvas)
    for py in range(max(0, cy - radius), min(height, cy + radius + 1)):
        for px in range(max(0, cx - radius), min(width, cx + radius + 1)):
            dx = px - cx
            dy = py - cy
            distance2 = dx * dx + dy * dy
            if inner2 <= distance2 <= outer2:
                canvas[py][px] = blend(canvas[py][px], color)


def fill_polygon(canvas, points, color):
    min_y = max(0, min(y for _, y in points))
    max_y = min(len(canvas) - 1, max(y for _, y in points))
    for py in range(min_y, max_y + 1):
        intersections = []
        for index, (x1, y1) in enumerate(points):
            x2, y2 = points[(index + 1) % len(points)]
            if y1 == y2:
                continue
            if min(y1, y2) <= py < max(y1, y2):
                ratio = (py - y1) / (y2 - y1)
                intersections.append(int(round(x1 + ratio * (x2 - x1))))
        intersections.sort()
        for start, end in zip(intersections[0::2], intersections[1::2]):
            fill_rect(canvas, start, py, end - start + 1, 1, color)


def draw_arc(canvas, cx: int, cy: int, radius: int, thickness: int, start_deg: float, end_deg: float, color):
    width = len(canvas[0])
    height = len(canvas)
    outer2 = radius * radius
    inner = max(0, radius - thickness)
    inner2 = inner * inner
    for py in range(max(0, cy - radius), min(height, cy + radius + 1)):
        for px in range(max(0, cx - radius), min(width, cx + radius + 1)):
            dx = px - cx
            dy = py - cy
            distance2 = dx * dx + dy * dy
            if not inner2 <= distance2 <= outer2:
                continue
            angle = (math.degrees(math.atan2(dy, dx)) + 360) % 360
            if start_deg <= angle <= end_deg:
                canvas[py][px] = blend(canvas[py][px], color)


def downsample(canvas, factor: int):
    src_height = len(canvas)
    src_width = len(canvas[0])
    width = src_width // factor
    height = src_height // factor
    result = empty_canvas(width, height, (0, 0, 0, 0))

    for y in range(height):
        for x in range(width):
            r = g = b = a = 0
            for sy in range(factor):
                for sx in range(factor):
                    pr, pg, pb, pa = canvas[y * factor + sy][x * factor + sx]
                    r += pr
                    g += pg
                    b += pb
                    a += pa
            samples = factor * factor
            result[y][x] = (r // samples, g // samples, b // samples, a // samples)
    return result


def icon_canvas(size: int):
    work = size * SUPERSAMPLE
    canvas = empty_canvas(work, work, (0, 0, 0, 0))
    cx = work // 2
    cy = work // 2

    fill_circle(canvas, cx, cy, int(work * 0.39), (3, 12, 19, 224))
    fill_circle(canvas, cx, cy, int(work * 0.30), (7, 24, 33, 255))
    fill_ring(canvas, cx, cy, int(work * 0.39), int(work * 0.045), (0, 220, 255, 210))
    fill_ring(canvas, cx, cy, int(work * 0.31), int(work * 0.018), (0, 150, 200, 130))

    diamond_outer = [
        (cx, int(work * 0.22)),
        (int(work * 0.78), cy),
        (cx, int(work * 0.78)),
        (int(work * 0.22), cy),
    ]
    diamond_inner = [
        (cx, int(work * 0.32)),
        (int(work * 0.68), cy),
        (cx, int(work * 0.68)),
        (int(work * 0.32), cy),
    ]
    fill_polygon(canvas, diamond_outer, (11, 39, 51, 235))
    fill_polygon(canvas, diamond_inner, (3, 16, 22, 255))

    draw_arc(canvas, cx, cy, int(work * 0.265), int(work * 0.05), 208, 322, (156, 248, 199, 220))

    wedge = [
        (cx + int(work * 0.06), cy - int(work * 0.18)),
        (cx + int(work * 0.25), cy - int(work * 0.02)),
        (cx + int(work * 0.08), cy + int(work * 0.14)),
        (cx - int(work * 0.02), cy + int(work * 0.03)),
    ]
    fill_polygon(canvas, wedge, (228, 249, 255, 230))
    fill_ring(canvas, cx, cy, int(work * 0.09), int(work * 0.025), (0, 229, 255, 140))
    fill_circle(canvas, cx, cy, int(work * 0.045), (156, 248, 199, 245))

    for index in range(3):
        radius = int(work * (0.14 + index * 0.04))
        draw_arc(canvas, cx, cy, radius, int(work * 0.01), 215, 325, (255, 255, 255, 18 - index * 4))

    return downsample(canvas, SUPERSAMPLE)


def panel_canvas(width: int, height: int, compact: bool):
    work_w = width * 2
    work_h = height * 2
    canvas = empty_canvas(work_w, work_h, (5, 14, 20, 255))

    for y in range(work_h):
        ratio = y / max(1, work_h - 1)
        row_color = (
            clamp(8 + 10 * (1 - ratio)),
            clamp(22 + 34 * (1 - ratio)),
            clamp(30 + 56 * (1 - ratio)),
            255,
        )
        fill_rect(canvas, 0, y, work_w, 1, row_color)

    inset = 26 if compact else 34
    fill_rect(canvas, inset, inset, work_w - inset * 2, work_h - inset * 2, (4, 16, 22, 245))
    fill_rect(canvas, inset, inset, work_w - inset * 2, 4, (0, 229, 255, 120))
    fill_rect(canvas, inset, inset, 4, work_h - inset * 2, (0, 229, 255, 70))
    fill_rect(canvas, inset, work_h - inset - 4, work_w - inset * 2, 4, (156, 248, 199, 80))

    icon = icon_canvas(46 if compact else 120)
    ox = work_w // 2 - len(icon[0])
    oy = 10 if compact else 76
    for y, row in enumerate(icon):
        for x, color in enumerate(row):
            px = ox + x
            py = oy + y
            if 0 <= px < work_w and 0 <= py < work_h:
                canvas[py][px] = blend(canvas[py][px], color)

    fill_rect(canvas, work_w // 2 + 30, 26 if compact else 86, 3, (work_h - 52 if compact else work_h - 172), (0, 229, 255, 65))
    return downsample(canvas, 2)


def write_png(path: Path, canvas):
    height = len(canvas)
    width = len(canvas[0])
    raw = bytearray()
    for row in canvas:
        raw.append(0)
        for r, g, b, a in row:
            raw.extend((r, g, b, a))

    def chunk(name: bytes, data: bytes) -> bytes:
        return struct.pack(">I", len(data)) + name + data + struct.pack(">I", zlib.crc32(name + data) & 0xFFFFFFFF)

    ihdr = struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)
    payload = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", ihdr) + chunk(b"IDAT", zlib.compress(bytes(raw), 9)) + chunk(b"IEND", b"")
    path.write_bytes(payload)


def write_ico(path: Path, png_bytes: bytes):
    header = struct.pack("<HHH", 0, 1, 1)
    entry = struct.pack("<BBBBHHII", 0, 0, 0, 0, 1, 32, len(png_bytes), 22)
    path.write_bytes(header + entry + png_bytes)


def write_bmp(path: Path, canvas):
    height = len(canvas)
    width = len(canvas[0])
    row_pad = (4 - (width * 3) % 4) % 4
    data = bytearray()
    for row in reversed(canvas):
        for r, g, b, _a in row:
            data.extend((b, g, r))
        data.extend(b"\x00" * row_pad)

    file_header_size = 14
    info_header_size = 40
    pixel_offset = file_header_size + info_header_size
    file_size = pixel_offset + len(data)

    header = struct.pack("<2sIHHI", b"BM", file_size, 0, 0, pixel_offset)
    info = struct.pack("<IIIHHIIIIII", info_header_size, width, height, 1, 24, 0, len(data), 2835, 2835, 0, 0)
    path.write_bytes(header + info + data)


def main():
    ASSETS.mkdir(parents=True, exist_ok=True)

    icon = icon_canvas(256)
    icon_png_path = ASSETS / "icon.png"
    write_png(icon_png_path, icon)
    write_ico(ASSETS / "icon.ico", icon_png_path.read_bytes())

    write_bmp(ASSETS / "installer-sidebar.bmp", panel_canvas(164, 314, compact=False))
    write_bmp(ASSETS / "installer-header.bmp", panel_canvas(150, 57, compact=True))


if __name__ == "__main__":
    main()
