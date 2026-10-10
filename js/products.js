// KERAMO ART — განხორციელებული პროექტების გალერეა
// ეს რეალური ფოტოებია; სახელები პირობითია (ყოველ ობიექტს ჩვენ ვარქმევთ სახელს დათვალიერების გასაადვილებლად).
// ზომები მიახლოებითია — ზუსტი ზომა დგინდება ადგილზე აზომვის შემდეგ (იხ. "შეკვეთის პროცესი").

var CATEGORIES = [
  { id: "built-in", label: "ჩაშენებული" },
  { id: "double",   label: "ორმაგი" },
  { id: "pedestal", label: "პოსტამენტური" },
  { id: "washer",   label: "სარეცხ მანქანაზე მორგებული" },
  { id: "custom",   label: "ინდივიდუალური დიზაინი" },
];

var PRODUCTS = [
  {
    id: "nebbia-01", name: "Nebbia", category: "built-in",
    material: "კერამოგრანიტი", color: "ნაცრისფერი",
    size: "≈ 100 × 45 სმ", washer: false,
    note: "ჩაშენებული ნიჟარა, შუქამრეკლი ოვალური სარკით"
  },
  {
    id: "notte-01", name: "Notte", category: "double",
    material: "მარმარილოს ეფექტის კერამოგრანიტი", color: "ღრმა შავი, ოქროსფერი ძარღვებით",
    size: "≈ 165 × 45 სმ", washer: false,
    note: "ორმაგი ნიჟარა, ორი ოქროსფერი ონკანით"
  },
  {
    id: "sabbia-01", name: "Sabbia", category: "built-in",
    material: "კერამოგრანიტი", color: "ქვიშისფერი",
    size: "≈ 120 × 40 სმ", washer: false,
    note: "მუქი ხის კარადით, ჩაშენებული"
  },
  {
    id: "costa-01", name: "Costa", category: "pedestal",
    material: "კერამოგრანიტი", color: "ბეჟი",
    size: "≈ 45 × 45 × 85 სმ", washer: false,
    note: "პოსტამენტური, ოქროსფერი ფიტინგებით"
  },
  {
    id: "calacatta-01", name: "Calacatta", category: "pedestal",
    material: "მარმარილოს ეფექტი", color: "თეთრი, ნაცრისფერი ძარღვებით",
    size: "≈ 45 × 45 × 85 სმ", washer: false,
    note: "პოსტამენტური, თაღოვანი სარკის ქვეშ"
  },
  {
    id: "verde-01", name: "Verde", category: "washer",
    material: "კერამოგრანიტი", color: "თეთრი",
    size: "სტანდარტული სარეცხი მანქანის სიგანეზე", washer: true,
    note: "სარეცხ მანქანაზე მორგებული — ნიჟარა და მანქანა ერთ ხაზზეა, ფერშიც და ზომაშიც"
  },
  {
    id: "lino-01", name: "Lino", category: "built-in",
    material: "კერამოგრანიტი", color: "ბეჟი",
    size: "≈ 110 × 40 სმ", washer: false,
    note: "მინიმალისტური, მრგვალი შუქამრეკლი სარკით"
  },
  {
    id: "crema-01", name: "Crema", category: "built-in",
    material: "მარმარილოს ეფექტი", color: "კრემისფერი",
    size: "≈ 130 × 45 სმ", washer: false,
    note: "ჩაშენებული, შუქგამტარი ზოლით სარკის ქვეშ"
  },
  {
    id: "bronzo-01", name: "Bronzo", category: "double",
    material: "კერამოგრანიტი", color: "ბრინჯაო-ნაცრისფერი",
    size: "≈ 180 × 45 სმ", washer: false,
    note: "ორმაგი ნიჟარა, ორი ინდივიდუალური ონკანით"
  },
  {
    id: "pietraserena-01", name: "Pietra Serena", category: "washer",
    material: "კერამოგრანიტი", color: "ღია ნაცრისფერი",
    size: "≈ 140 × 40 სმ, თაროთი", washer: true,
    note: "სარეცხ მანქანაზე მორგებული, გვერდით თაროთი"
  },
  {
    id: "ruggine-01", name: "Ruggine", category: "washer",
    material: "კერამოგრანიტი", color: "ჟანგისფერი, აბსტრაქტული ნახატით",
    size: "≈ 150 × 45 სმ", washer: true,
    note: "სარეცხ მანქანაზე მორგებული, მინის ზედაპირის დაცვით"
  },
  {
    id: "travertino-01", name: "Travertino", category: "pedestal",
    material: "ტრავერტინის ეფექტი", color: "ქვიშისფერი",
    size: "≈ 40 × 40 × 85 სმ", washer: false,
    note: "მასიური პოსტამენტური კუბი, შავი ფიტინგები"
  },
  {
    id: "scultura-01", name: "Scultura", category: "custom",
    material: "მარმარილოს ეფექტი", color: "ჭრელი, მრავალფეროვანი ძარღვებით",
    size: "≈ 50 × 50 × 85 სმ", washer: false,
    note: "სამკუთხა პოსტამენტი, ინდივიდუალური დიზაინერული გადაწყვეტა"
  },
  {
    id: "smeraldo-01", name: "Smeraldo", category: "custom",
    material: "მარმარილოს ეფექტი", color: "მუქი მწვანე",
    size: "ინდივიდუალური ზომა", washer: false,
    note: "გარე/სამეურნეო კომპლექტი კონფორკასთან ერთად"
  },
  {
    id: "terracotta-01", name: "Terracotta", category: "pedestal",
    material: "კერამოგრანიტი", color: "ბეჟი",
    size: "≈ 45 × 40 × 85 სმ", washer: false,
    note: "პოსტამენტური, გეომეტრიული ფილით შერწყმული"
  },
  {
    id: "caffe-01", name: "Caffè", category: "double",
    material: "მარმარილოს ეფექტი", color: "კრემისფერი",
    size: "≈ 160 × 45 სმ", washer: false,
    note: "კომერციული ობიექტის ორმაგი ნიჟარა — Cafe Bathroom Interior, ინდივიდუალური დიზაინი"
  },
  {
    id: "statuario-01", name: "Statuario", category: "built-in",
    material: "მარმარილოს ეფექტი", color: "თეთრი, მუქი ძარღვებით",
    size: "≈ 90 × 45 სმ", washer: false,
    note: "ჩაშენებული, ღია თაროთი ქვემოთ"
  },
];
