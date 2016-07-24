-- phpMyAdmin SQL Dump
-- version 4.1.14
-- http://www.phpmyadmin.net
--
-- Host: 127.0.0.1
-- Generation Time: Jul 24, 2016 at 11:05 AM
-- Server version: 5.6.17
-- PHP Version: 5.5.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;

--
-- Database: `ms_kotakarsip`
--

-- --------------------------------------------------------

--
-- Table structure for table `app_disposition`
--

CREATE TABLE IF NOT EXISTS `app_disposition` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_inbox` bigint(20) NOT NULL,
  `id_master_disposition` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `id_master_dispotition` (`id_master_disposition`),
  KEY `id_inbox` (`id_inbox`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `app_inbox`
--

CREATE TABLE IF NOT EXISTS `app_inbox` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `id_user` int(11) NOT NULL,
  `id_rack` int(11) NOT NULL,
  `inbox_date` date NOT NULL,
  `inbox_from` varchar(100) NOT NULL,
  `inbox_number` varchar(50) NOT NULL,
  `inbox_title` varchar(250) NOT NULL,
  `inbox_desc` text NOT NULL,
  `inbox_file` text NOT NULL,
  `inbox_disposition` varchar(200) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00' ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `id_user` (`id_user`),
  KEY `id_rack` (`id_rack`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=88 ;

--
-- Triggers `app_inbox`
--
DROP TRIGGER IF EXISTS `notif_inbox_delete`;
DELIMITER //
CREATE TRIGGER `notif_inbox_delete` AFTER DELETE ON `app_inbox`
 FOR EACH ROW INSERT INTO app_notifications (notification_kind, notification_type, id_user, id_content) VALUES ('inbox', 'delete', old.id_user, old.id)
//
DELIMITER ;
DROP TRIGGER IF EXISTS `notif_inbox_insert`;
DELIMITER //
CREATE TRIGGER `notif_inbox_insert` AFTER INSERT ON `app_inbox`
 FOR EACH ROW INSERT INTO app_notifications (notification_kind, notification_type, id_user, id_content) VALUES ('inbox', 'create', new.id_user, new.id)
//
DELIMITER ;
DROP TRIGGER IF EXISTS `notif_inbox_update`;
DELIMITER //
CREATE TRIGGER `notif_inbox_update` AFTER UPDATE ON `app_inbox`
 FOR EACH ROW INSERT INTO app_notifications (notification_kind, notification_type, id_user, id_content) VALUES ('inbox', 'update', new.id_user, new.id)
//
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `app_master_disposition`
--

CREATE TABLE IF NOT EXISTS `app_master_disposition` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `disposition_name` varchar(100) NOT NULL,
  `disposition_position` varchar(40) NOT NULL,
  `archive` enum('0','1') NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=6 ;

-- --------------------------------------------------------

--
-- Table structure for table `app_master_rack`
--

CREATE TABLE IF NOT EXISTS `app_master_rack` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `rack_number` varchar(5) NOT NULL,
  `archive` enum('0','1') NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=5 ;

-- --------------------------------------------------------

--
-- Table structure for table `app_notifications`
--

CREATE TABLE IF NOT EXISTS `app_notifications` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `notification_kind` enum('inbox','outbox') NOT NULL,
  `notification_type` enum('create','update','delete') NOT NULL,
  `id_user` int(11) NOT NULL,
  `id_content` bigint(20) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=18 ;

--
-- Triggers `app_notifications`
--
DROP TRIGGER IF EXISTS `for_user`;
DELIMITER //
CREATE TRIGGER `for_user` AFTER INSERT ON `app_notifications`
 FOR EACH ROW INSERT INTO app_notifications_read (id_notification, id_user) SELECT new.id, id FROM app_users WHERE id != new.id_user
//
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `app_notifications_read`
--

CREATE TABLE IF NOT EXISTS `app_notifications_read` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_notification` bigint(20) NOT NULL,
  `id_user` int(11) NOT NULL,
  `status` enum('0','1') NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=31 ;

-- --------------------------------------------------------

--
-- Table structure for table `app_outbox`
--

CREATE TABLE IF NOT EXISTS `app_outbox` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `id_user` int(11) NOT NULL,
  `id_rack` int(11) NOT NULL,
  `outbox_date` date NOT NULL,
  `outbox_for` varchar(100) NOT NULL,
  `outbox_number` varchar(50) NOT NULL,
  `outbox_title` varchar(250) NOT NULL,
  `outbox_desc` text NOT NULL,
  `outbox_file` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00' ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `id_user` (`id_user`),
  KEY `id_rack` (`id_rack`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=4 ;

--
-- Triggers `app_outbox`
--
DROP TRIGGER IF EXISTS `notif_outbox_delete`;
DELIMITER //
CREATE TRIGGER `notif_outbox_delete` AFTER DELETE ON `app_outbox`
 FOR EACH ROW INSERT INTO app_notifications (notification_kind, notification_type, id_user, id_content) VALUES ('outbox', 'delete', old.id_user, old.id)
//
DELIMITER ;
DROP TRIGGER IF EXISTS `notif_outbox_insert`;
DELIMITER //
CREATE TRIGGER `notif_outbox_insert` AFTER INSERT ON `app_outbox`
 FOR EACH ROW INSERT INTO app_notifications (notification_kind, notification_type, id_user, id_content) VALUES ('outbox', 'create', new.id_user, new.id)
//
DELIMITER ;
DROP TRIGGER IF EXISTS `notif_outbox_update`;
DELIMITER //
CREATE TRIGGER `notif_outbox_update` AFTER UPDATE ON `app_outbox`
 FOR EACH ROW INSERT INTO app_notifications (notification_kind, notification_type, id_user, id_content) VALUES ('outbox', 'update', new.id_user, new.id)
//
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `app_users`
--

CREATE TABLE IF NOT EXISTS `app_users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_login` varchar(60) NOT NULL,
  `user_pass` text NOT NULL,
  `user_displayname` varchar(100) NOT NULL,
  `user_email` varchar(100) NOT NULL,
  `user_registered` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `user_activation` enum('0','1') NOT NULL DEFAULT '1',
  `user_status` enum('0','1') NOT NULL DEFAULT '0',
  `archive` enum('0','1') NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_email` (`user_email`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=7 ;

-- --------------------------------------------------------

--
-- Stand-in structure for view `view_disposition`
--
CREATE TABLE IF NOT EXISTS `view_disposition` (
`id` int(11)
,`id_inbox` bigint(20)
,`id_master_disposition` int(11)
,`created_at` timestamp
,`inbox_from` varchar(100)
,`inbox_number` varchar(50)
,`inbox_title` varchar(250)
,`disposition_name` varchar(100)
,`disposition_position` varchar(40)
);
-- --------------------------------------------------------

--
-- Stand-in structure for view `view_inbox`
--
CREATE TABLE IF NOT EXISTS `view_inbox` (
`id` bigint(20)
,`id_user` int(11)
,`id_rack` int(11)
,`inbox_date` date
,`inbox_from` varchar(100)
,`inbox_number` varchar(50)
,`inbox_title` varchar(250)
,`inbox_desc` text
,`inbox_file` text
,`inbox_disposition` varchar(200)
,`created_at` timestamp
,`updated_at` timestamp
,`user_login` varchar(60)
,`user_displayname` varchar(100)
,`rack_number` varchar(5)
);
-- --------------------------------------------------------

--
-- Stand-in structure for view `view_notification`
--
CREATE TABLE IF NOT EXISTS `view_notification` (
`id` int(11)
,`id_notification` bigint(20)
,`notification_kind` enum('inbox','outbox')
,`notification_type` enum('create','update','delete')
,`id_content` bigint(20)
,`id_user` int(11)
,`id_user_create` int(11)
,`user_login_get` varchar(60)
,`user_displayname_get` varchar(100)
,`user_login` varchar(60)
,`user_displayname` varchar(100)
,`status` enum('0','1')
);
-- --------------------------------------------------------

--
-- Stand-in structure for view `view_outbox`
--
CREATE TABLE IF NOT EXISTS `view_outbox` (
`id` bigint(20)
,`id_user` int(11)
,`id_rack` int(11)
,`outbox_date` date
,`outbox_for` varchar(100)
,`outbox_number` varchar(50)
,`outbox_title` varchar(250)
,`outbox_desc` text
,`outbox_file` text
,`created_at` timestamp
,`updated_at` timestamp
,`user_login` varchar(60)
,`user_displayname` varchar(100)
,`rack_number` varchar(5)
);
-- --------------------------------------------------------

--
-- Structure for view `view_disposition`
--
DROP TABLE IF EXISTS `view_disposition`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `view_disposition` AS select `a`.`id` AS `id`,`a`.`id_inbox` AS `id_inbox`,`a`.`id_master_disposition` AS `id_master_disposition`,`a`.`created_at` AS `created_at`,`b`.`inbox_from` AS `inbox_from`,`b`.`inbox_number` AS `inbox_number`,`b`.`inbox_title` AS `inbox_title`,`c`.`disposition_name` AS `disposition_name`,`c`.`disposition_position` AS `disposition_position` from ((`app_disposition` `a` join `app_inbox` `b` on((`a`.`id_inbox` = `b`.`id`))) join `app_master_disposition` `c` on((`a`.`id_master_disposition` = `c`.`id`)));

-- --------------------------------------------------------

--
-- Structure for view `view_inbox`
--
DROP TABLE IF EXISTS `view_inbox`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `view_inbox` AS select `a`.`id` AS `id`,`a`.`id_user` AS `id_user`,`a`.`id_rack` AS `id_rack`,`a`.`inbox_date` AS `inbox_date`,`a`.`inbox_from` AS `inbox_from`,`a`.`inbox_number` AS `inbox_number`,`a`.`inbox_title` AS `inbox_title`,`a`.`inbox_desc` AS `inbox_desc`,`a`.`inbox_file` AS `inbox_file`,`a`.`inbox_disposition` AS `inbox_disposition`,`a`.`created_at` AS `created_at`,`a`.`updated_at` AS `updated_at`,`b`.`user_login` AS `user_login`,`b`.`user_displayname` AS `user_displayname`,`c`.`rack_number` AS `rack_number` from ((`app_inbox` `a` join `app_users` `b` on((`a`.`id_user` = `b`.`id`))) join `app_master_rack` `c` on((`a`.`id_rack` = `c`.`id`)));

-- --------------------------------------------------------

--
-- Structure for view `view_notification`
--
DROP TABLE IF EXISTS `view_notification`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `view_notification` AS select `a`.`id` AS `id`,`a`.`id_notification` AS `id_notification`,`b`.`notification_kind` AS `notification_kind`,`b`.`notification_type` AS `notification_type`,`b`.`id_content` AS `id_content`,`a`.`id_user` AS `id_user`,`b`.`id_user` AS `id_user_create`,`d`.`user_login` AS `user_login_get`,`d`.`user_displayname` AS `user_displayname_get`,`c`.`user_login` AS `user_login`,`c`.`user_displayname` AS `user_displayname`,`a`.`status` AS `status` from (((`app_notifications_read` `a` join `app_notifications` `b` on((`a`.`id_notification` = `b`.`id`))) join `app_users` `c` on((`b`.`id_user` = `c`.`id`))) join `app_users` `d` on((`a`.`id_user` = `d`.`id`)));

-- --------------------------------------------------------

--
-- Structure for view `view_outbox`
--
DROP TABLE IF EXISTS `view_outbox`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `view_outbox` AS select `a`.`id` AS `id`,`a`.`id_user` AS `id_user`,`a`.`id_rack` AS `id_rack`,`a`.`outbox_date` AS `outbox_date`,`a`.`outbox_for` AS `outbox_for`,`a`.`outbox_number` AS `outbox_number`,`a`.`outbox_title` AS `outbox_title`,`a`.`outbox_desc` AS `outbox_desc`,`a`.`outbox_file` AS `outbox_file`,`a`.`created_at` AS `created_at`,`a`.`updated_at` AS `updated_at`,`b`.`user_login` AS `user_login`,`b`.`user_displayname` AS `user_displayname`,`c`.`rack_number` AS `rack_number` from ((`app_outbox` `a` join `app_users` `b` on((`a`.`id_user` = `b`.`id`))) join `app_master_rack` `c` on((`a`.`id_rack` = `c`.`id`)));

--
-- Constraints for dumped tables
--

--
-- Constraints for table `app_disposition`
--
ALTER TABLE `app_disposition`
  ADD CONSTRAINT `inbox` FOREIGN KEY (`id_inbox`) REFERENCES `app_inbox` (`id`),
  ADD CONSTRAINT `master` FOREIGN KEY (`id_master_disposition`) REFERENCES `app_master_disposition` (`id`);

--
-- Constraints for table `app_inbox`
--
ALTER TABLE `app_inbox`
  ADD CONSTRAINT `rack_inbox` FOREIGN KEY (`id_rack`) REFERENCES `app_master_rack` (`id`),
  ADD CONSTRAINT `user_inbox` FOREIGN KEY (`id_user`) REFERENCES `app_users` (`id`);

--
-- Constraints for table `app_outbox`
--
ALTER TABLE `app_outbox`
  ADD CONSTRAINT `rack_outbox` FOREIGN KEY (`id_rack`) REFERENCES `app_master_rack` (`id`),
  ADD CONSTRAINT `user_outbox` FOREIGN KEY (`id_user`) REFERENCES `app_users` (`id`);

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
