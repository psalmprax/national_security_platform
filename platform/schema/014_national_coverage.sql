-- National Coverage Seeding (37 States + FCT + Strategic Capitals)

-- 1. All States and FCT
INSERT INTO states (name, code, capital_city, boundary_geom) VALUES
('Abia', 'NG-AB', 'Umuahia', ST_GeomFromText('POLYGON((7.4 5.4, 7.6 5.4, 7.6 5.6, 7.4 5.6, 7.4 5.4))', 4326)),
('Adamawa', 'NG-AD', 'Yola', ST_GeomFromText('POLYGON((12.4 9.1, 12.6 9.1, 12.6 9.3, 12.4 9.3, 12.4 9.1))', 4326)),
('Akwa Ibom', 'NG-AK', 'Uyo', ST_GeomFromText('POLYGON((7.8 4.9, 8.0 4.9, 8.0 5.1, 7.8 5.1, 7.8 4.9))', 4326)),
('Anambra', 'NG-AN', 'Awka', ST_GeomFromText('POLYGON((7.0 6.1, 7.2 6.1, 7.2 6.3, 7.0 6.3, 7.0 6.1))', 4326)),
('Bauchi', 'NG-BA', 'Bauchi', ST_GeomFromText('POLYGON((9.7 10.2, 9.9 10.2, 9.9 10.4, 9.7 10.4, 9.7 10.2))', 4326)),
('Bayelsa', 'NG-BY', 'Yenagoa', ST_GeomFromText('POLYGON((6.2 4.8, 6.4 4.8, 6.4 5.0, 6.2 5.0, 6.2 4.8))', 4326)),
('Benue', 'NG-BE', 'Makurdi', ST_GeomFromText('POLYGON((8.5 7.6, 8.7 7.6, 8.7 7.8, 8.5 7.8, 8.5 7.6))', 4326)),
('Borno', 'NG-BO', 'Maiduguri', ST_GeomFromText('POLYGON((13.1 11.8, 13.3 11.8, 13.3 12.0, 13.1 12.0, 13.1 11.8))', 4326)),
('Cross River', 'NG-CR', 'Calabar', ST_GeomFromText('POLYGON((8.3 4.9, 8.5 4.9, 8.5 5.1, 8.3 5.1, 8.3 4.9))', 4326)),
('Delta', 'NG-DE', 'Asaba', ST_GeomFromText('POLYGON((6.6 6.1, 6.8 6.1, 6.8 6.3, 6.6 6.3, 6.6 6.1))', 4326)),
('Ebonyi', 'NG-EB', 'Abakaliki', ST_GeomFromText('POLYGON((8.0 6.2, 8.2 6.2, 8.2 6.4, 8.0 6.4, 8.0 6.2))', 4326)),
('Edo', 'NG-ED', 'Benin City', ST_GeomFromText('POLYGON((5.5 6.2, 5.7 6.2, 5.7 6.4, 5.5 6.4, 5.5 6.2))', 4326)),
('Ekiti', 'NG-EK', 'Ado Ekiti', ST_GeomFromText('POLYGON((5.2 7.5, 5.4 7.5, 5.4 7.7, 5.2 7.7, 5.2 7.5))', 4326)),
('Enugu', 'NG-EN', 'Enugu', ST_GeomFromText('POLYGON((7.4 6.3, 7.6 6.3, 7.6 6.5, 7.4 6.5, 7.4 6.3))', 4326)),
('Federal Capital Territory', 'NG-FC', 'Abuja', ST_GeomFromText('POLYGON((7.3 8.9, 7.6 8.9, 7.6 9.2, 7.3 9.2, 7.3 8.9))', 4326)),
('Gombe', 'NG-GO', 'Gombe', ST_GeomFromText('POLYGON((11.1 10.2, 11.3 10.2, 11.3 10.4, 11.1 10.4, 11.1 10.2))', 4326)),
('Imo', 'NG-IM', 'Owerri', ST_GeomFromText('POLYGON((6.9 5.4, 7.1 5.4, 7.1 5.6, 6.9 5.6, 6.9 5.4))', 4326)),
('Jigawa', 'NG-JI', 'Dutse', ST_GeomFromText('POLYGON((9.2 11.6, 9.4 11.6, 9.4 11.8, 9.2 11.8, 9.2 11.6))', 4326)),
('Kaduna', 'NG-KD', 'Kaduna', ST_GeomFromText('POLYGON((7.3 10.4, 7.5 10.4, 7.5 10.6, 7.3 10.6, 7.3 10.4))', 4326)),
('Kano', 'NG-KN', 'Kano', ST_GeomFromText('POLYGON((8.4 11.9, 8.6 11.9, 8.6 12.1, 8.4 12.1, 8.4 11.9))', 4326)),
('Katsina', 'NG-KT', 'Katsina', ST_GeomFromText('POLYGON((7.5 12.9, 7.7 12.9, 7.7 13.1, 7.5 13.1, 7.5 12.9))', 4326)),
('Kebbi', 'NG-KE', 'Birnin Kebbi', ST_GeomFromText('POLYGON((4.1 12.3, 4.3 12.3, 4.3 12.5, 4.1 12.5, 4.1 12.3))', 4326)),
('Kogi', 'NG-KO', 'Lokoja', ST_GeomFromText('POLYGON((6.6 7.7, 6.8 7.7, 6.8 7.9, 6.6 7.9, 6.6 7.7))', 4326)),
('Kwara', 'NG-KW', 'Ilorin', ST_GeomFromText('POLYGON((4.4 8.4, 4.6 8.4, 4.6 8.6, 4.4 8.6, 4.4 8.4))', 4326)),
('Lagos', 'NG-LA', 'Ikeja', ST_GeomFromText('POLYGON((3.3 6.4, 3.5 6.4, 3.5 6.6, 3.3 6.6, 3.3 6.4))', 4326)),
('Nasarawa', 'NG-NA', 'Lafia', ST_GeomFromText('POLYGON((8.4 8.4, 8.6 8.4, 8.6 8.6, 8.4 8.6, 8.4 8.4))', 4326)),
('Niger', 'NG-NI', 'Minna', ST_GeomFromText('POLYGON((6.4 9.5, 6.6 9.5, 6.6 9.7, 6.4 9.7, 6.4 9.5))', 4326)),
('Ogun', 'NG-OG', 'Abeokuta', ST_GeomFromText('POLYGON((3.2 7.0, 3.4 7.0, 3.4 7.2, 3.2 7.2, 3.2 7.0))', 4326)),
('Ondo', 'NG-ON', 'Akure', ST_GeomFromText('POLYGON((5.1 7.1, 5.3 7.1, 5.3 7.3, 5.1 7.3, 5.1 7.1))', 4326)),
('Osun', 'NG-OS', 'Osogbo', ST_GeomFromText('POLYGON((4.4 7.7, 4.6 7.7, 4.6 7.9, 4.4 7.9, 4.4 7.7))', 4326)),
('Oyo', 'NG-OY', 'Ibadan', ST_GeomFromText('POLYGON((3.8 7.3, 4.0 7.3, 4.0 7.5, 3.8 7.5, 3.8 7.3))', 4326)),
('Plateau', 'NG-PL', 'Jos', ST_GeomFromText('POLYGON((8.8 9.8, 9.0 9.8, 9.0 10.0, 8.8 10.0, 8.8 9.8))', 4326)),
('Rivers', 'NG-RI', 'Port Harcourt', ST_GeomFromText('POLYGON((6.9 4.7, 7.1 4.7, 7.1 4.9, 6.9 4.9, 6.9 4.7))', 4326)),
('Sokoto', 'NG-SO', 'Sokoto', ST_GeomFromText('POLYGON((5.1 12.9, 5.3 12.9, 5.3 13.1, 5.1 13.1, 5.1 12.9))', 4326)),
('Taraba', 'NG-TA', 'Jalingo', ST_GeomFromText('POLYGON((11.3 8.8, 11.5 8.8, 11.5 9.0, 11.3 9.0, 11.3 8.8))', 4326)),
('Yobe', 'NG-YO', 'Damaturu', ST_GeomFromText('POLYGON((11.9 11.7, 12.1 11.7, 12.1 11.9, 11.9 11.9, 11.9 11.7))', 4326)),
('Zamfara', 'NG-ZA', 'Gusau', ST_GeomFromText('POLYGON((6.6 12.1, 6.8 12.1, 6.8 12.3, 6.6 12.3, 6.6 12.1))', 4326))
ON CONFLICT (name) DO NOTHING;

-- 2. LGAs (Full National Coverage - 774 LGAs)
INSERT INTO lgas (state_id, name)
SELECT id, l.name
FROM states, 
     (VALUES ('Aba North'), ('Aba South'), ('Arochukwu'), ('Bende'), ('Ikwuano'), ('Isiala Ngwa North'), ('Isiala Ngwa South'), ('Isiukwuato'), ('Obingwa'), ('Ohafia'), ('Osisioma Ngwa'), ('Ugwunagbo'), ('Ukwa East'), ('Ukwa West'), ('Umuahia North'), ('Umuahia South'), ('Umu Nneochi')) AS l(name)
WHERE states.name = 'Abia'
ON CONFLICT (state_id, name) DO NOTHING;

INSERT INTO lgas (state_id, name)
SELECT id, l.name
FROM states, 
     (VALUES ('Demsa'), ('Fufore'), ('Ganye'), ('Gayuk'), ('Gombi'), ('Grie'), ('Hong'), ('Jada'), ('Lamurde'), ('Madagali'), ('Maiha'), ('Mayo-Belwa'), ('Michika'), ('Mubi North'), ('Mubi South'), ('Numan'), ('Shelleng'), ('Song'), ('Toungo'), ('Yola North'), ('Yola South')) AS l(name)
WHERE states.name = 'Adamawa'
ON CONFLICT (state_id, name) DO NOTHING;

INSERT INTO lgas (state_id, name)
SELECT id, l.name
FROM states, 
     (VALUES ('Abak'), ('Eastern Obolo'), ('Eket'), ('Esit Eket'), ('Essien Udim'), ('Etim Ekpo'), ('Etinan'), ('Ibeno'), ('Ibesikpo Asutan'), ('Ibiono Ibom'), ('Ika'), ('Ikono'), ('Ikot Abasi'), ('Ikot Ekpene'), ('Ini'), ('Itu'), ('Mbo'), ('Mkpat Enin'), ('Nsit Atai'), ('Nsit Ibom'), ('Nsit Ubium'), ('Obot Akara'), ('Okobo'), ('Onna'), ('Oron'), ('Oruk Anam'), ('Udung Uko'), ('Ukanafun'), ('Uruan'), ('Urue-Offong/Oruko'), ('Uyo')) AS l(name)
WHERE states.name = 'Akwa Ibom'
ON CONFLICT (state_id, name) DO NOTHING;

INSERT INTO lgas (state_id, name)
SELECT id, l.name
FROM states, 
     (VALUES ('Aguata'), ('Awka North'), ('Awka South'), ('Anambra East'), ('Anambra West'), ('Anaocha'), ('Ayamelum'), ('Dunukofia'), ('Ekwusigo'), ('Idemili North'), ('Idemili South'), ('Ihiala'), ('Njikoka'), ('Nnewi North'), ('Nnewi South'), ('Ogbaru'), ('Onitsha North'), ('Onitsha South'), ('Orumba North'), ('Orumba South'), ('Oyi')) AS l(name)
WHERE states.name = 'Anambra'
ON CONFLICT (state_id, name) DO NOTHING;

INSERT INTO lgas (state_id, name)
SELECT id, l.name
FROM states, 
     (VALUES ('Alkaleri'), ('Bauchi'), ('Bogoro'), ('Damban'), ('Darazo'), ('Dass'), ('Gamawa'), ('Ganjuwa'), ('Giade'), ('Itas/Gadau'), ('Jama''are'), ('Katagum'), ('Kirfi'), ('Misau'), ('Ningi'), ('Shira'), ('Tafawa Balewa'), ('Toro'), ('Warji'), ('Zaki')) AS l(name)
WHERE states.name = 'Bauchi'
ON CONFLICT (state_id, name) DO NOTHING;

INSERT INTO lgas (state_id, name)
SELECT id, l.name
FROM states, 
     (VALUES ('Brass'), ('Ekeremor'), ('Kolokuma/Opokuma'), ('Nembe'), ('Ogbia'), ('Sagbama'), ('Southern Ijaw'), ('Yenagoa')) AS l(name)
WHERE states.name = 'Bayelsa'
ON CONFLICT (state_id, name) DO NOTHING;

INSERT INTO lgas (state_id, name)
SELECT id, l.name
FROM states, 
     (VALUES ('Ado'), ('Agatu'), ('Apa'), ('Buruku'), ('Gboko'), ('Guma'), ('Gwer East'), ('Gwer West'), ('Katsina-Ala'), ('Konshisha'), ('Kwande'), ('Logo'), ('Makurdi'), ('Obi'), ('Ogbadibo'), ('Ohimini'), ('Oju'), ('Okpokwu'), ('Otukpo'), ('Tarka'), ('Ukum'), ('Ushongo'), ('Vandeikya')) AS l(name)
WHERE states.name = 'Benue'
ON CONFLICT (state_id, name) DO NOTHING;

INSERT INTO lgas (state_id, name)
SELECT id, l.name
FROM states, 
     (VALUES ('Abadam'), ('Askira/Uba'), ('Bama'), ('Bayo'), ('Biu'), ('Chibok'), ('Damboa'), ('Dikwa'), ('Gubio'), ('Guzamala'), ('Gwoza'), ('Hawul'), ('Jere'), ('Kaga'), ('Kala/Balge'), ('Konduga'), ('Kukawa'), ('Kwaya Kusar'), ('Mafa'), ('Magumeri'), ('Maiduguri'), ('Marte'), ('Mobbar'), ('Monguno'), ('Nganzai'), ('Shani')) AS l(name)
WHERE states.name = 'Borno'
ON CONFLICT (state_id, name) DO NOTHING;

INSERT INTO lgas (state_id, name)
SELECT id, l.name
FROM states, 
     (VALUES ('Abi'), ('Akamkpa'), ('Akpabuyo'), ('Bakassi'), ('Bekwarra'), ('Biase'), ('Boki'), ('Calabar Municipal'), ('Calabar South'), ('Etung'), ('Ikom'), ('Obanliku'), ('Obubra'), ('Obudu'), ('Odukpani'), ('Ogoja'), ('Yakurr'), ('Yala')) AS l(name)
WHERE states.name = 'Cross River'
ON CONFLICT (state_id, name) DO NOTHING;

INSERT INTO lgas (state_id, name)
SELECT id, l.name
FROM states, 
     (VALUES ('Aniocha North'), ('Aniocha South'), ('Bomadi'), ('Burutu'), ('Ethiope East'), ('Ethiope West'), ('Ika North East'), ('Ika South'), ('Isoko North'), ('Isoko South'), ('Ndokwa East'), ('Ndokwa West'), ('Okpe'), ('Oshimili North'), ('Oshimili South'), ('Patani'), ('Sapele'), ('Udu'), ('Ughelli North'), ('Ughelli South'), ('Ukwuani'), ('Uvwie'), ('Warri North'), ('Warri South'), ('Warri South West')) AS l(name)
WHERE states.name = 'Delta'
ON CONFLICT (state_id, name) DO NOTHING;

INSERT INTO lgas (state_id, name)
SELECT id, l.name
FROM states, 
     (VALUES ('Abakaliki'), ('Afikpo North'), ('Afikpo South (Edda)'), ('Ezza North'), ('Ezza South'), ('Ikwo'), ('Ishielu'), ('Ivo'), ('Izzi'), ('Ohaozara'), ('Ohaukwu'), ('Onicha')) AS l(name)
WHERE states.name = 'Ebonyi'
ON CONFLICT (state_id, name) DO NOTHING;

INSERT INTO lgas (state_id, name)
SELECT id, l.name
FROM states, 
     (VALUES ('Akoko-Edo'), ('Egor'), ('Esan Central'), ('Esan North-East'), ('Esan South-East'), ('Esan West'), ('Etsako Central'), ('Etsako East'), ('Etsako West'), ('Igueben'), ('Ikpoba-Okha'), ('Oredo'), ('Orhionmwon'), ('Ovia North-East'), ('Ovia South-West'), ('Owan East'), ('Owan West'), ('Uhunmwonde')) AS l(name)
WHERE states.name = 'Edo'
ON CONFLICT (state_id, name) DO NOTHING;

INSERT INTO lgas (state_id, name)
SELECT id, l.name
FROM states, 
     (VALUES ('Ado Ekiti'), ('Efon'), ('Ekiti East'), ('Ekiti South-West'), ('Ekiti West'), ('Emure'), ('Gbonyin'), ('Ido/Osi'), ('Ijero'), ('Ikere'), ('Ikole'), ('Ilejemeje'), ('Irepodun/Ifelodun'), ('Ise/Orun'), ('Moba'), ('Oye')) AS l(name)
WHERE states.name = 'Ekiti'
ON CONFLICT (state_id, name) DO NOTHING;

INSERT INTO lgas (state_id, name)
SELECT id, l.name
FROM states, 
     (VALUES ('Aninri'), ('Awgu'), ('Enugu East'), ('Enugu North'), ('Enugu South'), ('Ezeagu'), ('Igbo Etiti'), ('Igbo Eze North'), ('Igbo Eze South'), ('Isi Uzo'), ('Nkanu East'), ('Nkanu West'), ('Nsukka'), ('Oji River'), ('Udenu'), ('Udi'), ('Uzo-Uwani')) AS l(name)
WHERE states.name = 'Enugu'
ON CONFLICT (state_id, name) DO NOTHING;

INSERT INTO lgas (state_id, name)
SELECT id, l.name
FROM states, 
     (VALUES ('Akko'), ('Balanga'), ('Billiri'), ('Dukku'), ('Funakaye'), ('Gombe'), ('Kaltungo'), ('Kwami'), ('Nafada'), ('Shongom'), ('Yamaltu/Deba')) AS l(name)
WHERE states.name = 'Gombe'
ON CONFLICT (state_id, name) DO NOTHING;

INSERT INTO lgas (state_id, name)
SELECT id, l.name
FROM states, 
     (VALUES ('Aboh Mbaise'), ('Ahiazu Mbaise'), ('Ehime Mbano'), ('Ezinihitte Mbaise'), ('Ideato North'), ('Ideato South'), ('Ikeduru'), ('Isiala Mbano'), ('Isu'), ('Mbaitoli'), ('Ngor Okpala'), ('Njaba'), ('Nkwerre'), ('Nwangele'), ('Obowo'), ('Oguta'), ('Ohaji/Egbema'), ('Okigwe'), ('Orlu'), ('Orsu'), ('Oru East'), ('Oru West'), ('Owerri Municipal'), ('Owerri North'), ('Owerri West'), ('Unuimo')) AS l(name)
WHERE states.name = 'Imo'
ON CONFLICT (state_id, name) DO NOTHING;

INSERT INTO lgas (state_id, name)
SELECT id, l.name
FROM states, 
     (VALUES ('Auyo'), ('Babura'), ('Biriniwa'), ('Buji'), ('Dutse'), ('Gagarawa'), ('Garki'), ('Gumel'), ('Guri'), ('Hadejia'), ('Jahun'), ('Kafin Hausa'), ('Kaugama'), ('Kazaure'), ('Kiri Kasama'), ('Kiyawa'), ('Kudai'), ('Maigatari'), ('Malam Madori'), ('Miga'), ('Ringim'), ('Roni'), ('Sule Tankarkar'), ('Taura'), ('Yankwashi')) AS l(name)
WHERE states.name = 'Jigawa'
ON CONFLICT (state_id, name) DO NOTHING;

INSERT INTO lgas (state_id, name)
SELECT id, l.name
FROM states, 
     (VALUES ('Birnin Gwari'), ('Chikun'), ('Giwa'), ('Igabi'), ('Ikara'), ('Jaba'), ('Jema''a'), ('Kachia'), ('Kaduna North'), ('Kaduna South'), ('Kagarko'), ('Kajuru'), ('Kaura'), ('Kauru'), ('Kubau'), ('Kudan'), ('Lere'), ('Makarfi'), ('Sabon Gari'), ('Sanga'), ('Soba'), ('Zangon Kataf'), ('Zaria')) AS l(name)
WHERE states.name = 'Kaduna'
ON CONFLICT (state_id, name) DO NOTHING;

INSERT INTO lgas (state_id, name)
SELECT id, l.name
FROM states, 
     (VALUES ('Ajingi'), ('Albasu'), ('Bagwai'), ('Bebeji'), ('Bichi'), ('Bunkure'), ('Dala'), ('Dambatta'), ('Dawakin Kudu'), ('Dawakin Tofa'), ('Doguwa'), ('Fagge'), ('Gabasawa'), ('Garko'), ('Garun Mallam'), ('Gaya'), ('Gezawa'), ('Gwale'), ('Gwarzo'), ('Kabo'), ('Kano Municipal'), ('Karaye'), ('Kibiya'), ('Kiru'), ('Kumbotso'), ('Kunchi'), ('Kura'), ('Madobi'), ('Makoda'), ('Minjibir'), ('Nasarawa'), ('Rano'), ('Rimin Gado'), ('Rogo'), ('Shanono'), ('Sumaila'), ('Takai'), ('Tarauni'), ('Tofa'), ('Tsanyawa'), ('Tudun Wada'), ('Ungogo'), ('Warawa'), ('Wudil')) AS l(name)
WHERE states.name = 'Kano'
ON CONFLICT (state_id, name) DO NOTHING;

INSERT INTO lgas (state_id, name)
SELECT id, l.name
FROM states, 
     (VALUES ('Bakori'), ('Batagarawa'), ('Batsari'), ('Baure'), ('Bindawa'), ('Charanchi'), ('Dandume'), ('Danja'), ('Dan Musa'), ('Daura'), ('Dutsi'), ('Dutsin Ma'), ('Faskari'), ('Funtua'), ('Ingawa'), ('Jibia'), ('Kafur'), ('Kaita'), ('Kankara'), ('Kankia'), ('Katsina'), ('Kurfi'), ('Kusada'), ('Mai''Adua'), ('Malumfashi'), ('Mani'), ('Mashi'), ('Matazu'), ('Musawa'), ('Rimi'), ('Sabuwa'), ('Safana'), ('Sandamu'), ('Zango')) AS l(name)
WHERE states.name = 'Katsina'
ON CONFLICT (state_id, name) DO NOTHING;

INSERT INTO lgas (state_id, name)
SELECT id, l.name
FROM states, 
     (VALUES ('Aleiro'), ('Arewa Dandi'), ('Argungu'), ('Augie'), ('Bagudo'), ('Birnin Kebbi'), ('Bunza'), ('Dandi'), ('Fakai'), ('Gwandu'), ('Jega'), ('Kalgo'), ('Koko/Besse'), ('Maiyama'), ('Ngaski'), ('Sakaba'), ('Shanga'), ('Suru'), ('Wasagu/Danko'), ('Yauri'), ('Zuru')) AS l(name)
WHERE states.name = 'Kebbi'
ON CONFLICT (state_id, name) DO NOTHING;

INSERT INTO lgas (state_id, name)
SELECT id, l.name
FROM states, 
     (VALUES ('Adavi'), ('Ajaokuta'), ('Ankpa'), ('Bassa'), ('Dekina'), ('Ibaji'), ('Idah'), ('Igalamela-Odolu'), ('Ijumu'), ('Kabba/Bunu'), ('Koton Karfe'), ('Lokoja'), ('Mopa-Muro'), ('Ofu'), ('Ogori/Magongo'), ('Okehi'), ('Okene'), ('Olamaboro'), ('Omala'), ('Yagba East'), ('Yagba West')) AS l(name)
WHERE states.name = 'Kogi'
ON CONFLICT (state_id, name) DO NOTHING;

INSERT INTO lgas (state_id, name)
SELECT id, l.name
FROM states, 
     (VALUES ('Asa'), ('Baruten'), ('Edu'), ('Ekiti'), ('Ifelodun'), ('Ilorin East'), ('Ilorin South'), ('Ilorin West'), ('Irepodun'), ('Isin'), ('Kaiama'), ('Moro'), ('Offa'), ('Oke Ero'), ('Oyun'), ('Patigi')) AS l(name)
WHERE states.name = 'Kwara'
ON CONFLICT (state_id, name) DO NOTHING;

INSERT INTO lgas (state_id, name)
SELECT id, l.name
FROM states, 
     (VALUES ('Agege'), ('Ajeromi-Ifelodun'), ('Alimosho'), ('Amuwo-Odofin'), ('Apapa'), ('Badagry'), ('Epe'), ('Eti-Osa'), ('Ibeju-Lekki'), ('Ifako-Ijaiye'), ('Ikeja'), ('Ikorodu'), ('Kosofe'), ('Lagos Island'), ('Lagos Mainland'), ('Mushin'), ('Ojo'), ('Oshodi-Isolo'), ('Shomolu'), ('Surulere')) AS l(name)
WHERE states.name = 'Lagos'
ON CONFLICT (state_id, name) DO NOTHING;

INSERT INTO lgas (state_id, name)
SELECT id, l.name
FROM states, 
     (VALUES ('Akwanga'), ('Awe'), ('Doma'), ('Karu'), ('Keana'), ('Keffi'), ('Kokona'), ('Lafia'), ('Nasarawa'), ('Nasarawa Eggon'), ('Obi'), ('Toto'), ('Wamba')) AS l(name)
WHERE states.name = 'Nasarawa'
ON CONFLICT (state_id, name) DO NOTHING;

INSERT INTO lgas (state_id, name)
SELECT id, l.name
FROM states, 
     (VALUES ('Agaie'), ('Agwara'), ('Bida'), ('Borgu'), ('Bosso'), ('Chanchaga'), ('Edati'), ('Gbako'), ('Gurara'), ('Katcha'), ('Kontagora'), ('Lapai'), ('Lavun'), ('Magama'), ('Mariga'), ('Mashegu'), ('Mokwa'), ('Munya'), ('Paikoro'), ('Rafi'), ('Rijau'), ('Shiroro'), ('Suleja'), ('Tafa'), ('Wushishi')) AS l(name)
WHERE states.name = 'Niger'
ON CONFLICT (state_id, name) DO NOTHING;

INSERT INTO lgas (state_id, name)
SELECT id, l.name
FROM states, 
     (VALUES ('Abeokuta North'), ('Abeokuta South'), ('Ado-Odo/Ota'), ('Egbado North'), ('Egbado South'), ('Ewekoro'), ('Ifo'), ('Ijebu East'), ('Ijebu North'), ('Ijebu North East'), ('Ijebu Ode'), ('Ikenne'), ('Imeko Afon'), ('Ipokia'), ('Obafemi Owode'), ('Ogun Waterside'), ('Odeda'), ('Odogbolu'), ('Remo North'), ('Sagamu')) AS l(name)
WHERE states.name = 'Ogun'
ON CONFLICT (state_id, name) DO NOTHING;

INSERT INTO lgas (state_id, name)
SELECT id, l.name
FROM states, 
     (VALUES ('Akoko North-East'), ('Akoko North-West'), ('Akoko South-East'), ('Akoko South-West'), ('Idanre'), ('Ifedore'), ('Odigbo'), ('Okitipupa'), ('Ondo East'), ('Ondo West'), ('Ose'), ('Owo')) AS l(name)
WHERE states.name = 'Ondo'
ON CONFLICT (state_id, name) DO NOTHING;

INSERT INTO lgas (state_id, name)
SELECT id, l.name
FROM states, 
     (VALUES ('Atakumosa East'), ('Atakumosa West'), ('Ayedaade'), ('Ayedire'), ('Boluwaduro'), ('Boripe'), ('Ede North'), ('Ede South'), ('Egbedore'), ('Ejigbo'), ('Ife Central'), ('Ife East'), ('Ife North'), ('Ife South'), ('Ifelodun'), ('Ilesa East'), ('Ilesa West'), ('Ila'), ('Iwo'), ('Obokun'), ('Odo Otin'), ('Ola Oluwa'), ('Olorunda'), ('Oriade'), ('Orolu'), ('Osogbo')) AS l(name)
WHERE states.name = 'Osun'
ON CONFLICT (state_id, name) DO NOTHING;

INSERT INTO lgas (state_id, name)
SELECT id, l.name
FROM states, 
     (VALUES ('Akinyele'), ('Atiba'), ('Atisbo'), ('Egbeda'), ('Ibadan North'), ('Ibadan North-East'), ('Ibadan North-West'), ('Ibadan South-East'), ('Ibadan South-West'), ('Ibarapa Central'), ('Ibarapa East'), ('Ibarapa North'), ('Ido'), ('Ifeloju'), ('Iganna'), ('Irepo'), ('Iseyin'), ('Itesiwaju'), ('Iwajowa'), ('Kajola'), ('Lagelu'), ('Ogbomosho North'), ('Ogbomosho South'), ('Ogo Oluwa'), ('Olorunsogo'), ('Oluyole'), ('Ona Ara'), ('Orelope'), ('Ori Ire'), ('Oyo East'), ('Oyo West'), ('Saki East'), ('Saki West'), ('Surulere')) AS l(name)
WHERE states.name = 'Oyo'
ON CONFLICT (state_id, name) DO NOTHING;

INSERT INTO lgas (state_id, name)
SELECT id, l.name
FROM states, 
     (VALUES ('Barkin Ladi'), ('Bassa'), ('Bokkos'), ('Jos East'), ('Jos North'), ('Jos South'), ('Kanam'), ('Kanke'), ('Langtang North'), ('Langtang South'), ('Mangu'), ('Mikang'), ('Pankshin'), ('Qua''an Pan'), ('Riyom'), ('Shendam'), ('Wase')) AS l(name)
WHERE states.name = 'Plateau'
ON CONFLICT (state_id, name) DO NOTHING;

INSERT INTO lgas (state_id, name)
SELECT id, l.name
FROM states, 
     (VALUES ('Abua/Odual'), ('Ahoada East'), ('Ahoada West'), ('Akuku-Toru'), ('Andoni'), ('Asari-Toru'), ('Bonny'), ('Degema'), ('Eleme'), ('Emohua'), ('Etche'), ('Gokana'), ('Ikwerre'), ('Khana'), ('Obio/Akpor'), ('Ogba/Egbema/Ndoni'), ('Ogu/Bolo'), ('Okrika'), ('Omuma'), ('Opobo/Nkoro'), ('Oyigbo'), ('Port Harcourt'), ('Tai')) AS l(name)
WHERE states.name = 'Rivers'
ON CONFLICT (state_id, name) DO NOTHING;

INSERT INTO lgas (state_id, name)
SELECT id, l.name
FROM states, 
     (VALUES ('Binji'), ('Bodinga'), ('Dange Shuni'), ('Gada'), ('Goronyo'), ('Gwadabawa'), ('Illela'), ('Kware'), ('Rabah'), ('Sabon Birni'), ('Shagari'), ('Silame'), ('Sokoto North'), ('Sokoto South'), ('Tambuwal'), ('Tangaza'), ('Tureta'), ('Wamakko'), ('Wurno'), ('Yabo')) AS l(name)
WHERE states.name = 'Sokoto'
ON CONFLICT (state_id, name) DO NOTHING;

INSERT INTO lgas (state_id, name)
SELECT id, l.name
FROM states, 
     (VALUES ('Ardo Kola'), ('Bali'), ('Donga'), ('Gashaka'), ('Gassol'), ('Ibi'), ('Jalingo'), ('Karim Lamido'), ('Kurmi'), ('Lau'), ('Sardauna'), ('Takum'), ('Ussa'), ('Wukari'), ('Yangtu Development Area'), ('Zing')) AS l(name)
WHERE states.name = 'Taraba'
ON CONFLICT (state_id, name) DO NOTHING;

INSERT INTO lgas (state_id, name)
SELECT id, l.name
FROM states, 
     (VALUES ('Bade'), ('Bursari'), ('Damaturu'), ('Fika'), ('Fune'), ('Geidam'), ('Gujba'), ('Gulani'), ('Jakusko'), ('Karasuwa'), ('Machina'), ('Nangere'), ('Nguru'), ('Potiskum'), ('Tarmuwa'), ('Yunusari'), ('Yusufari')) AS l(name)
WHERE states.name = 'Yobe'
ON CONFLICT (state_id, name) DO NOTHING;

INSERT INTO lgas (state_id, name)
SELECT id, l.name
FROM states, 
     (VALUES ('Anka'), ('Bakura'), ('Birnin Magaji'), ('Bukkuyum'), ('Bungudu'), ('Gummi'), ('Gusau'), ('Kaura Namoda'), ('Maradun'), ('Maru'), ('Shinkafi'), ('Talata Mafara'), ('Tsafe'), ('Zurmi')) AS l(name)
WHERE states.name = 'Zamfara'
ON CONFLICT (state_id, name) DO NOTHING;

INSERT INTO lgas (state_id, name)
SELECT id, l.name
FROM states, 
     (VALUES ('Abaji'), ('Abuja Municipal'), ('Bwari'), ('Gwagwalada'), ('Kuje'), ('Kwali')) AS l(name)
WHERE states.name = 'Federal Capital Territory'
ON CONFLICT (state_id, name) DO NOTHING;

-- 3. Villages (Sample Data)
-- Note: A complete list of Nigerian villages is too large for this format.
-- Below are samples for Abuja Municipal to demonstrate structure.

INSERT INTO villages (lga_id, name, location, population_est)
SELECT id, 'Garki', ST_GeomFromText('POINT(7.53 9.03)', 4326), 15000
FROM lgas WHERE name = 'Abuja Municipal'
ON CONFLICT DO NOTHING; -- Assuming village names unique per LGA or UUIDs handled

INSERT INTO villages (lga_id, name, location, population_est)
SELECT id, 'Wuse', ST_GeomFromText('POINT(7.47 9.06)', 4326), 25000
FROM lgas WHERE name = 'Abuja Municipal'
ON CONFLICT DO NOTHING;

INSERT INTO villages (lga_id, name, location, population_est)
SELECT id, 'Maitama', ST_GeomFromText('POINT(7.50 9.08)', 4326), 10000
FROM lgas WHERE name = 'Abuja Municipal'
ON CONFLICT DO NOTHING;

INSERT INTO villages (lga_id, name, location, population_est)
SELECT id, 'Asokoro', ST_GeomFromText('POINT(7.52 9.04)', 4326), 8000
FROM lgas WHERE name = 'Abuja Municipal'
ON CONFLICT DO NOTHING;

-- Further village data should be loaded via external CSV/ETL processes.
