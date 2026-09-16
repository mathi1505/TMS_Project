package com.example.lissomsoft.tms.dto;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

public final class ScreenCatalog {

    public static final List<ScreenDefinition> SCREENS = List.of(
        new ScreenDefinition("DASH", "Reports Dash Board",               "Reports"),
        new ScreenDefinition("CRSM", "Course Master",                    "Masters"),
        new ScreenDefinition("STDM", "Student Master",                   "Masters"),
        new ScreenDefinition("TRXM", "Transaction Master",               "Masters"),
        new ScreenDefinition("CFGM", "Configuration Master",             "Masters"),
        new ScreenDefinition("CRSD", "Course Detail",                    "Detailed"),
        new ScreenDefinition("STDD", "Student Daily Activity",           "Detailed"),
        new ScreenDefinition("TRXD", "Daily Transaction Entry",          "Detailed"),
        new ScreenDefinition("RPTS", "Student Information Report",       "Reports"),
        new ScreenDefinition("RPTA", "Student Activity Dashboard Report","Reports"),
        new ScreenDefinition("RPTD", "Student Daily Activity Report",    "Reports"),
        new ScreenDefinition("USRM", "User Maintenance",                 "Administration"),
        new ScreenDefinition("MYAC", "My Daily Activity",                "My Activity")
    );

    public static final Set<String> CODES =
        SCREENS.stream().map(ScreenDefinition::code).collect(Collectors.toUnmodifiableSet());

    public static final List<String> ALL_CODES =
        SCREENS.stream().map(ScreenDefinition::code).toList();


    public static final List<String> DEFAULT_STAFF_CODES =
        SCREENS.stream().map(ScreenDefinition::code).filter(c -> !c.equals("USRM")).toList();


    public static final List<String> DEFAULT_STUDENT_CODES = List.of("MYAC");

    private ScreenCatalog() {
    }
}
