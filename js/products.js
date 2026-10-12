// KERAMO ART — სარეზერვო მონაცემები (გამოიყენება, თუ Supabase არ არის დაკავშირებული).
// ზომები მიახლოებითია, შეფასებულია ფოტოების მიხედვით (სიგრძე × სიღრმე, სმ).
// ზუსტი ზომა დგინდება ადგილზე აზომვის შემდეგ.

var CATEGORIES = [
  { id: "built-in", label: "ჩაშენებული" },
  { id: "double",   label: "ორმაგი" },
  { id: "pedestal", label: "პოსტამენტური" },
  { id: "washer",   label: "სარეცხ მანქანაზე მორგებული" },
  { id: "custom",   label: "ინდივიდუალური დიზაინი" },
];

// ფასები ნიჟარის სიგრძის მიხედვით (ლარი)
var PRICING = {
  tiers: [
    { maxCm: 120, price: 850,  label: "1.2 მეტრამდე" },
    { maxCm: 160, price: 1250, label: "1.2 – 1.6 მეტრი" }
  ],
  wallMount: 150
};

var PRODUCTS = [
  { id: "nebbia-01", name: "Nebbia", category: "built-in", material: "კერამოგრანიტი", color: "ნაცრისფერი",
    length_cm: 80, depth_cm: 40, washer: false,
    note: "კედელზე დამაგრებული ნიჟარა, შუქამრეკლი ოვალური სარკით" },
  { id: "notte-01", name: "Notte", category: "double", material: "მარმარილოს ეფექტის კერამოგრანიტი", color: "ღრმა შავი, ოქროსფერი ძარღვებით",
    length_cm: 160, depth_cm: 45, washer: false,
    note: "ორმაგი ნიჟარა, ორი ოქროსფერი ონკანით და ქვედა განათებით" },
  { id: "sabbia-01", name: "Sabbia", category: "built-in", material: "კერამოგრანიტი", color: "ქვიშისფერი",
    length_cm: 120, depth_cm: 45, washer: false,
    note: "მუქი ხის კარადით, ჩაშენებული" },
  { id: "costa-01", name: "Costa", category: "pedestal", material: "კერამოგრანიტი", color: "ბეჟი",
    length_cm: 45, depth_cm: 45, height_cm: 85, washer: false,
    note: "პოსტამენტური, ოქროსფერი ფიტინგებით" },
  { id: "calacatta-01", name: "Calacatta", category: "pedestal", material: "მარმარილოს ეფექტი", color: "თეთრი, ნაცრისფერი ძარღვებით",
    length_cm: 45, depth_cm: 45, height_cm: 85, washer: false,
    note: "პოსტამენტური, თაღოვანი სარკის ქვეშ" },
  { id: "verde-01", name: "Verde", category: "washer", material: "კერამოგრანიტი", color: "თეთრი",
    length_cm: 130, depth_cm: 60, washer: true,
    note: "სარეცხ მანქანაზე მორგებული — ნიჟარა და მანქანა ერთ ხაზზეა, ფერშიც და ზომაშიც" },
  { id: "lino-01", name: "Lino", category: "built-in", material: "კერამოგრანიტი", color: "ბეჟი",
    length_cm: 100, depth_cm: 45, washer: false,
    note: "მინიმალისტური, მრგვალი შუქამრეკლი სარკით" },
  { id: "crema-01", name: "Crema", category: "built-in", material: "მარმარილოს ეფექტი", color: "კრემისფერი",
    length_cm: 150, depth_cm: 50, washer: false,
    note: "ჩაშენებული, შუქგამტარი ზოლით სარკის ქვეშ" },
  { id: "bronzo-01", name: "Bronzo", category: "double", material: "კერამოგრანიტი", color: "ბრინჯაო-ნაცრისფერი",
    length_cm: 180, depth_cm: 45, washer: false,
    note: "ორმაგი ნიჟარა, ორი ინდივიდუალური ონკანით" },
  { id: "pietraserena-01", name: "Pietra Serena", category: "washer", material: "კერამოგრანიტი", color: "ღია ნაცრისფერი",
    length_cm: 120, depth_cm: 60, washer: true,
    note: "სარეცხ მანქანაზე მორგებული, გვერდით თაროთი" },
  { id: "ruggine-01", name: "Ruggine", category: "washer", material: "კერამოგრანიტი", color: "ჟანგისფერი, აბსტრაქტული ნახატით",
    length_cm: 150, depth_cm: 55, washer: true,
    note: "სარეცხ მანქანაზე მორგებული, მინის ზედაპირის დაცვით" },
  { id: "travertino-01", name: "Travertino", category: "pedestal", material: "ტრავერტინის ეფექტი", color: "ქვიშისფერი",
    length_cm: 40, depth_cm: 40, height_cm: 85, washer: false,
    note: "მასიური პოსტამენტური კუბი, შავი ფიტინგები" },
  { id: "scultura-01", name: "Scultura", category: "custom", material: "მარმარილოს ეფექტი", color: "ჭრელი, მრავალფეროვანი ძარღვებით",
    length_cm: 60, depth_cm: 45, height_cm: 85, washer: false,
    note: "სამკუთხა პოსტამენტი, ინდივიდუალური დიზაინერული გადაწყვეტა" },
  { id: "smeraldo-01", name: "Smeraldo", category: "custom", material: "მარმარილოს ეფექტი", color: "მუქი მწვანე",
    length_cm: null, depth_cm: null, washer: false,
    note: "გარე/სამეურნეო კომპლექტი კონფორკასთან ერთად — ფასი ინდივიდუალურად" },
  { id: "terracotta-01", name: "Terracotta", category: "pedestal", material: "კერამოგრანიტი", color: "ბეჟი",
    length_cm: 45, depth_cm: 40, height_cm: 85, washer: false,
    note: "პოსტამენტური, გეომეტრიული ფილით შერწყმული" },
  { id: "caffe-01", name: "Caffè", category: "double", material: "მარმარილოს ეფექტი", color: "კრემისფერი",
    length_cm: 160, depth_cm: 45, washer: false,
    note: "კომერციული ობიექტის ორმაგი ნიჟარა — Cafe Bathroom Interior" },
  { id: "statuario-01", name: "Statuario", category: "built-in", material: "მარმარილოს ეფექტი", color: "თეთრი, მუქი ძარღვებით",
    length_cm: 80, depth_cm: 45, washer: false,
    note: "კედელზე დამაგრებული, ღია თაროთი ქვემოთ" },
];

// ფასის გამოთვლა სიგრძით (სმ). აბრუნებს null-ს, თუ ფასი ინდივიდუალურია.
function priceForLength(cm) {
  if (!cm || cm <= 0) return null;
  for (var i = 0; i < PRICING.tiers.length; i++) if (cm <= PRICING.tiers[i].maxCm) return PRICING.tiers[i].price;
  return null;
}
