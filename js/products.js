// KERAMO ART — სანიჟარეების კატალოგის მონაცემები
// placeholder კონტენტია; რეალური ფოტოები და აღწერები მერე ჩაანაცვლებთ (იხ. assets/sinks/README.md)

const CATEGORIES = [
  {
    "id": "vessel",
    "label": "ბადიისებრი"
  },
  {
    "id": "undermount",
    "label": "ჩაშენებული"
  },
  {
    "id": "rectangular",
    "label": "მართკუთხა"
  },
  {
    "id": "pedestal",
    "label": "სვეტზე დამონტაჟებული"
  },
  {
    "id": "corner",
    "label": "კუთხის"
  }
];

const PRODUCTS = [
  {
    "id": "onda-01",
    "name": "Onda",
    "shape": "vessel",
    "category": "vessel",
    "material": "კერამოგრანიტი",
    "color": "მატი თეთრი",
    "size": "⌀ 42 × 15 სმ",
    "collection": "Onda"
  },
  {
    "id": "onda-02",
    "name": "Onda Noir",
    "shape": "vessel",
    "category": "vessel",
    "material": "კერამოგრანიტი",
    "color": "მატი შავი",
    "size": "⌀ 42 × 15 სმ",
    "collection": "Onda"
  },
  {
    "id": "luna-01",
    "name": "Luna",
    "shape": "vessel",
    "category": "vessel",
    "material": "ფაიფური",
    "color": "საპნისფერი",
    "size": "⌀ 40 × 14 სმ",
    "collection": "Luna"
  },
  {
    "id": "luna-02",
    "name": "Luna Sabbia",
    "shape": "vessel",
    "category": "vessel",
    "material": "ფაიფური",
    "color": "ქვიშისფერი",
    "size": "⌀ 40 × 14 სმ",
    "collection": "Luna"
  },
  {
    "id": "terra-01",
    "name": "Terra",
    "shape": "vessel",
    "category": "vessel",
    "material": "კერამოგრანიტი",
    "color": "ტერაკოტა",
    "size": "⌀ 45 × 16 სმ",
    "collection": "Terra"
  },
  {
    "id": "pietra-01",
    "name": "Pietra",
    "shape": "undermount",
    "category": "undermount",
    "material": "კერამოგრანიტი",
    "color": "მატი ნაცრისფერი",
    "size": "55 × 38 სმ",
    "collection": "Pietra"
  },
  {
    "id": "pietra-02",
    "name": "Pietra Grande",
    "shape": "undermount",
    "category": "undermount",
    "material": "კერამოგრანიტი",
    "color": "მატი ნაცრისფერი",
    "size": "60 × 42 სმ",
    "collection": "Pietra"
  },
  {
    "id": "marmo-01",
    "name": "Marmo",
    "shape": "undermount",
    "category": "undermount",
    "material": "ფაიფური",
    "color": "თეთრი მარმარილოს ეფექტით",
    "size": "56 × 40 სმ",
    "collection": "Marmo"
  },
  {
    "id": "marmo-02",
    "name": "Marmo Scuro",
    "shape": "undermount",
    "category": "undermount",
    "material": "ფაიფური",
    "color": "მუქი მარმარილოს ეფექტით",
    "size": "56 × 40 სმ",
    "collection": "Marmo"
  },
  {
    "id": "nero-01",
    "name": "Nero",
    "shape": "undermount",
    "category": "undermount",
    "material": "კერამოგრანიტი",
    "color": "ღრმა შავი",
    "size": "58 × 40 სმ",
    "collection": "Nero"
  },
  {
    "id": "bianco-01",
    "name": "Bianco",
    "shape": "rectangular",
    "category": "rectangular",
    "material": "კერამოგრანიტი",
    "color": "ბრჭყვიალა თეთრი",
    "size": "60 × 45 სმ",
    "collection": "Bianco"
  },
  {
    "id": "bianco-02",
    "name": "Bianco Puro",
    "shape": "rectangular",
    "category": "rectangular",
    "material": "კერამოგრანიტი",
    "color": "მატი თეთრი",
    "size": "65 × 46 სმ",
    "collection": "Bianco"
  },
  {
    "id": "linea-01",
    "name": "Linea",
    "shape": "rectangular",
    "category": "rectangular",
    "material": "ფაიფური",
    "color": "ნაცრისფერი",
    "size": "70 × 46 სმ",
    "collection": "Linea"
  },
  {
    "id": "linea-02",
    "name": "Linea Lunga",
    "shape": "rectangular",
    "category": "rectangular",
    "material": "ფაიფური",
    "color": "ნაცრისფერი",
    "size": "80 × 46 სმ",
    "collection": "Linea"
  },
  {
    "id": "quadro-01",
    "name": "Quadro",
    "shape": "rectangular",
    "category": "rectangular",
    "material": "კერამოგრანიტი",
    "color": "ანთრაციტი",
    "size": "50 × 50 სმ",
    "collection": "Quadro"
  },
  {
    "id": "antico-01",
    "name": "Antico",
    "shape": "pedestal",
    "category": "pedestal",
    "material": "ფაიფური",
    "color": "სპილოს ძვალი",
    "size": "⌀ 38 × 82 სმ",
    "collection": "Antico"
  },
  {
    "id": "antico-02",
    "name": "Antico Scolpito",
    "shape": "pedestal",
    "category": "pedestal",
    "material": "ფაიფური",
    "color": "სპილოს ძვალი",
    "size": "⌀ 38 × 84 სმ",
    "collection": "Antico"
  },
  {
    "id": "classico-01",
    "name": "Classico",
    "shape": "pedestal",
    "category": "pedestal",
    "material": "ფაიფური",
    "color": "თეთრი",
    "size": "⌀ 40 × 85 სმ",
    "collection": "Classico"
  },
  {
    "id": "moderno-01",
    "name": "Moderno",
    "shape": "pedestal",
    "category": "pedestal",
    "material": "კერამოგრანიტი",
    "color": "მატი ნაცრისფერი",
    "size": "⌀ 36 × 80 სმ",
    "collection": "Moderno"
  },
  {
    "id": "angolo-01",
    "name": "Angolo",
    "shape": "corner",
    "category": "corner",
    "material": "კერამოგრანიტი",
    "color": "მატი თეთრი",
    "size": "50 × 50 სმ",
    "collection": "Angolo"
  },
  {
    "id": "angolo-02",
    "name": "Angolo Scuro",
    "shape": "corner",
    "category": "corner",
    "material": "კერამოგრანიტი",
    "color": "მატი შავი",
    "size": "52 × 52 სმ",
    "collection": "Angolo"
  },
  {
    "id": "vertice-01",
    "name": "Vertice",
    "shape": "corner",
    "category": "corner",
    "material": "ფაიფური",
    "color": "ნაცრისფერი",
    "size": "48 × 48 სმ",
    "collection": "Vertice"
  },
  {
    "id": "riva-01",
    "name": "Riva",
    "shape": "vessel",
    "category": "vessel",
    "material": "კერამოგრანიტი",
    "color": "ზეთისხილისფერი",
    "size": "⌀ 43 × 15 სმ",
    "collection": "Riva"
  },
  {
    "id": "forma-01",
    "name": "Forma",
    "shape": "undermount",
    "category": "undermount",
    "material": "ფაიფური",
    "color": "მატი ქვიშისფერი",
    "size": "57 × 40 სმ",
    "collection": "Forma"
  }
];
