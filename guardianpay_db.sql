-- =============================================================================
-- RESPALDO DE BASE DE DATOS: guardianpay_db
-- FECHA DE GENERACIÓN: 2026-10-08 11:13:02
-- SERVIDOR: localhost:3306 | USUARIO: root
-- =============================================================================

CREATE DATABASE IF NOT EXISTS `guardianpay_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `guardianpay_db`;

SET FOREIGN_KEY_CHECKS = 0;

-- Estructura de tabla para `usuarios`
DROP TABLE IF EXISTS `usuarios`;
CREATE TABLE `usuarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `dni` varchar(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(9) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `birth_date` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pin` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `balance` float NOT NULL,
  `account_number` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `avatar` varchar(4) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `account_number` (`account_number`),
  UNIQUE KEY `ix_users_phone` (`phone`),
  UNIQUE KEY `ix_users_dni` (`dni`),
  KEY `ix_users_id` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Volcado de datos para la tabla `usuarios` (5 registros)
INSERT INTO `usuarios` (`id`, `dni`, `name`, `phone`, `birth_date`, `email`, `pin`, `balance`, `account_number`, `avatar`, `created_at`) VALUES (1, '72849102', 'Anthony Luque', '987654321', '1999-08-24', 'anthony.luque@guardianpay.pe', 'pbkdf2:546d88d56d176edbe0702b541227a0de:88f5d73ba3c1877943b88c167f3fd6250542a70ba0bc79ec8e8ece750f224438', 755.0, '193-482910-0-21', 'AL', '2026-10-07 15:46:47');
INSERT INTO `usuarios` (`id`, `dni`, `name`, `phone`, `birth_date`, `email`, `pin`, `balance`, `account_number`, `avatar`, `created_at`) VALUES (2, '71982341', 'Lucía Gómez', '981234567', '2000-03-12', 'lucia.gomez@gmail.com', '123456', 1050.0, '193-774912-0-88', 'LG', '2026-10-07 15:46:47');
INSERT INTO `usuarios` (`id`, `dni`, `name`, `phone`, `birth_date`, `email`, `pin`, `balance`, `account_number`, `avatar`, `created_at`) VALUES (3, '70819234', 'Carlos Mendoza', '971889922', '1998-11-05', 'carlos.mendoza@gmail.com', 'pbkdf2:fe0a2791d170a9656794cebe7abcdd24:f94c7c7efe197b6887a8f428a063ad2c1a52f344eee22c6888f2533c28ea9cc8', 1005.0, '193-559102-0-34', 'CM', '2026-10-07 15:46:47');
INSERT INTO `usuarios` (`id`, `dni`, `name`, `phone`, `birth_date`, `email`, `pin`, `balance`, `account_number`, `avatar`, `created_at`) VALUES (4, '73910284', 'Santiago Mendizabal', '993441122', '1999-01-18', 'santiago.m@guardianpay.pe', '123456', 2100.0, '193-882190-0-99', 'SM', '2026-10-07 15:46:47');
INSERT INTO `usuarios` (`id`, `dni`, `name`, `phone`, `birth_date`, `email`, `pin`, `balance`, `account_number`, `avatar`, `created_at`) VALUES (5, '40918273', 'María Quispe (Mamá)', '976543210', '1975-06-30', 'maria.quispe@gmail.com', '123456', 1200.0, '193-339182-0-12', 'MQ', '2026-10-07 15:46:47');


-- Estructura de tabla para `transferencias`
DROP TABLE IF EXISTS `transferencias`;
CREATE TABLE `transferencias` (
  `id` int NOT NULL AUTO_INCREMENT,
  `operation_code` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `sender_id` int NOT NULL,
  `receiver_id` int NOT NULL,
  `amount` float NOT NULL,
  `time_str` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `location_str` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_frequent_contact` tinyint(1) DEFAULT NULL,
  `risk_score` float NOT NULL,
  `risk_level` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `decision` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ix_transactions_operation_code` (`operation_code`),
  KEY `sender_id` (`sender_id`),
  KEY `receiver_id` (`receiver_id`),
  KEY `ix_transactions_id` (`id`),
  CONSTRAINT `transferencias_ibfk_1` FOREIGN KEY (`sender_id`) REFERENCES `usuarios` (`id`),
  CONSTRAINT `transferencias_ibfk_2` FOREIGN KEY (`receiver_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Volcado de datos para la tabla `transferencias` (12 registros)
INSERT INTO `transferencias` (`id`, `operation_code`, `sender_id`, `receiver_id`, `amount`, `time_str`, `location_str`, `is_frequent_contact`, `risk_score`, `risk_level`, `decision`, `status`, `created_at`) VALUES (1, 'OP-37721732', 1, 2, 50.0, '14:30', 'Arequipa', 0, 60.8, 'MEDIO', 'APROBADO_CON_ALERTA', 'COMPLETADO', '2026-10-07 15:52:12');
INSERT INTO `transferencias` (`id`, `operation_code`, `sender_id`, `receiver_id`, `amount`, `time_str`, `location_str`, `is_frequent_contact`, `risk_score`, `risk_level`, `decision`, `status`, `created_at`) VALUES (2, 'OP-14885052', 1, 2, 25.0, '14:30', 'Arequipa', 1, 1.2, 'BAJO', 'APROBADO', 'COMPLETADO', '2026-10-07 15:53:08');
INSERT INTO `transferencias` (`id`, `operation_code`, `sender_id`, `receiver_id`, `amount`, `time_str`, `location_str`, `is_frequent_contact`, `risk_score`, `risk_level`, `decision`, `status`, `created_at`) VALUES (3, 'OP-19243231', 1, 2, 50.0, '14:30', 'Arequipa', 1, 1.0, 'BAJO', 'APROBADO', 'COMPLETADO', '2026-10-07 16:04:00');
INSERT INTO `transferencias` (`id`, `operation_code`, `sender_id`, `receiver_id`, `amount`, `time_str`, `location_str`, `is_frequent_contact`, `risk_score`, `risk_level`, `decision`, `status`, `created_at`) VALUES (4, 'OP-52306134', 1, 3, 15.0, '14:30', 'Arequipa', 0, 57.8, 'MEDIO', 'APROBADO_CON_ALERTA', 'COMPLETADO', '2026-10-07 16:15:57');
INSERT INTO `transferencias` (`id`, `operation_code`, `sender_id`, `receiver_id`, `amount`, `time_str`, `location_str`, `is_frequent_contact`, `risk_score`, `risk_level`, `decision`, `status`, `created_at`) VALUES (5, 'OP-66370359', 1, 2, 50.0, '14:30', 'Arequipa', 1, 1.0, 'BAJO', 'APROBADO', 'COMPLETADO', '2026-10-07 16:19:27');
INSERT INTO `transferencias` (`id`, `operation_code`, `sender_id`, `receiver_id`, `amount`, `time_str`, `location_str`, `is_frequent_contact`, `risk_score`, `risk_level`, `decision`, `status`, `created_at`) VALUES (6, 'OP-99056117', 1, 2, 20.0, '14:30', 'Arequipa', 1, 1.3, 'BAJO', 'APROBADO', 'COMPLETADO', '2026-10-07 16:31:43');
INSERT INTO `transferencias` (`id`, `operation_code`, `sender_id`, `receiver_id`, `amount`, `time_str`, `location_str`, `is_frequent_contact`, `risk_score`, `risk_level`, `decision`, `status`, `created_at`) VALUES (7, 'OP-70378488', 1, 3, 480.0, '14:30', 'Arequipa', 1, 78.4, 'CRÍTICO', 'DESAFIO_BIOMETRICO', 'COMPLETADO', '2026-10-07 16:37:44');
INSERT INTO `transferencias` (`id`, `operation_code`, `sender_id`, `receiver_id`, `amount`, `time_str`, `location_str`, `is_frequent_contact`, `risk_score`, `risk_level`, `decision`, `status`, `created_at`) VALUES (8, 'OP-13232303', 1, 3, 480.0, '14:30', 'Arequipa', 1, 78.4, 'CRÍTICO', 'DESAFIO_BIOMETRICO', 'COMPLETADO', '2026-10-07 16:37:44');
INSERT INTO `transferencias` (`id`, `operation_code`, `sender_id`, `receiver_id`, `amount`, `time_str`, `location_str`, `is_frequent_contact`, `risk_score`, `risk_level`, `decision`, `status`, `created_at`) VALUES (9, 'OP-90402852', 1, 3, 480.0, '14:30', 'Arequipa', 1, 78.4, 'CRÍTICO', 'DESAFIO_BIOMETRICO', 'COMPLETADO', '2026-10-07 16:37:44');
INSERT INTO `transferencias` (`id`, `operation_code`, `sender_id`, `receiver_id`, `amount`, `time_str`, `location_str`, `is_frequent_contact`, `risk_score`, `risk_level`, `decision`, `status`, `created_at`) VALUES (10, 'OP-84140948', 1, 3, 480.0, '14:30', 'Arequipa', 1, 78.4, 'CRÍTICO', 'DESAFIO_BIOMETRICO', 'COMPLETADO', '2026-10-07 16:37:44');
INSERT INTO `transferencias` (`id`, `operation_code`, `sender_id`, `receiver_id`, `amount`, `time_str`, `location_str`, `is_frequent_contact`, `risk_score`, `risk_level`, `decision`, `status`, `created_at`) VALUES (11, 'OP-75178796', 3, 2, 30.0, '15:45', 'Arequipa', 1, 1.6, 'BAJO', 'APROBADO', 'COMPLETADO', '2026-10-07 16:48:19');
INSERT INTO `transferencias` (`id`, `operation_code`, `sender_id`, `receiver_id`, `amount`, `time_str`, `location_str`, `is_frequent_contact`, `risk_score`, `risk_level`, `decision`, `status`, `created_at`) VALUES (12, 'OP-15544201', 1, 2, 5.0, '14:30', 'Arequipa', 1, 4.9, 'BAJO', 'APROBADO', 'COMPLETADO', '2026-10-07 16:52:56');


-- Estructura de tabla para `auditoria_ia`
DROP TABLE IF EXISTS `auditoria_ia`;
CREATE TABLE `auditoria_ia` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `operation_code` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `monto_evaluado` float NOT NULL,
  `hora_transaccion` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `es_madrugada` int DEFAULT NULL,
  `es_contacto_nuevo` int DEFAULT NULL,
  `es_ubicacion_inusual` int DEFAULT NULL,
  `score_obtenido` float NOT NULL,
  `nivel_riesgo` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `decision_ia` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tiempo_inferencia_ms` float NOT NULL,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `ix_auditoria_ia_id` (`id`),
  CONSTRAINT `auditoria_ia_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Volcado de datos para la tabla `auditoria_ia` (5 registros)
INSERT INTO `auditoria_ia` (`id`, `user_id`, `operation_code`, `monto_evaluado`, `hora_transaccion`, `es_madrugada`, `es_contacto_nuevo`, `es_ubicacion_inusual`, `score_obtenido`, `nivel_riesgo`, `decision_ia`, `tiempo_inferencia_ms`, `created_at`) VALUES (1, 1, 'OP-99056117', 20.0, '14:30', 0, 0, 0, 1.3, 'BAJO', 'APROBADO', 41.37, '2026-10-07 16:46:02');
INSERT INTO `auditoria_ia` (`id`, `user_id`, `operation_code`, `monto_evaluado`, `hora_transaccion`, `es_madrugada`, `es_contacto_nuevo`, `es_ubicacion_inusual`, `score_obtenido`, `nivel_riesgo`, `decision_ia`, `tiempo_inferencia_ms`, `created_at`) VALUES (2, 3, 'OP-11029384', 35.0, '10:15', 0, 0, 0, 2.1, 'BAJO', 'APROBADO', 38.2, '2026-10-07 16:46:02');
INSERT INTO `auditoria_ia` (`id`, `user_id`, `operation_code`, `monto_evaluado`, `hora_transaccion`, `es_madrugada`, `es_contacto_nuevo`, `es_ubicacion_inusual`, `score_obtenido`, `nivel_riesgo`, `decision_ia`, `tiempo_inferencia_ms`, `created_at`) VALUES (3, 1, 'OP-SIM-ALERT', 480.0, '03:45', 1, 1, 1, 78.3, 'CRÍTICO', 'DESAFIO_BIOMETRICO', 83.46, '2026-10-07 16:46:02');
INSERT INTO `auditoria_ia` (`id`, `user_id`, `operation_code`, `monto_evaluado`, `hora_transaccion`, `es_madrugada`, `es_contacto_nuevo`, `es_ubicacion_inusual`, `score_obtenido`, `nivel_riesgo`, `decision_ia`, `tiempo_inferencia_ms`, `created_at`) VALUES (4, 3, 'OP-75178796', 30.0, '15:45', 0, 0, 0, 1.6, 'BAJO', 'APROBADO', 86.96, '2026-10-07 16:48:19');
INSERT INTO `auditoria_ia` (`id`, `user_id`, `operation_code`, `monto_evaluado`, `hora_transaccion`, `es_madrugada`, `es_contacto_nuevo`, `es_ubicacion_inusual`, `score_obtenido`, `nivel_riesgo`, `decision_ia`, `tiempo_inferencia_ms`, `created_at`) VALUES (5, 1, 'OP-15544201', 5.0, '14:30', 0, 0, 0, 4.9, 'BAJO', 'APROBADO', 44.79, '2026-10-07 16:52:56');


-- Estructura de tabla para `contactos_frecuentes`
DROP TABLE IF EXISTS `contactos_frecuentes`;
CREATE TABLE `contactos_frecuentes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `contact_user_id` int NOT NULL,
  `alias` varchar(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contador_transferencias` int DEFAULT NULL,
  `es_favorito` tinyint(1) DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `contact_user_id` (`contact_user_id`),
  KEY `ix_contactos_frecuentes_id` (`id`),
  CONSTRAINT `contactos_frecuentes_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `usuarios` (`id`),
  CONSTRAINT `contactos_frecuentes_ibfk_2` FOREIGN KEY (`contact_user_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Volcado de datos para la tabla `contactos_frecuentes` (7 registros)
INSERT INTO `contactos_frecuentes` (`id`, `user_id`, `contact_user_id`, `alias`, `contador_transferencias`, `es_favorito`, `updated_at`) VALUES (1, 1, 2, 'Lucía Amiga', 9, 1, '2026-10-07 16:52:56');
INSERT INTO `contactos_frecuentes` (`id`, `user_id`, `contact_user_id`, `alias`, `contador_transferencias`, `es_favorito`, `updated_at`) VALUES (2, 1, 3, 'Carlos UTEC', 5, 1, '2026-10-07 16:46:02');
INSERT INTO `contactos_frecuentes` (`id`, `user_id`, `contact_user_id`, `alias`, `contador_transferencias`, `es_favorito`, `updated_at`) VALUES (3, 1, 5, 'Mamá', 14, 1, '2026-10-07 16:46:02');
INSERT INTO `contactos_frecuentes` (`id`, `user_id`, `contact_user_id`, `alias`, `contador_transferencias`, `es_favorito`, `updated_at`) VALUES (4, 3, 1, 'Anthony Compañero', 4, 1, '2026-10-07 16:46:02');
INSERT INTO `contactos_frecuentes` (`id`, `user_id`, `contact_user_id`, `alias`, `contador_transferencias`, `es_favorito`, `updated_at`) VALUES (5, 3, 2, 'Lucía Gómez', 3, 0, '2026-10-07 16:48:19');
INSERT INTO `contactos_frecuentes` (`id`, `user_id`, `contact_user_id`, `alias`, `contador_transferencias`, `es_favorito`, `updated_at`) VALUES (6, 2, 1, 'Anthony Luque', 6, 1, '2026-10-07 16:46:02');
INSERT INTO `contactos_frecuentes` (`id`, `user_id`, `contact_user_id`, `alias`, `contador_transferencias`, `es_favorito`, `updated_at`) VALUES (7, 2, 4, 'Santiago Profe', 3, 0, '2026-10-07 16:46:02');


SET FOREIGN_KEY_CHECKS = 1;

-- Fin del respaldo