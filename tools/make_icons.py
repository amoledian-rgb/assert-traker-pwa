"""자산관리 PWA 아이콘 생성 — 딥 네이비(#1B365D) 바탕 + 골드(#C5A059) 포인트.

개인 데이터가 전혀 없는 순수 그래픽. PWA(maskable) 로도 쓸 수 있게
그림은 중앙 안전영역(80% 원) 안에만 둔다.
"""
import os
from PIL import Image, ImageDraw

NAVY = (27, 54, 93)       # #1B365D
NAVY_HI = (36, 70, 118)   # 윗부분 밝기
GOLD = (197, 160, 89)     # #C5A059
GOLD_LT = (214, 182, 118)
WHITE = (244, 246, 250)

S = 2048  # 작업 캔버스(최종 512의 4배)

# 세로 그라데이션 배경
img = Image.new("RGB", (S, S), NAVY)
gd = ImageDraw.Draw(img)
for y in range(S):
    t = y / (S - 1)
    c = tuple(int(NAVY_HI[i] * (1 - t) + NAVY[i] * t) for i in range(3))
    gd.line([(0, y), (S, y)], fill=c)

d = ImageDraw.Draw(img)
cx = S // 2

# 1) 위쪽 골드 링 (동전)
R, W = 160, 36
cy = 470
d.ellipse([cx - R, cy - R, cx + R, cy + R], outline=GOLD, width=W)

# 2) 상승 막대 3개
bar_w, gap, base_y = 200, 80, 1520
heights = [380, 560, 740]
total_w = bar_w * 3 + gap * 2
x0 = (S - total_w) // 2
for i, h in enumerate(heights):
    x = x0 + i * (bar_w + gap)
    color = GOLD if i < 2 else GOLD_LT
    d.rounded_rectangle([x, base_y - h, x + bar_w, base_y], radius=44, fill=color)

# 3) 받침선
d.rounded_rectangle([x0 - 60, base_y + 64, x0 + total_w + 60, base_y + 96], radius=16, fill=WHITE)

# 축소 저장
out = os.path.dirname(os.path.abspath(__file__))
dst = os.path.dirname(out)
for size in (512, 192, 180):
    img.resize((size, size), Image.LANCZOS).save(os.path.join(dst, "icon-%d.png" % size), optimize=True)
print("icons written:", [f for f in sorted(os.listdir(dst)) if f.startswith("icon-")])
