#!/usr/bin/env python3
"""Single source of truth for the placeholder catalog data: writes js/products.js
and generates one placeholder SVG illustration per product in assets/sinks/."""
import os, json, random

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SINKS_OUT = os.path.join(ROOT, "assets", "sinks")
PRODUCTS_JS = os.path.join(ROOT, "js", "products.js")
os.makedirs(SINKS_OUT, exist_ok=True)

ORANGE = "#E3934A"
LINE = "#2A2522"
BG = "#F4EFE9"

CATEGORIES = [
    {"id": "vessel", "label": "ბადიისებრი"},
    {"id": "undermount", "label": "ჩაშენებული"},
    {"id": "rectangular", "label": "მართკუთხა"},
    {"id": "pedestal", "label": "სვეტზე დამონტაჟებული"},
    {"id": "corner", "label": "კუთხის"},
]

PRODUCTS = [
    {"id": "onda-01", "name": "Onda", "shape": "vessel", "category": "vessel", "material": "კერამოგრანიტი", "color": "მატი თეთრი", "size": "⌀ 42 × 15 სმ", "collection": "Onda"},
    {"id": "onda-02", "name": "Onda Noir", "shape": "vessel", "category": "vessel", "material": "კერამოგრანიტი", "color": "მატი შავი", "size": "⌀ 42 × 15 სმ", "collection": "Onda"},
    {"id": "luna-01", "name": "Luna", "shape": "vessel", "category": "vessel", "material": "ფაიფური", "color": "საპნისფერი", "size": "⌀ 40 × 14 სმ", "collection": "Luna"},
    {"id": "luna-02", "name": "Luna Sabbia", "shape": "vessel", "category": "vessel", "material": "ფაიფური", "color": "ქვიშისფერი", "size": "⌀ 40 × 14 სმ", "collection": "Luna"},
    {"id": "terra-01", "name": "Terra", "shape": "vessel", "category": "vessel", "material": "კერამოგრანიტი", "color": "ტერაკოტა", "size": "⌀ 45 × 16 სმ", "collection": "Terra"},
    {"id": "pietra-01", "name": "Pietra", "shape": "undermount", "category": "undermount", "material": "კერამოგრანიტი", "color": "მატი ნაცრისფერი", "size": "55 × 38 სმ", "collection": "Pietra"},
    {"id": "pietra-02", "name": "Pietra Grande", "shape": "undermount", "category": "undermount", "material": "კერამოგრანიტი", "color": "მატი ნაცრისფერი", "size": "60 × 42 სმ", "collection": "Pietra"},
    {"id": "marmo-01", "name": "Marmo", "shape": "undermount", "category": "undermount", "material": "ფაიფური", "color": "თეთრი მარმარილოს ეფექტით", "size": "56 × 40 სმ", "collection": "Marmo"},
    {"id": "marmo-02", "name": "Marmo Scuro", "shape": "undermount", "category": "undermount", "material": "ფაიფური", "color": "მუქი მარმარილოს ეფექტით", "size": "56 × 40 სმ", "collection": "Marmo"},
    {"id": "nero-01", "name": "Nero", "shape": "undermount", "category": "undermount", "material": "კერამოგრანიტი", "color": "ღრმა შავი", "size": "58 × 40 სმ", "collection": "Nero"},
    {"id": "bianco-01", "name": "Bianco", "shape": "rectangular", "category": "rectangular", "material": "კერამოგრანიტი", "color": "ბრჭყვიალა თეთრი", "size": "60 × 45 სმ", "collection": "Bianco"},
    {"id": "bianco-02", "name": "Bianco Puro", "shape": "rectangular", "category": "rectangular", "material": "კერამოგრანიტი", "color": "მატი თეთრი", "size": "65 × 46 სმ", "collection": "Bianco"},
    {"id": "linea-01", "name": "Linea", "shape": "rectangular", "category": "rectangular", "material": "ფაიფური", "color": "ნაცრისფერი", "size": "70 × 46 სმ", "collection": "Linea"},
    {"id": "linea-02", "name": "Linea Lunga", "shape": "rectangular", "category": "rectangular", "material": "ფაიფური", "color": "ნაცრისფერი", "size": "80 × 46 სმ", "collection": "Linea"},
    {"id": "quadro-01", "name": "Quadro", "shape": "rectangular", "category": "rectangular", "material": "კერამოგრანიტი", "color": "ანთრაციტი", "size": "50 × 50 სმ", "collection": "Quadro"},
    {"id": "antico-01", "name": "Antico", "shape": "pedestal", "category": "pedestal", "material": "ფაიფური", "color": "სპილოს ძვალი", "size": "⌀ 38 × 82 სმ", "collection": "Antico"},
    {"id": "antico-02", "name": "Antico Scolpito", "shape": "pedestal", "category": "pedestal", "material": "ფაიფური", "color": "სპილოს ძვალი", "size": "⌀ 38 × 84 სმ", "collection": "Antico"},
    {"id": "classico-01", "name": "Classico", "shape": "pedestal", "category": "pedestal", "material": "ფაიფური", "color": "თეთრი", "size": "⌀ 40 × 85 სმ", "collection": "Classico"},
    {"id": "moderno-01", "name": "Moderno", "shape": "pedestal", "category": "pedestal", "material": "კერამოგრანიტი", "color": "მატი ნაცრისფერი", "size": "⌀ 36 × 80 სმ", "collection": "Moderno"},
    {"id": "angolo-01", "name": "Angolo", "shape": "corner", "category": "corner", "material": "კერამოგრანიტი", "color": "მატი თეთრი", "size": "50 × 50 სმ", "collection": "Angolo"},
    {"id": "angolo-02", "name": "Angolo Scuro", "shape": "corner", "category": "corner", "material": "კერამოგრანიტი", "color": "მატი შავი", "size": "52 × 52 სმ", "collection": "Angolo"},
    {"id": "vertice-01", "name": "Vertice", "shape": "corner", "category": "corner", "material": "ფაიფური", "color": "ნაცრისფერი", "size": "48 × 48 სმ", "collection": "Vertice"},
    {"id": "riva-01", "name": "Riva", "shape": "vessel", "category": "vessel", "material": "კერამოგრანიტი", "color": "ზეთისხილისფერი", "size": "⌀ 43 × 15 სმ", "collection": "Riva"},
    {"id": "forma-01", "name": "Forma", "shape": "undermount", "category": "undermount", "material": "ფაიფური", "color": "მატი ქვიშისფერი", "size": "57 × 40 სმ", "collection": "Forma"},
]

def card(shape_svg, name):
    return f'''<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="{name}">
  <rect width="400" height="300" fill="{BG}"/>
  {shape_svg}
</svg>'''

def vessel(seed):
    random.seed(seed)
    rx = random.randint(95, 120); ry = random.randint(34, 44)
    cx, cy = 200, 150
    counter_y = cy + ry - 6
    return f'''
  <rect x="40" y="{counter_y}" width="320" height="14" fill="{LINE}" opacity="0.12"/>
  <ellipse cx="{cx}" cy="{cy+8}" rx="{rx+10}" ry="{ry+14}" fill="{LINE}" opacity="0.06"/>
  <ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="none" stroke="{LINE}" stroke-width="3"/>
  <ellipse cx="{cx}" cy="{cy}" rx="{rx-18}" ry="{ry-12}" fill="none" stroke="{ORANGE}" stroke-width="2.5"/>
  <circle cx="{cx}" cy="{cy+2}" r="4" fill="{LINE}"/>
  <line x1="{cx-4}" y1="{cy-ry-26}" x2="{cx-4}" y2="{cy-ry-4}" stroke="{LINE}" stroke-width="4" stroke-linecap="round"/>
  <path d="M {cx-4} {cy-ry-26} q 16 0 16 18" fill="none" stroke="{LINE}" stroke-width="4" stroke-linecap="round"/>
'''

def undermount(seed):
    random.seed(seed)
    w = random.randint(190, 230); h = random.randint(70, 86)
    x = 200 - w/2; y = 150 - h/2
    r = random.choice([10, 22, 34])
    return f'''
  <rect x="30" y="{y+h+4}" width="340" height="16" fill="{LINE}" opacity="0.12"/>
  <rect x="{x-8}" y="{y-8}" width="{w+16}" height="{h+16}" rx="{r+6}" fill="{LINE}" opacity="0.06"/>
  <rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="none" stroke="{LINE}" stroke-width="3"/>
  <rect x="{x+16}" y="{y+14}" width="{w-32}" height="{h-28}" rx="{max(r-10,4)}" fill="none" stroke="{ORANGE}" stroke-width="2.5"/>
  <circle cx="200" cy="{y+h/2}" r="4" fill="{LINE}"/>
  <line x1="196" y1="{y-30}" x2="196" y2="{y-6}" stroke="{LINE}" stroke-width="4" stroke-linecap="round"/>
  <path d="M 196 {y-30} q 16 0 16 18" fill="none" stroke="{LINE}" stroke-width="4" stroke-linecap="round"/>
'''

def pedestal(seed):
    random.seed(seed)
    rx = random.randint(78, 92); ry = random.randint(30, 38)
    cx, cy = 200, 118
    return f'''
  <ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="none" stroke="{LINE}" stroke-width="3"/>
  <ellipse cx="{cx}" cy="{cy}" rx="{rx-16}" ry="{ry-10}" fill="none" stroke="{ORANGE}" stroke-width="2.5"/>
  <path d="M {cx-34} {cy+ry-4} C {cx-30} 210, {cx-26} 250, {cx-22} 266 L {cx+22} 266 C {cx+26} 250, {cx+30} 210, {cx+34} {cy+ry-4} Z" fill="none" stroke="{LINE}" stroke-width="3"/>
  <rect x="{cx-40}" y="262" width="80" height="10" rx="3" fill="{LINE}" opacity="0.5"/>
  <line x1="{cx-4}" y1="{cy-ry-26}" x2="{cx-4}" y2="{cy-ry-4}" stroke="{LINE}" stroke-width="4" stroke-linecap="round"/>
  <path d="M {cx-4} {cy-ry-26} q 16 0 16 18" fill="none" stroke="{LINE}" stroke-width="4" stroke-linecap="round"/>
'''

def corner(seed):
    random.seed(seed)
    size = random.randint(150, 175)
    x, y = 120, 92
    return f'''
  <rect x="30" y="{y+size+4}" width="340" height="16" fill="{LINE}" opacity="0.12"/>
  <path d="M {x} {y} L {x+size} {y} L {x+size} {y+size} L {x+40} {y+size} Q {x} {y+size} {x} {y+size-40} Z" fill="none" stroke="{LINE}" stroke-width="3"/>
  <path d="M {x+18} {y+18} L {x+size-18} {y+18} L {x+size-18} {y+size-18} L {x+54} {y+size-18} Q {x+18} {y+size-18} {x+18} {y+size-54} Z" fill="none" stroke="{ORANGE}" stroke-width="2.5"/>
  <circle cx="{x+size-50}" cy="{y+size-50}" r="4" fill="{LINE}"/>
  <line x1="{x+size-30}" y1="{y-26}" x2="{x+size-30}" y2="{y-4}" stroke="{LINE}" stroke-width="4" stroke-linecap="round"/>
  <path d="M {x+size-30} {y-26} q 16 0 16 18" fill="none" stroke="{LINE}" stroke-width="4" stroke-linecap="round"/>
'''

def rectangular(seed):
    random.seed(seed)
    w = random.randint(210, 250); h = random.randint(84, 100)
    x = 200 - w/2; y = 150 - h/2
    return f'''
  <rect x="26" y="{y+h+4}" width="348" height="16" fill="{LINE}" opacity="0.12"/>
  <rect x="{x}" y="{y}" width="{w}" height="{h}" fill="none" stroke="{LINE}" stroke-width="3"/>
  <rect x="{x+16}" y="{y+16}" width="{w-32}" height="{h-32}" fill="none" stroke="{ORANGE}" stroke-width="2.5"/>
  <circle cx="200" cy="{y+h/2}" r="4" fill="{LINE}"/>
  <line x1="196" y1="{y-30}" x2="196" y2="{y-6}" stroke="{LINE}" stroke-width="4" stroke-linecap="round"/>
  <path d="M 196 {y-30} q 16 0 16 18" fill="none" stroke="{LINE}" stroke-width="4" stroke-linecap="round"/>
'''

GENERATORS = {"vessel": vessel, "undermount": undermount, "pedestal": pedestal, "corner": corner, "rectangular": rectangular}

def main():
    for p in PRODUCTS:
        gen = GENERATORS[p["shape"]]
        seed = sum(ord(c) for c in p["id"])
        svg = card(gen(seed), p["name"])
        with open(os.path.join(SINKS_OUT, f'{p["id"]}.svg'), "w") as f:
            f.write(svg)

    js = "// KERAMO ART — სანიჟარეების კატალოგის მონაცემები\n"
    js += "// placeholder კონტენტია; რეალური ფოტოები და აღწერები მერე ჩაანაცვლებთ (იხ. assets/sinks/README.md)\n\n"
    js += "const CATEGORIES = " + json.dumps(CATEGORIES, ensure_ascii=False, indent=2) + ";\n\n"
    js += "const PRODUCTS = " + json.dumps(PRODUCTS, ensure_ascii=False, indent=2) + ";\n"
    with open(PRODUCTS_JS, "w") as f:
        f.write(js)

    print(f"Generated {len(PRODUCTS)} sink illustrations in {SINKS_OUT}")
    print(f"Wrote {PRODUCTS_JS}")

if __name__ == "__main__":
    main()
