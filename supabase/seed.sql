-- seed (არსებული 17 მოდელი)
insert into public.categories (id,label,sort,price,basins,min_cm) values
  ($q$built-in$q$,$q$ერთვანიანი (კედლის)$q$,0,null,1,null),
  ($q$double$q$,$q$ორვანიანი$q$,1,null,2,120),
  ($q$washer$q$,$q$სარეცხ მანქანაზე მორგებული$q$,2,null,1,90),
  ($q$pedestal-rect$q$,$q$პოსტამენტი — მართკუთხა$q$,3,1400,1,null),
  ($q$pedestal-taper$q$,$q$პოსტამენტი — დაცერავებული ფეხით$q$,4,1550,1,null),
  ($q$custom$q$,$q$ინდივიდუალური დიზაინი$q$,5,null,1,null)
on conflict (id) do update set label = excluded.label, sort = excluded.sort, price = excluded.price, basins = excluded.basins, min_cm = excluded.min_cm;

insert into public.products (slug,name,category,material,color,length_cm,depth_cm,height_cm,washer,featured,note,images,sort) values
  ($q$nebbia-01$q$,$q$Nebbia$q$,$q$built-in$q$,$q$კერამოგრანიტი$q$,$q$ნაცრისფერი$q$,80,40,null,false,false,$q$კედელზე დამაგრებული ნიჟარა, შუქამრეკლი ოვალური სარკით$q$,array[$q$assets/sinks/nebbia-01.jpg$q$],0),
  ($q$notte-01$q$,$q$Notte$q$,$q$double$q$,$q$მარმარილოს ეფექტის კერამოგრანიტი$q$,$q$ღრმა შავი, ოქროსფერი ძარღვებით$q$,160,45,null,false,true,$q$ორვანიანი ნიჟარა, ორი ოქროსფერი ონკანით და ქვედა განათებით$q$,array[$q$assets/sinks/notte-01.jpg$q$],1),
  ($q$sabbia-01$q$,$q$Sabbia$q$,$q$built-in$q$,$q$კერამოგრანიტი$q$,$q$ქვიშისფერი$q$,120,45,null,false,false,$q$მუქი ხის კარადით, ჩაშენებული$q$,array[$q$assets/sinks/sabbia-01.jpg$q$],2),
  ($q$costa-01$q$,$q$Costa$q$,$q$pedestal-taper$q$,$q$კერამოგრანიტი$q$,$q$ბეჟი$q$,45,45,85,false,false,$q$პოსტამენტური, ოქროსფერი ფიტინგებით$q$,array[$q$assets/sinks/costa-01.jpg$q$],3),
  ($q$calacatta-01$q$,$q$Calacatta$q$,$q$pedestal-taper$q$,$q$მარმარილოს ეფექტი$q$,$q$თეთრი, ნაცრისფერი ძარღვებით$q$,45,45,85,false,true,$q$პოსტამენტური, თაღოვანი სარკის ქვეშ$q$,array[$q$assets/sinks/calacatta-01.jpg$q$],4),
  ($q$verde-01$q$,$q$Verde$q$,$q$washer$q$,$q$კერამოგრანიტი$q$,$q$თეთრი$q$,130,60,null,true,false,$q$სარეცხ მანქანაზე მორგებული — ნიჟარა და მანქანა ერთ ხაზზეა, ფერშიც და ზომაშიც$q$,array[$q$assets/sinks/verde-01.jpg$q$],5),
  ($q$lino-01$q$,$q$Lino$q$,$q$built-in$q$,$q$კერამოგრანიტი$q$,$q$ბეჟი$q$,100,45,null,false,false,$q$მინიმალისტური, მრგვალი შუქამრეკლი სარკით$q$,array[$q$assets/sinks/lino-01.jpg$q$],6),
  ($q$crema-01$q$,$q$Crema$q$,$q$built-in$q$,$q$მარმარილოს ეფექტი$q$,$q$კრემისფერი$q$,150,50,null,false,false,$q$ჩაშენებული, შუქგამტარი ზოლით სარკის ქვეშ$q$,array[$q$assets/sinks/crema-01.jpg$q$],7),
  ($q$bronzo-01$q$,$q$Bronzo$q$,$q$double$q$,$q$კერამოგრანიტი$q$,$q$ბრინჯაო-ნაცრისფერი$q$,180,45,null,false,false,$q$ორვანიანი ნიჟარა, ორი ინდივიდუალური ონკანით$q$,array[$q$assets/sinks/bronzo-01.jpg$q$],8),
  ($q$pietraserena-01$q$,$q$Pietra Serena$q$,$q$washer$q$,$q$კერამოგრანიტი$q$,$q$ღია ნაცრისფერი$q$,120,60,null,true,true,$q$სარეცხ მანქანაზე მორგებული, გვერდით თაროთი$q$,array[$q$assets/sinks/pietraserena-01.jpg$q$],9),
  ($q$ruggine-01$q$,$q$Ruggine$q$,$q$washer$q$,$q$კერამოგრანიტი$q$,$q$ჟანგისფერი, აბსტრაქტული ნახატით$q$,150,55,null,true,false,$q$სარეცხ მანქანაზე მორგებული, მინის ზედაპირის დაცვით$q$,array[$q$assets/sinks/ruggine-01.jpg$q$],10),
  ($q$travertino-01$q$,$q$Travertino$q$,$q$pedestal-rect$q$,$q$ტრავერტინის ეფექტი$q$,$q$ქვიშისფერი$q$,40,40,85,false,false,$q$მასიური პოსტამენტური კუბი, შავი ფიტინგები$q$,array[$q$assets/sinks/travertino-01.jpg$q$],11),
  ($q$scultura-01$q$,$q$Scultura$q$,$q$pedestal-taper$q$,$q$მარმარილოს ეფექტი$q$,$q$ჭრელი, მრავალფეროვანი ძარღვებით$q$,60,45,85,false,false,$q$სამკუთხა, ქვემოთ დავიწროებული პოსტამენტი — დიზაინერული გადაწყვეტა$q$,array[$q$assets/sinks/scultura-01.jpg$q$],12),
  ($q$smeraldo-01$q$,$q$Smeraldo$q$,$q$custom$q$,$q$მარმარილოს ეფექტი$q$,$q$მუქი მწვანე$q$,null,null,null,false,false,$q$გარე/სამეურნეო კომპლექტი კონფორკასთან ერთად — ფასი ინდივიდუალურად$q$,array[$q$assets/sinks/smeraldo-01.jpg$q$],13),
  ($q$terracotta-01$q$,$q$Terracotta$q$,$q$pedestal-rect$q$,$q$კერამოგრანიტი$q$,$q$ბეჟი$q$,45,40,85,false,false,$q$პოსტამენტური, გეომეტრიული ფილით შერწყმული$q$,array[$q$assets/sinks/terracotta-01.jpg$q$],14),
  ($q$caffe-01$q$,$q$Caffè$q$,$q$double$q$,$q$მარმარილოს ეფექტი$q$,$q$კრემისფერი$q$,160,45,null,false,false,$q$კომერციული ობიექტის ორვანიანი ნიჟარა — Cafe Bathroom Interior$q$,array[$q$assets/sinks/caffe-01.jpg$q$],15),
  ($q$statuario-01$q$,$q$Statuario$q$,$q$built-in$q$,$q$მარმარილოს ეფექტი$q$,$q$თეთრი, მუქი ძარღვებით$q$,80,45,null,false,false,$q$კედელზე დამაგრებული, ღია თაროთი ქვემოთ$q$,array[$q$assets/sinks/statuario-01.jpg$q$],16)
on conflict (slug) do update set category = excluded.category, note = excluded.note;

delete from public.categories where id = $q$pedestal$q$ and not exists (select 1 from public.products where category = $q$pedestal$q$);
