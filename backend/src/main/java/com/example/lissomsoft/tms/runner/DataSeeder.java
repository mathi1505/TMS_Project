package com.example.lissomsoft.tms.runner;
import com.example.lissomsoft.tms.entity.User;
import com.example.lissomsoft.tms.repository.UserRepository;
import com.example.lissomsoft.tms.entity.ConfigDet;
import com.example.lissomsoft.tms.repository.ConfigDetRepository;
import com.example.lissomsoft.tms.entity.CourseDetail;
import com.example.lissomsoft.tms.repository.CourseDetailRepository;
import com.example.lissomsoft.tms.entity.CourseMaster;
import com.example.lissomsoft.tms.repository.CourseMasterRepository;
import com.example.lissomsoft.tms.entity.TrxnDet;
import com.example.lissomsoft.tms.repository.TrxnDetRepository;
import com.example.lissomsoft.tms.entity.TrxnMaster;
import com.example.lissomsoft.tms.repository.TrxnMasterRepository;
import com.example.lissomsoft.tms.dto.ScreenCatalog;
import com.example.lissomsoft.tms.entity.RoleScreenAccess;
import com.example.lissomsoft.tms.repository.RoleScreenAccessRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;

@Component
@RequiredArgsConstructor
@Order(0)
public class DataSeeder implements CommandLineRunner {

    private final ConfigDetRepository configDetRepository;
    private final CourseMasterRepository courseMasterRepository;
    private final CourseDetailRepository courseDetailRepository;
    private final TrxnMasterRepository trxnMasterRepository;
    private final TrxnDetRepository trxnDetRepository;
    private final UserRepository userRepository;
    private final RoleScreenAccessRepository roleScreenAccessRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        seedUsers();
        seedConfigDet();
        seedRoleScreenAccess();
        seedCourseMaster();
        seedCourseDetail();
        seedTrxnMaster();
        seedTrxnDet();
    }

    private void seedUsers() {
        if (userRepository.count() > 0) return;
        LocalDate d = LocalDate.of(2026, 1, 1);
        userRepository.saveAll(java.util.List.of(
            new User("ADM", 1, "admin", passwordEncoder.encode("admin123"), "ADMIN", "system", d, "A"),
            new User("STF", 1, "staff", passwordEncoder.encode("staff123"), "STAFF", "system", d, "A")
        ));
    }

    private void seedConfigDet() {
        if (configDetRepository.count() > 0) return;
        LocalDate d = LocalDate.of(2026, 1, 1);
        Object[][] rows = {
            {"ROLE", 1, "ADMIN - Administrator"},
            {"ROLE", 2, "STAFF - Staff"},
            {"ROLE", 3, "STUDENT - Student"},
            {"STUD", 1, "INT - Internship"},
            {"STUD", 2, "TRI - Training"},
            {"MODE", 1, "Online"},
            {"MODE", 2, "Offline"},
            {"MODE", 3, "Hybrid"},
            {"TRAN", 1, "In Progress"},
            {"TRAN", 2, "Completed"},
            {"TRAN", 3, "Dropped"},
            {"TRAN", 4, "Shifted to Main Office"},
            {"TRAN", 5, "Left"},
            {"TRAN", 6, "Others"},
            {"FREQ", 1, "W - Weekly"},
            {"FREQ", 2, "M - Monthly"},
            {"FREQ", 3, "H - Half-Yearly"},
            {"FREQ", 4, "Q - Quarterly"},
            {"FREQ", 5, "Y - Yearly"}
        };
        for (Object[] r : rows) {
            ConfigDet c = new ConfigDet();
            c.setConfigMaster((String) r[0]);
            c.setConfigId((Integer) r[1]);
            c.setConfigName((String) r[2]);
            c.setDelFlag("A");
            c.setEntryBy("admin");
            c.setEntryDate(d);
            configDetRepository.save(c);
        }
    }

    /**
     * Seeds the starting Role Access table so STAFF and STUDENT keep exactly
     * the screen access they already had before this feature existed.
     * ADMIN is not stored — it always has full access (see RoleAccessService).
     * Runs once; after that the Role Access admin screen owns this data.
     */
    private void seedRoleScreenAccess() {
        if (roleScreenAccessRepository.count() > 0) return;
        LocalDate d = LocalDate.of(2026, 1, 1);

        java.util.List<RoleScreenAccess> rows = new java.util.ArrayList<>();
        for (String code : ScreenCatalog.DEFAULT_STAFF_CODES) {
            rows.add(new RoleScreenAccess("STAFF", code, "system", d));
        }
        for (String code : ScreenCatalog.DEFAULT_STUDENT_CODES) {
            rows.add(new RoleScreenAccess("STUDENT", code, "system", d));
        }
        roleScreenAccessRepository.saveAll(rows);
    }

    private void seedCourseMaster() {
        if (courseMasterRepository.count() > 0) return;
        LocalDate d = LocalDate.of(2026, 1, 5);
        courseMasterRepository.saveAll(java.util.List.of(
            cm("FE", "Frontend", "Angular", 10, 300, "A", d),
            cm("BE", "Backend", "Java Spring Boot", 10, 300, "A", d),
            cm("DB", "Database", "MySQL PostgreSQL", 4, 120, "A", d),
            cm("FP", "Integration Project", "Full Stack Project", 2, 60, "D", d)
        ));
    }

    private CourseMaster cm(String id, String tech, String topic, int weeks, int hours, String delFlag, LocalDate d) {
        CourseMaster c = new CourseMaster();
        c.setId(id); c.setTechnology(tech); c.setTopic(topic);
        c.setDurationWeeks(weeks); c.setHours(hours); c.setDelFlag(delFlag);
        c.setEntryBy("admin"); c.setEntryDate(d);
        return c;
    }

    private void seedCourseDetail() {
        if (courseDetailRepository.count() > 0) return;
        LocalDate d = LocalDate.of(2026, 1, 5);
        Object[][] rows = {
            {"FE",1,"Web Basics","Internet basics HTTP HTTPS Client Server Browser working","1.0",30,"A"},
            {"FE",2,"HTML","Tags Forms Tables Semantic HTML Accessibility","1.0",30,"A"},
            {"FE",3,"CSS","Box Model Flexbox Grid Media Queries Responsive Design","1.0",30,"A"},
            {"FE",4,"CSS Frameworks","Bootstrap Grid and Components Tailwind Utility Classes","1.0",30,"A"},
            {"FE",5,"TypeScript","Data Types Functions Classes Interfaces Generics","1.0",30,"A"},
            {"FE",6,"Angular Basics","CLI Components Templates Data Binding","1.0",30,"A"},
            {"FE",7,"Angular Core","Directives Pipes Services Routing","1.5",45,"A"},
            {"FE",8,"Angular Advanced","Reactive Forms Guards Lazy Loading","1.5",45,"D"},
            {"FE",9,"Angular API","HttpClient REST API Interceptors Error Handling","1.0",30,"A"},
            {"FE",10,"Angular Project","CRUD Application with API Integration","1.0",30,"A"},
            {"BE",1,"Java Basics","JDK JVM Variables Data Types Control Statements","1.0",30,"A"},
            {"BE",2,"OOP Concepts","Classes Objects Inheritance Polymorphism","1.0",30,"A"},
            {"BE",3,"Advanced Java","Exception Handling Collections Streams","1.0",30,"A"},
            {"BE",4,"Java Eight","Functional Programming Stream API Date Time","1.0",30,"A"},
            {"BE",5,"Java Seventeen","Records Sealed Classes Pattern Matching","0.5",15,"A"},
            {"BE",6,"Spring Core","IOC Dependency Injection Bean Lifecycle","1.0",30,"A"},
            {"BE",7,"Spring MVC","Controllers Validation Exception Handling","1.0",30,"A"},
            {"BE",8,"Spring Boot","Auto Configuration Starters Profiles","1.0",30,"A"},
            {"BE",9,"REST API","CRUD REST API DTO Pagination Sorting","1.0",30,"A"},
            {"BE",10,"Spring Security","JWT Authentication JUnit Mockito","1.0",30,"D"},
            {"BE",11,"Backend Project","Spring Boot REST Project","0.5",15,"A"},
            {"DB",1,"SQL Basics","DDL DML DQL Joins Subqueries","1.0",30,"A"},
            {"DB",2,"MySQL","Indexes Views Stored Procedures","1.0",30,"A"},
            {"DB",3,"PostgreSQL","JSON Queries Performance Optimization","1.0",30,"A"},
            {"DB",4,"MS SQL Server","Triggers Functions Transactions","1.0",30,"A"},
            {"FP",1,"Integration","Angular Spring Boot Database Integration","1.0",30,"A"},
            {"FP",2,"Final Project","End to End Full Stack Application","1.0",30,"A"}
        };
        for (Object[] r : rows) {
            CourseDetail cd = new CourseDetail();
            cd.setCourseId((String) r[0]);
            cd.setCourseDetId((Integer) r[1]);
            cd.setTechnology((String) r[2]);
            cd.setTopic((String) r[3]);
            cd.setDurationWeeks(new BigDecimal((String) r[4]));
            cd.setHours((Integer) r[5]);
            cd.setDelFlag((String) r[6]);
            cd.setEntryBy("admin");
            cd.setEntryDate(d);
            courseDetailRepository.save(cd);
        }
    }

    private void seedTrxnMaster() {
        if (trxnMasterRepository.count() > 0) return;
        LocalDate d = LocalDate.of(2026,1,1);
        trxnMasterRepository.saveAll(java.util.List.of(
            tm("AS",1,"Murali",null,d), tm("TR",1,"Rajesh",null,d), tm("ME",1,"Brinda",null,d),
            tm("PR",1,"TMS Project","Training & Internship Management System",d),
            tm("OT",1,"Others",null,d),
            tm("EX",1,"Expenses",null,d), tm("IN",1,"Income",null,d), tm("IN",2,"Fees",null,d), tm("EX",2,"Purchase",null,d)
        ));
    }

    private TrxnMaster tm(String id, int num, String name, String description, LocalDate d) {
        TrxnMaster t = new TrxnMaster();
        t.setTrxnId(id); t.setTrxnNumber(num); t.setTrxnName(name); t.setTrxnDescription(description);
        t.setDelFlag("A"); t.setEntryBy("admin"); t.setEntryDate(d);
        return t;
    }

    private void seedTrxnDet() {
        if (trxnDetRepository.count() > 0) return;
        trxnDetRepository.saveAll(java.util.List.of(
            td("EX",2,LocalDate.of(2026,6,20),LocalDate.of(2026,6,20),"INV-1001",
               "Office stationery purchase","D",new BigDecimal("2500.00")),
            td("IN",2,LocalDate.of(2026,6,21),LocalDate.of(2026,6,21),"RCPT-5001",
               "Course fee received - Arjun Kumar","C",new BigDecimal("15000.00")),
            td("EX",1,LocalDate.of(2026,6,22),LocalDate.of(2026,6,22),"EB-2206",
               "Electricity bill payment","D",new BigDecimal("3200.00")),
            td("IN",1,LocalDate.of(2026,6,23),LocalDate.of(2026,6,23),"RCPT-5002",
               "Consulting income","C",new BigDecimal("8000.00"))
        ));
    }

    private TrxnDet td(String trxnId, int masterNum, LocalDate tranDate, LocalDate valDate,
                        String ref, String desc, String drCr, BigDecimal amount) {
        TrxnDet t = new TrxnDet();
        t.setTrxnId(trxnId); t.setMasterNumber(masterNum);
        t.setTranDate(tranDate); t.setValueDate(valDate); t.setReferenceNo(ref); t.setDescription(desc);
        t.setDrCrFlag(drCr); t.setAmount(amount); t.setDelFlag("A"); t.setEntryBy("admin"); t.setEntryDate(tranDate);
        return t;
    }
}
