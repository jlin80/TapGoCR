-- La collation por defecto (utf8mb4_unicode_ci) ya es insensible a
-- mayúsculas y acentos, así que estos índices únicos por sí solos rechazan
-- "María Rodríguez" == "MARIA RODRIGUEZ" == "Maria Rodriguez", sin lógica
-- adicional. Reemplazan el lock por nombre (GET_LOCK) que vivía en la
-- aplicación: ahora la garantía la da la base, no una sesión que puede
-- quedar huérfana.
ALTER TABLE `User` ADD UNIQUE INDEX `User_name_key` (`name`);
ALTER TABLE `Business` ADD UNIQUE INDEX `Business_name_key` (`name`);
