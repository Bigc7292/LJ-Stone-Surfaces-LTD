INSERT INTO stone_library (id, name, category, texture, swatch_url, description) VALUES 
('auto_1768878350491_0', 'Calacatta Laza Quartz', 'Uncategorized', 'Standard', '/stones/calacatta-laza-quartz.png', 'Imported from file system'),
('auto_1768878350491_1', 'Colonial White', 'Uncategorized', 'Standard', '/stones/colonial_white.jpg', 'Imported from file system'),
('auto_1768878350491_2', 'Pietra Gray', 'Uncategorized', 'Standard', '/stones/pietra-gray.png', 'Imported from file system'),
('auto_1768878350491_3', 'Statuarietto Gioia', 'Uncategorized', 'Standard', '/stones/statuarietto-gioia.png', 'Imported from file system'),
('auto_1768878350491_4', 'Super White Quartzite', 'Uncategorized', 'Standard', '/stones/super-white-quartzite.png', 'Imported from file system'),
('auto_1768878350491_5', 'Taj Mahal Quartzite', 'Uncategorized', 'Standard', '/stones/taj-mahal-quartzite.png', 'Imported from file system') 
ON CONFLICT (id) DO NOTHING;