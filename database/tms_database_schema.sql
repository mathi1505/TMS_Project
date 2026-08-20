
CREATE DATABASE IF NOT EXISTS tms_db;
USE tms_db;

DROP TABLE IF EXISTS student_det;
DROP TABLE IF EXISTS trxn_det;
DROP TABLE IF EXISTS course_det;
DROP TABLE IF EXISTS student_master;
DROP TABLE IF EXISTS Config_det;
DROP TABLE IF EXISTS Trxn_master;
DROP TABLE IF EXISTS course_master;

-- ----------------------------------------------------------------------------
-- course_master
-- ----------------------------------------------------------------------------
CREATE TABLE course_master (
    ID              varchar(2)   PRIMARY KEY,
    Tech            varchar(25)  not null,
    topic           varchar(50)  not null,
    duration_week   int,
    hours           int,
    entry_by        varchar(25),
    entry_date      date,
    Del_flg         char(1)
);

-- ----------------------------------------------------------------------------
-- Trxn_master
-- ----------------------------------------------------------------------------
CREATE TABLE Trxn_master (
    Trxn_master_id      varchar(2)  not null,
    Trxn_master_num     int         not null,
    Trxn_master_name    varchar(25),
    Trxn_description     varchar(50),
    Entry_by            varchar(25),
    Entry_date          date,
    Del_flg             char(1),
    PRIMARY KEY (Trxn_master_id, Trxn_master_num)
);

-- ----------------------------------------------------------------------------
-- Config_det
-- ----------------------------------------------------------------------------
CREATE TABLE Config_det (
    Config_master   varchar(4)   not null,
    Config_id       int,
    Config_name     varchar(25)  not null,
    Entry_by        varchar(25),
    Entry_date      date,
    Del_flag        char(1),
    PRIMARY KEY (config_master, config_id)
);

-- ----------------------------------------------------------------------------
-- student_master
-- ----------------------------------------------------------------------------
CREATE TABLE student_master (
    Student_id              varchar(5)  NOT NULL,
    Student_no              int          NOT NULL,
    Student_Name            varchar(50) NOT NULL,
    Student_type            varchar(4),
    Student_Std_mode        varchar(3) NOT NULL,
    Student_Assign_Staff    varchar(15) NOT NULL,
    Student_batch           int,
    Student_native          varchar(50) NOT NULL,
    Joining_date            date,
    Mobile_no               bigint,
    Emergency_no            bigint,
    Relationship            varchar(30),
    Email_ID                varchar(50),
    Qualification           varchar(30),
    College_name            varchar(50),
    Passout_year            year,
    Experience              varchar(30),
    Reference_by            varchar(30),
    Paid                    varchar(1),
    Total_fee               int,
    Duration_Freq           char(1),
    Total_Duration          int,
    Std_status              varchar(30),
    entry_by                varchar(25),
    entry_date              date,
    Del_flg                 char(1),
    PRIMARY KEY (Student_id, Student_no)
);

-- ----------------------------------------------------------------------------
-- course_det
-- ----------------------------------------------------------------------------
CREATE TABLE course_det (
    Course_ID       varchar(2)      not null,
    Course_DET_ID   int             not null,
    Tech            varchar(25)     not null,
    topic           varchar(100)    not null,
    duration_week   decimal(5,2),
    hours           int,
    entry_by        varchar(25),
    entry_date      date,
    Del_flg         char(1),
    PRIMARY KEY (Course_ID, Course_DET_ID),
    CONSTRAINT fk_course_det_course_master
        FOREIGN KEY (Course_ID) REFERENCES course_master (ID)
);

-- ----------------------------------------------------------------------------
-- trxn_det
-- ----------------------------------------------------------------------------
CREATE TABLE trxn_det (
    Trxn_id         varchar(2)      not null,
    Trxn_num        int             not null,
    Tran_date       Date            not null,
    Value_date      Date            not null,
    Trxn_ref        varchar(15),
    Descrip         varchar(50),
    DC_Flag         char(1),
    Amt             numeric(10,2),
    Entry_by        varchar(25),
    Entry_date      date,
    Del_flag        char(1),
    primary key (Trxn_id, Trxn_num, Trxn_date, value_date, Trxn_ref),
    CONSTRAINT fk_Trxn_det_Trxn_master
        FOREIGN KEY (Trxn_id, Trxn_num) REFERENCES Trxn_master (Trxn_master_id, Trxn_master_num)
);

-- ----------------------------------------------------------------------------
-- student_det
-- ----------------------------------------------------------------------------
CREATE TABLE student_det (
    Student_id          VARCHAR(5) NOT NULL,
    Student_num         INT         NOT NULL,
    Student_name        VARCHAR(50),
    Tran_date           DATE        NOT NULL,
    Value_date          DATE        NOT NULL,
    Atten_in_time       TIME,
    Atten_out_time      TIME,
    Tran_id             VARCHAR(2),
    Tran_num            INT,
    Tran_name           VARCHAR(50),
    Tran_particular     VARCHAR(30),
    Course_id           VARCHAR(2),
    Course_num          INT,
    Technology          VARCHAR(25),
    Naration            VARCHAR(50),
    Remarks             VARCHAR(50),
    Entry_by            VARCHAR(25),
    Entry_date          DATE,
    Del_flag            CHAR(1),

    PRIMARY KEY (Student_id, Student_num, Tran_date, Value_date),
    CONSTRAINT fk_student_det_student_master
        FOREIGN KEY (Student_id, Student_num)
        REFERENCES student_master (Student_id, Student_no),
    CONSTRAINT fk_student_det_course_det
        FOREIGN KEY (Course_id, Course_num)
        REFERENCES course_det (Course_ID, Course_DET_ID)
);
