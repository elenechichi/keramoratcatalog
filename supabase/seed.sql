-- seed
insert into public.categories (id,label,sort) values
  ($q$built-in$q$,$q$ჩაშენებული$q$,0),
  ($q$double$q$,$q$ორმაგი$q$,1),
  ($q$pedestal$q$,$q$პოსტამენტური$q$,2),
  ($q$washer$q$,$q$სარეცხ მანქანაზე მორგებული$q$,3),
  ($q$custom$q$,$q$ინდივიდუალური დიზაინი$q$,4)
on conflict (id) do nothing;

insert into public.products (slug,name,category,material,color,size,washer,featured,note,images,sort) values
  ($q$nebbia-01$q$,$q$Nebbia$q$,$q$built-in$q$,$q$კერამოგრანიტი$q$,$q$ნაცრისფერი$q$,$q$≈ 100 × 45 სმ$q$,false,false,$q$ჩაშენებული ნიჟარა, შუქამრეკლი ოვალური სარკით$q$,array[$q$assets/sinks/nebbia-01.jpg$q$],0),
  ($q$notte-01$q$,$q$Notte$q$,$q$double$q$,$q$მარმარილოს ეფექტის კერამოგრანიტი$q$,$q$ღრმა შავი, ოქროსფერი ძარღვებით$q$,$q$≈ 165 × 45 სმ$q$,false,true,$q$ორმაგი ნიჟარა, ორი ოქროსფერი ონკანით$q$,array[$q$assets/sinks/notte-01.jpg$q$],1),
  ($q$sabbia-01$q$,$q$Sabbia$q$,$q$built-in$q$,$q$კერამოგრანიტი$q$,$q$ქვიშისფერი$q$,$q$≈ 120 × 40 სმ$q$,false,false,$q$მუქი ხის კარადით, ჩაშენებული$q$,array[$q$assets/sinks/sabbia-01.jpg$q$],2),
  ($q$costa-01$q$,$q$Costa$q$,$q$pedestal$q$,$q$კერამოგრანიტი$q$,$q$ბეჟი$q$,$q$≈ 45 × 45 × 85 სმ$q$,false,false,$q$პოსტამენტური, ოქროსფერი ფიტინგებით$q$,array[$q$assets/sinks/costa-01.jpg$q$],3),
  ($q$calacatta-01$q$,$q$Calacatta$q$,$q$pedestal$q$,$q$მარმარილოს ეფექტი$q$,$q$თეთრი, ნაცრისფერი ძარღვებით$q$,$q$≈ 45 × 45 × 85 სმ$q$,false,true,$q$პოსტამენტური, თაღოვანი სარკის ქვეშ$q$,array[$q$assets/sinks/calacatta-01.jpg$q$],4),
  ($q$verde-01$q$,$q$Verde$q$,$q$washer$q$,$q$კერამოგრანიტი$q$,$q$თეთრი$q$,$q$სტანდარტული სარეცხი მანქანის სიგანეზე$q$,true,false,$q$სარეცხ მანქანაზე მორგებული — ნიჟარა და მანქანა ერთ ხაზზეა, ფერშიც და ზომაშიც$q$,array[$q$assets/sinks/verde-01.jpg$q$],5),
  ($q$lino-01$q$,$q$Lino$q$,$q$built-in$q$,$q$კერამოგრანიტი$q$,$q$ბეჟი$q$,$q$≈ 110 × 40 სმ$q$,false,false,$q$მინიმალისტური, მრგვალი შუქამრეკლი სარკით$q$,array[$q$assets/sinks/lino-01.jpg$q$],6),
  ($q$crema-01$q$,$q$Crema$q$,$q$built-in$q$,$q$მარმარილოს ეფექტი$q$,$q$კრემისფერი$q$,$q$≈ 130 × 45 სმ$q$,false,false,$q$ჩაშენებული, შუქგამტარი ზოლით სარკის ქვეშ$q$,array[$q$assets/sinks/crema-01.jpg$q$],7),
  ($q$bronzo-01$q$,$q$Bronzo$q$,$q$double$q$,$q$კერამოგრანიტი$q$,$q$ბრინჯაო-ნაცრისფერი$q$,$q$≈ 180 × 45 სმ$q$,false,false,$q$ორმაგი ნიჟარა, ორი ინდივიდუალური ონკანით$q$,array[$q$assets/sinks/bronzo-01.jpg$q$],8),
  ($q$pietraserena-01$q$,$q$Pietra Serena$q$,$q$washer$q$,$q$კერამოგრანიტი$q$,$q$ღია ნაცრისფერი$q$,$q$≈ 140 × 40 სმ, თაროთი$q$,true,true,$q$სარეცხ მანქანაზე მორგებული, გვერდით თაროთი$q$,array[$q$assets/sinks/pietraserena-01.jpg$q$],9),
  ($q$ruggine-01$q$,$q$Ruggine$q$,$q$washer$q$,$q$კერამოგრანიტი$q$,$q$ჟანგისფერი, აბსტრაქტული ნახატით$q$,$q$≈ 150 × 45 სმ$q$,true,false,$q$სარეცხ მანქანაზე მორგებული, მინის ზედაპირის დაცვით$q$,array[$q$assets/sinks/ruggine-01.jpg$q$],10),
  ($q$travertino-01$q$,$q$Travertino$q$,$q$pedestal$q$,$q$ტრავერტინის ეფექტი$q$,$q$ქვიშისფერი$q$,$q$≈ 40 × 40 × 85 სმ$q$,false,false,$q$მასიური პოსტამენტური კუბი, შავი ფიტინგები$q$,array[$q$assets/sinks/travertino-01.jpg$q$],11),
  ($q$scultura-01$q$,$q$Scultura$q$,$q$custom$q$,$q$მარმარილოს ეფექტი$q$,$q$ჭრელი, მრავალფეროვანი ძარღვებით$q$,$q$≈ 50 × 50 × 85 სმ$q$,false,false,$q$სამკუთხა პოსტამენტი, ინდივიდუალური დიზაინერული გადაწყვეტა$q$,array[$q$assets/sinks/scultura-01.jpg$q$],12),
  ($q$smeraldo-01$q$,$q$Smeraldo$q$,$q$custom$q$,$q$მარმარილოს ეფექტი$q$,$q$მუქი მწვანე$q$,$q$ინდივიდუალური ზომა$q$,false,false,$q$გარე/სამეურნეო კომპლექტი კონფორკასთან ერთად$q$,array[$q$assets/sinks/smeraldo-01.jpg$q$],13),
  ($q$terracotta-01$q$,$q$Terracotta$q$,$q$pedestal$q$,$q$კერამოგრანიტი$q$,$q$ბეჟი$q$,$q$≈ 45 × 40 × 85 სმ$q$,false,false,$q$პოსტამენტური, გეომეტრიული ფილით შერწყმული$q$,array[$q$assets/sinks/terracotta-01.jpg$q$],14),
  ($q$caffe-01$q$,$q$Caffè$q$,$q$double$q$,$q$მარმარილოს ეფექტი$q$,$q$კრემისფერი$q$,$q$≈ 160 × 45 სმ$q$,false,false,$q$კომერციული ობიექტის ორმაგი ნიჟარა — Cafe Bathroom Interior, ინდივიდუალური დიზაინი$q$,array[$q$assets/sinks/caffe-01.jpg$q$],15),
  ($q$statuario-01$q$,$q$Statuario$q$,$q$built-in$q$,$q$მარმარილოს ეფექტი$q$,$q$თეთრი, მუქი ძარღვებით$q$,$q$≈ 90 × 45 სმ$q$,false,false,$q$ჩაშენებული, ღია თაროთი ქვემოთ$q$,array[$q$assets/sinks/statuario-01.jpg$q$],16)
on conflict (slug) do nothing;
